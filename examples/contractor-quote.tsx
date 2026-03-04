/**
 * Example: Full contractor quote PDF using react-pdf-rtl
 * This is what a real Peles-style quote looks like.
 */

import React from "react";
import { Document, Page, View, Text } from "@react-pdf/renderer";
import {
  setupHebrewPDF,
  RTLText,
  RTLTable,
  RTLSummaryRow,
  RTLDivider,
  RTLView,
  getRTLPageStyle,
  formatCurrencyRTL,
} from "react-pdf-rtl";

// ✅ Call once at module level — registers Rubik + disables hyphenation
setupHebrewPDF();

interface BoQItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface QuoteData {
  contractorName: string;
  clientName: string;
  projectAddress: string;
  quoteNumber: string;
  date: string;
  items: BoQItem[];
  notes?: string;
}

const VAT_RATE = 0.18;

export function ContractorQuotePDF({ quote }: { quote: QuoteData }) {
  const subtotal = quote.items.reduce((sum, item) => sum + item.total, 0);
  const vat = subtotal * VAT_RATE;
  const grandTotal = subtotal + vat;

  return (
    <Document
      title={`הצעת מחיר ${quote.quoteNumber}`}
      author={quote.contractorName}
      language="he"
    >
      <Page size="A4" style={getRTLPageStyle("Rubik")}>
        {/* ── Header ─────────────────────────────────────────── */}
        <RTLView style={{ justifyContent: "space-between", marginBottom: 24 }}>
          <View>
            <RTLText style={{ fontSize: 22, fontWeight: "bold", color: "#111827" }}>
              הצעת מחיר
            </RTLText>
            <RTLText style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>
              {`מספר: ${quote.quoteNumber}`}
            </RTLText>
            <RTLText style={{ fontSize: 11, color: "#6B7280" }}>
              {`תאריך: ${quote.date}`}
            </RTLText>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <RTLText style={{ fontSize: 14, fontWeight: "bold" }}>
              {quote.contractorName}
            </RTLText>
          </View>
        </RTLView>

        <RTLDivider color="#E5E7EB" marginVertical={12} />

        {/* ── Client + Project ───────────────────────────────── */}
        <RTLView style={{ gap: 32, marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <RTLText style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 2 }}>
              לכבוד
            </RTLText>
            <RTLText style={{ fontSize: 12, fontWeight: "bold" }}>
              {quote.clientName}
            </RTLText>
          </View>
          <View style={{ flex: 1 }}>
            <RTLText style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 2 }}>
              כתובת הפרויקט
            </RTLText>
            <RTLText style={{ fontSize: 12 }}>{quote.projectAddress}</RTLText>
          </View>
        </RTLView>

        {/* ── BoQ Table ──────────────────────────────────────── */}
        <RTLTable
          columns={[
            { header: "תיאור עבודה", key: "description", flex: 3 },
            { header: "כמות", key: "quantity", flex: 1, align: "center" },
            { header: "יחידה", key: "unit", flex: 1, align: "center" },
            {
              header: "מחיר יחידה",
              key: "unitPrice",
              flex: 1,
              isCurrency: true,
              align: "left",
            },
            {
              header: 'סה"כ',
              key: "total",
              flex: 1,
              isCurrency: true,
              align: "left",
            },
          ]}
          data={quote.items}
          headerBg="#1F2937"
          headerColor="#EAB308"
          stripeBg="#F9FAFB"
          fontSize={10}
        />

        {/* ── Totals ─────────────────────────────────────────── */}
        <View style={{ marginTop: 16, paddingHorizontal: 8 }}>
          <RTLSummaryRow
            label='סה"כ לפני מע"מ'
            value={subtotal}
            isCurrency
            fontSize={11}
          />
          <RTLSummaryRow
            label={`מע"מ ${VAT_RATE * 100}%`}
            value={vat}
            isCurrency
            fontSize={11}
            color="#6B7280"
          />
          <RTLDivider marginVertical={6} />
          <RTLSummaryRow
            label="סכום סופי לתשלום"
            value={grandTotal}
            isCurrency
            bold
            fontSize={13}
            color="#111827"
          />
        </View>

        {/* ── Notes ──────────────────────────────────────────── */}
        {quote.notes && (
          <View style={{ marginTop: 24 }}>
            <RTLText style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 4 }}>
              הערות
            </RTLText>
            <RTLText style={{ fontSize: 11, color: "#374151", lineHeight: 1.5 }}>
              {quote.notes}
            </RTLText>
          </View>
        )}

        {/* ── Footer ─────────────────────────────────────────── */}
        <View
          style={{
            position: "absolute",
            bottom: 30,
            left: 40,
            right: 40,
          }}
          fixed
        >
          <RTLDivider color="#E5E7EB" marginVertical={8} />
          <RTLText style={{ fontSize: 9, color: "#9CA3AF", textAlign: "center" }}>
            הצעת מחיר זו תקפה ל-30 יום מתאריך הנפקתה
          </RTLText>
        </View>
      </Page>
    </Document>
  );
}

// ── Sample data for testing ───────────────────────────────────────────────────

export const sampleQuote: QuoteData = {
  contractorName: "יוסי כהן עבודות בנייה",
  clientName: "משפחת לוי",
  projectAddress: "רחוב הרצל 12, תל אביב",
  quoteNumber: "2024-042",
  date: "04/03/2026",
  items: [
    {
      description: "חפירה וביסוס - עבודת עפר",
      quantity: 15,
      unit: 'מ"ק',
      unitPrice: 180,
      total: 2700,
    },
    {
      description: "יציקת יסודות בטון מזוין",
      quantity: 8,
      unit: 'מ"ק',
      unitPrice: 950,
      total: 7600,
    },
    {
      description: "בניית קירות גבס - חדרים",
      quantity: 120,
      unit: 'מ"ר',
      unitPrice: 85,
      total: 10200,
    },
    {
      description: "ריצוף פורצלן 60x60",
      quantity: 85,
      unit: 'מ"ר',
      unitPrice: 220,
      total: 18700,
    },
    {
      description: "עבודות אינסטלציה מלאות",
      quantity: 1,
      unit: "פאושל",
      unitPrice: 12500,
      total: 12500,
    },
  ],
  notes:
    "המחיר אינו כולל מע״מ. תשלום: 30% מקדמה, 40% באמצע העבודה, 30% בסיום.",
};
