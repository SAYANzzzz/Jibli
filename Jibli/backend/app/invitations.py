"""Published guest invitations stored with their existing, private D17 order."""
import json
import re
from datetime import date, datetime, timezone
from secrets import token_hex
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field, field_validator

from .auth import require_admin
from .payments import PaymentRoute
from .supabase_client import get_supabase_admin

router = APIRouter(route_class=PaymentRoute)
PUBLIC_FIELDS = {"name", "couple", "hosts", "school", "age", "date", "time", "venue", "language", "rsvp", "contact", "note"}


class InvitationIn(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    image: str = Field(default="", max_length=2000)
    mood: str = "champagne"
    details: dict[str, str]
    certificate: bool = False
    published: bool = True

    @field_validator("image")
    @classmethod
    def safe_image(cls, value):
        # No data URLs, scripts, protocol-relative URLs or arbitrary local paths.
        if value and not (re.match(r"^https://[^\s]+$", value) or re.match(r"^/invitations/[a-z0-9/_-]+\.(jfif|jpg|jpeg|png|webp)$", value)):
            raise ValueError("Use an HTTPS image URL or a supported invitation image.")
        return value

    @field_validator("mood")
    @classmethod
    def valid_mood(cls, value):
        if value not in {"champagne", "garden", "midnight", "confetti"}:
            raise ValueError("Choose a valid invitation mood.")
        return value

    @field_validator("details")
    @classmethod
    def valid_details(cls, value):
        if len(value) > 20 or any(len(v) > 3000 for v in value.values()):
            raise ValueError("Invitation text is too long.")
        result = {k: v.strip() for k, v in value.items() if k in PUBLIC_FIELDS}
        if not (result.get("name") or result.get("couple")):
            raise ValueError("Add the recipient or host name.")
        if result.get("date"):
            date.fromisoformat(result["date"])
        if result.get("time") and not re.fullmatch(r"(?:[01][0-9]|2[0-3]):[0-5][0-9]", result["time"]):
            raise ValueError("Invalid event time.")
        return result


@router.put("/admin/payments/{payment_id}/invitation")
def publish_invitation(payment_id: UUID, payload: InvitationIn, _: dict = Depends(require_admin)):
    db = get_supabase_admin()
    rows = db.table("d17_orders").select("*").eq("id", str(payment_id)).execute().data
    if not rows:
        raise HTTPException(404, "Order not found.")
    order = rows[0]
    if not order["product_key"].startswith("invitation:") or order["status"] not in {"confirmed", "processing", "delivered"}:
        raise HTTPException(409, "Verify this invitation payment before publishing.")
    try:
        content = json.loads(order["details"])
        if not isinstance(content, dict):
            raise ValueError()
    except (ValueError, TypeError):
        content = {"request": order["details"]}
    link = order.get("delivery", "")
    if not re.fullmatch(r"/invite/[0-9a-f]{32}", link):
        link = f"/invite/{token_hex(16)}"
    content["invitation"] = payload.model_dump()
    serialized = json.dumps(content, ensure_ascii=False)
    if len(serialized) > 24000:
        raise HTTPException(422, "Shorten the invitation content.")
    update = db.table("d17_orders").update({"details": serialized, "delivery": link, "updated_at": datetime.now(timezone.utc).isoformat()}).eq("id", str(payment_id)).eq("status", order["status"])
    if order.get("updated_at"):
        update = update.eq("updated_at", order["updated_at"])
    updated = update.execute().data
    if not updated:
        raise HTTPException(409, "Order changed. Refresh and try again.")
    return {"payment": updated[0], "url": link}


@router.get("/invitations/{token}")
def guest_invitation(token: str, response: Response):
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Robots-Tag"] = "noindex, nofollow"
    if not re.fullmatch(r"[0-9a-f]{32}", token):
        raise HTTPException(404, "Invitation not found.")
    rows = get_supabase_admin().table("d17_orders").select("details,status").eq("delivery", f"/invite/{token}").execute().data
    for row in rows:
        try:
            invitation = InvitationIn.model_validate(json.loads(row["details"])["invitation"])
        except (ValueError, KeyError, TypeError):
            continue
        if invitation.published and row["status"] in {"confirmed", "processing", "delivered"}:
            # Explicitly return guest content only, never the payment record.
            return {"invitation": invitation.model_dump(exclude={"published"})}
    raise HTTPException(404, "This invitation is not available.")
