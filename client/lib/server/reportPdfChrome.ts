// Shared page geometry and "chrome" (footer / continuation header / table
// header row) for NERU's A4-landscape PDF reports, so every report's
// pagination band looks and behaves identically.

export const PAGE_W = 841.89;
export const PAGE_H = 595.28;
export const MARGIN = 40;

export function drawReportFooter(doc: PDFKit.PDFDocument, pageNum: number, usableW: number): void {
  const fy = PAGE_H - 24;
  doc.moveTo(MARGIN, fy).lineTo(MARGIN + usableW, fy)
     .strokeColor('#e2e8f0').lineWidth(0.5).stroke();
  doc.font('Body').fontSize(7).fillColor('#9ca3af')
     .text('DOPA Coaching · NERU · Confidential', MARGIN, fy + 4, { lineBreak: false });
  doc.font('Body').fontSize(7).fillColor('#9ca3af')
     .text(`Page ${pageNum}`, MARGIN, fy + 4, { width: usableW, align: 'right', lineBreak: false });
}

export function drawContinuationHeader(doc: PDFKit.PDFDocument, title: string, usableW: number): number {
  doc.rect(0, 0, PAGE_W, 24).fill('#0f2942');
  doc.font('Body-Bold').fontSize(8.5).fillColor('#ffffff')
     .text(`${title} (continued)`, MARGIN, 8, { lineBreak: false });
  doc.font('Body').fontSize(7.5).fillColor('#7fa8c8')
     .text('DOPA Coaching', MARGIN, 8, { width: usableW, align: 'right', lineBreak: false });
  return 28;
}

export function drawTableHeaderRow(
  doc: PDFKit.PDFDocument,
  cols: { label: string; w: number }[],
  y: number,
  usableW: number,
  hdrH: number,
): void {
  doc.rect(MARGIN, y, usableW, hdrH).fill('#1e4060');
  doc.rect(MARGIN, y, usableW, 2).fill('#3b82f6');

  let x = MARGIN;
  for (const col of cols) {
    doc.font('Body-Bold').fontSize(7.5).fillColor('#ffffff')
       .text(col.label, x + 4, y + 9, { width: col.w - 6, lineBreak: false });
    x += col.w;
  }
  x = MARGIN;
  for (let i = 0; i < cols.length - 1; i++) {
    x += cols[i].w;
    doc.moveTo(x, y + 4).lineTo(x, y + hdrH - 4)
       .strokeColor('#2c5f85').lineWidth(0.5).stroke();
  }
}
