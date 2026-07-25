from typing import Any, Literal

from pydantic import BaseModel, Field

Shop = Literal["aliexpress", "shein", "temu"]
Currency = Literal["usd", "eur"]


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


class EmailCheckIn(BaseModel):
  email: str = Field(min_length=3)
