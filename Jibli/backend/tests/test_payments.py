import copy
import unittest
from types import SimpleNamespace
from unittest.mock import patch
from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient
from postgrest.exceptions import APIError

from app.auth import get_current_profile, get_current_user, require_admin
from app.payments import CATALOG, router
from app.quotes import quote_marker


class Query:
    def __init__(self, db, table):
        self.db, self.name, self.filters = db, table, []
        self.operation, self.values = "select", None

    def select(self, *_): return self
    def order(self, *_, **__): return self
    def eq(self, field, value):
        self.filters.append((field, value))
        return self

    def insert(self, values):
        self.operation, self.values = "insert", values
        return self

    def update(self, values):
        self.operation, self.values = "update", values
        return self

    def execute(self):
        table = self.db.rows.setdefault(self.name, [])
        if self.operation == "insert":
            if any(row["id"] == self.values["id"] for row in table):
                raise APIError({"code": "23505", "message": "duplicate", "details": "", "hint": ""})
            row = {"status": "pending_payment", "authorization": None, "delivery": "", "review_note": "", **self.values}
            table.append(row)
            return SimpleNamespace(data=[copy.deepcopy(row)])
        rows = [row for row in table if all(row.get(key) == value for key, value in self.filters)]
        if self.operation == "update":
            reference = self.values.get("authorization")
            if reference and any(row.get("authorization") == reference and row not in rows for row in table):
                raise APIError({"code": "23505", "message": "duplicate", "details": "", "hint": ""})
            for row in rows: row.update(self.values)
        return SimpleNamespace(data=copy.deepcopy(rows))


class Database:
    def __init__(self): self.rows = {}
    def table(self, name): return Query(self, name)
    def rpc(self, _, args):
        return Query(self, "d17_orders").update(args["changes"]).eq("id", args["payment_id"]).eq("status", args["expected_status"])


class PaymentTests(unittest.TestCase):
    def setUp(self):
        self.db = Database()
        self.user = {"id": str(uuid4())}
        app = FastAPI()
        app.include_router(router)
        app.dependency_overrides[get_current_user] = lambda: self.user
        app.dependency_overrides[get_current_profile] = lambda: {**self.user, "role": "user"}
        self.app = app
        self.client = TestClient(app)
        self.patch = patch("app.payments.get_supabase_admin", return_value=self.db)
        self.patch.start()
        self.addCleanup(self.patch.stop)

    def checkout(self, **extra):
        key = next(key for key in CATALOG if key.startswith("invitation:weddings:"))
        return self.client.post("/payments/checkout", json={"id": str(uuid4()), "product_key": key, "phone": "92123456", **extra})

    def reference(self, payment, number="000123"):
        return self.client.post(f"/payments/{payment['id']}/reference", json={"authorization": number})

    def admin(self):
        self.app.dependency_overrides[require_admin] = lambda: {"id": str(uuid4())}

    def test_server_price_and_idempotency(self):
        response = self.checkout(amount=1)
        self.assertEqual(response.status_code, 200)
        payment = response.json()["payment"]
        self.assertEqual(payment["amount"], 15)
        response = self.checkout(id=payment["id"])
        self.assertEqual(response.json()["payment"]["id"], payment["id"])
        self.assertEqual(len(self.db.rows["d17_orders"]), 1)

    def test_reference_preserves_zeros_and_requires_admin(self):
        payment = self.checkout().json()["payment"]
        result = self.reference(payment)
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.json()["payment"]["authorization"], "000123")
        self.assertEqual(result.json()["payment"]["status"], "pending_verification")
        self.assertEqual(self.reference(payment).status_code, 200)
        self.assertEqual(self.client.patch(f"/admin/payments/{payment['id']}", json={"status": "confirmed"}).status_code, 403)

    def test_duplicate_and_invalid_references(self):
        first = self.checkout().json()["payment"]
        second = self.checkout().json()["payment"]
        self.assertEqual(self.reference(first).status_code, 200)
        self.assertEqual(self.reference(second).status_code, 409)
        for invalid in ["", "abc", "12 34", "1.23", "-12"]:
            self.assertEqual(self.reference(second, invalid).status_code, 422)

    def test_ownership(self):
        payment = self.checkout().json()["payment"]
        self.user = {"id": str(uuid4())}
        self.assertEqual(self.reference(payment).status_code, 404)
        self.assertEqual(self.client.get("/payments").json()["payments"], [])

    def test_admin_lifecycle_and_delivery(self):
        payment = self.checkout().json()["payment"]
        self.admin()
        url = f"/admin/payments/{payment['id']}"
        self.assertEqual(self.client.patch(url, json={"status": "confirmed"}).status_code, 409)
        self.reference(payment)
        self.assertEqual(self.client.patch(url, json={"status": "delivered", "delivery": "CODE"}).status_code, 409)
        self.assertEqual(self.client.patch(url, json={"status": "confirmed"}).status_code, 200)
        self.assertEqual(self.client.patch(url, json={"status": "processing"}).status_code, 200)
        self.assertEqual(self.client.patch(url, json={"status": "delivered"}).status_code, 400)
        self.assertEqual(self.client.patch(url, json={"status": "delivered", "delivery": "Gift code: ABC-123"}).status_code, 200)
        self.assertEqual(self.client.get("/payments").json()["payments"][0]["delivery"], "Gift code: ABC-123")

    def test_rejection_requires_reason_and_allows_correction(self):
        payment = self.checkout().json()["payment"]
        self.reference(payment)
        self.admin()
        url = f"/admin/payments/{payment['id']}"
        self.assertEqual(self.client.patch(url, json={"status": "rejected"}).status_code, 400)
        self.assertEqual(self.client.patch(url, json={"status": "rejected", "note": "Transfer amount does not match."}).status_code, 200)
        self.assertEqual(self.reference(payment, "000124").status_code, 200)

    def test_aliexpress_requires_owned_confirmed_quote(self):
        order_id = str(uuid4())
        self.assertEqual(self.checkout(order_id=order_id).status_code, 400)
        self.db.rows["orders"] = [{"id": order_id, "user_id": self.user["id"], "status": "waiting_confirmation", "final_price": 73}]
        self.assertEqual(self.checkout(order_id=order_id).status_code, 400)
        self.db.rows["order_events"] = [{"order_id": order_id, "note": quote_marker(self.db.rows["orders"][0])}]
        self.assertEqual(self.checkout(order_id=order_id).json()["payment"]["amount"], 73)

    def test_unknown_or_unpriced_products_and_invalid_phone(self):
        self.assertEqual(self.checkout(product_key="unknown").status_code, 400)
        unpriced = next(key for key, value in CATALOG.items() if value["amount"] is None)
        self.assertEqual(self.checkout(product_key=unpriced).status_code, 400)
        self.assertEqual(self.checkout(phone="123").status_code, 422)

    def test_missing_database_fails_before_payment_instructions(self):
        with patch.object(self.db, "table", side_effect=APIError({"code": "PGRST205", "message": "not found", "details": "", "hint": ""})):
            response = self.checkout()
        self.assertEqual(response.status_code, 503)
        self.assertIn("before transferring money", response.json()["detail"])


if __name__ == "__main__": unittest.main()
