// Components
export {
  RTLText,
  RTLView,
  RTLTable,
  RTLDivider,
  RTLSummaryRow,
  getRTLPageStyle,
} from "./components/index";

export type {
  RTLTextProps,
  RTLViewProps,
  RTLTableProps,
  RTLTableColumn,
  RTLDividerProps,
  RTLSummaryRowProps,
} from "./components/index";

// Font utilities
export {
  registerRTLFont,
  registerRubik,
  registerNotoSansHebrew,
  disableHyphenation,
  setupHebrewPDF,
} from "./fonts/register";

export type { RegisterRTLFontOptions, RTLFontSource, RTLFontWeight } from "./fonts/register";

// RTL utilities
export {
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
} from "./utils/rtl";

export type { TextSegment } from "./utils/rtl";
