"""Authenticate admin quotes even when legacy browser insert policies exist."""
import hashlib
import hmac
from decimal import Decimal

from .config import get_settings


def quote_marker(order: dict) -> str:
    amount = format(Decimal(str(order["final_price"])).normalize(), "f")
    message = f"quote-v1:{order['id']}:{order['user_id']}:{amount}".encode()
    secret = get_settings().supabase_service_role_key.encode()
    digest = hmac.new(secret, message, hashlib.sha256).hexdigest()
    return f"[Jibli verified quote: {digest}]"


def has_verified_quote(db, order: dict) -> bool:
    expected = quote_marker(order)
    events = db.table("order_events").select("note").eq("order_id", order["id"]).execute().data
    return any(hmac.compare_digest((event.get("note") or "")[-len(expected):], expected) for event in events)
