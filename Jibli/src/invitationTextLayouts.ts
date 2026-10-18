export type ArtworkField = "name" | "hosts" | "date" | "time" | "venue" | "contact" | "school" | "age" | "year" | "note";
// These references have titles or illustrations where a name would normally go.
// Keep the personalisation on its own line rather than painting over the artwork.
export const captionNameDesigns = new Set([
  "disco-graduate", "birthday-disco", "blue-cake", "disco-eighteen",
  "silver-fourteen", "family-roots", "green-tradition", "gathering-brunch",
  "kindergarten-welcome", "school-registration", "eid-school-welcome",
]);
export type TextSlot = {
  field: ArtworkField;
  box: [left: number, top: number, width: number, height: number];
  size: number;
  font?: "arabic" | "script" | "serif" | "sans";
  color?: string;
  background?: string;
  part?: number;
  align?: "start" | "center";
  format?: "weekday" | "short";
  uppercase?: boolean;
};

const slot = (field: ArtworkField, box: TextSlot["box"], size: number, options: Partial<TextSlot> = {}): TextSlot => ({ field, box, size, ...options });
const name = (box: TextSlot["box"], size = 7, options: Partial<TextSlot> = {}) => slot("name", box, size, options);
const date = (box: TextSlot["box"], size = 3.4, options: Partial<TextSlot> = {}) => slot("date", box, size, options);
const time = (box: TextSlot["box"], size = 3.2, options: Partial<TextSlot> = {}) => slot("time", box, size, options);
const venue = (box: TextSlot["box"], size = 3, options: Partial<TextSlot> = {}) => slot("venue", box, size, options);

// Coordinates refer to the original artwork, so text remains aligned at any size.
// Each slot replaces only its printed field, leaving the illustration intact.
export const invitationTextLayouts: Record<string, TextSlot[]> = {
  "arabesque-burgundy": [
    name([20, 50.5, 60, 8.5], 9, { font: "arabic", color: "#795019" }),
    time([20, 63, 18, 16]), venue([39, 63, 23, 16], 3.2), date([63, 63, 18, 16]),
  ],
  "arabic-satin": [name([27, 37, 50, 27], 14, { font: "arabic", color: "#573a26" }), date([27, 65, 50, 7]), time([27, 72, 50, 6]), venue([20, 80, 60, 9])],
  "blush-embossed": [name([22, 51, 56, 14], 9, { font: "arabic", color: "#91694c" }), date([22, 68, 56, 7]), time([22, 75, 56, 5]), venue([20, 81, 60, 8])],
  "garden-couple": [name([24, 50, 25, 7], 5.8, { part: 0 }), name([53, 50, 25, 7], 5.8, { part: 1 }), date([29, 61, 42, 5]), time([29, 67, 42, 5]), venue([29, 73, 42, 7])],
  "classic-ivory": [name([24, 50, 25, 7], 5.8, { part: 0 }), name([53, 50, 25, 7], 5.8, { part: 1 }), date([29, 61, 42, 5]), time([29, 67, 42, 5]), venue([29, 73, 42, 7])],
  "photo-frame": [name([28, 23, 45, 28], 9, { font: "serif" }), date([27, 63, 46, 8]), time([27, 72, 46, 5]), venue([25, 79, 50, 10])],
  "illustrated-photo": [name([9, 75, 82, 13], 10, { font: "script" }), date([27, 21, 47, 7], 6)],
  "teal-love": [name([23, 18, 65, 22], 10, { font: "script", color: "#286c61" }), date([72, 52, 21, 8], 3.2), time([71, 61, 22, 5]), venue([22, 86, 62, 7])],
  "garden-hands": [name([12, 21, 34, 5], 6.5, { part: 0 }), name([62, 36, 23, 6], 6.5, { part: 1 }), date([40, 45, 26, 13]), date([14, 50, 24, 4], 3, { format: "weekday" }), time([68, 50, 23, 4]), venue([59, 90, 35, 5])],
  "ring-promise": [name([11, 21, 35, 5], 6.5, { part: 0 }), name([57, 36, 27, 5], 6.5, { part: 1 }), date([39, 45, 28, 13]), date([14, 50, 24, 4], 3, { format: "weekday" }), time([67, 50, 23, 4]), venue([22, 85, 55, 4])],
  "intimate-vows": [name([10, 13, 80, 14], 10, { font: "script", color: "#fff8ee", background: "#776d60" }), date([15, 57, 70, 18], 5, { color: "#fff8ee", background: "#776d60" }), time([56, 71, 37, 7], 3.5, { color: "#fff8ee", background: "#776d60" }), venue([20, 85, 60, 10], 3, { color: "#fff8ee", background: "#776d60" })],
  "childhood-love": [name([11, 44, 30, 10], 5, { part: 0, font: "sans" }), name([64, 44, 30, 10], 5, { part: 1, font: "sans" }), date([28, 28, 44, 7]), time([30, 35, 40, 5]), venue([17, 91, 66, 6])],
  "birthday-disco": [name([9, 77, 82, 8], 6, { font: "script" }), slot("age", [29, 47, 34, 23], 20, { color: "#df7497" }), date([17, 84, 65, 5]), time([22, 89, 56, 4]), venue([17, 93, 66, 5])],
  "blue-cake": [name([53, 32, 37, 12], 5.5, { font: "script" }), slot("age", [2, 47, 39, 29], 20), date([63, 77, 32, 6]), time([63, 83, 32, 5]), venue([47, 92, 46, 6])],
  "cool-kid": [name([20, 10, 62, 20], 8, { font: "sans" }), date([22, 29, 58, 6]), time([26, 35, 50, 5]), venue([35, 87, 50, 9], 3, { color: "#fff", background: "#484555" })],
  "disco-eighteen": [name([5, 76, 84, 9], 5, { font: "sans" }), slot("age", [63, 42, 35, 23], 20), date([15, 85, 68, 5]), time([15, 90, 68, 4]), venue([12, 94, 74, 5])],
  "pink-night": [name([30, 11, 68, 16], 9, { font: "script", color: "#c96e96", background: "#111111" }), date([58, 38, 36, 6], 3.5, { color: "#eee", background: "#171717" }), time([60, 44, 34, 5], 3.5, { color: "#eee", background: "#171717" }), venue([71, 57, 26, 12], 3.5)],
  "pink-sparkle": [name([12, 72, 80, 8], 6, { font: "script" }), slot("age", [2, 69, 22, 11], 7), date([18, 80, 68, 5]), time([20, 85, 64, 5]), venue([10, 91, 80, 7])],
  "silver-fourteen": [name([7, 81, 80, 6], 5, { font: "script" }), slot("age", [68, 32, 30, 26], 19), date([13, 86, 70, 5]), time([15, 91, 66, 4]), venue([13, 95, 70, 4])],
  "tiffs-party": [name([8, 12, 61, 10], 8, { font: "serif" }), slot("age", [20, 37, 28, 8], 7), date([5, 58, 44, 7]), time([5, 65, 44, 5]), venue([5, 74, 43, 12], 3)],
  "family-roots": [name([12, 64, 76, 8], 6, { font: "serif" }), date([17, 76, 66, 7]), time([20, 83, 60, 5]), venue([16, 89, 68, 7])],
  "gathering-brunch": [name([18, 13, 65, 8], 6, { font: "serif" }), date([7, 43, 45, 5]), time([50, 43, 44, 5]), venue([17, 89, 68, 8])],
  "green-tradition": [name([10, 20, 80, 31], 10, { font: "serif" }), date([16, 62, 47, 8], 4, { background: "#627435", color: "#fff" }), time([62, 62, 25, 8], 4, { background: "#627435", color: "#fff" }), venue([13, 75, 76, 6])],
  "nouveau-florals": [name([30, 29, 40, 5], 4.5, { font: "serif", color: "#805638", uppercase: true }), date([28, 59, 44, 8]), time([29, 67, 42, 5]), venue([25, 75, 50, 10])],
  "blue-florals": [name([20, 46, 60, 9], 6, { font: "script", color: "#61798c" }), slot("school", [20, 60, 60, 6], 3), date([20, 81, 60, 7]), time([25, 89, 50, 5]), venue([24, 70, 52, 9])],
  "classic-mortarboard": [name([15, 41, 70, 9], 6), slot("year", [35, 52, 30, 8], 7), date([22, 62, 56, 5]), time([30, 67, 40, 4]), venue([18, 71, 64, 6]), slot("hosts", [18, 84, 64, 8], 3)],
  "disco-graduate": [name([6, 63, 88, 12], 6, { font: "serif" }), date([13, 76, 72, 7]), time([13, 83, 72, 7], 5, { color: "#c55383" }), venue([13, 91, 72, 7])],
  "midnight-silver": [name([11, 62, 80, 9], 5, { color: "#fff", background: "#101320" }), slot("year", [12, 36, 76, 8], 6, { color: "#fff", background: "#101320" }), date([14, 84, 72, 5], 3, { color: "#fff", background: "#101320" }), time([16, 89, 68, 4], 3, { color: "#fff", background: "#101320" }), venue([14, 93, 72, 5], 3, { color: "#fff", background: "#101320" }), slot("school", [12, 73, 76, 10], 3.5, { color: "#fff", background: "#101320" })],
  "red-tassel": [name([32, 68, 63, 9], 5.5, { font: "script" }), date([35, 79, 60, 7]), time([35, 86, 60, 4]), venue([35, 91, 60, 6])],
  "velvet-bow": [name([22, 58, 64, 7], 5), slot("year", [17, 37, 20, 7], 5), date([18, 67, 70, 5]), time([18, 72, 70, 4]), venue([18, 76, 70, 8]), slot("hosts", [32, 87, 61, 6], 3)],
  "bold-coffee": [name([9, 5, 78, 7], 4, { font: "sans", color: "#c62834" }), date([9, 70, 80, 10], 4.5, { font: "sans", color: "#c62834" }), time([9, 81, 80, 6], 4.5, { font: "sans", color: "#c62834" }), venue([9, 88, 80, 5]), slot("contact", [9, 94, 80, 5], 3)],
  "burgundy-bow": [name([31, 7, 39, 9], 5, { font: "sans" }), date([34, 36, 34, 7]), time([34, 43, 34, 4]), venue([12, 84, 76, 5]), slot("contact", [12, 90, 76, 5], 3)],
  "popup-party": [name([37, 9, 60, 13], 7, { font: "script", color: "#fff", background: "#435044" }), date([7, 6, 28, 8], 3, { color: "#fff", background: "#435044" }), time([7, 14, 28, 5], 3, { color: "#fff", background: "#435044" }), venue([35, 66, 43, 12], 3.5, { color: "#fff", background: "#6e6958" })],
  "red-ribbon": [name([18, 87, 65, 6], 5, { font: "sans", color: "#b32b31" }), date([33, 28, 38, 9], 4, { color: "#b32b31" }), time([33, 38, 38, 5]), venue([17, 94, 68, 5])],
  // Event details belong in the following sections; the illustrated cover has no spare text area.
  "kindergarten-welcome": [name([19, 8, 61, 11.5], 6, { font: "sans", color: "#d83158", background: "#fff0ea" })],
  "school-registration": [name([21, 8, 56, 6], 5, { font: "sans", color: "#2b83ba" }), slot("year", [27, 12, 46, 6], 6, { color: "#4597b3" }), slot("hosts", [15, 23, 66, 8], 4, { font: "arabic" }), date([16, 34, 65, 6]), time([16, 40, 65, 5]), venue([16, 45, 65, 8]), slot("contact", [16, 54, 65, 7], 4)],
  "eid-school-welcome": [name([23, 11, 54, 9], 5, { font: "sans", color: "#ffffff", background: "#8050be" }), slot("hosts", [24, 22, 53, 6], 4, { font: "arabic" }), date([26, 65, 47, 6]), time([26, 71, 47, 5]), venue([24, 77, 52, 7])],
  "weekly-star-blue": [name([24, 65, 40, 8], 4.5, { font: "sans", color: "#25558d", background: "#dcefff" }), slot("hosts", [24, 79, 37, 9], 4, { font: "sans", color: "#426928", background: "#eef5db" })],
  "weekly-star-pink": [name([39, 57, 33, 7], 4.5, { font: "sans", color: "#8e335f", background: "#fce4ee" }), slot("hosts", [41, 84, 27, 7], 4, { font: "sans", color: "#684572", background: "#e8d4ef" })],
  "quran-certificate-blue": [name([28, 48, 44, 7], 4.5, { font: "arabic", color: "#25558d" }), slot("hosts", [57, 87, 12, 7], 3, { font: "sans", color: "#25558d" }), date([27, 87, 10, 7], 2.5, { format: "short", color: "#25558d" })],
  "quran-certificate-pink": [name([23, 48, 49, 8], 4.5, { font: "arabic", color: "#a34870" }), slot("hosts", [61, 81, 11, 7], 3, { font: "sans", color: "#a34870" }), date([19, 81, 10, 7], 2.5, { format: "short", color: "#a34870" })],
};
