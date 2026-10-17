import { useId } from "react";

/** Folded cardstock, coloured by the invitation's palette. */
export default function InvitationEnvelopeArtwork() {
  const id = useId().replaceAll(":", "");
  return <svg className="inviteEnvelopeCraft" viewBox="0 0 736 1308" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${id}-paper`} x2="1" y2="1"><stop stopColor="var(--stock-light)" /><stop offset=".55" stopColor="var(--stock)" /><stop offset="1" stopColor="var(--stock-dark)" /></linearGradient>
      <linearGradient id={`${id}-flap`} x1="1" y1="0" x2="0" y2=".6"><stop stopColor="var(--stock-light)" /><stop offset=".8" stopColor="var(--stock)" /><stop offset="1" stopColor="var(--stock-dark)" /></linearGradient>
      <radialGradient id={`${id}-shade`}><stop offset=".35" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".24" /></radialGradient>
      <filter id={`${id}-shadow`} x="-20%" y="-10%" width="140%" height="120%"><feDropShadow dx="-5" dy="4" stdDeviation="5" floodOpacity=".4" /></filter>
      <filter id={`${id}-grain`}><feTurbulence type="fractalNoise" baseFrequency=".62" numOctaves="3" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
    </defs>
    <rect width="736" height="1308" fill={`url(#${id}-paper)`} />
    <path d="M0 0 Q65 12 110 90 L390 600 L0 1308Z" fill="var(--stock-dark)" opacity=".45" />
    <path d="M0 1308 Q22 1260 69 1200 L387 699 L736 1308Z" fill={`url(#${id}-paper)`} stroke="#000" strokeOpacity=".18" strokeWidth="3" />
    <path d="M0 0 Q65 4 111 91 L385 598" fill="none" stroke="#fff" strokeOpacity=".12" strokeWidth="3" />
    <path className="inviteEnvelopeCraftFlap" d="M736 0 Q685 0 642 57 L282 600 Q245 651 282 703 L644 1248 Q685 1300 736 1308Z" fill={`url(#${id}-flap)`} filter={`url(#${id}-shadow)`} />
    <rect width="736" height="1308" filter={`url(#${id}-grain)`} opacity=".13" style={{ mixBlendMode: "soft-light" }} />
    <rect width="736" height="1308" fill={`url(#${id}-shade)`} />
  </svg>;
}
