# react-pdf-rtl

> RTL (Hebrew & Arabic) support for [`@react-pdf/renderer`](https://react-pdf.org/)

`@react-pdf/renderer` is a fantastic library — but Hebrew and Arabic text rendering is broken out of the box. Mixed content like `"חפירה וביסוס - 3 מ״ק"` renders reversed. Currency `₪1,500` gets scrambled. Tables need `row-reverse` everywhere. Font setup is undocumented.

This library fixes all of that.

---

## Installation

```bash
npm install react-pdf-rtl
# peer dependencies
npm install @react-pdf/renderer react
```

---

## Quick Start

```tsx
import { Document, Page } from "@react-pdf/renderer";
import {
  setupHebrewPDF,
  RTLText,
  RTLTable,
  RTLSummaryRow,
  RTLDivider,
  getRTLPageStyle,
} from "react-pdf-rtl";

// Register Rubik font + disable hyphenation — call once at module level
setupHebrewPDF();

const pageStyle = getRTLPageStyle("Rubik");

export function QuotePDF({ items, total }) {
  return (
    <Document>
      <Page size="A4" style={pageStyle}>
        <RTLText style={{ fontSize: 20, fontWeight: "bold" }}>
          הצעת מחיר
        </RTLText>

        <RTLDivider marginVertical={12} />

        <RTLTable
          columns={[
            { header: "תיאור עבודה", key: "description", flex: 3 },
            { header: "כמות", key: "quantity", flex: 1, align: "center" },
            { header: "יחידה", key: "unit", flex: 1, align: "center" },
            { header: "מחיר יחידה", key: "unitPrice", flex: 1, isCurrency: true },
            { header: 'סה"כ', key: "total", flex: 1, isCurrency: true },
          ]}
          data={items}
          headerBg="#1F2937"
          headerColor="#EAB308"
        />

        <RTLDivider marginVertical={8} />

        <RTLSummaryRow label='סה"כ לפני מע"מ' value={total} isCurrency />
        <RTLSummaryRow label='מע"מ 18%' value={total * 0.18} isCurrency />
        <RTLSummaryRow
          label="סכום סופי לתשלום"
          value={total * 1.18}
          isCurrency
          bold
        />
      </Page>
    </Document>
  );
}
```

---

## API Reference

### Font Setup

#### `setupHebrewPDF(fontFamily?)`
One-shot setup. Registers font + disables hyphenation. Call once at module level.
```ts
setupHebrewPDF();           // defaults to "Rubik"
setupHebrewPDF("NotoSansHebrew");
```

> **Note:** `setupHebrewPDF()` loads the font from GitHub at runtime (requires internet).
> For production environments or offline use, provide a local TTF file instead:
> ```ts
> import { registerRTLFont, disableHyphenation } from "react-pdf-rtl";
>
> registerRTLFont({
>   family: "Rubik",
>   fonts: [{ src: "/fonts/Rubik.ttf" }],
> });
> disableHyphenation();
> ```
> Download Rubik TTF: [google/fonts on GitHub](https://github.com/google/fonts/tree/main/ofl/rubik)

#### `registerRubik()`
Registers the Rubik variable TTF (weights 300–700) from the google/fonts GitHub repository.
Requires internet access at render time.

#### `registerNotoSansHebrew()`
Registers Noto Sans Hebrew variable TTF from the google/fonts GitHub repository.
Requires internet access at render time.

#### `registerRTLFont(options)`
Register any custom font — recommended for production:
```ts
registerRTLFont({
  family: "MyFont",
  fonts: [
    { src: "/fonts/MyFont-Regular.ttf", fontWeight: "normal" },
    { src: "/fonts/MyFont-Bold.ttf", fontWeight: "bold" },
  ],
});
```

#### `disableHyphenation()`
Prevents Hebrew words from being split mid-word. Called automatically by `setupHebrewPDF`.

---

### Components

#### `<RTLText>`
Drop-in replacement for `<Text>` with automatic RTL detection. Sets `direction: "rtl"` via style for Hebrew/Arabic content.

```tsx
<RTLText style={{ fontSize: 14 }}>חפירה וביסוס - 3 מ"ק</RTLText>
<RTLText direction="rtl">כותרת</RTLText>
<RTLText direction="ltr">English text</RTLText>
<RTLText direction="auto">auto-detected</RTLText>  {/* default */}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `string \| number` | — | Text content |
| `style` | `Style` | — | react-pdf style |
| `direction` | `"rtl" \| "ltr" \| "auto"` | `"auto"` | Force or auto-detect direction |
| `wrap` | `boolean` | `true` | Allow text wrapping |

#### `<RTLView>`
A `<View>` pre-set with `flexDirection: "row-reverse"` and `textAlign: "right"`.

```tsx
<RTLView style={{ gap: 8 }}>
  <RTLText>תיאור</RTLText>
  <Text>₪1,200</Text>
</RTLView>
```

#### `<RTLTable>`
Full RTL-aware table. Columns rendered right-to-left. Hebrew cells auto-wrapped.

```tsx
<RTLTable
  columns={[
    { header: "תיאור", key: "description", flex: 3 },
    { header: "כמות", key: "qty", flex: 1, align: "center" },
    { header: "מחיר", key: "price", flex: 1, isCurrency: true },
  ]}
  data={rows}
  headerBg="#1F2937"
  headerColor="#FFFFFF"
  stripeBg="#F9FAFB"
/>
```

| Column Prop | Type | Description |
|------------|------|-------------|
| `header` | `string` | Column header (auto RTL-wrapped) |
| `key` | `string` | Row data key |
| `flex` | `number` | Relative width |
| `width` | `number` | Fixed width in pts |
| `align` | `"right" \| "left" \| "center"` | Cell text alignment |
| `isCurrency` | `boolean` | Formats as `₪1,500` |
| `render` | `(value, row) => string` | Custom cell renderer |

#### `<RTLSummaryRow>`
Label + value row for totals, right-aligned label, left-aligned value.

```tsx
<RTLSummaryRow label='סה"כ' value={12500} isCurrency bold />
```

#### `<RTLDivider>`
Simple horizontal rule.
```tsx
<RTLDivider color="#E5E7EB" thickness={1} marginVertical={8} />
```

#### `getRTLPageStyle(fontFamily?)`
Returns a base `Style` object for RTL pages.
```ts
const style = getRTLPageStyle("Rubik");
// { fontFamily: "Rubik", direction: "rtl", textAlign: "right", padding: ... }
```

---

### Utilities

#### `hasRTLChars(str)`
Returns `true` if string contains any Hebrew/Arabic characters.

#### `isRTLDominant(str)`
Returns `true` if the majority of alphabetic characters are RTL.

#### `wrapRTL(str)` / `wrapLTR(str)`
Manually wrap text in Unicode bidi markers (`\u202B...\u202C`).

#### `smartWrap(str)`
Auto-detect direction and wrap accordingly. Pure numbers are left unchanged.

#### `formatCurrencyRTL(amount, symbol?, locale?)`
Format a number as currency, ensuring `₪` and digits render correctly in RTL context.
```ts
formatCurrencyRTL(1500)           // ₪1,500 (correct RTL direction)
formatCurrencyRTL(1500, "$", "en-US") // $1,500
```

#### `splitBidiSegments(str)`
Split mixed text into RTL/LTR/neutral segments:
```ts
splitBidiSegments("שלום world 123")
// [
//   { text: "שלום ", direction: "rtl" },
//   { text: "world ", direction: "ltr" },
//   { text: "123", direction: "neutral" },
// ]
```

---

## Why This Exists

The [`diegomura/react-pdf`](https://github.com/diegomura/react-pdf) issue tracker has RTL/Hebrew bug reports dating back to 2019 ([#732](https://github.com/diegomura/react-pdf/issues/732), [#1571](https://github.com/diegomura/react-pdf/issues/1571), [#3010](https://github.com/diegomura/react-pdf/issues/3010)) with no official fix. This library provides a battle-tested layer on top.

---

## License

MIT
