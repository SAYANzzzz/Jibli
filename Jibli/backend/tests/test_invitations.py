import json
import unittest
from unittest.mock import patch, MagicMock
from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.auth import get_current_profile, get_current_user
from app.invitations import router
from test_payments import Database


class InvitationTests(unittest.TestCase):
    def setUp(self):
        self.db = Database()
        self.id = str(uuid4())
        self.db.rows["d17_orders"] = [{"id": self.id, "user_id": str(uuid4()), "product_key": "invitation:weddings:arabesque-burgundy", "status": "confirmed", "delivery": "", "details": "Original private request", "phone": "92123456", "authorization": "123456"}]
        app = FastAPI()
        app.include_router(router)
        app.dependency_overrides[get_current_user] = lambda: {"id": str(uuid4())}
        app.dependency_overrides[get_current_profile] = lambda: {"role": "admin"}
        self.app, self.client = app, TestClient(app)
        mocked = patch("app.invitations.get_supabase_admin", return_value=self.db)
        mocked.start()
        self.addCleanup(mocked.stop)
        self.payload = {"title": "Our wedding", "image": "", "mood": "garden", "details": {"couple": "Amira & Youssef", "date": "2027-06-20", "time": "18:30", "venue": "Tunis", "private_account_email": "secret@example.invalid"}, "published": True}

    def publish(self, **changes):
        return self.client.put(f"/admin/payments/{self.id}/invitation", json={**self.payload, **changes})

    def test_publication_edit_privacy_and_unpublish(self):
        result = self.publish()
        self.assertEqual(result.status_code, 200)
        url = result.json()["url"]
        token = url.rsplit("/", 1)[1]
        self.assertEqual(len(token), 32)
        guest = self.client.get(f"/invitations/{token}")
        self.assertEqual(guest.status_code, 200)
        self.assertEqual(guest.headers["cache-control"], "no-store")
        text = json.dumps(guest.json())
        for secret in ["private_account_email", "authorization", "phone", "user_id", "Original private request"]:
            self.assertNotIn(secret, text)
        edited = self.publish(title="Updated wedding")
        self.assertEqual(edited.json()["url"], url)
        self.assertEqual(self.client.get(f"/invitations/{token}").json()["invitation"]["title"], "Updated wedding")
        self.publish(published=False)
        self.assertEqual(self.client.get(f"/invitations/{token}").status_code, 404)
        self.assertEqual(self.client.get("/invitations/not-valid").status_code, 404)

    def test_requires_admin_and_verified_invitation(self):
        self.app.dependency_overrides[get_current_profile] = lambda: {"role": "user"}
        self.assertEqual(self.publish().status_code, 403)
        self.app.dependency_overrides[get_current_profile] = lambda: {"role": "admin"}
        self.db.rows["d17_orders"][0]["status"] = "pending_verification"
        self.assertEqual(self.publish().status_code, 409)
        self.db.rows["d17_orders"][0].update(status="confirmed", product_key="gaming:riot-points:0")
        self.assertEqual(self.publish().status_code, 409)

    def test_validates_content(self):
        for changes in [{"image": "javascript:alert(1)"}, {"image": "//evil.invalid/image"}, {"mood": "invalid"}, {"details": {"name": ""}}, {"details": {"name": "Amira", "date": "2027-99-99"}}, {"details": {"name": "Amira", "time": "99:99"}}]:
            self.assertEqual(self.publish(**changes).status_code, 422, changes)

    def test_venue_photos_survive_publication_and_reject_unsafe_urls(self):
        details = {**self.payload["details"], "venuePhoto1": "https://example.com/venue.jpg"}
        result = self.publish(details=details)
        self.assertEqual(result.status_code, 200)
        token = result.json()["url"].rsplit("/", 1)[1]
        guest = self.client.get(f"/invitations/{token}").json()["invitation"]
        self.assertEqual(guest["details"]["venuePhoto1"], details["venuePhoto1"])
        for url in ["javascript:alert(1)", "//example.com/photo", "data:image/png;base64,abc"]:
            self.assertEqual(self.publish(details={**details, "venuePhoto1": url}).status_code, 422)

    def test_birthday_photo_and_crop_survive_publication(self):
        details = {"name": "Nour", "age": "7", "birthdayPhoto": "https://example.com/portrait.png", "birthdayPhotoX": "0", "birthdayPhotoY": "100", "birthdayPhotoZoom": "1.75"}
        result = self.publish(image="/invitations/birthdays/disco-eighteen.jfif", details=details)
        self.assertEqual(result.status_code, 200)
        token = result.json()["url"].rsplit("/", 1)[1]
        public = self.client.get(f"/invitations/{token}").json()["invitation"]["details"]
        self.assertEqual(public, details)
        for changes in [{"birthdayPhoto": "javascript:alert(1)"}, {"birthdayPhoto": "data:image/png;base64,abc"}, {"birthdayPhotoX": "-1"}, {"birthdayPhotoY": "101"}, {"birthdayPhotoZoom": "0"}, {"birthdayPhotoZoom": "NaN"}, {"birthdayPhotoX": "not-a-number"}]:
            self.assertEqual(self.publish(details={**details, **changes}).status_code, 422, changes)

    def test_google_maps_links_survive_publication_and_are_validated(self):
        for link in ["https://maps.app.goo.gl/Example", "https://www.google.com/maps/place/Tunis", "https://maps.google.com/?q=36.8,10.1", "https://goo.gl/maps/Example"]:
            result = self.publish(details={**self.payload["details"], "mapsUrl": link})
            self.assertEqual(result.status_code, 200, link)
            token = result.json()["url"].rsplit("/", 1)[1]
            self.assertEqual(self.client.get(f"/invitations/{token}").json()["invitation"]["details"]["mapsUrl"], link)
        for link in ["javascript:alert(1)", "https://example.com/maps", "https://google.com.evil.com/maps", "https://google.com/search", "https://user@google.com/maps", "http://maps.app.goo.gl/Example"]:
            self.assertEqual(self.publish(details={**self.payload["details"], "mapsUrl": link}).status_code, 422, link)

    def test_couple_portraits_and_crops_survive_publication(self):
        details = {**self.payload["details"]}
        for field in ("partnerPhoto1", "partnerPhoto2", "couplePhoto"):
            details.update({field: f"https://example.com/{field}.png", f"{field}X": "25", f"{field}Y": "75", f"{field}Zoom": "1.5"})
        result = self.publish(details=details)
        self.assertEqual(result.status_code, 200, result.text)
        token = result.json()["url"].rsplit("/", 1)[1]
        public = self.client.get(f"/invitations/{token}").json()["invitation"]["details"]
        for field in ("partnerPhoto1", "partnerPhoto2", "couplePhoto"):
            self.assertEqual(public[field], details[field])
            self.assertEqual(public[f"{field}Zoom"], "1.5")
            for suffix, invalid in (("X", "101"), ("Y", "-1"), ("Zoom", "4"), ("Zoom", "nan")):
                self.assertEqual(self.publish(details={**details, f"{field}{suffix}": invalid}).status_code, 422)
            self.assertEqual(self.publish(details={**details, field: "javascript:alert(1)"}).status_code, 422)

    def test_authenticated_photo_upload_and_validation(self):
        storage = MagicMock()
        bucket = storage.from_.return_value
        bucket.get_public_url.return_value = "https://example.com/venue.png"
        self.db.storage = storage
        result = self.client.post("/invitations/photos", files={"image": ("venue.png", b"\x89PNG\r\n\x1a\nphoto", "image/png")})
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.json()["url"], "https://example.com/venue.png")
        self.assertTrue(bucket.upload.call_args.args[0].startswith("invitation-venues/"))
        for content, mime in [(b"<svg></svg>", "image/png"), (b"x" * (5 * 1024 * 1024 + 1), "image/jpeg")]:
            self.assertEqual(self.client.post("/invitations/photos", files={"image": ("photo", content, mime)}).status_code, 422)
        del self.app.dependency_overrides[get_current_user]
        self.assertEqual(self.client.post("/invitations/photos", files={"image": ("venue.png", b"photo", "image/png")}).status_code, 401)

    def test_unpublished_and_missing_links_do_not_disclose_content(self):
        self.publish(published=False)
        token = self.db.rows["d17_orders"][0]["delivery"].rsplit("/", 1)[1]
        self.assertEqual(self.client.get(f"/invitations/{token}").status_code, 404)
        self.assertEqual(self.client.get(f"/invitations/{'a' * 32}").status_code, 404)


if __name__ == "__main__":
    unittest.main()
