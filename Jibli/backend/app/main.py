from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from .auth import get_current_profile, get_current_user, require_admin
from .config import get_settings
from .product_preview import preview_product
from .schemas import CartRequestIn, PreviewRequest, ProfileUpdateIn
from .supabase_client import get_supabase_admin

settings = get_settings()

app = FastAPI(title="Jibli API")

app.add_middleware(
  CORSMiddleware,
  allow_origins=[
    settings.frontend_origin,
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
  ],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
  return {"status": "ok"}


@app.post("/products/preview")
def preview_products(payload: PreviewRequest, user: dict = Depends(get_current_user)) -> dict:
  return {"items": [preview_product(link) for link in payload.links]}


@app.get("/me/profile")
def get_profile(user: dict = Depends(get_current_user)) -> dict:
  return get_current_profile(user)


@app.put("/me/profile")
def update_profile(payload: ProfileUpdateIn, user: dict = Depends(get_current_user)) -> dict:
  data = payload.model_dump(exclude_none=True)

  if not data:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No profile fields sent.")

  supabase = get_supabase_admin()
  existing = supabase.table("profiles").select("id").eq("id", user["id"]).maybe_single().execute()

  if existing.data:
    response = supabase.table("profiles").update(data).eq("id", user["id"]).execute()
  else:
    response = supabase.table("profiles").insert({"id": user["id"], **data}).execute()

  return {"profile": response.data[0] if response.data else None}


def get_or_create_active_cart(user_id: str) -> dict:
  supabase = get_supabase_admin()
  existing = (
    supabase.table("carts")
    .select("*")
    .eq("user_id", user_id)
    .eq("status", "active")
    .limit(1)
    .execute()
  )

  if existing.data:
    return existing.data[0]

  created = supabase.table("carts").insert({"user_id": user_id, "status": "active"}).execute()
  return created.data[0]


@app.get("/cart")
def get_cart(user: dict = Depends(get_current_user)) -> dict:
  cart = get_or_create_active_cart(user["id"])
  items = (
    get_supabase_admin()
    .table("cart_items")
    .select("*")
    .eq("cart_id", cart["id"])
    .order("created_at", desc=False)
    .execute()
  )

  return {"cart": cart, "items": items.data}


@app.get("/shein-panier")
def get_shein_panier(_: dict = Depends(get_current_user)) -> dict:
  items = (
    get_supabase_admin()
    .table("cart_items")
    .select("estimated_price, quantity, shop")
    .eq("shop", "shein")
    .execute()
  )
  total = 0.0

  for item in items.data or []:
    total += float(item.get("estimated_price") or 0) * int(item.get("quantity") or 1)

  return {"total": total, "item_count": len(items.data or [])}


@app.post("/cart/items")
def add_cart_items(payload: CartRequestIn, user: dict = Depends(get_current_user)) -> dict:
  supabase = get_supabase_admin()
  cart = get_or_create_active_cart(user["id"])

  # Replace the active panier with the latest submitted form state.
  supabase.table("cart_items").delete().eq("cart_id", cart["id"]).execute()
  rows = []

  for item in payload.items:
    selected_options = item.selected_options
    rows.append(
      {
        "cart_id": cart["id"],
        "user_id": user["id"],
        "product_link": str(item.product_link),
        "shop": item.shop,
        "product_name": item.product_name,
        "selected_color": selected_options.get("color"),
        "selected_size": selected_options.get("size"),
        "selected_options": selected_options,
        "quantity": item.quantity,
        "estimated_price": item.estimated_price,
      }
    )

  inserted = supabase.table("cart_items").insert(rows).execute()
  return {"cart": cart, "items": inserted.data}


@app.post("/orders/submit")
def submit_order(user: dict = Depends(get_current_user)) -> dict:
  supabase = get_supabase_admin()
  cart = get_or_create_active_cart(user["id"])
  items = supabase.table("cart_items").select("id").eq("cart_id", cart["id"]).execute()

  if not items.data:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="Your panier is empty.",
    )

  order = (
    supabase.table("orders")
    .insert({"user_id": user["id"], "cart_id": cart["id"], "status": "new_request"})
    .execute()
  )
  supabase.table("carts").update({"status": "submitted"}).eq("id", cart["id"]).execute()

  created_order = order.data[0]
  supabase.table("order_events").insert(
    {
      "order_id": created_order["id"],
      "user_id": user["id"],
      "status": "new_request",
      "note": "Order request submitted.",
    }
  ).execute()

  return {"order": created_order}


@app.get("/orders")
def list_orders(user: dict = Depends(get_current_user)) -> dict:
  supabase = get_supabase_admin()
  orders = (
    supabase
    .table("orders")
    .select("*")
    .eq("user_id", user["id"])
    .order("created_at", desc=True)
    .execute()
  )

  order_rows = orders.data or []
  cart_ids = [order["cart_id"] for order in order_rows if order.get("cart_id")]
  order_ids = [order["id"] for order in order_rows if order.get("id")]
  items_by_cart_id = {}
  events_by_order_id = {}

  if cart_ids:
    items = (
      supabase
      .table("cart_items")
      .select("*")
      .in_("cart_id", cart_ids)
      .order("created_at", desc=False)
      .execute()
    )

    for item in items.data or []:
      items_by_cart_id.setdefault(item["cart_id"], []).append(item)

  if order_ids:
    events = (
      supabase
      .table("order_events")
      .select("*")
      .in_("order_id", order_ids)
      .order("created_at", desc=False)
      .execute()
    )

    for event in events.data or []:
      events_by_order_id.setdefault(event["order_id"], []).append(event)

  for order in order_rows:
    order["items"] = items_by_cart_id.get(order.get("cart_id"), [])
    order["events"] = events_by_order_id.get(order.get("id"), [])

  return {"orders": order_rows}


@app.get("/admin/orders")
def list_all_orders(_: dict = Depends(require_admin)) -> dict:
  supabase = get_supabase_admin()
  orders = (
    supabase
    .table("orders")
    .select("*")
    .order("created_at", desc=True)
    .execute()
  )

  order_rows = orders.data or []
  cart_ids = [order["cart_id"] for order in order_rows if order.get("cart_id")]
  user_ids = [order["user_id"] for order in order_rows if order.get("user_id")]
  order_ids = [order["id"] for order in order_rows if order.get("id")]
  items_by_cart_id = {}
  profiles_by_user_id = {}
  events_by_order_id = {}

  if cart_ids:
    items = (
      supabase
      .table("cart_items")
      .select("*")
      .in_("cart_id", cart_ids)
      .order("created_at", desc=False)
      .execute()
    )

    for item in items.data or []:
      items_by_cart_id.setdefault(item["cart_id"], []).append(item)

  if user_ids:
    profiles = (
      supabase
      .table("profiles")
      .select("id, email, full_name, phone, city")
      .in_("id", user_ids)
      .execute()
    )

    for profile in profiles.data or []:
      profiles_by_user_id[profile["id"]] = profile

  if order_ids:
    events = (
      supabase
      .table("order_events")
      .select("*")
      .in_("order_id", order_ids)
      .order("created_at", desc=False)
      .execute()
    )

    for event in events.data or []:
      events_by_order_id.setdefault(event["order_id"], []).append(event)

  for order in order_rows:
    order["items"] = items_by_cart_id.get(order.get("cart_id"), [])
    order["profiles"] = profiles_by_user_id.get(order.get("user_id"))
    order["events"] = events_by_order_id.get(order.get("id"), [])

  return {"orders": order_rows}


@app.get("/admin/users")
def list_all_users(_: dict = Depends(require_admin)) -> dict:
  users = (
    get_supabase_admin()
    .table("profiles")
    .select("id, email, full_name, phone, city, postal_code, avatar_url, role")
    .order("full_name", desc=False)
    .execute()
  )

  return {"users": users.data or []}


@app.patch("/admin/orders/{order_id}/status")
def update_order_status(
  order_id: str,
  payload: dict,
  admin_profile: dict = Depends(require_admin),
) -> dict:
  status_value = payload.get("status")

  if not status_value:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Status is required.")

  supabase = get_supabase_admin()
  update_data = {"status": status_value}

  for field in ["tracking_number", "final_price", "deposit_amount"]:
    if field in payload:
      update_data[field] = payload.get(field)

  updated = (
    supabase.table("orders")
    .update(update_data)
    .eq("id", order_id)
    .execute()
  )

  if not updated.data:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

  order = updated.data[0]
  supabase.table("order_events").insert(
    {
      "order_id": order_id,
      "user_id": order["user_id"],
      "status": status_value,
      "note": payload.get("note") or f"Updated by admin {admin_profile.get('full_name') or ''}".strip(),
    }
  ).execute()

  return {"order": order}


@app.delete("/admin/orders/{order_id}")
def delete_order(order_id: str, _: dict = Depends(require_admin)) -> dict:
  supabase = get_supabase_admin()
  existing = supabase.table("orders").select("id").eq("id", order_id).maybe_single().execute()

  if not existing.data:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

  supabase.table("orders").delete().eq("id", order_id).execute()

  return {"deleted": True, "order_id": order_id}
