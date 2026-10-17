const arabicLetters = { ا: "a", ب: "b", ت: "t", ث: "th", ج: "j", ح: "h", خ: "kh", د: "d", ذ: "dh", ر: "r", ز: "z", س: "s", ش: "sh", ص: "s", ض: "d", ط: "t", ظ: "dh", ع: "a", غ: "gh", ف: "f", ق: "q", ك: "k", ل: "l", م: "m", ن: "n", ه: "h", و: "ou", ي: "i", ى: "a", ة: "a", ء: "" };

export function invitationSlug(invitation) {
  const details = invitation.details || {};
  const name = details.couple?.trim() || details.name?.trim() || invitation.title || "invitation";
  return [...name.normalize("NFKD").replace(/\p{Mark}/gu, "")].map((letter) => arabicLetters[letter] ?? letter).join("")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60).replace(/-+$/g, "") || "invitation";
}

export function invitationToken(path) {
  const legacy = path.match(/^\/invite\/([a-f0-9]{32})$/);
  if (legacy) return legacy[1];
  const readable = path.match(/^\/invitation\/[a-z0-9][a-z0-9-]{0,59}--([A-Za-z0-9_-]{22})$/);
  if (!readable) return null;
  try {
    const bytes = atob(readable[1].replace(/-/g, "+").replace(/_/g, "/") + "==");
    const encoded = btoa(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    if (bytes.length !== 16 || encoded !== readable[1]) return null;
    return [...bytes].map((byte) => byte.charCodeAt(0).toString(16).padStart(2, "0")).join("");
  } catch { return null; }
}

export function invitationSharePath(path, invitation) {
  const token = invitationToken(path);
  if (!token) return path;
  const bytes = token.match(/../g).map((part) => String.fromCharCode(parseInt(part, 16))).join("");
  const code = btoa(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `/invitation/${invitationSlug(invitation)}--${code}`;
}
