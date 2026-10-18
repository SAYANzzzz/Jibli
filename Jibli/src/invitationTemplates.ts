import type { InvitationData } from "./invitationData";

const templates = [
  { key: "kindergarten-welcome", title: "Kindergarten welcome", image: "/invitations/others/kindergarten-welcome.jfif" },
  { key: "school-registration", title: "School registration", image: "/invitations/others/school-registration.jfif" },
  { key: "eid-school-welcome", title: "Welcome after Eid", image: "/invitations/others/eid-school-welcome.jfif" },
  { key: "weekly-star-blue", title: "Weekly star blue", image: "/invitations/others/weekly-star-blue.jfif" },
  { key: "weekly-star-pink", title: "Weekly star pink", image: "/invitations/others/weekly-star-pink.jfif" },
  { key: "quran-certificate-blue", title: "Quran achievement blue", image: "/invitations/others/quran-certificate-blue.jfif" },
  { key: "quran-certificate-pink", title: "Quran achievement pink", image: "/invitations/others/quran-certificate-pink.jfif" },
  {
    "key": "disco-eighteen",
    "title": "Disco eighteen",
    "image": "/invitations/birthdays/disco-eighteen.jfif"
  },
  {
    "key": "blue-cake",
    "title": "Blue cake",
    "image": "/invitations/birthdays/blue-cake.jfif"
  },
  {
    "key": "pink-night",
    "title": "Pink night",
    "image": "/invitations/birthdays/pink-night.jfif"
  },
  {
    "key": "tiffs-party",
    "title": "Vintage birthday",
    "image": "/invitations/birthdays/tiffs-party.jfif"
  },
  {
    "key": "pink-sparkle",
    "title": "Pink sparkle",
    "image": "/invitations/birthdays/pink-sparkle.jfif"
  },
  {
    "key": "cool-kid",
    "title": "Cool kid",
    "image": "/invitations/birthdays/cool-kid.jfif"
  },
  {
    "key": "birthday-disco",
    "title": "Birthday disco",
    "image": "/invitations/birthdays/birthday-disco.jfif"
  },
  {
    "key": "silver-fourteen",
    "title": "Silver fourteen",
    "image": "/invitations/birthdays/silver-fourteen.jfif"
  },
  {
    "key": "garden-hands",
    "title": "Garden hands",
    "image": "/invitations/engagements/garden-hands.jfif"
  },
  {
    "key": "ring-promise",
    "title": "Ring promise",
    "image": "/invitations/engagements/ring-promise.jfif"
  },
  {
    "key": "intimate-vows",
    "title": "Intimate vows",
    "image": "/invitations/engagements/intimate-vows.jfif"
  },
  {
    "key": "childhood-love",
    "title": "Childhood love",
    "image": "/invitations/engagements/childhood-love.jfif"
  },
  {
    "key": "arabesque-burgundy",
    "title": "Arabesque burgundy",
    "image": "/invitations/weddings/arabesque-burgundy.jfif"
  },
  {
    "key": "arabic-satin",
    "title": "Satin ribbons",
    "image": "/invitations/weddings/arabic-satin.jfif"
  },
  {
    "key": "blush-embossed",
    "title": "Blush embossed",
    "image": "/invitations/weddings/blush-embossed.jfif"
  },
  {
    "key": "garden-couple",
    "title": "Garden couple",
    "image": "/invitations/weddings/garden-couple.jfif"
  },
  {
    "key": "photo-frame",
    "title": "Childhood story",
    "image": "/invitations/weddings/photo-frame.jfif"
  },
  {
    "key": "illustrated-photo",
    "title": "Illustrated love",
    "image": "/invitations/weddings/illustrated-photo.jfif"
  },
  {
    "key": "teal-love",
    "title": "Teal celebration",
    "image": "/invitations/weddings/teal-love.jfif"
  },
{"key": "nouveau-florals", "title": "Nouveau florals", "image": "/invitations/family/nouveau-florals.jfif"},
{"key": "green-tradition", "title": "Green tradition", "image": "/invitations/family/green-tradition.jfif"},
{"key": "family-roots", "title": "Family roots", "image": "/invitations/family/family-roots.jfif"},
{"key": "gathering-brunch", "title": "Gathering brunch", "image": "/invitations/family/gathering-brunch.jfif"},
{"key": "bold-coffee", "title": "Bold coffee", "image": "/invitations/openings/bold-coffee.jfif"},
{"key": "red-ribbon", "title": "Ribbon reveal", "image": "/invitations/openings/red-ribbon.jfif"},
{"key": "burgundy-bow", "title": "Burgundy bow", "image": "/invitations/openings/burgundy-bow.jfif"},
{"key": "popup-party", "title": "Popup opening", "image": "/invitations/openings/popup-party.jfif"},
{"key": "midnight-silver", "title": "Midnight silver", "image": "/invitations/graduations/midnight-silver.jfif"},
{"key": "red-tassel", "title": "Red tassel", "image": "/invitations/graduations/red-tassel.jfif"},
{"key": "velvet-bow", "title": "Velvet bow", "image": "/invitations/graduations/velvet-bow.jfif"},
{"key": "blue-florals", "title": "Blue florals", "image": "/invitations/graduations/blue-florals.jfif"},
{"key": "disco-graduate", "title": "Disco graduate", "image": "/invitations/graduations/disco-graduate.jfif"},
{"key": "classic-mortarboard", "title": "Classic mortarboard", "image": "/invitations/graduations/classic-mortarboard.jfif"}
];

/** Retain the selected template, including older published records that lost their image. */
export function resolveInvitationImage(invitation: Pick<InvitationData, "image" | "title">, productKey?: string) {
  const image=invitation.image.trim();
  if (image) {
    // Older deliveries used different PNG artwork for the same selected template.
    // Keep custom final artwork, but render local templates identically everywhere.
    const match=image.match(/^\/invitations\/[^/]+\/([a-z0-9-]+)\.(?:png|jpe?g|jfif|webp)$/i);
    return match ? templates.find(template=>template.key===match[1])?.image || image : image;
  }
  const key = productKey?.split(":").at(-1);
  const title = invitation.title.replace(/\s*\/\s*others\s*$/i, "").trim().toLocaleLowerCase();
  return templates.find((template) => template.key === key)?.image
    || templates.find((template) => template.title.toLocaleLowerCase() === title || template.key === title)?.image
    || "";
}

/** Built-in artwork determines its own type; custom artwork keeps the explicit choice. */
export function invitationIsCertificate(image: string, fallback = false): boolean {
  const template = templates.find(template => template.image === image);
  return template ? /certificate|weekly-star/.test(template.key) : fallback;
}
