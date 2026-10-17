type Invitation = { title: string; details: Record<string, string> };
export function invitationSlug(invitation: Invitation): string;
export function invitationToken(path: string): string | null;
export function invitationSharePath(path: string, invitation: Invitation): string;
