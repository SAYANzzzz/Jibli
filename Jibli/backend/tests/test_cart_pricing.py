import unittest
from app.pricing import calculate_cart_total


class CartPricingTests(unittest.TestCase):
    def test_recalculates_instead_of_using_estimate(self):
        self.assertEqual(calculate_cart_total([{"shop": "aliexpress", "quantity": 2, "selected_options": {"usd_price": "10"}, "estimated_price": 1}]), 79)

    def test_legacy_request_needs_quote(self):
        self.assertIsNone(calculate_cart_total([{"shop": "aliexpress", "quantity": 1, "selected_options": {}}]))

    def test_rejects_invalid_amounts(self):
        for value in ["nan", "inf", "-1", "0", "bad"]:
            with self.assertRaises(ValueError):
                calculate_cart_total([{"shop": "aliexpress", "quantity": 1, "selected_options": {"usd_price": value}}])
