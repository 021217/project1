// data/filters.ts
export type TreeNode = {
  id: string;
  name: string;
  children?: TreeNode[];
};

export const FILTER_TABS = [
  "MATERIAL",
  "SHAPE",
  "FUNCTION",
  "COLORS",
  "ASTROLOGY", // ⬅ add this
] as const;

/* ---------------- MATERIALS (example) ---------------- */
export const MATERIALS: TreeNode[] = [
  {
    id: "minerals",
    name: "Crystals & Mineraloids",
    children: [
      {
        id: "silicates",
        name: "Silicates Crystals",
        children: [
          { id: "quartz-family", name: "Quartz Family" },
          { id: "feld-moon", name: "Feldspars & Moonstones" },
          { id: "other-silicates", name: "Other Silicates" },
        ],
      },
    ],
  },
  {
    id: "plant",
    name: "Plant Based",
    children: [
      { id: "seeds", name: "Seeds" },
      { id: "wood", name: "Wood" },
      { id: "amber-resin", name: "Amber & Resin" },
    ],
  },
  { id: "animal", name: "Animal Based" },
  { id: "metal", name: "Metal", children: [{ id: "silver", name: "Silver" }] },
  { id: "arts", name: "Arts & Crafts" },
];

/* ---------------- ASPIRATIONS (chips) ---------------- */
export const ASPIRATIONS = [
  "Health",
  "Study",
  "Career",
  "Wisdom",
  "Inner Peace",
  "Growth",
  "Creativity",
  "Relationship",
  "Protection",
  "Luck",
] as const;

/* ---------------- ASTROLOGY (12 signs) ---------------- */
export type AstrologyItem = {
  id: string;
  name: string;
  bg: string;   // background image path (put images in /public/astro/bg/)
  icon: string; // icon path (put icons in /public/astro/icons/)
};

export const ASTROLOGY_SIGNS: AstrologyItem[] = [
  { id: "aries",      name: "Aries",      bg: "/astro/bg/aries.png",      icon: "/astro/icons/aries.png" },
  { id: "taurus",     name: "Taurus",     bg: "/astro/bg/taurus.png",     icon: "/astro/icons/taurus.png" },
  { id: "gemini",     name: "Gemini",     bg: "/astro/bg/gemini.png",     icon: "/astro/icons/gemini.png" },
  { id: "cancer",     name: "Cancer",     bg: "/astro/bg/cancer.png",     icon: "/astro/icons/cancer.png" },
  { id: "leo",        name: "Leo",        bg: "/astro/bg/leo.png",        icon: "/astro/icons/leo.png" },
  { id: "virgo",      name: "Virgo",      bg: "/astro/bg/virgo.png",      icon: "/astro/icons/virgo.png" },
  { id: "libra",      name: "Libra",      bg: "/astro/bg/libra.png",      icon: "/astro/icons/libra.png" },
  { id: "scorpio",    name: "Scorpio",    bg: "/astro/bg/scorpio.png",    icon: "/astro/icons/scorpio.png" },
  { id: "sagittarius",name: "Sagittarius",bg: "/astro/bg/sagittarius.png",icon: "/astro/icons/sagittarius.png" },
  { id: "capricorn",  name: "Capricorn",  bg: "/astro/bg/capricorn.png",  icon: "/astro/icons/capricorn.png" },
  { id: "aquarius",   name: "Aquarius",   bg: "/astro/bg/aquarius.png",   icon: "/astro/icons/aquarius.png" },
  { id: "pisces",     name: "Pisces",     bg: "/astro/bg/pisces.png",     icon: "/astro/icons/pisces.png" },
];
