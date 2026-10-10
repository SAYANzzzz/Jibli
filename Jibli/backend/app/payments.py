"""Manual D17 verification. No reference is treated as proof of payment."""
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.routing import APIRoute
from postgrest.exceptions import APIError
from httpx import RequestError
from pydantic import BaseModel, Field

from .auth import get_current_user, require_admin
from .supabase_client import get_supabase_admin
from .quotes import has_verified_quote

class PaymentRoute(APIRoute):
    def get_route_handler(self):
        handler = super().get_route_handler()

        async def handle(request):
            try:
                return await handler(request)
            except APIError as error:
                if error.code in ("42P01", "PGRST205", "PGRST202"):
                    raise HTTPException(503, "D17 payment setup is not available yet. Contact Jibli before transferring money.") from error
                raise
            except RequestError as error:
                raise HTTPException(503, "Cannot reach the payment service. Please try again shortly.") from error

        return handle


router = APIRouter(route_class=PaymentRoute)
CATALOG = json.loads(Path(__file__).with_name("payment_catalog.json").read_text(encoding="utf-8"))


class CheckoutIn(BaseModel):
    id: UUID
    product_key: str = Field(max_length=150)
    details: str = Field(default="", max_length=12000)
    phone: str = Field(pattern=r"^(?:\+?216)?[2459][0-9]{7}$")
    order_id: UUID | None = None


class ReferenceIn(BaseModel):
    authorization: str = Field(pattern=r"^[0-9]{1,30}$")


class ReviewIn(BaseModel):
    status: Literal["confirmed", "processing", "delivered", "rejected"]
    note: str = Field(default="", max_length=2000)
    delivery: str = Field(default="", max_length=6000)


def owned_payment(db, payment_id: UUID, user_id: str):
    rows = db.table("d17_orders").select("*").eq("id", str(payment_id)).eq("user_id", user_id).execute().data
    if not rows:
        raise HTTPException(404, "Payment order not found.")
    return rows[0]


@router.post("/payments/checkout")
def checkout(payload: CheckoutIn, user: dict = Depends(get_current_user)):
    db = get_supabase_admin()
    existing = db.table("d17_orders").select("*").eq("id", str(payload.id)).eq("user_id", user["id"]).execute().data
    if existing:
        return {"payment": existing[0]}
    if payload.order_id:
        orders = db.table("orders").select("*").eq("id", str(payload.order_id)).eq("user_id", user["id"]).execute().data
        if not orders or orders[0]["status"] not in ("price_confirmed", "waiting_confirmation") or not orders[0].get("final_price"):
            raise HTTPException(400, "Wait for Jibli to confirm your AliExpress price before paying.")
        if not has_verified_quote(db, orders[0]):
            raise HTTPException(400, "Jibli must verify this price in the admin dashboard before you pay.")
        product = {"title": f"AliExpress order #{str(payload.order_id)[:8].upper()}", "amount": orders[0]["final_price"], "kind": "aliexpress"}
    else:
        product = CATALOG.get(payload.product_key)
        if not product or product.get("amount") is None:
            raise HTTPException(400, "This offer needs a confirmed price. Contact Jibli before paying.")
    details = payload.details
    if payload.product_key.startswith("invitation:") and details.lstrip().startswith("{"):
        from .invitations import InvitationIn
        try:
            content = json.loads(details)
            invitation = InvitationIn.model_validate({**content["invitation"], "published": False})
            details = json.dumps({"request": str(content.get("request", "")), "invitation": invitation.model_dump()}, ensure_ascii=False)
        except (ValueError, KeyError, TypeError):
            raise HTTPException(422, "Check the invitation name, date and customisation before paying.")
    data = {
        "id": str(payload.id), "user_id": user["id"], "order_id": str(payload.order_id) if payload.order_id else None,
        "product_key": payload.product_key, "title": product["title"], "kind": product["kind"],
        "amount": product["amount"], "details": details, "phone": payload.phone,
    }
    try:
        payment = db.table("d17_orders").insert(data).execute().data[0]
    except APIError as error:
        if error.code == "23505":
            # A concurrent retry or an existing payment for this AliExpress order.
            query = db.table("d17_orders").select("*").eq("user_id", user["id"])
            query = query.eq("order_id", str(payload.order_id)) if payload.order_id else query.eq("id", str(payload.id))
            rows = query.execute().data
            if rows:
                return {"payment": rows[0]}
        raise
    return {"payment": payment}


@router.get("/payments")
def my_payments(user: dict = Depends(get_current_user)):
    return {"payments": get_supabase_admin().table("d17_orders").select("*").eq("user_id", user["id"]).order("created_at", desc=True).execute().data}


@router.post("/payments/{payment_id}/reference")
def submit_reference(payment_id: UUID, payload: ReferenceIn, user: dict = Depends(get_current_user)):
    db = get_supabase_admin()
    payment = owned_payment(db, payment_id, user["id"])
    if payment["status"] == "pending_verification" and payment["authorization"] == payload.authorization:
        return {"payment": payment}
    if payment["status"] not in ("pending_payment", "rejected"):
        raise HTTPException(409, "This payment is already under review or confirmed.")
    try:
        rows = db.table("d17_orders").update({
            "authorization": payload.authorization, "status": "pending_verification", "review_note": "",
            "submitted_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", str(payment_id)).eq("user_id", user["id"]).eq("status", payment["status"]).execute().data
    except APIError as error:
        if error.code == "23505":
            raise HTTPException(409, "This authorization number has already been submitted. Check your D17 receipt or contact Jibli.") from error
        raise
    if not rows:
        raise HTTPException(409, "The payment changed. Refresh before trying again.")
    return {"payment": rows[0]}


@router.get("/admin/payments")
def admin_payments(_: dict = Depends(require_admin)):
    return {"payments": get_supabase_admin().table("d17_orders").select("*").order("created_at", desc=True).execute().data}


@router.patch("/admin/payments/{payment_id}")
def review_payment(payment_id: UUID, payload: ReviewIn, admin: dict = Depends(require_admin)):
    db = get_supabase_admin()
    rows = db.table("d17_orders").select("*").eq("id", str(payment_id)).execute().data
    if not rows:
        raise HTTPException(404, "Payment not found.")
    payment = rows[0]
    transitions = {"pending_verification": {"confirmed", "rejected"}, "confirmed": {"processing", "delivered"}, "processing": {"delivered"}}
    if payload.status not in transitions.get(payment["status"], set()):
        raise HTTPException(409, "Invalid payment transition. Refresh the payment list.")
    if payload.status == "rejected" and not payload.note.strip():
        raise HTTPException(400, "Explain why the payment could not be verified.")
    if payload.status == "delivered" and not payload.delivery.strip():
        raise HTTPException(400, "Provide the gift code, invitation link, subscription link or order tracking details.")
    if payload.status == "delivered" and payment.get("delivery", "").startswith("/invite/") and payload.delivery.strip() != payment["delivery"]:
        raise HTTPException(409, "Keep the published invitation link. Edit or unpublish it in the invitation editor.")
    data = {"status": payload.status, "review_note": payload.note, "reviewed_by": admin["id"], "updated_at": datetime.now(timezone.utc).isoformat()}
    if payload.status == "confirmed":
        if payment.get("order_id"):
            orders = db.table("orders").select("*").eq("id", payment["order_id"]).execute().data
            if not orders or float(orders[0].get("final_price") or 0) != float(payment["amount"]) or not has_verified_quote(db, orders[0]):
                raise HTTPException(409, "Verify the linked AliExpress quote before confirming this payment.")
        data["confirmed_at"] = datetime.now(timezone.utc).isoformat()
    if payload.status == "delivered":
        data["delivery"] = payload.delivery.strip()
    # Both the payment and its linked AliExpress status are committed atomically.
    updated = db.rpc("review_d17_order", {"payment_id": str(payment_id), "expected_status": payment["status"], "changes": data}).execute().data
    if not updated:
        raise HTTPException(409, "The payment changed. Refresh before trying again.")
    return {"payment": updated[0]}
