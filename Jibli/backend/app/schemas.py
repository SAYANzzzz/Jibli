from typing import Any, Literal

from pydantic import BaseModel, Field

Shop = Literal["aliexpress"]
Currency = Literal["usd"]


class PreviewRequest(BaseModel):
  links: list[str] = Field(min_length=1)


class QuickPreviewIn(BaseModel):
  link: str = Field(min_length=1)


class QuickOrderPriceIn(BaseModel):
  shop: Shop
  amount: float = Field(gt=0)
  currency: Currency = "usd"
  quantity: int = Field(default=1, ge=1)


class CartItemIn(BaseModel):
  # Deliberately a plain string, not Pydantic's HttpUrl - real customers
  # paste links copied from mobile share sheets that sometimes come out
  # missing the scheme or otherwise not strictly RFC-valid, and strict
  # parsing was hard-rejecting real orders with a 422. The frontend already
  # normalizes/validates the link before this is ever sent.
  product_link: str = Field(min_length=3)
  shop: Shop
  product_name: str | None = None
  selected_options: dict[str, Any] = Field(default_factory=dict)
  quantity: int = Field(default=1, ge=1)
  estimated_price: float | None = None


class CartRequestIn(BaseModel):
  items: list[CartItemIn] = Field(min_length=1)
  notes: str | None = None


class ProfileUpdateIn(BaseModel):
  full_name: str | None = None
  phone: str | None = None
  city: str | None = None
  address: str | None = None
  postal_code: str | None = None
  avatar_url: str | None = None


class AdminOrderUpdateIn(BaseModel):
  status: Literal["new_request", "waiting_confirmation", "price_confirmed", "deposit_paid", "ordered", "preparing", "collected_by_carrier", "at_origin_sorting", "left_origin_sorting", "at_origin_airport", "awaiting_flight", "leaving_origin_country", "arrived_transit_country", "left_transit_country", "arrived_local_airport", "arrived_tunisia", "out_for_delivery", "delivered", "cancelled"]
  final_price: float | None = Field(default=None, ge=0)
  deposit_amount: float | None = Field(default=None, ge=0)
  tracking_number: str | None = Field(default=None, max_length=200)
  note: str | None = Field(default=None, max_length=2_000)
