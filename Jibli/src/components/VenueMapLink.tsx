import { useCommerceCopy } from "../i18n/commerceCopy";
import { isGoogleMapsLink } from "../invitationMaps";

export default function VenueMapLink({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const copy = useCommerceCopy();
  return <label>{copy("Google Maps link (optional)")}
    <input type="url" inputMode="url" maxLength={2000} value={value} placeholder="https://maps.app.goo.gl/…" onChange={(event) => {
      const link = event.target.value.trim();
      event.target.setCustomValidity(!link || isGoogleMapsLink(link) ? "" : copy("Paste a valid Google Maps HTTPS link."));
      onChange(link);
    }} />
    <span>{copy("In Google Maps, choose Share, then Copy link. Guests will open this exact location.")}</span>
  </label>;
}
