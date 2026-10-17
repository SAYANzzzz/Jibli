export function isGoogleMapsLink(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.port && (
      url.hostname === "maps.app.goo.gl" || url.hostname === "maps.google.com" ||
      (["google.com", "www.google.com", "goo.gl"].includes(url.hostname) && /^\/maps(?:\/|$)/.test(url.pathname))
    );
  } catch { return false; }
}

export function invitationMapQuery(link: string, venue: string): string {
  if (!isGoogleMapsLink(link)) return venue;
  const url = new URL(link);
  const coordinates = url.pathname.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  const place = url.pathname.match(/\/place\/([^/]+)/);
  let placeName = "";
  try { placeName = place ? decodeURIComponent(place[1]).replaceAll("+", " ") : ""; } catch { /* Fall back to the venue for malformed pasted paths. */ }
  return url.searchParams.get("destination") || url.searchParams.get("query") || url.searchParams.get("q") ||
    (coordinates ? `${coordinates[1]},${coordinates[2]}` : placeName || venue);
}

export function invitationDirectionsUrl(link: string, venue: string): string {
  const mapsLink = link.trim();
  if (isGoogleMapsLink(mapsLink)) return mapsLink;
  const params = new URLSearchParams({ api: "1", destination: venue, travelmode: "driving", dir_action: "navigate" });
  return `https://www.google.com/maps/dir/?${params}`;
}
