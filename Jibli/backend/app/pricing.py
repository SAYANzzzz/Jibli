import math
from typing import Literal

Shop = Literal["aliexpress"]
Currency = Literal["usd"]

MULTIPLIERS: dict[Shop, float] = {
  "aliexpress": 3.7,
}

# AliExpress items each carry their own flat fee on top of the multiplier,
# added once per item/line (not multiplied by quantity). Shein and Temu
# don't get a per-item fee - they're covered by the order-level shipping
# fee in the frontend's ProductRequest page instead, which is waived when
# every item in the order is AliExpress.
ITEM_FEE_TND: dict[Shop, int] = {
  "aliexpress": 5,
}


def arrondi(value: float) -> int:
  """Round up to the next whole dinar (3.2 -> 4, 5.01 -> 6)."""
  return math.ceil(value)


def calculate_cart_total(items: list[dict]) -> int | None:
  """Recalculate checkout from source USD prices; never trust browser totals."""
  total = 0
  for item in items:
    raw = (item.get("selected_options") or {}).get("usd_price")
    if raw is None:
      return None  # Older requests still need an admin quote.
    amount = float(raw)
    if not math.isfinite(amount) or amount <= 0:
      raise ValueError("Each product needs a valid USD price.")
    total += calculate_price(item["shop"], amount, item["quantity"])["total_price_tnd"]
  return total if items else None


def calculate_price(shop: str, amount: float, quantity: int = 1, currency: Currency = "usd") -> dict:
  if shop not in MULTIPLIERS:
    raise ValueError(f"Unsupported shop: {shop}")

  if amount <= 0:
    raise ValueError("Price must be greater than 0.")

  if quantity < 1:
    raise ValueError("Quantity must be at least 1.")

  # The multiplier is applied to the entered amount as-is, regardless of
  # whether the customer picked USD or EUR — no currency conversion. The
  # item fee is added once per item/line, after multiplying by quantity -
  # not per unit, so ordering 3 of the same item only adds the fee once.
  unit_price_tnd = arrondi(amount * MULTIPLIERS[shop])
  total_price_tnd = unit_price_tnd * quantity + ITEM_FEE_TND[shop]

  return {
    "shop": shop,
    "usd_price": amount,
    "quantity": quantity,
    "unit_price_tnd": unit_price_tnd,
    "total_price_tnd": total_price_tnd,
  }
