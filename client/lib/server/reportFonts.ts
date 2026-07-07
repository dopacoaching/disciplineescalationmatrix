import path from 'path';

// PDFKit's built-in Helvetica/Times/Courier only support Latin-1 — Malayalam and
// other non-Latin characters render as gibberish. We embed Noto Sans (Latin) and
// Noto Sans Malayalam, then pick per text run based on whether the string contains
// any Malayalam codepoints.
const FONT_DIR = path.join(process.cwd(), 'lib', 'server', 'fonts');
export const FONT_LATIN_REGULAR = path.join(FONT_DIR, 'NotoSans-Regular.ttf');
export const FONT_LATIN_BOLD    = path.join(FONT_DIR, 'NotoSans-Bold.ttf');
export const FONT_ML_REGULAR    = path.join(FONT_DIR, 'NotoSansMalayalam-Regular.ttf');
export const FONT_ML_BOLD       = path.join(FONT_DIR, 'NotoSansMalayalam-Bold.ttf');

const MALAYALAM_RE = /[ഀ-ൿ]/;

export function fontFor(text: string, bold = false): string {
  if (MALAYALAM_RE.test(text)) return bold ? 'BodyMl-Bold' : 'BodyMl';
  return bold ? 'Body-Bold' : 'Body';
}

export function registerReportFonts(doc: PDFKit.PDFDocument): void {
  doc.registerFont('Body',        FONT_LATIN_REGULAR);
  doc.registerFont('Body-Bold',   FONT_LATIN_BOLD);
  doc.registerFont('BodyMl',      FONT_ML_REGULAR);
  doc.registerFont('BodyMl-Bold', FONT_ML_BOLD);
}
