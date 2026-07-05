import html
import re
from typing import Literal
from urllib.error import URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen

Shop = Literal["aliexpress", "shein"]


DEMO_PRODUCTS = {
  "aliexpress": {
    "name": "AliExpress product from your link",
    "price": "Checked after link review",
    "image_label": "AliExpress item",
    "image_url": None,
    "rating": "Verified by Jibli",
    "sold_count": "Options checked after link review",
    "shipping": "Shipping confirmed before payment",
    "delivery_eta": "Confirmed by admin",
    "seller": "AliExpress seller",
    "variants": [
      {"label": "Color", "name": "color", "options": ["Black", "White", "Blue", "Red"]},
      {"label": "Size", "name": "size", "options": ["One size", "S", "M", "L", "XL"]},
      {"label": "Shipping", "name": "shipping", "options": ["Standard", "Saver", "Fast"]},
    ],
  },
  "shein": {
    "name": "Shein product from your link",
    "price": "Part of Shein panier",
    "image_label": "Shein item",
    "image_url": None,
    "rating": "Shared panier item",
    "sold_count": "Pending panier target",
    "shipping": "Grouped with Shein panier",
    "delivery_eta": "Launches after 129 USD",
    "seller": "Shein",
    "variants": [
      {"label": "Color", "name": "color", "options": ["Black", "White", "Beige", "Pink"]},
      {"label": "Size", "name": "size", "options": ["XS", "S", "M", "L", "XL"]},
      {"label": "Category", "name": "category", "options": ["Women", "Men", "Kids", "Home"]},
    ],
  },
}


def _normalize_image_url(base_url: str, image_url: str | None) -> str | None:
  if not image_url:
    return None

  if image_url.startswith("//"):
    return f"https:{image_url}"

  return urljoin(base_url, image_url)


def _extract_meta(content: str, key: str) -> str | None:
  patterns = [
    rf'<meta[^>]+property=["\']{re.escape(key)}["\'][^>]+content=["\']([^"\']+)["\']',
    rf'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']{re.escape(key)}["\']',
    rf'<meta[^>]+name=["\']{re.escape(key)}["\'][^>]+content=["\']([^"\']+)["\']',
    rf'<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']{re.escape(key)}["\']',
  ]

  for pattern in patterns:
    match = re.search(pattern, content, flags=re.IGNORECASE)
    if match:
      return html.unescape(match.group(1)).strip()

  return None


def _extract_title(content: str) -> str | None:
  meta_title = _extract_meta(content, "og:title") or _extract_meta(content, "twitter:title")

  if meta_title:
    return meta_title

  match = re.search(r"<title[^>]*>(.*?)</title>", content, flags=re.IGNORECASE | re.DOTALL)
  if not match:
    return None

  return html.unescape(re.sub(r"\s+", " ", match.group(1))).strip()


def _fetch_public_metadata(link: str) -> dict:
  request = Request(
    link,
    headers={
      "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"
      ),
      "Accept-Language": "en-US,en;q=0.9",
    },
  )

  with urlopen(request, timeout=8) as response:
    content_type = response.headers.get_content_charset() or "utf-8"
    content = response.read(1_500_000).decode(content_type, errors="ignore")

  price_amount = _extract_meta(content, "product:price:amount")
  price_currency = _extract_meta(content, "product:price:currency")
  image_url = (
    _extract_meta(content, "og:image")
    or _extract_meta(content, "twitter:image")
    or _extract_meta(content, "image")
  )

  return {
    "name": _extract_title(content),
    "price": f"{price_amount} {price_currency}".strip() if price_amount else None,
    "image_url": _normalize_image_url(link, image_url),
  }


def detect_shop(link: str) -> Shop | None:
  normalized = link.lower()

  if "aliexpress" in normalized:
    return "aliexpress"

  if "shein" in normalized:
    return "shein"

  return None


def preview_product(link: str) -> dict:
  shop = detect_shop(link)

  if not shop:
    return {
      "link": link,
      "shop": None,
      "supported": False,
      "error": "Only AliExpress and Shein links are supported. Temu is unavailable because it does not ship to Tunisia.",
    }

  product = {
    "link": link,
    "shop": shop,
    "supported": True,
    **DEMO_PRODUCTS[shop],
  }

  try:
    metadata = _fetch_public_metadata(link)
  except (URLError, TimeoutError, ValueError, OSError):
    metadata = {}

  if metadata.get("name"):
    product["name"] = metadata["name"]

  if metadata.get("price"):
    product["price"] = metadata["price"]

  if metadata.get("image_url"):
    product["image_url"] = metadata["image_url"]

  return product
