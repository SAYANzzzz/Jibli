import unittest
from unittest.mock import patch
from uuid import uuid4

from fastapi import HTTPException

from app.main import submit_order, update_order_status
from app.payments import checkout, CheckoutIn
from app.schemas import AdminOrderUpdateIn
from test_payments import Database, Query


class DefaultIdQuery(Query):
    def insert(self, values):
        return super().insert({"id": str(uuid4()), **values})


class QuoteDatabase(Database):
    def table(self, name):
        return DefaultIdQuery(self, name)


class QuoteFlowTests(unittest.TestCase):
    def test_customer_estimate_cannot_authorize_payment(self):
        db = QuoteDatabase()
        user = {"id": str(uuid4())}
        cart_id = str(uuid4())
        db.rows["carts"] = [{"id": cart_id, "status": "active"}]
        db.rows["cart_items"] = [{"id": str(uuid4()), "cart_id": cart_id, "shop": "aliexpress", "quantity": 1, "selected_options": {"usd_price": "0.01"}}]
        with patch("app.main.get_supabase_admin", return_value=db), patch("app.main.get_or_create_active_cart", return_value={"id": cart_id}), patch("app.payments.get_supabase_admin", return_value=db):
            order = submit_order(user)["order"]
            self.assertEqual(order["status"], "new_request")
            self.assertIsNone(order["final_price"])
            payload = CheckoutIn(id=uuid4(), product_key="aliexpress", order_id=order["id"], phone="92123456")
            with self.assertRaises(HTTPException) as error:
                checkout(payload, user)
            self.assertEqual(error.exception.status_code, 400)
            update_order_status(order["id"], AdminOrderUpdateIn(status="price_confirmed", final_price=120), {"full_name": "Admin"})
            payment = checkout(payload, user)["payment"]
            self.assertEqual(payment["amount"], 120)
            db.rows["orders"][0]["final_price"] = 1
            forged = CheckoutIn(id=uuid4(), product_key="aliexpress", order_id=order["id"], phone="92123456")
            with self.assertRaises(HTTPException) as forged_error:
                checkout(forged, user)
            self.assertEqual(forged_error.exception.status_code, 400)
