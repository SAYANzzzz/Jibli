"""Convert shared Google Maps locations into navigation links."""
import re
from functools import lru_cache
from urllib.parse import parse_qs, unquote_plus, urlencode, urljoin, urlsplit

import httpx
from fastapi import HTTPException


def valid_maps_url(value):
    try:
        url = urlsplit(value)
        return url.scheme == "https" and not (url.username or url.password or url.port) and (
            url.hostname in {"maps.app.goo.gl", "maps.google.com"} or
            (url.hostname in {"www.google.com", "google.com", "goo.gl"} and re.match(r"^/maps(?:/|$)", url.path))
        )
    except ValueError:
        return False


@lru_cache(maxsize=256)
def expand_maps_link(link):
    # Validate every hop; never fetch an arbitrary destination from a redirect.
    try:
        with httpx.Client(timeout=5, follow_redirects=False) as client:
            for _ in range(5):
                if not valid_maps_url(link):
                    break
                if urlsplit(link).hostname not in {"maps.app.goo.gl", "goo.gl"}:
                    return link
                with client.stream("GET", link) as response:
                    if response.status_code not in {301, 302, 303, 307, 308} or not response.headers.get("location"):
                        break
                    link = urljoin(link, response.headers["location"])
    except httpx.HTTPError:
        pass
    raise HTTPException(422, "Could not read this Google Maps share link. Copy the full place link from Google Maps and try again.")


def navigation_url(link, venue):
    if not valid_maps_url(link):
        raise HTTPException(422, "Paste a valid Google Maps HTTPS link.")
    url = urlsplit(expand_maps_link(link))
    query = parse_qs(url.query)
    coordinates = re.search(r"!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)", url.path)
    place = re.search(r"/place/([^/]+)", url.path)
    destination = next((query[key][0] for key in ("destination", "query", "q") if query.get(key)), None)
    destination = destination or (f"{coordinates[1]},{coordinates[2]}" if coordinates else unquote_plus(place[1]) if place else None)
    if not destination:
        raise HTTPException(422, "This link has no readable destination. Copy the full place link from Google Maps.")
    params = {"api": "1", "destination": destination, "travelmode": "driving", "dir_action": "navigate"}
    place_id = query.get("destination_place_id") or query.get("query_place_id")
    if place_id:
        params["destination_place_id"] = place_id[0]
    return f"https://www.google.com/maps/dir/?{urlencode(params)}"
