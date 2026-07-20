import html
import json
import re
import threading
from typing import Literal
from urllib.error import URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen

Shop = Literal["aliexpress", "shein", "temu"]

_BROWSER_USER_AGENT = (
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"
)

# AliExpress/Shein/Temu render their real price client-side and AliExpress
# actively blocks plain server-to-server requests with an anti-bot page, so a
# real headless browser is needed to see what a customer's browser sees. Only
# one page is ever rendered at a time (Render's free tier has very little
# RAM, and each Chromium instance is heavy) — concurrent preview requests
# simply queue up rather than spawning multiple browsers and risking an OOM
# crash of the whole backend.
_browser_lock = threading.Semaphore(1)


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
  "temu": {
    "name": "Temu product from your link",
    "price": "Checked after link review",
    "image_label": "Temu item",
    "image_url": None,
    "rating": "Verified by Jibli",
    "sold_count": "Options checked after link review",
    "shipping": "Shipping confirmed before payment",
    "delivery_eta": "Confirmed by admin",
    "seller": "Temu seller",
    "variants": [
      {"label": "Color", "name": "color", "options": ["Black", "White", "Blue", "Red"]},
      {"label": "Size", "name": "size", "options": ["One size", "S", "M", "L", "XL"]},
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


def _extract_itemprop(content: str, prop: str) -> str | None:
  patterns = [
    rf'<meta[^>]+itemprop=["\']{re.escape(prop)}["\'][^>]+content=["\']([^"\']+)["\']',
    rf'<meta[^>]+content=["\']([^"\']+)["\'][^>]+itemprop=["\']{re.escape(prop)}["\']',
  ]

  for pattern in patterns:
    match = re.search(pattern, content, flags=re.IGNORECASE)
    if match:
      return html.unescape(match.group(1)).strip()

  return None


def _price_from_offer(offer: dict) -> str | None:
  price = offer.get("price") or offer.get("lowPrice") or offer.get("Price")
  currency = offer.get("priceCurrency") or offer.get("priceCurrencyCode")

  if not price:
    return None

  return f"{price} {currency}".strip() if currency else str(price)


def _extract_price_from_ld_json(content: str) -> str | None:
  blocks = re.findall(
    r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
    content,
    flags=re.IGNORECASE | re.DOTALL,
  )

  for block in blocks:
    try:
      data = json.loads(block.strip())
    except (ValueError, TypeError):
      continue

    nodes = data if isinstance(data, list) else [data]

    for node in nodes:
      if not isinstance(node, dict):
        continue

      graph = node.get("@graph")
      candidates = [node, *graph] if isinstance(graph, list) else [node]

      for candidate in candidates:
        if not isinstance(candidate, dict):
          continue

        offers = candidate.get("offers")

        if isinstance(offers, dict):
          price = _price_from_offer(offers)
          if price:
            return price
        elif isinstance(offers, list):
          for offer in offers:
            if isinstance(offer, dict):
              price = _price_from_offer(offer)
              if price:
                return price

  return None


_NEARBY_CURRENCY_PATTERN = re.compile(r'"currency(?:Code)?"\s*:\s*"([A-Za-z]{3})"')


def _extract_price_from_inline_json(content: str) -> str | None:
  """Best-effort fallback for storefronts that embed price data in a
  non-standard inline JSON blob instead of meta tags or JSON-LD."""
  patterns = [
    r'"salePrice"\s*:\s*\{[^{}]*?"value"\s*:\s*"?([0-9]+(?:\.[0-9]+)?)"?',
    r'"formatedAmount"\s*:\s*"([^0-9]*[0-9]+(?:\.[0-9]+)?)',
    r'"minPrice"\s*:\s*"?([0-9]+(?:\.[0-9]+)?)"?',
    r'"price"\s*:\s*"?(\$?[0-9]+(?:\.[0-9]+)?)"?',
  ]

  for pattern in patterns:
    match = re.search(pattern, content)
    if not match:
      continue

    amount = match.group(1)

    # These blobs don't consistently carry a currency next to the price, so
    # look for a currency code within a small window around the match — if
    # none is found the amount is returned bare, which _price_currency_is_usable
    # then correctly treats as unverified rather than assuming USD.
    window = content[max(0, match.start() - 150) : match.end() + 150]
    currency_match = _NEARBY_CURRENCY_PATTERN.search(window)

    if currency_match:
      return f"{amount} {currency_match.group(1)}"

    return amount

  return None


def _fetch_plain_html(link: str) -> str:
  request = Request(
    link,
    headers={
      "User-Agent": _BROWSER_USER_AGENT,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
  )

  with urlopen(request, timeout=10) as response:
    content_type = response.headers.get_content_charset() or "utf-8"
    return response.read(3_000_000).decode(content_type, errors="ignore")


def _fetch_rendered_html(link: str) -> str:
  """Load the page in a real headless browser so client-side-rendered price
  data (Shein, Temu) is present in the HTML, and so AliExpress's anti-bot
  check sees a real browser instead of a bare HTTP client."""
  from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
  from playwright.sync_api import sync_playwright

  with _browser_lock:
    with sync_playwright() as playwright:
      browser = playwright.chromium.launch(
        headless=True,
        args=["--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage"],
      )

      try:
        page = browser.new_page(
          user_agent=_BROWSER_USER_AGENT,
          viewport={"width": 1280, "height": 900},
        )
        page.goto(link, timeout=20_000, wait_until="domcontentloaded")

        try:
          page.wait_for_load_state("networkidle", timeout=6_000)
        except PlaywrightTimeoutError:
          pass

        return page.content()
      finally:
        browser.close()


def _fetch_html(link: str) -> str:
  try:
    return _fetch_rendered_html(link)
  except Exception:
    # Playwright missing/failed to launch (e.g. browser binary not installed)
    # or the render itself failed — fall back to a plain request so a preview
    # can still surface a name/image even without the JS-rendered price.
    return _fetch_plain_html(link)


# Shop sites localize price to whatever currency they infer from the
# scraper's IP (e.g. TND, GBP, AED...), but Jibli's price formula expects the
# amount to be in USD or EUR (see pricing.py). Silently treating "17.66 TND"
# as if it were "17.66 USD" would badly under- or over-quote a customer, so a
# price in an unrecognized/non-USD/EUR currency is discarded rather than
# auto-filled — the customer enters it manually instead.
_USABLE_CURRENCY_PATTERN = re.compile(r"(usd|us\$|\$|eur|€)", re.IGNORECASE)
_OTHER_CURRENCY_PATTERN = re.compile(
  r"\b(tnd|gbp|aed|sar|cny|rmb|jpy|inr|cad|aud|try|mad|dzd|egp|qar|kwd|chf|sek|nok|dkk)\b",
  re.IGNORECASE,
)


def _price_currency_is_usable(price: str) -> bool:
  if _OTHER_CURRENCY_PATTERN.search(price):
    return False

  return bool(_USABLE_CURRENCY_PATTERN.search(price))


def _fetch_public_metadata(link: str) -> dict:
  content = _fetch_html(link)

  price_amount = _extract_meta(content, "product:price:amount")
  price_currency = _extract_meta(content, "product:price:currency")
  price = f"{price_amount} {price_currency}".strip() if price_amount else None

  if not price:
    itemprop_price = _extract_itemprop(content, "price")
    itemprop_currency = _extract_itemprop(content, "priceCurrency")
    if itemprop_price:
      price = f"{itemprop_price} {itemprop_currency}".strip() if itemprop_currency else itemprop_price

  if not price:
    price = _extract_price_from_ld_json(content)

  if not price:
    price = _extract_price_from_inline_json(content)

  if price and not _price_currency_is_usable(price):
    price = None

  image_url = (
    _extract_meta(content, "og:image")
    or _extract_meta(content, "twitter:image")
    or _extract_meta(content, "image")
  )

  return {
    "name": _extract_title(content),
    "price": price,
    "image_url": _normalize_image_url(link, image_url),
  }


def detect_shop(link: str) -> Shop | None:
  normalized = link.lower()

  if "aliexpress" in normalized:
    return "aliexpress"

  if "shein" in normalized:
    return "shein"

  if "temu" in normalized:
    return "temu"

  return None


def preview_product(link: str) -> dict:
  shop = detect_shop(link)

  if not shop:
    return {
      "link": link,
      "shop": None,
      "supported": False,
      "error": "Only AliExpress, Shein, and Temu links are supported.",
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
