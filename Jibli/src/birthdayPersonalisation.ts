export type BirthdayLayout = {
  portrait: [number, number, number, number];
  silhouette: string;
  foreground?: string;
  filter: string;
  paper: string;
  texture: [number, number, number, number];
  ages: { box: [number, number, number, number]; rotate?: number; style: "silver" | "pink" | "print"; digit?: number }[];
};

// All coordinates use the original artwork's 100 × 100 coordinate space.
// Photo masks follow the existing cutout; foreground decorations stay above it.
export const birthdayLayouts: Record<string, BirthdayLayout> = {
  "disco-eighteen": {
    portrait:[10,26,64,45], silhouette:"M31 33 Q30 27 44 27 Q62 26 70 40 L74 51 L68 71 L47 71 L45 65 L23 65 L12 61 L10 55 L19 49 L25 43 Z",
    foreground:"M32 18 L44 26 L49 29 L34 31 Z M4 55 L23 55 L23 66 L4 66 Z M0 64 L76 64 L76 80 L0 80 Z",
    filter:"grayscale(1)", paper:"#ececea", texture:[49,3,11,12],
    ages:[{box:[62,48,35,21],rotate:14,style:"silver"}],
  },
  "blue-cake": {
    portrait:[22,51,56,33], silhouette:"M41 52 L68 55 L70 63 L65 67 L72 69 L78 83 L25 83 L22 76 L29 69 L36 66 L36 60 Z",
    foreground:"M41 51 L61 30 L70 31 L71 57 Z M22 78 L78 78 L78 100 L22 100 Z",
    filter:"none",paper:"#eee7d8",texture:[3,42,13,9],
    ages:[{box:[3,51,35,31],style:"silver",digit:0},{box:[63,51,34,30],style:"silver",digit:1}],
  },
  "pink-night": {
    portrait:[3,34,49,59],silhouette:"M20 39 Q20 34 35 34 Q46 34 46 47 L49 59 L51 63 L50 91 L5 93 L3 83 L6 64 L10 56 L15 51 Z",
    foreground:"M0 79 L29 80 L29 100 L0 100 Z M0 92 L53 91 L53 100 L0 100 Z",
    filter:"none",paper:"#111111",texture:[29,1,5,8],ages:[],
  },
  "tiffs-party": {
    portrait:[45,23,51,34],silhouette:"M58 28 Q64 21 77 24 Q91 27 91 39 L96 54 L93 57 L45 57 L49 44 L53 35 Z",
    foreground:"M68 22 L90 8 L90 31 Z M41 53 L98 53 L98 63 L41 63 Z",
    filter:"none",paper:"#eee5d3",texture:[3,1,12,5],ages:[{box:[20,37,12,6],style:"print"}],
  },
  "pink-sparkle": {
    portrait:[23,18,47,39],silhouette:"M42 21 Q52 16 62 22 Q73 27 67 39 L70 47 L65 49 L63 57 L32 57 L30 50 L25 49 L23 40 L28 33 Z",
    foreground:"M47 17 L60 5 L71 21 L68 28 L58 25 Z M23 55 L78 55 L78 77 L23 77 Z",
    filter:"grayscale(1)",paper:"#f2ecde",texture:[1,25,13,12],ages:[],
  },
  "cool-kid": {
    portrait:[13,44,73,56],silhouette:"M29 54 Q32 44 51 44 Q68 44 70 58 L68 73 L65 77 L80 87 L86 100 L13 100 L18 87 L30 82 L29 74 L26 63 Z",
    foreground:"M19 54 L21 33 L43 48 L48 52 L44 55 Z M11 73 L34 73 L34 94 L11 94 Z",
    filter:"grayscale(1) sepia(.5) hue-rotate(40deg)",paper:"#fffdf6",texture:[1,2,15,20],ages:[],
  },
  "birthday-disco": {
    portrait:[28,25,45,41],silhouette:"M38 28 Q42 23 54 25 Q64 26 65 35 L65 41 L69 44 L73 53 L69 58 L68 66 L28 66 L29 53 L31 46 L34 39 Z",
    foreground:"M44 24 L57 13 L65 24 L63 30 L51 27 Z M7 65 L96 65 L96 72 L7 72 Z",
    filter:"grayscale(1)",paper:"#eee8dc",texture:[45,40,8,8],ages:[{box:[28,50,43,20],style:"pink"}],
  },
  "silver-fourteen": {
    portrait:[6,33,48,36],silhouette:"M23 36 Q30 30 43 35 Q54 39 51 48 L48 57 L50 61 L53 69 L6 66 L7 58 L6 54 L10 46 L15 39 Z",
    foreground:"M30 34 L53 22 L49 38 Z M5 58 L23 58 L23 66 L5 66 Z M0 65 L80 65 L80 80 L0 80 Z",
    filter:"grayscale(1)",paper:"#eeeeec",texture:[50,1,14,18],ages:[{box:[51,50,43,24],rotate:14,style:"silver"}],
  },
};

export const birthdayDesignKey = (image: string) => image.split("/").pop()?.replace(/\.[^.]+$/, "") || "";
export const birthdayHasAge = (image: string) => !!birthdayLayouts[birthdayDesignKey(image)]?.ages.length;
