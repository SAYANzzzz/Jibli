export const ADMIN_EMAIL = "sayanzzz2004@gmail.com";

export function isAdminEmail(email?: string | null) {
  return email?.toLowerCase() === ADMIN_EMAIL;
}
