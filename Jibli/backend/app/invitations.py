"""Published guest invitations stored with their existing, private D17 order."""
import json
import re
from datetime import date, datetime, timezone
from secrets import token_hex
from uuid import UUID, uuid4
from urllib.parse import urlsplit

from fastapi import APIRouter, Depends, HTTPException, Response, UploadFile, File, Query
from fastapi.responses import RedirectResponse
from .invitation_maps import navigation_url
from pydantic import BaseModel, Field, field_validator

from .auth import require_admin, get_current_user
from .payments import PaymentRoute
from .supabase_client import get_supabase_admin

router = APIRouter(route_class=PaymentRoute)
PUBLIC_FIELDS = {"name", "couple", "hosts", "school", "age", "date", "time", "venue", "language", "rsvp", "contact", "note"}
PHOTO_FIELDS = {"venuePhoto1", "venuePhoto2", "venuePhoto3", "birthdayPhoto", "partnerPhoto1", "partnerPhoto2", "couplePhoto"}
PUBLIC_FIELDS |= PHOTO_FIELDS
PUBLIC_FIELDS |= {"birthdayPhotoX", "birthdayPhotoY", "birthdayPhotoZoom"}
PUBLIC_FIELDS |= {f"{photo}{suffix}" for photo in ("partnerPhoto1", "partnerPhoto2", "couplePhoto") for suffix in ("X", "Y", "Zoom")}
PUBLIC_FIELDS.add("mapsUrl")


@router.get("/invitations/directions")
def invitation_directions(link: str = Query(max_length=2000), venue: str = Query(default="", max_length=3000)):
    return RedirectResponse(navigation_url(link, venue), status_code=302, headers={"Cache-Control": "no-store"})


@router.post("/invitations/photos")
async def upload_venue_photo(image: UploadFile = File(...), user: dict = Depends(get_current_user)):
    contents = await image.read(5 * 1024 * 1024 + 1)
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(422, "Photos must be no larger than 5 MB.")
    kind = None
    if contents.startswith(b"\xff\xd8\xff"):
        kind = ("jpg", "image/jpeg")
    elif contents.startswith(b"\x89PNG\r\n\x1a\n"):
        kind = ("png", "image/png")
    elif contents.startswith(b"RIFF") and contents[8:12] == b"WEBP":
        kind = ("webp", "image/webp")
    if not kind or image.content_type != kind[1]:
        raise HTTPException(422, "Choose a JPG, PNG or WebP photo.")
    path = f"invitation-venues/{user['id']}/{uuid4().hex}.{kind[0]}"
    bucket = get_supabase_admin().storage.from_("order-photos")
    bucket.upload(path, contents, {"content-type": kind[1]})
    return {"url": bucket.get_public_url(path)}


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
        if len(value) > 40 or any(len(v) > 3000 for v in value.values()):
            raise ValueError("Invitation text is too long.")
        result = {k: v.strip() for k, v in value.items() if k in PUBLIC_FIELDS}
        if result.get("mapsUrl"):
            link = urlsplit(result["mapsUrl"])
            if len(result["mapsUrl"]) > 2000 or link.scheme != "https" or link.username or link.password or link.port or not (
                link.hostname in {"maps.app.goo.gl", "maps.google.com"} or
                (link.hostname in {"google.com", "www.google.com", "goo.gl"} and re.match(r"^/maps(?:/|$)", link.path))
            ):
                raise ValueError("Paste a valid Google Maps HTTPS link.")
        for key in PHOTO_FIELDS:
            if result.get(key) and not re.fullmatch(r"https://[^\s]+", result[key]):
                raise ValueError("Venue photos must use HTTPS URLs.")
        for key, minimum, maximum in [(f"{photo}{suffix}", minimum, maximum) for photo in ("birthdayPhoto", "partnerPhoto1", "partnerPhoto2", "couplePhoto") for suffix, minimum, maximum in (("X", 0, 100), ("Y", 0, 100), ("Zoom", 1, 3))]:
            if result.get(key):
                try:
                    number = float(result[key])
                except ValueError:
                    raise ValueError("Invalid invitation photo crop.")
                if not minimum <= number <= maximum:
                    raise ValueError("Invalid invitation photo crop.")
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
