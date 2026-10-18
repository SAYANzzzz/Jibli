import { optimizedImage } from "./optimizedImage";

type Palette = readonly [paper: string, deep: string, ink: string, foil: string, glow: string];
const palettes: Record<string, Palette> = {
  burgundy: ["#fff8ee", "#e9d5cb", "#4d202c", "#893c50", "#d4a476"],
  ivory: ["#fffaf1", "#eadecb", "#493a26", "#92703c", "#d4b783"],
  blush: ["#fff5f6", "#eed4dd", "#612a45", "#a24770", "#e2a8bc"],
  sage: ["#f7faf2", "#dce7d3", "#283f32", "#587a56", "#aac59a"],
  teal: ["#eefaf7", "#cbe6df", "#174b49", "#267e76", "#9ccfc4"],
  navy: ["#15243b", "#0c1628", "#f3f1e9", "#bccae2", "#7691b8"],
  silver: ["#f5f6fb", "#dfe2ed", "#28304b", "#636f91", "#b2b9d0"],
  lilac: ["#faf4ff", "#e6d9f1", "#48305c", "#8257aa", "#c7a7df"],
  sky: ["#f2f9ff", "#d5e7f5", "#23466b", "#477caf", "#9fc6e6"],
  coral: ["#fff5ef", "#f6dace", "#642c32", "#b94e51", "#e9a18c"],
  coffee: ["#fff6ea", "#e9d6c1", "#4e2b20", "#98513b", "#cda47c"],
  goldBrown: ["#fff8ed", "#e6d4b6", "#513820", "#94703c", "#cfad70"],
  noir: ["#25212b", "#15121b", "#fff4f5", "#e3a8c5", "#976c95"],
};

// Envelope cardstock follows the artwork rather than its pale interior paper.
const envelopeColours: Record<string, string> = {
  burgundy: "#651e33", ivory: "#ead7b4", blush: "#d7a6b7",
  sage: "#739473", teal: "#33877e", navy: "#192c4c",
  silver: "#bbc1cc", lilac: "#bba0d1", sky: "#89b4dc",
  coral: "#c94e52", coffee: "#a77b63", noir: "#302532",
  goldBrown: "#ad8752",
};
const envelopeOverrides: Record<string, string> = {
  "eid-school-welcome": "#46c5df",
  "popup-party": "#486354", "family-roots": "#cba656",
  "illustrated-photo": "#e6dfd0", "tiffs-party": "#ad775e",
};

// Match each collection's actual artwork rather than giving every card one theme.
const designs: Record<string, [palette: string, layout: string]> = {
  "arabesque-burgundy": ["burgundy", "arch"], "arabic-satin": ["coffee", "editorial"],
  "blush-embossed": ["blush", "arch"], "garden-couple": ["sage", "arch"],
  "classic-ivory": ["ivory", "arch"], "photo-frame": ["ivory", "editorial"],
  "illustrated-photo": ["sky", "playful"], "teal-love": ["teal", "playful"],
  "garden-hands": ["burgundy", "editorial"], "ring-promise": ["silver", "editorial"],
  "intimate-vows": ["silver", "arch"], "childhood-love": ["silver", "playful"],
  "disco-eighteen": ["silver", "playful"], "blue-cake": ["sky", "playful"],
  "pink-night": ["noir", "playful"], "tiffs-party": ["burgundy", "editorial"],
  "pink-sparkle": ["blush", "playful"], "cool-kid": ["coral", "playful"],
  "birthday-disco": ["lilac", "playful"], "silver-fourteen": ["silver", "playful"],
  "bold-coffee": ["coral", "editorial"], "red-ribbon": ["coral", "editorial"],
  "burgundy-bow": ["burgundy", "arch"], "popup-party": ["silver", "editorial"],
  "midnight-silver": ["navy", "editorial"], "red-tassel": ["coral", "editorial"],
  "velvet-bow": ["burgundy", "arch"], "blue-florals": ["sky", "arch"],
  "disco-graduate": ["lilac", "playful"], "classic-mortarboard": ["ivory", "editorial"],
  "nouveau-florals": ["blush", "arch"], "green-tradition": ["sage", "arch"],
  "family-roots": ["ivory", "arch"], "gathering-brunch": ["coffee", "editorial"],
  "kindergarten-welcome": ["coral", "playful"], "school-registration": ["sky", "playful"],
  "eid-school-welcome": ["sage", "playful"], "weekly-star-blue": ["sky", "certificate"],
  "weekly-star-pink": ["blush", "certificate"], "quran-certificate-blue": ["sky", "certificate"],
  "quran-certificate-pink": ["blush", "certificate"],
};

export function getInvitationDesign(image: string) {
  const key = image.split("/").pop()?.replace(/\.[^.]+$/, "") || "";
  const [palette, layout] = designs[key] || ["ivory", "arch"];
  const [paper, deep, ink, foil, glow] = palettes[palette];
  const background = designs[key]
    ? image.replace(/[^/]+$/, `${key}-stationery${key === "burgundy-bow" ? "-clean" : ""}.png`)
    : undefined;
  return { key, layout, colours: { "--paper": paper, "--paper-deep": deep, "--ink": ink, "--foil": foil, "--glow": glow,
    "--envelope-colour": envelopeOverrides[key] || envelopeColours[palette],
    "--envelope-ink": ["burgundy", "teal", "navy", "coral", "noir"].includes(palette) || key === "popup-party" ? "#fff4df" : "#38252d",
    "--section-background": background ? `url("${optimizedImage(background)}")` : "none" } };
}
