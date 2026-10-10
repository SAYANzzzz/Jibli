export type InvitationData = { title: string; image: string; mood: string; details: Record<string, string>; certificate?: boolean; published?: boolean };
export function parseInvitation(value: string): { request: string; invitation?: InvitationData } {
  try { const parsed = JSON.parse(value); if (typeof parsed.request === "string") return parsed; } catch { /* Legacy text order. */ }
  return { request: value };
}
