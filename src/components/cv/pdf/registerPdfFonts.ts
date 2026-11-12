"use client";

import { Font } from "@react-pdf/renderer";

let registered = false;

export function ensurePdfFontsRegistered() {
  if (registered) return;
  registered = true;

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";

  Font.register({
    family: "Inter",
    fonts: [
      { src: `${origin}/fonts/cv/Inter-Regular.ttf`, fontWeight: 400 },
      { src: `${origin}/fonts/cv/Inter-Italic.ttf`, fontWeight: 400, fontStyle: "italic" },
      { src: `${origin}/fonts/cv/Inter-SemiBold.ttf`, fontWeight: 600 },
      { src: `${origin}/fonts/cv/Inter-Bold.ttf`, fontWeight: 700 },
    ],
  });

  Font.register({
    family: "Roboto",
    fonts: [
      { src: `${origin}/fonts/cv/Roboto-Regular.ttf`, fontWeight: 400 },
      { src: `${origin}/fonts/cv/Roboto-Italic.ttf`, fontWeight: 400, fontStyle: "italic" },
      { src: `${origin}/fonts/cv/Roboto-Medium.ttf`, fontWeight: 600 },
      { src: `${origin}/fonts/cv/Roboto-Bold.ttf`, fontWeight: 700 },
    ],
  });

  Font.register({
    family: "TimesNewRoman",
    fonts: [
      { src: `${origin}/fonts/cv/NotoSerif-Regular.ttf`, fontWeight: 400 },
      { src: `${origin}/fonts/cv/NotoSerif-Italic.ttf`, fontWeight: 400, fontStyle: "italic" },
      { src: `${origin}/fonts/cv/NotoSerif-Bold.ttf`, fontWeight: 600 },
      { src: `${origin}/fonts/cv/NotoSerif-Bold.ttf`, fontWeight: 700 },
    ],
  });

  Font.registerHyphenationCallback((word) => [word]);
}

