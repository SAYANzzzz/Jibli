import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AnimatedInvitation from "../components/AnimatedInvitation";
import { API_URL } from "../api";
import type { InvitationData } from "../invitationData";
import { useCommerceCopy } from "../i18n/commerceCopy";

export default function GuestInvitation() {
  const { token } = useParams();
  return <GuestInvitationContent key={token} token={token} />;
}

function GuestInvitationContent({ token }: { token: string | undefined }) {
  const copy = useCommerceCopy();
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = window.setTimeout(() => controller.abort(), 65000);
    fetch(`${API_URL}/invitations/${token}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => { if (!response.ok) throw new Error(response.status === 404 ? "This invitation is not available. Please contact your host." : "Could not load your invitation. Check your connection and try again."); return response.json(); })
      .then((result) => { if (active) setInvitation(result.invitation); })
      .catch((e) => { if (active) setError(e instanceof Error && e.message.startsWith("This invitation") ? e.message : "Could not load your invitation. Check your connection and try again."); })
      .finally(() => window.clearTimeout(timeout));
    return () => { active = false; window.clearTimeout(timeout); controller.abort(); };
  }, [token, attempt]);
  return <main className="guestInvitation weddingSelectedDesign">
    <meta name="robots" content="noindex, nofollow" />
    <title>{invitation ? `${invitation.title} · Jibli` : "Invitation · Jibli"}</title>
    {error ? <div className="guestInvitationStatus"><p role="alert">{copy(error)}</p><button type="button" className="outlineBtn" onClick={() => { setError(""); setAttempt((value) => value + 1); }}>{copy("Try again")}</button></div> : invitation ? <AnimatedInvitation key={token} guest title={invitation.title} image={invitation.image} certificate={invitation.certificate} details={{ ...invitation.details, mood: invitation.mood }} /> : <p role="status">{copy("Opening your invitation…")}</p>}
  </main>;
}
