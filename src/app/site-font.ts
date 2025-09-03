import localFont from "next/font/local";

// register your custom Tom New Romans font
export const tomNewRoman = localFont({
  src: [
    {
      path: "../../public/fonts/toms-new-roman.woff", // ⚠️ match the exact filename
      weight: "400", // normal weight
      style: "normal",
    },
  ],
  variable: "--font-tomsnewroman",
  display: "swap",
});
