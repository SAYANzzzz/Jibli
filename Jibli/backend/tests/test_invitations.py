import json
import unittest
from unittest.mock import patch
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

    def test_unpublished_and_missing_links_do_not_disclose_content(self):
        self.publish(published=False)
        token = self.db.rows["d17_orders"][0]["delivery"].rsplit("/", 1)[1]
        self.assertEqual(self.client.get(f"/invitations/{token}").status_code, 404)
        self.assertEqual(self.client.get(f"/invitations/{'a' * 32}").status_code, 404)


if __name__ == "__main__":
    unittest.main()
