import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AnimatedInvitation from "../components/AnimatedInvitation";
import { API_URL } from "../api";
import type { InvitationData } from "../invitationData";

export default function GuestInvitation() {
  const { token } = useParams();
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/invitations/${token}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => { if (!response.ok) throw new Error("This invitation is not available. Please contact your host."); return response.json(); })
      .then((result) => setInvitation(result.invitation))
      .catch((e) => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [token]);
  return <main className="guestInvitation weddingSelectedDesign">
    <meta name="robots" content="noindex, nofollow" />
    <title>{invitation ? `${invitation.title} · Jibli` : "Invitation · Jibli"}</title>
    {error ? <p role="alert">{error}</p> : invitation ? <AnimatedInvitation key={token} guest title={invitation.title} image={invitation.image} certificate={invitation.certificate} details={{ ...invitation.details, mood: invitation.mood }} /> : <p role="status">Opening your invitation…</p>}
  </main>;
}
