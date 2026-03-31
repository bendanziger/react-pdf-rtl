import React from "react";
import { Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import { isRTLDominant, hasRTLChars, formatCurrencyRTL } from "../utils/rtl";

// ─── RTLText ────────────────────────────────────────────────────────────────

export interface RTLTextProps {
  children: string | number;
  style?: Style | Style[];
  /** Force direction instead of auto-detecting */
  direction?: "rtl" | "ltr" | "auto";
  wrap?: boolean;
  debug?: boolean;
}

/**
 * Drop-in replacement for @react-pdf/renderer's <Text> with RTL support.
 *
 * Automatically:
 * - Detects Hebrew/Arabic content and applies RLE bidi markers
 * - Handles mixed content (Hebrew text + numbers) correctly
 * - Preserves LTR content unchanged
 *
 * @example
 * <RTLText style={{ fontSize: 14 }}>חפירה וביסוס - 3 מ"ק</RTLText>
 * <RTLText>Item description in English</RTLText>
 */
export function RTLText({ children, style, direction = "auto", wrap = true, debug }: RTLTextProps) {
  const str = String(children);
  const isRTL = direction === "rtl" || (direction === "auto" && isRTLDominant(str));
  const dirStyle: Style = isRTL ? { direction: "rtl", textAlign: "right" } : {};

  return (
    <Text style={[dirStyle, style as Style]} wrap={wrap} debug={debug}>
      {str}
    </Text>
  );
}

// ─── RTLView ─────────────────────────────────────────────────────────────────

export interface RTLViewProps {
  children: React.ReactNode;
  style?: Style | Style[];
  debug?: boolean;
}

/**
 * A <View> pre-configured for RTL layout.
 * Sets flexDirection to "row-reverse" and textAlign to "right".
 * Use as a wrapper for rows in RTL documents.
 *
 * @example
 * <RTLView style={{ marginBottom: 8 }}>
 *   <RTLText>תיאור עבודה</RTLText>
 *   <Text>₪1,200</Text>
 * </RTLView>
 */
export function RTLView({ children, style, debug }: RTLViewProps) {
  return (
    <View style={[styles.rtlView, style as Style]} debug={debug}>
      {children}
    </View>
  );
}

// ─── RTLPage styles helper ────────────────────────────────────────────────────

/**
 * Returns base styles for an RTL page layout.
 * Pass your fontFamily to get consistent defaults.
 *
 * @example
 * const pageStyle = getRTLPageStyle("Rubik");
 */
export function getRTLPageStyle(fontFamily = "Rubik"): Style {
  return {
    fontFamily,
    fontSize: 11,
    direction: "rtl",
    textAlign: "right",
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
  };
}

// ─── RTLTable ────────────────────────────────────────────────────────────────

export interface RTLTableColumn {
  /** Column header label */
  header: string;
  /** Key in the data row object */
  key: string;
  /** Flex width (like CSS flex) */
  flex?: number;
  /** Explicit width in pts */
  width?: number;
  /** Text alignment within the cell */
  align?: "right" | "left" | "center";
  /** If true, formats value as currency using formatCurrencyRTL */
  isCurrency?: boolean;
  /** Custom cell renderer */
  render?: (value: unknown, row: Record<string, unknown>) => string;
}

export interface RTLTableProps {
  columns: RTLTableColumn[];
  data: Record<string, unknown>[];
  fontFamily?: string;
  /** Header background color */
  headerBg?: string;
  /** Header text color */
  headerColor?: string;
  /** Row stripe color (alternating rows) */
  stripeBg?: string;
  /** Border color */
  borderColor?: string;
  /** Font size for table content */
  fontSize?: number;
}

/**
 * A fully RTL-aware table component for @react-pdf/renderer.
 *
 * Renders columns right-to-left, handles Hebrew text in cells,
 * and supports currency formatting out of the box.
 *
 * @example
 * <RTLTable
 *   columns={[
 *     { header: "תיאור", key: "description", flex: 3 },
 *     { header: "כמות", key: "quantity", flex: 1, align: "center" },
 *     { header: "מחיר יחידה", key: "unitPrice", flex: 1, isCurrency: true },
 *     { header: 'סה"כ', key: "total", flex: 1, isCurrency: true },
 *   ]}
 *   data={boqItems}
 *   headerBg="#1a1a1a"
 *   headerColor="#EAB308"
 * />
 */
export function RTLTable({
  columns,
  data,
  fontFamily = "Rubik",
  headerBg = "#1F2937",
  headerColor = "#FFFFFF",
  stripeBg = "#F9FAFB",
  borderColor = "#E5E7EB",
  fontSize = 10,
}: RTLTableProps) {
  const colStyles = columns.map((col) => ({
    flex: col.flex ?? 1,
    width: col.width,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRightWidth: 1,
    borderRightColor: borderColor,
  }));

  return (
    <View style={{ borderWidth: 1, borderColor, fontFamily }}>
      {/* Header Row — RTL: columns reversed */}
      <View style={[styles.tableRow, { backgroundColor: headerBg, flexDirection: "row-reverse" }]}>
        {columns.map((col, i) => (
          <View key={col.key} style={colStyles[i]}>
            <Text
              style={{
                fontSize,
                fontWeight: "bold",
                color: headerColor,
                textAlign: col.align ?? "right",
                direction: "rtl",
              }}
            >
              {col.header}
            </Text>
          </View>
        ))}
      </View>

      {/* Data Rows */}
      {data.map((row, rowIndex) => (
        <View
          key={rowIndex}
          style={[
            styles.tableRow,
            { flexDirection: "row-reverse", backgroundColor: rowIndex % 2 === 1 ? stripeBg : "#FFFFFF" },
          ]}
          wrap={false}
        >
          {columns.map((col, i) => {
            const raw = row[col.key];
            let cellText: string;

            if (col.render) {
              cellText = col.render(raw, row);
            } else if (col.isCurrency && typeof raw === "number") {
              cellText = formatCurrencyRTL(raw);
            } else {
              cellText = String(raw ?? "");
            }

            return (
              <View key={col.key} style={colStyles[i]}>
                <Text
                  style={{
                    fontSize,
                    color: "#111827",
                    textAlign: col.align ?? (col.isCurrency ? "left" : "right"),
                    direction: hasRTLChars(String(raw ?? "")) ? "rtl" : "ltr",
                  }}
                >
                  {cellText}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ─── RTLDivider ───────────────────────────────────────────────────────────────

export interface RTLDividerProps {
  color?: string;
  thickness?: number;
  marginVertical?: number;
}

/**
 * A simple horizontal divider for RTL PDF documents.
 */
export function RTLDivider({ color = "#E5E7EB", thickness = 1, marginVertical = 8 }: RTLDividerProps) {
  return (
    <View
      style={{
        borderBottomWidth: thickness,
        borderBottomColor: color,
        marginVertical,
      }}
    />
  );
}

// ─── RTLSummaryRow ────────────────────────────────────────────────────────────

export interface RTLSummaryRowProps {
  label: string;
  value: string | number;
  isCurrency?: boolean;
  bold?: boolean;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
}

/**
 * A label + value row for totals/summaries in RTL layout.
 * Label on the right, value on the left — as expected in Hebrew documents.
 *
 * @example
 * <RTLSummaryRow label='סה"כ לפני מע"מ' value={12500} isCurrency bold />
 * <RTLSummaryRow label='מע"מ 18%' value={2250} isCurrency />
 * <RTLSummaryRow label="סכום סופי" value={14750} isCurrency bold color="#EAB308" />
 */
export function RTLSummaryRow({
  label,
  value,
  isCurrency = false,
  bold = false,
  fontSize = 11,
  color = "#111827",
  fontFamily = "Rubik",
}: RTLSummaryRowProps) {
  const displayValue =
    isCurrency && typeof value === "number" ? formatCurrencyRTL(value) : String(value);

  return (
    <View style={[styles.summaryRow, { fontFamily }]}>
      <Text style={{ fontSize, fontWeight: bold ? "bold" : "normal", color, textAlign: "right", direction: "rtl" }}>
        {label}
      </Text>
      <Text style={{ fontSize, fontWeight: bold ? "bold" : "normal", color, textAlign: "left" }}>
        {displayValue}
      </Text>
    </View>
  );
}

// ─── Shared Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  rtlView: {
    flexDirection: "row-reverse",
    textAlign: "right",
  },
  tableRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    minHeight: 28,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
});
