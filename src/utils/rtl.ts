/**
 * RTL script unicode ranges
 * Hebrew: U+0590–U+05FF
 * Arabic: U+0600–U+06FF
 * Syriac: U+0700–U+074F
 * Arabic Supplement: U+0750–U+077F
 * Arabic Extended: U+08A0–U+08FF
 * Hebrew/Arabic Presentation Forms: U+FB1D–U+FDFF, U+FE70–U+FEFC
 */
const RTL_PATTERN =
  /[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\u0750-\u077F\u08A0-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFC]/;

/** Pre-compiled pattern for pure numeric/symbol strings — no bidi wrapping needed */
const NUMERIC_ONLY_PATTERN = /^[\d\s.,₪$€%+\-*/()]+$/;

/**
 * Bidi control character ranges as a string — used to build fresh regexes.
 * IMPORTANT: Do NOT use a single shared /g regex for both .test() and .replace().
 * A stateful global regex retains lastIndex across calls and produces false negatives.
 */
const BIDI_CHAR_CLASS = "\\u202A-\\u202E\\u200E\\u200F";

/**
 * Unicode bidi control characters
 */
export const BIDI = {
  /** Right-to-Left Embedding — forces RTL rendering for the embedded text */
  RLE: "\u202B",
  /** Left-to-Right Embedding */
  LRE: "\u202A",
  /** Pop Directional Formatting — ends the current embedding */
  PDF: "\u202C",
  /** Right-to-Left Mark — invisible RTL directional mark */
  RLM: "\u200F",
  /** Left-to-Right Mark */
  LRM: "\u200E",
  /** Right-to-Left Override — strongly forces RTL */
  RLO: "\u202E",
} as const;

/**
 * Returns true if the string contains any RTL characters (Hebrew, Arabic, etc.)
 * FIX: coerces input to string — safe when called from JS without types
 */
export function hasRTLChars(str: unknown): boolean {
  if (str == null) return false;
  return RTL_PATTERN.test(String(str));
}

/**
 * Returns true if the MAJORITY of the string's alphabetic content is RTL.
 * Useful for mixed strings like "מחיר: 120 ₪" — still considered RTL.
 * FIX: coerces input to string — safe when called from JS without types
 */
export function isRTLDominant(str: unknown): boolean {
  if (str == null) return false;
  const s = String(str);

  const rtlMatches = s.match(
    /[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\u0750-\u077F\u08A0-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFC]/g
  );
  const ltrMatches = s.match(/[a-zA-Z]/g);

  const rtlCount = rtlMatches?.length ?? 0;
  const ltrCount = ltrMatches?.length ?? 0;

  return rtlCount > 0 && rtlCount >= ltrCount;
}

/**
 * Wraps text in RLE...PDF bidi markers so @react-pdf/renderer
 * renders it right-to-left correctly, including mixed content.
 *
 * FIX: idempotent — guards against double-wrapping (broken bidi nesting)
 */
export function wrapRTL(text: string): string {
  if (text.charCodeAt(0) === 0x202b) return text;
  return `\u202B${text}\u202C`;
}

/**
 * Wraps text in LRE...PDF for explicit LTR segments inside an RTL document.
 * FIX: idempotent — guards against double-wrapping
 */
export function wrapLTR(text: string): string {
  if (text.charCodeAt(0) === 0x202a) return text;
  return `\u202A${text}\u202C`;
}

/**
 * Smart wrap: auto-detects direction and wraps accordingly.
 * FIX: accepts string | number | null | undefined — BoQ fields are often numbers
 */
export function smartWrap(text: string | number | null | undefined): string {
  if (text == null) return "";
  const str = String(text);
  if (!str) return str;

  const trimmed = str.trim();
  if (!trimmed) return "";

  if (NUMERIC_ONLY_PATTERN.test(trimmed)) return trimmed;

  return isRTLDominant(trimmed) ? wrapRTL(trimmed) : trimmed;
}

/**
 * Formats a currency amount for RTL display.
 * Ensures the symbol (₪) and number don't get scrambled in bidi context.
 *
 * FIX: throws RangeError on NaN/Infinity with clear message
 * FIX: handles negative amounts correctly (discounts, returns)
 */
export function formatCurrencyRTL(
  amount: number,
  symbol = "₪",
  locale = "he-IL"
): string {
  if (!Number.isFinite(amount)) {
    throw new RangeError(
      `formatCurrencyRTL: expected a finite number, got ${amount}`
    );
  }

  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const valueStr = amount < 0 ? `-${formatted}` : formatted;

  // RLM before symbol keeps it on the right in RTL context
  // LRE...PDF around the number prevents digit reversal
  return `\u200F${symbol}${wrapLTR(valueStr)}`;
}

/**
 * Splits mixed RTL/LTR text into segments with direction metadata.
 * Reconstructs exactly: splitBidiSegments(s).map(s => s.text).join('') === s
 *
 * FIX: uses Array.from() to correctly handle surrogate pairs (emoji, rare Unicode)
 */
export type TextSegment = {
  text: string;
  direction: "rtl" | "ltr" | "neutral";
};

export function splitBidiSegments(text: string): TextSegment[] {
  if (!text) return [];

  const segments: TextSegment[] = [];
  let current = "";
  let currentDir: "rtl" | "ltr" | "neutral" = "neutral";

  for (const char of Array.from(text)) {
    const charDir: "rtl" | "ltr" | "neutral" = RTL_PATTERN.test(char)
      ? "rtl"
      : /[a-zA-Z]/.test(char)
      ? "ltr"
      : "neutral";

    if (charDir !== "neutral" && charDir !== currentDir && current) {
      segments.push({ text: current, direction: currentDir });
      current = char;
      currentDir = charDir;
    } else {
      if (charDir !== "neutral") currentDir = charDir;
      current += char;
    }
  }

  if (current) segments.push({ text: current, direction: currentDir });
  return segments;
}

/**
 * Returns true if the string already contains bidi control characters.
 */
export function hasBidiMarkers(text: string): boolean {
  return /[\u202A-\u202E\u200E\u200F]/.test(text);
}

/**
 * Strips all bidi control characters from a string.
 * Use for: extracting plain text for storage, search, or logging.
 */
export function stripBidiMarkers(text: string): string {
  return text.replace(/[\u202A-\u202E\u200E\u200F]/g, "");
}
