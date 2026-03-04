import { describe, it, expect } from "vitest";
import {
  hasRTLChars,
  isRTLDominant,
  wrapRTL,
  wrapLTR,
  smartWrap,
  formatCurrencyRTL,
  splitBidiSegments,
  hasBidiMarkers,
  stripBidiMarkers,
  BIDI,
} from "./rtl";

// ─── hasRTLChars ─────────────────────────────────────────────────────────────

describe("hasRTLChars", () => {
  it("detects Hebrew characters", () => {
    expect(hasRTLChars("שלום")).toBe(true);
  });

  it("detects Arabic characters", () => {
    expect(hasRTLChars("مرحبا")).toBe(true);
  });

  it("returns false for English text", () => {
    expect(hasRTLChars("Hello world")).toBe(false);
  });

  it("returns false for numbers only", () => {
    expect(hasRTLChars("12345")).toBe(false);
  });

  it("detects Hebrew in mixed content", () => {
    expect(hasRTLChars("חפירה - 3 מ\"ק")).toBe(true);
  });

  it("returns false for symbols and punctuation", () => {
    expect(hasRTLChars("₪ $ € % + - * /")).toBe(false);
  });

  it("handles empty string", () => {
    expect(hasRTLChars("")).toBe(false);
  });

  it("detects Hebrew presentation forms (U+FB1D range)", () => {
    // Hebrew letter Yod with Hiriq (presentation form)
    expect(hasRTLChars("\uFB1D")).toBe(true);
  });
});

// ─── isRTLDominant ───────────────────────────────────────────────────────────

describe("isRTLDominant", () => {
  it("pure Hebrew is RTL dominant", () => {
    expect(isRTLDominant("שלום עולם")).toBe(true);
  });

  it("pure English is not RTL dominant", () => {
    expect(isRTLDominant("Hello world")).toBe(false);
  });

  it("Hebrew with numbers is still RTL dominant", () => {
    expect(isRTLDominant("חפירה - 3 מ\"ק")).toBe(true);
  });

  it("more Hebrew than English → RTL dominant", () => {
    // "תיאור: abc" — 4 Hebrew chars vs 3 English → RTL
    expect(isRTLDominant("תיאור: abc")).toBe(true);
  });

  it("more English than Hebrew → not RTL dominant", () => {
    // "a description (עב)" — 11 English vs 2 Hebrew → LTR
    expect(isRTLDominant("description (עב)")).toBe(false);
  });

  it("pure numbers are not RTL dominant", () => {
    expect(isRTLDominant("12345.67")).toBe(false);
  });

  it("empty string is not RTL dominant", () => {
    expect(isRTLDominant("")).toBe(false);
  });
});

// ─── wrapRTL / wrapLTR ───────────────────────────────────────────────────────

describe("wrapRTL", () => {
  it("wraps text with RLE and PDF markers", () => {
    const result = wrapRTL("שלום");
    expect(result).toBe(`${BIDI.RLE}שלום${BIDI.PDF}`);
  });

  it("starts with RLE (U+202B)", () => {
    expect(wrapRTL("test").charCodeAt(0)).toBe(0x202b);
  });

  it("ends with PDF (U+202C)", () => {
    const s = wrapRTL("test");
    expect(s.charCodeAt(s.length - 1)).toBe(0x202c);
  });

  it("preserves inner content unchanged", () => {
    const inner = "חפירה וביסוס - 3 מ\"ק";
    const wrapped = wrapRTL(inner);
    expect(wrapped.slice(1, -1)).toBe(inner);
  });
});

describe("wrapLTR", () => {
  it("wraps text with LRE and PDF markers", () => {
    expect(wrapLTR("Hello")).toBe(`${BIDI.LRE}Hello${BIDI.PDF}`);
  });

  it("starts with LRE (U+202A)", () => {
    expect(wrapLTR("test").charCodeAt(0)).toBe(0x202a);
  });
});

// ─── smartWrap ───────────────────────────────────────────────────────────────

describe("smartWrap", () => {
  it("wraps Hebrew text in RTL markers", () => {
    const result = smartWrap("שלום");
    expect(result.charCodeAt(0)).toBe(0x202b);
  });

  it("does NOT wrap English text", () => {
    const result = smartWrap("Hello");
    expect(result).toBe("Hello");
  });

  it("does NOT wrap pure numbers", () => {
    expect(smartWrap("1,500")).toBe("1,500");
    expect(smartWrap("120.50")).toBe("120.50");
    expect(smartWrap("₪ 1500")).toBe("₪ 1500");
  });

  it("wraps mixed Hebrew+numbers (most common BoQ case)", () => {
    const result = smartWrap("חפירה - 3 מ\"ק");
    expect(result.charCodeAt(0)).toBe(0x202b);
  });

  it("handles empty string without throwing", () => {
    expect(smartWrap("")).toBe("");
  });

  it("handles whitespace-only string", () => {
    const result = smartWrap("   ");
    expect(result).toBe(""); // trimmed
  });

  it("does not double-wrap already-wrapped text", () => {
    // This tests idempotency isn't required but wrapping twice shouldn't crash
    const once = smartWrap("שלום");
    expect(() => smartWrap(once)).not.toThrow();
  });
});

// ─── formatCurrencyRTL ───────────────────────────────────────────────────────

describe("formatCurrencyRTL", () => {
  it("formats a number with shekel symbol", () => {
    const result = formatCurrencyRTL(1500);
    expect(result).toContain("₪");
    expect(result).toContain("1,500");
  });

  it("includes RLM before symbol", () => {
    const result = formatCurrencyRTL(1000);
    expect(result.charCodeAt(0)).toBe(0x200f); // RLM
  });

  it("wraps the number in LRE...PDF to prevent reversal", () => {
    const result = formatCurrencyRTL(1000);
    expect(result).toContain(BIDI.LRE);
    expect(result).toContain(BIDI.PDF);
  });

  it("handles zero", () => {
    const result = formatCurrencyRTL(0);
    expect(result).toContain("0");
    expect(result).toContain("₪");
  });

  it("handles large numbers with comma separator", () => {
    const result = formatCurrencyRTL(1000000);
    expect(result).toContain("1,000,000");
  });

  it("handles decimal amounts", () => {
    const result = formatCurrencyRTL(1500.5);
    expect(result).toContain("1,500.5");
  });

  it("supports custom currency symbols", () => {
    const result = formatCurrencyRTL(100, "$", "en-US");
    expect(result).toContain("$");
    expect(result).toContain("100");
  });

  it("does not produce NaN for valid numbers", () => {
    expect(formatCurrencyRTL(9999)).not.toContain("NaN");
  });
});

// ─── splitBidiSegments ───────────────────────────────────────────────────────

describe("splitBidiSegments", () => {
  it("returns empty array for empty string", () => {
    expect(splitBidiSegments("")).toEqual([]);
  });

  it("returns single RTL segment for pure Hebrew", () => {
    const result = splitBidiSegments("שלום");
    expect(result).toHaveLength(1);
    expect(result[0].direction).toBe("rtl");
    expect(result[0].text).toBe("שלום");
  });

  it("returns single LTR segment for pure English", () => {
    const result = splitBidiSegments("Hello");
    expect(result).toHaveLength(1);
    expect(result[0].direction).toBe("ltr");
  });

  it("splits mixed Hebrew + English", () => {
    const result = splitBidiSegments("שלום world");
    const directions = result.map((s) => s.direction);
    expect(directions).toContain("rtl");
    expect(directions).toContain("ltr");
  });

  it("neutral characters (spaces, numbers) attach to previous segment", () => {
    const result = splitBidiSegments("שלום 123");
    // Space and numbers are neutral, should merge with the Hebrew segment
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it("reconstructed text equals original", () => {
    const original = "שלום world 123";
    const segments = splitBidiSegments(original);
    const reconstructed = segments.map((s) => s.text).join("");
    expect(reconstructed).toBe(original);
  });

  it("handles numbers-only string as neutral", () => {
    const result = splitBidiSegments("12345");
    expect(result[0].direction).toBe("neutral");
  });
});

// ─── BIDI constants ──────────────────────────────────────────────────────────

describe("BIDI constants", () => {
  it("RLE is U+202B", () => expect(BIDI.RLE.charCodeAt(0)).toBe(0x202b));
  it("LRE is U+202A", () => expect(BIDI.LRE.charCodeAt(0)).toBe(0x202a));
  it("PDF is U+202C", () => expect(BIDI.PDF.charCodeAt(0)).toBe(0x202c));
  it("RLM is U+200F", () => expect(BIDI.RLM.charCodeAt(0)).toBe(0x200f));
  it("LRM is U+200E", () => expect(BIDI.LRM.charCodeAt(0)).toBe(0x200e));
  it("RLO is U+202E", () => expect(BIDI.RLO.charCodeAt(0)).toBe(0x202e));
});

// ─── Edge cases / BoQ-specific scenarios ─────────────────────────────────────

describe("BoQ real-world scenarios", () => {
  it("handles unit strings like מ\"ק, מ\"ר correctly", () => {
    expect(() => smartWrap('15 מ"ק')).not.toThrow();
    expect(hasRTLChars('מ"ק')).toBe(true);
  });

  it("handles BoQ description with numbers mid-text", () => {
    const text = "חפירה וביסוס - 3 מ\"ק עומק";
    expect(hasRTLChars(text)).toBe(true);
    expect(isRTLDominant(text)).toBe(true);
    const wrapped = smartWrap(text);
    expect(wrapped.charCodeAt(0)).toBe(0x202b);
  });

  it("handles price list item name", () => {
    const text = "ריצוף פורצלן 60x60";
    expect(isRTLDominant(text)).toBe(true);
  });

  it("currency formatting survives the full BoQ pipeline", () => {
    const items = [
      { price: 180, qty: 15 },
      { price: 950, qty: 8 },
      { price: 12500, qty: 1 },
    ];
    for (const item of items) {
      const total = item.price * item.qty;
      expect(() => formatCurrencyRTL(total)).not.toThrow();
      expect(formatCurrencyRTL(total)).toContain("₪");
    }
  });

  it("handles the word פאושל (lump sum) used in contractor quotes", () => {
    expect(hasRTLChars("פאושל")).toBe(true);
    expect(smartWrap("פאושל").charCodeAt(0)).toBe(0x202b);
  });
});

// ─── FIX VALIDATION: bugs found in QA ────────────────────────────────────────

describe("FIX: smartWrap handles non-string input", () => {
  it("accepts number input without throwing", () => {
    expect(() => smartWrap(42)).not.toThrow();
    expect(smartWrap(42)).toBe("42");
  });

  it("accepts 0 without throwing", () => {
    expect(smartWrap(0)).toBe("0");
  });

  it("accepts null gracefully", () => {
    expect(smartWrap(null)).toBe("");
  });

  it("accepts undefined gracefully", () => {
    expect(smartWrap(undefined)).toBe("");
  });
});

describe("FIX: wrapRTL is idempotent (no double-wrapping)", () => {
  it("does not re-wrap already-wrapped RTL text", () => {
    const once = wrapRTL("שלום");
    const twice = wrapRTL(once);
    expect(twice).toBe(once);
  });

  it("does not double the bidi markers", () => {
    const once = wrapRTL("test");
    const twice = wrapRTL(once);
    // Should still have exactly one RLE at start
    expect(twice.charCodeAt(0)).toBe(0x202b);
    expect(twice.charCodeAt(1)).not.toBe(0x202b);
  });
});

describe("FIX: wrapLTR is idempotent", () => {
  it("does not re-wrap already-wrapped LTR text", () => {
    const once = wrapLTR("hello");
    const twice = wrapLTR(once);
    expect(twice).toBe(once);
  });
});

describe("FIX: formatCurrencyRTL validates input", () => {
  it("throws RangeError for NaN", () => {
    expect(() => formatCurrencyRTL(NaN)).toThrow(RangeError);
    expect(() => formatCurrencyRTL(NaN)).toThrow(/finite number/);
  });

  it("throws RangeError for Infinity", () => {
    expect(() => formatCurrencyRTL(Infinity)).toThrow(RangeError);
  });

  it("throws RangeError for -Infinity", () => {
    expect(() => formatCurrencyRTL(-Infinity)).toThrow(RangeError);
  });

  it("handles negative amounts correctly", () => {
    const result = formatCurrencyRTL(-500);
    expect(result).toContain("₪");
    expect(result).toContain("-");
    expect(result).toContain("500");
    // Should NOT contain NaN or garbage
    expect(result).not.toContain("NaN");
  });
});

// ─── NEW: hasBidiMarkers + stripBidiMarkers ───────────────────────────────────

describe("hasBidiMarkers", () => {
  it("detects RLE marker", () => {
    expect(hasBidiMarkers(wrapRTL("שלום"))).toBe(true);
  });

  it("detects LRE marker", () => {
    expect(hasBidiMarkers(wrapLTR("hello"))).toBe(true);
  });

  it("returns false for clean text", () => {
    expect(hasBidiMarkers("שלום עולם")).toBe(false);
    expect(hasBidiMarkers("Hello world")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(hasBidiMarkers("")).toBe(false);
  });
});

describe("stripBidiMarkers", () => {
  it("removes RLE/PDF from wrapped text", () => {
    const wrapped = wrapRTL("שלום");
    const stripped = stripBidiMarkers(wrapped);
    expect(stripped).toBe("שלום");
    expect(hasBidiMarkers(stripped)).toBe(false);
  });

  it("removes all bidi markers from currency format", () => {
    const formatted = formatCurrencyRTL(1500);
    const stripped = stripBidiMarkers(formatted);
    expect(stripped).toContain("₪");
    expect(stripped).toContain("1,500");
    expect(hasBidiMarkers(stripped)).toBe(false);
  });

  it("is a no-op on clean text", () => {
    expect(stripBidiMarkers("שלום עולם")).toBe("שלום עולם");
  });

  it("round-trips: strip(wrap(text)) === text", () => {
    const original = "חפירה וביסוס";
    expect(stripBidiMarkers(wrapRTL(original))).toBe(original);
  });
});
