import { useState } from "react";
import { Copy, ExternalLink, MessageCircle, Share2 } from "lucide-react";
import type { InvitationData } from "../invitationData";
import { invitationClientPhone, invitationShareMessage } from "../invitationSharing";
import { useCommerceCopy } from "../i18n/commerceCopy";
import "./InvitationShareCard.css";
import { invitationSharePath } from "../../shared/invitation-links.mjs";

export default function InvitationShareCard({ path, invitation, clientPhone }: { path: string; invitation: InvitationData; clientPhone?: string }) {
  const copy = useCommerceCopy();
  const [notice, setNotice] = useState("");
  const [audience, setAudience] = useState<"client" | "guests">(clientPhone ? "client" : "guests");
  const url = new URL(invitationSharePath(path, invitation), location.origin).href;
  const message = invitationShareMessage(invitation, url, audience === "client");
  const phone = clientPhone ? invitationClientPhone(clientPhone) : "";
  const canShare = typeof navigator.share === "function";
  async function copyText(value: string) {
    try { await navigator.clipboard.writeText(value); setNotice(copy("Copied")); }
    catch { setNotice(copy("Select the text below to copy it.")); }
  }
  if (invitation.published === false) return <div className="invitationShareCard"><strong>{copy("Invitation unpublished")}</strong><p>{copy("Publish the invitation to enable sharing. Its existing link is currently unavailable.")}</p></div>;
  return <section className="invitationShareCard" aria-label={copy("Share invitation")}>
    <div className="invitationShareHeading"><span className="invitationReadyDot" /><strong>{copy("Your invitation is ready to share")}</strong></div>
    <p>{copy("Preview the invitation, then send the link. Guests can open it without an account.")}</p>
    <label>{copy("Guest invitation link")}<input readOnly dir="ltr" value={url} onFocus={(event) => event.target.select()} /></label>
    <div className="invitationShareActions"><a className="outlineBtn" href={url} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} />{copy("Preview invitation")}</a><button type="button" className="outlineBtn" onClick={() => copyText(url)}><Copy size={15} />{copy("Copy invitation link")}</button></div>
    <div className="invitationAudience" role="group" aria-label={copy("Message recipient")}>
      {clientPhone && <button type="button" aria-pressed={audience === "client"} onClick={() => setAudience("client")}>{copy("Send to client")}</button>}
      <button type="button" aria-pressed={audience === "guests"} onClick={() => setAudience("guests")}>{copy("Share with guests")}</button>
    </div>
    <label>{copy("Ready-to-send message")}<textarea readOnly rows={8} dir="auto" value={message} onFocus={(event) => event.target.select()} /></label>
    <div className="invitationShareActions"><a className="primaryBtn" href={`https://wa.me/${audience === "client" ? phone : ""}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} />{copy("Open WhatsApp message")}</a><button type="button" className="outlineBtn" onClick={() => copyText(message)}><Copy size={15} />{copy("Copy message")}</button>
      {canShare && <button type="button" className="outlineBtn" onClick={async () => { try { await navigator.share({ title: invitation.title, text: message }); } catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) setNotice(copy("Use Copy message or WhatsApp to share this invitation.")); } }}><Share2 size={15} />{copy("More sharing options")}</button>}
    </div>
    <small>{audience === "client" && phone ? `WhatsApp: +${phone}. ` : ""}{copy("WhatsApp opens a draft. Review it and tap Send.")}</small>
    <p className="invitationShareNotice" role="status">{notice}</p>
  </section>;
}
