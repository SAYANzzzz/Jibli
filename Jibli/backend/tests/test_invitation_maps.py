import unittest
from unittest.mock import patch, MagicMock
from urllib.parse import parse_qs, urlsplit

from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

from app.invitations import router
from app.invitation_maps import navigation_url, expand_maps_link


class InvitationMapsTests(unittest.TestCase):
    def tearDown(self):
        expand_maps_link.cache_clear()

    def test_directions_use_the_destination_and_current_location(self):
        for link, destination in [
            ("https://maps.google.com/?q=36.8,10.1", "36.8,10.1"),
            ("https://www.google.com/maps/place/Le+Serail/data=!3d36.7!4d10.2", "36.7,10.2"),
            ("https://www.google.com/maps/place/Le+Serail", "Le Serail"),
        ]:
            result = navigation_url(link, "Different venue")
            self.assertEqual(urlsplit(result).path, "/maps/dir/")
            query = parse_qs(urlsplit(result).query)
            self.assertEqual(query["destination"], [destination])
            self.assertEqual(query["dir_action"], ["navigate"])
            self.assertNotIn("origin", query)

    def test_short_share_link_redirects_to_exact_pin(self):
        app = FastAPI()
        app.include_router(router)
        with patch("app.invitation_maps.httpx.Client") as client:
            response = MagicMock(status_code=302, headers={"location": "https://www.google.com/maps/place/Venue/data=!3d36.7!4d10.2"})
            client.return_value.__enter__.return_value.stream.return_value.__enter__.return_value = response
            result = TestClient(app).get("/invitations/directions", params={"link": "https://maps.app.goo.gl/example"}, follow_redirects=False)
        self.assertEqual(result.status_code, 302)
        self.assertEqual(parse_qs(urlsplit(result.headers["location"]).query)["destination"], ["36.7,10.2"])

    def test_rejects_redirects_outside_google_maps(self):
        with patch("app.invitation_maps.httpx.Client") as client:
            response = MagicMock(status_code=302, headers={"location": "http://127.0.0.1/private"})
            stream = client.return_value.__enter__.return_value.stream
            stream.return_value.__enter__.return_value = response
            with self.assertRaises(HTTPException):
                navigation_url("https://maps.app.goo.gl/example", "Venue")
            self.assertEqual(stream.call_count, 1)

    def test_preserves_place_id(self):
        result = navigation_url("https://www.google.com/maps/search/?query=Venue&query_place_id=ChIJ123", "Venue")
        self.assertEqual(parse_qs(urlsplit(result).query)["destination_place_id"], ["ChIJ123"])
