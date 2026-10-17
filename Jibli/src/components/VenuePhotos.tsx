import { useState } from "react";
import { apiFetch } from "../api";
import { useCommerceCopy } from "../i18n/commerceCopy";
import { venuePhotoKeys } from "../invitationPhotos";

export default function VenuePhotos({ details, onChange, onBusyChange, disabled = false }: { details: Record<string, string>; onChange: (photos: Record<string, string>) => void; onBusyChange?: (busy: boolean) => void; disabled?: boolean }) {
  const copy = useCommerceCopy();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const photos = venuePhotoKeys.map((key) => details[key]).filter(Boolean);
  return <fieldset className="venuePhotoUpload" disabled={busy || disabled}>
    <legend>{copy("Invitation photos (optional)")}</legend>
    <p>{copy("Add up to 3 photos for your photo collage. JPG, PNG or WebP, up to 5 MB each.")}</p>
    <label>{busy ? copy("Uploading photos…") : copy("Add invitation photos")}<input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy || photos.length === 3} onChange={async (event) => {
      const files = Array.from(event.target.files || []);
      event.target.value = "";
      if (!files.length) return;
      setError("");
      if (files.length + photos.length > 3 || files.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024)) {
        setError(copy("Choose up to 3 JPG, PNG or WebP photos, no larger than 5 MB each.")); return;
      }
      setBusy(true); onBusyChange?.(true);
      const next = [...photos];
      try {
        for (const file of files) {
          const body = new FormData(); body.append("image", file);
          const result = await apiFetch("/invitations/photos", { method: "POST", body });
          next.push(result.url);
        }
      } catch (cause) { setError(cause instanceof Error ? cause.message : copy("Could not upload photos. Try again.")); }
      finally { onChange(Object.fromEntries(venuePhotoKeys.map((key, index) => [key, next[index] || ""]))); setBusy(false); onBusyChange?.(false); }
    }} /></label>
    {busy && <p role="status">{copy("Uploading photos…")}</p>}
    {error && <p role="alert">{error}</p>}
    <div className="venuePhotoPreviews">{photos.map((url, index) => <div key={url}><img src={url} alt={`${copy("Invitation photo")} ${index + 1}`} /><button type="button" onClick={() => {
      const next = photos.filter((_, i) => i !== index);
      onChange(Object.fromEntries(venuePhotoKeys.map((key, i) => [key, next[i] || ""])));
    }}>{copy("Remove photo")}</button></div>)}</div>
  </fieldset>;
}
