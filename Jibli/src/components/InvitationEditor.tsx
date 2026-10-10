import { useState } from "react";
import { apiFetch } from "../api";
import { parseInvitation } from "../invitationData";
import type { PaymentOrder } from "../payments";
import AnimatedInvitation from "./AnimatedInvitation";

export default function InvitationEditor({ order, onSave }: { order: PaymentOrder; onSave: (order: PaymentOrder) => void }) {
  const initial = parseInvitation(order.details).invitation;
  const [title, setTitle] = useState(initial?.title || order.title);
  // Reference artwork contains sample names: use the personalised web design unless final artwork was saved by admin.
  const [image, setImage] = useState(order.delivery.startsWith("/invite/") ? initial?.image || "" : "");
  const [details, setDetails] = useState(initial?.details || { name: "", date: "", time: "", venue: "", note: "", contact: "", language: "French" });
  const [mood, setMood] = useState(initial?.mood || "champagne");
  const [certificate, setCertificate] = useState(initial?.certificate || false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save(published: boolean) {
    setBusy(true); setError("");
    try { const result = await apiFetch(`/admin/payments/${order.id}/invitation`, { method: "PUT", body: JSON.stringify({ title, image, mood, details, certificate, published }) }); onSave(result.payment); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not save invitation."); }
    finally { setBusy(false); }
  }
  return <details className="invitationEditor"><summary>Edit & publish guest invitation</summary><form className="invitationForm" onSubmit={(e) => { e.preventDefault(); void save(true); }}>
    <label>Invitation title<input required maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} /></label>
    <label>Final artwork URL (optional)<input type="url" placeholder="https://… Leave blank for the personalised web design" value={image} onChange={(e) => setImage(e.target.value)} /></label>
    <label><input type="checkbox" checked={certificate} onChange={(e) => setCertificate(e.target.checked)} /> Achievement certificate</label>
    {Object.entries({ name: "Recipient / host name", couple: "Couple names", hosts: "Hosts / organisation", school: "School / achievement", date: "Date", time: "Time", venue: "Venue", language: "Language", contact: "Guest RSVP contact", note: "Public message" }).map(([key, label]) => <label key={key}>{label}<input type={key === "date" ? "date" : key === "time" ? "time" : "text"} required={key === "name" && !details.couple} maxLength={key === "note" ? 3000 : 160} value={details[key] || ""} onChange={(e) => setDetails((current) => ({ ...current, [key]: e.target.value }))} /></label>)}
    <label>Colour mood<select value={mood} onChange={(e) => setMood(e.target.value)}><option value="champagne">Champagne</option><option value="garden">Botanical</option><option value="midnight">Midnight</option><option value="confetti">Rose</option></select></label>
    <p>Only these public invitation fields appear to guests. Review the preview before publishing.</p>
    <div className="weddingSelectedDesign"><AnimatedInvitation key={`${image}-${certificate}`} title={title} image={image} details={{ ...details, mood }} onMoodChange={setMood} certificate={certificate} /></div>
    {error && <p role="alert">{error}</p>}<div className="d17Actions"><button className="primaryBtn" disabled={busy}>Save & publish</button><button type="button" className="outlineBtn" disabled={busy} onClick={() => save(false)}>Save & unpublish</button></div>
  </form></details>;
}
