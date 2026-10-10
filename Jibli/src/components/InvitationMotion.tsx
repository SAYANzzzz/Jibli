/** Independent vector layers keep the wording still while the decorations move. */
export default function InvitationMotion({ mood }: { mood: string }) {
  return <div className={`inviteMotion inviteMotion-${mood}`} aria-hidden="true">
    {[false, true].map((right) => <svg key={String(right)} className={`inviteBotanical ${right ? "inviteBotanicalRight" : ""}`} viewBox="0 0 120 260" fill="none">
      <g className="inviteBranch">
        <path d="M12 260 Q90 170 52 20" stroke="currentColor" strokeWidth="1.3" />
        {[35, 75, 115, 155, 195].map((y, i) => <g key={y} className="inviteLeaf" style={{ animationDelay: `${i * -.6}s` }}>
          <path d={`M60 ${y + 25} Q${i % 2 ? 100 : 12} ${y + 18} ${i % 2 ? 92 : 20} ${y - 12} Q55 ${y} 60 ${y + 25}`} fill="currentColor" opacity=".45" />
        </g>)}
        <g className="inviteBlossom" transform="translate(53 36)">
          {[0, 60, 120, 180, 240, 300].map((angle) => <ellipse key={angle} cx="0" cy="-10" rx="6" ry="13" transform={`rotate(${angle})`} fill="currentColor" opacity=".4" />)}
          <circle r="4" fill="currentColor" />
        </g>
      </g>
    </svg>)}
    <svg className="inviteButterfly" viewBox="0 0 60 50" fill="currentColor">
      <path className="inviteWingLeft" d="M30 27 C4 -8 -8 22 26 33 C5 49 26 53 30 30Z" />
      <path className="inviteWingRight" d="M30 27 C56 -8 68 22 34 33 C55 49 34 53 30 30Z" />
      <path d="M30 19v17m0-15-5-7m5 7 5-7" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
    <span className="inviteOrbit" />
    {Array.from({ length: 7 }, (_, i) => <span key={i} className="invitePetal" style={{ left: `${10 + i * 13}%`, animationDelay: `${i * -2.1}s`, animationDuration: `${14 + i % 3 * 3}s` }} />)}
  </div>;
}
