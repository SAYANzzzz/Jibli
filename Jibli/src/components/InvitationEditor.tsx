import BirthdayPhotoInput from "./BirthdayPhotoInput";
import { birthdayHasAge, birthdayDesignKey, birthdayLayouts } from "../birthdayPersonalisation";
import VenueMapLink from "./VenueMapLink";
import VenuePhotos from "./VenuePhotos";
import { useState } from "react";
import { apiFetch } from "../api";
import { parseInvitation } from "../invitationData";
import type { PaymentOrder } from "../payments";
import AnimatedInvitation from "./AnimatedInvitation";
import { resolveInvitationImage, invitationIsCertificate } from "../invitationTemplates";

export default function InvitationEditor({ order, onSave }: { order: PaymentOrder; onSave: (order: PaymentOrder) => void }) {
  const initial = parseInvitation(order.details).invitation;
  const selectedArtwork = resolveInvitationImage({ title: order.title, image: "" }, order.product_key);
  const [title, setTitle] = useState(initial?.title || order.title);
  const [image, setImage] = useState(resolveInvitationImage(initial || { title: order.title, image: "" }, order.product_key) || selectedArtwork);
  const artwork = image.trim() || selectedArtwork;
  const [details, setDetails] = useState(initial?.details || { name: "", date: "", time: "", venue: "", note: "", contact: "", language: "French" });
  const [mood, setMood] = useState(initial?.mood || "champagne");
  const [customCertificate, setCertificate] = useState(initial?.certificate || false);
  const certificate = invitationIsCertificate(resolveInvitationImage({image: artwork,title}), customCertificate);
  const [busy, setBusy] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function save(published: boolean) {
    if (busy || uploadingPhotos) return;
    setBusy(true); setError(""); setNotice("");
    try { const result = await apiFetch(`/admin/payments/${order.id}/invitation`, { method: "PUT", body: JSON.stringify({ title, image: artwork, mood, details, certificate, published }) }); onSave(result.payment); setNotice(published ? "Published. Your invitation link and ready-to-send messages are in the sharing card above." : "Unpublished. The guest link is disabled until you publish again."); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not save invitation."); }
    finally { setBusy(false); }
  }
  return <details className="invitationEditor"><summary>Edit & publish guest invitation</summary><form className="invitationForm" onSubmit={(e) => { e.preventDefault(); void save(true); }}>
    <aside className="invitationPublishHelp"><strong>1. Personalise · 2. Publish · 3. Send</strong><p>Review the names and event details, then open the preview. Leave the artwork URL blank for a personalised card; add only finished artwork with the correct names.</p><p>Save &amp; publish creates a sharing card above this editor. Preview the guest link, then choose Send to client for the handoff message, or Share with guests for the invitation message. WhatsApp opens a draft for you to review and send. Guests need no account. Edits keep the same link; unpublishing disables it.</p></aside>
    <label>Invitation title<input required maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} /></label>
    <label>Final artwork URL (optional)<input type="text" inputMode="url" placeholder="https://… Leave blank to keep the selected design" maxLength={2000} value={image} onChange={(e) => setImage(e.target.value)} /></label>
    <label className="invitationCertificateToggle"><input type="checkbox" disabled={artwork.startsWith("/invitations/")} checked={certificate} onChange={(e) => setCertificate(e.target.checked)} /> Achievement certificate</label>
    {Object.entries({ name: "Recipient / host name", couple: "Couple names", hosts: "Hosts / organisation", school: "School / achievement", date: "Date", time: "Time", venue: "Venue", language: "Language", contact: "Guest RSVP contact", note: "Public message" }).map(([key, label]) => <label key={key}>{label}<input type={key === "date" ? "date" : key === "time" ? "time" : "text"} required={key === "name" && !details.couple} maxLength={key === "note" ? 3000 : 160} value={details[key] || ""} onChange={(e) => setDetails((current) => ({ ...current, [key]: e.target.value }))} /></label>)}
    <label>Colour mood<select value={mood} onChange={(e) => setMood(e.target.value)}><option value="champagne">Champagne</option><option value="garden">Botanical</option><option value="midnight">Midnight</option><option value="confetti">Rose</option></select></label>
    <p>Only these public invitation fields appear to guests. Review the preview before publishing.</p>
    <VenueMapLink value={(details as Record<string, string>).mapsUrl || ""} onChange={(mapsUrl) => setDetails((current) => ({ ...current, mapsUrl }))} />
{birthdayLayouts[birthdayDesignKey(artwork)] && <>
{birthdayHasAge(artwork) && <label>Age on the invitation<input type="number" min="0" max="120" step="1" value={details.age || ""} onChange={(event) => setDetails((current) => ({ ...current, age: event.target.value }))} /></label>}
<BirthdayPhotoInput details={details} disabled={busy || uploadingPhotos} onBusyChange={setUploadingPhotos} onChange={(fields) => setDetails((current) => ({ ...current, ...fields }))} />
</>}
<VenuePhotos details={details} disabled={busy || uploadingPhotos} onBusyChange={setUploadingPhotos} onChange={(photos) => setDetails((current) => ({ ...current, ...photos }))} />
    <div className="weddingSelectedDesign"><AnimatedInvitation key={`${artwork}-${certificate}`} title={title} image={artwork} details={{ ...details, mood }} onMoodChange={setMood} certificate={certificate} /></div>
    {error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}<div className="d17Actions"><button className="primaryBtn" disabled={busy || uploadingPhotos}>{uploadingPhotos ? "Uploading photos…" : busy ? "Saving…" : "Save & publish"}</button><button type="button" className="outlineBtn" disabled={busy || uploadingPhotos} onClick={() => save(false)}>Save & unpublish</button></div>
  </form></details>;
}
