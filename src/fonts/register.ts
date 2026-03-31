import { Font } from "@react-pdf/renderer";

export type RTLFontWeight =
  | "normal"
  | "bold"
  | 100
  | 200
  | 300
  | 400
  | 500
  | 600
  | 700
  | 800
  | 900;

export interface RTLFontSource {
  src: string;
  fontWeight?: RTLFontWeight;
  fontStyle?: "normal" | "italic";
}

export interface RegisterRTLFontOptions {
  /** Font family name, e.g. "Rubik" */
  family: string;
  /** Array of font sources (different weights/styles) */
  fonts: RTLFontSource[];
}

/**
 * Registers a font family with @react-pdf/renderer.
 * Wraps Font.register with sensible defaults for RTL fonts.
 *
 * @example
 * registerRTLFont({
 *   family: "Rubik",
 *   fonts: [
 *     { src: "/fonts/Rubik-Regular.ttf", fontWeight: "normal" },
 *     { src: "/fonts/Rubik-Bold.ttf", fontWeight: "bold" },
 *   ],
 * });
 */
export function registerRTLFont(options: RegisterRTLFontOptions): void {
  Font.register({
    family: options.family,
    fonts: options.fonts,
  });
}

/**
 * Registers the Rubik font from Google Fonts GitHub repository (TTF format).
 * Rubik is the recommended font for Hebrew PDFs — designed for Hebrew,
 * supports all weights, and renders cleanly in @react-pdf/renderer.
 *
 * Uses the variable TTF font (single file, all weights 300–900).
 * Note: @react-pdf/renderer requires TTF/OTF — WOFF2 is not supported.
 *
 * Weights registered: 300 (Light), 400 (Regular), 500 (Medium), 700 (Bold)
 */
export function registerRubik(): void {
  const src =
    "https://raw.githubusercontent.com/google/fonts/main/ofl/rubik/Rubik%5Bwght%5D.ttf";
  Font.register({
    family: "Rubik",
    fonts: [
      { src, fontWeight: 300 },
      { src, fontWeight: 400 },
      { src, fontWeight: 500 },
      { src, fontWeight: 700 },
    ],
  });
}

/**
 * Registers Noto Sans Hebrew from Google Fonts CDN.
 * Good fallback if Rubik is not desired — extensive Hebrew glyph coverage.
 */
export function registerNotoSansHebrew(): void {
  Font.register({
    family: "NotoSansHebrew",
    fonts: [
      {
        src: "https://fonts.gstatic.com/s/notosanshebrew/v38/or3HQ7v33eiDljA1IufXTtVf7V6RvEEdhQlk0LlGxCyaeNKYZC0sqk3xXGJXag.woff2",
        fontWeight: 400,
      },
      {
        src: "https://fonts.gstatic.com/s/notosanshebrew/v38/or3HQ7v33eiDljA1IufXTtVf7V6RvEEdhQlk0LlGxCyaeNKYZC0sqk3xXGJXag.woff2",
        fontWeight: 700,
      },
    ],
  });
}

/**
 * Disables font hyphenation — critical for Hebrew text.
 * Hebrew words should never be hyphenated mid-word.
 */
export function disableHyphenation(): void {
  Font.registerHyphenationCallback((word) => [word]);
}

/**
 * One-shot setup: registers Rubik + disables hyphenation.
 * This is the recommended setup for Hebrew PDFs.
 *
 * @example
 * // At the top of your PDF component file:
 * setupHebrewPDF();
 */
export function setupHebrewPDF(fontFamily: "Rubik" | "NotoSansHebrew" = "Rubik"): void {
  if (fontFamily === "Rubik") {
    registerRubik();
  } else {
    registerNotoSansHebrew();
  }
  disableHyphenation();
}
