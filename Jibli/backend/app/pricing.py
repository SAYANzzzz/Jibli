import math
from typing import Literal

Shop = Literal["aliexpress", "shein", "temu"]
Currency = Literal["usd", "eur"]

MULTIPLIERS: dict[Shop, float] = {
  "aliexpress": 3.7,
  "shein": 5.5,
  "temu": 5.5,
}

# AliExpress adds a flat service fee on top; Shein and Temu don't.
SERVICE_FEE_TND: dict[Shop, int] = {
  "aliexpress": 5,
  "shein": 0,
  "temu": 0,
}


def arrondi(value: float) -> int:
  """Round up to the next whole dinar (3.2 -> 4, 5.01 -> 6)."""
  return math.ceil(value)


def calculate_price(shop: str, amount: float, quantity: int = 1, currency: Currency = "usd") -> dict:
  if shop not in MULTIPLIERS:
    raise ValueError(f"Unsupported shop: {shop}")

  if amount <= 0:
    raise ValueError("Price must be greater than 0.")

  if quantity < 1:
    raise ValueError("Quantity must be at least 1.")

  # The multiplier is applied to the entered amount as-is, regardless of
  # whether the customer picked USD or EUR — no currency conversion.
  unit_price_tnd = arrondi(amount * MULTIPLIERS[shop]) + SERVICE_FEE_TND[shop]
  total_price_tnd = unit_price_tnd * quantity

  return {
    "shop": shop,
    "usd_price": amount,
    "quantity": quantity,
    "unit_price_tnd": unit_price_tnd,
    "total_price_tnd": total_price_tnd,
  }
