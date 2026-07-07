import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/server/db';
import AuditLog from '@/lib/server/models/AuditLog';
import { getAuthUser, adminBatchScope } from '@/lib/server/auth';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { fontFor, registerReportFonts } from '@/lib/server/reportFonts';
import { parseDate, fmtDate, fmtDateTime } from '@/lib/server/reportFormat';
import { XL, xlFill, xlBorder, xlHairBorder } from '@/lib/server/reportExcelStyles';
import { PAGE_W, PAGE_H, MARGIN as M, drawReportFooter, drawContinuationHeader, drawTableHeaderRow } from '@/lib/server/reportPdfChrome';
import { AUDIT_ACTION_CATEGORIES, AUDIT_ACTION_LABELS } from '@/lib/server/auditActions';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }
    await connectDB();

    const sp = req.nextUrl.searchParams;
    const format = sp.get('format');
    if (format !== 'pdf' && format !== 'excel') {
      return NextResponse.json({ message: 'Invalid format. Use pdf or excel.' }, { status: 400 });
    }
    const fromDate = sp.get('fromDate');
    const toDate = sp.get('toDate');
    const action = sp.get('action');

    const filter: Record<string, unknown> = {};
    const scope = adminBatchScope(user);
    if (scope) filter.batchIds = { $in: scope };

    const from = parseDate(fromDate);
    const to = parseDate(toDate);
    if (from || to) {
      filter.createdAt = {
        ...(from ? { $gte: from } : {}),
        ...(to ? { $lte: new Date(to!.getTime() + 86399999) } : {}),
      };
    }
    if (action && AUDIT_ACTION_CATEGORIES.has(action)) {
      filter.action = { $regex: `^${action}\\.`, $options: 'i' };
    }

    const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).lean();

    const dateLabel =
      fromDate && toDate ? `${fmtDate(fromDate)} – ${fmtDate(toDate)}`
      : fromDate         ? `From ${fmtDate(fromDate)}`
      : toDate           ? `Until ${fmtDate(toDate)}`
      : 'All time';

    const fileBase = `NERU-AuditLog-${fromDate || 'all'}-to-${toDate || 'all'}`;
    const errorCount = logs.filter(l => l.status === 'error').length;

    if (format === 'excel') return await generateExcel(logs, dateLabel, fileBase, errorCount);
    return await generatePDF(logs, dateLabel, fileBase, errorCount);
  } catch (err) {
    console.error('[audit-log/export]', err);
    return NextResponse.json({ message: 'Export failed' }, { status: 500 });
  }
}

// ─── Excel ────────────────────────────────────────────────────────────────────

async function generateExcel(logs: any[], dateLabel: string, fileBase: string, errorCount: number): Promise<NextResponse> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'NERU – DOPA Coaching';
  wb.created = new Date();

  const ws = wb.addWorksheet('Audit Log', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
    properties: { tabColor: { argb: XL.navy } },
  });

  ws.columns = [
    { key: 'date',    width: 20 },
    { key: 'actor',   width: 22 },
    { key: 'role',    width: 12 },
    { key: 'action',  width: 24 },
    { key: 'target',  width: 26 },
    { key: 'details', width: 50 },
    { key: 'status',  width: 10 },
  ];

  ws.mergeCells('A1:G1');
  Object.assign(ws.getCell('A1'), {
    value: 'Admin Action History',
    font: { name: 'Calibri', size: 18, bold: true, color: { argb: XL.white } },
    fill: xlFill(XL.navy),
    alignment: { vertical: 'middle', horizontal: 'center' },
  });
  ws.getRow(1).height = 40;

  ws.mergeCells('A2:G2');
  Object.assign(ws.getCell('A2'), {
    value: `DOPA Coaching · NERU  ·  ${dateLabel}`,
    font: { name: 'Calibri', size: 10, color: { argb: 'FFB8D4EC' } },
    fill: xlFill(XL.navyMid),
    alignment: { vertical: 'middle', horizontal: 'center' },
  });
  ws.getRow(2).height = 22;

  ws.mergeCells('A3:G3');
  Object.assign(ws.getCell('A3'), {
    value: `Total: ${logs.length}   ·   Errors: ${errorCount}   ·   Generated: ${new Date().toLocaleString('en-IN')}`,
    font: { name: 'Calibri', size: 9, color: { argb: XL.gray600 } },
    fill: xlFill(XL.gray50),
    alignment: { vertical: 'middle', horizontal: 'center' },
  });
  ws.getRow(3).height = 18;
  ws.getRow(4).height = 5;

  const hdrs = ['Date', 'Actor', 'Role', 'Action', 'Target', 'Details', 'Status'];
  const hdrRow = ws.getRow(5);
  hdrRow.height = 22;
  hdrs.forEach((h, i) => {
    const cell = hdrRow.getCell(i + 1);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: XL.white } };
    cell.fill = xlFill(XL.navyLight);
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    cell.border = xlBorder('medium', XL.navyMid);
  });
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 5, showGridLines: false }];
  ws.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: 7 } };

  logs.forEach((l, i) => {
    const rn = i + 6;
    const row = ws.getRow(rn);
    row.height = 18;
    const isError = l.status === 'error';
    const defaultBg = isError ? XL.errBg : (i % 2 === 0 ? XL.altRow : XL.white);

    const vals = [
      fmtDateTime(l.createdAt),
      l.actorUsername,
      l.actorRole,
      AUDIT_ACTION_LABELS[l.action] || l.action,
      l.targetName || '—',
      l.details || '—',
      l.status,
    ];
    vals.forEach((v, ci) => {
      const cell = row.getCell(ci + 1);
      cell.value = v;
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: ci === 5, indent: 1 };
      cell.border = xlHairBorder();
      cell.font = { name: 'Calibri', size: 9, color: { argb: isError ? XL.errFg : XL.gray900 }, bold: isError && ci === 6 };
      cell.fill = xlFill(defaultBg);
    });
  });

  if (logs.length === 0) {
    ws.mergeCells('A6:G6');
    Object.assign(ws.getCell('A6'), {
      value: 'No actions found for the selected filters.',
      font: { name: 'Calibri', size: 11, italic: true, color: { argb: XL.gray400 } },
      alignment: { vertical: 'middle', horizontal: 'center' },
    });
    ws.getRow(6).height = 40;
  }

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(
    new Blob([buffer as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileBase}.xlsx"`,
      },
    },
  );
}

// ─── PDF ──────────────────────────────────────────────────────────────────────

async function generatePDF(logs: any[], dateLabel: string, fileBase: string, errorCount: number): Promise<NextResponse> {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40, autoFirstPage: true });
  registerReportFonts(doc);

  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));
  const done = new Promise<void>(resolve => doc.on('end', resolve));

  const usableW = PAGE_W - M * 2;
  const CONTENT_BOT = PAGE_H - 32;

  const cols = [
    { label: 'Date & Time', w: 100 },
    { label: 'Actor',       w: 110 },
    { label: 'Role',        w: 70  },
    { label: 'Action',      w: 130 },
    { label: 'Target',      w: 140 },
    { label: 'Details',     w: usableW - 100 - 110 - 70 - 130 - 140 },
  ];
  const ROW_H = 22;
  const HDR_H = 26;
  const REPORT_TITLE = 'Admin Action History';

  const drawPage1Header = (): number => {
    doc.rect(0, 0, PAGE_W, 52).fill('#0f2942');
    doc.font('Body').fontSize(7.5).fillColor('#7fa8c8')
       .text('DOPA Coaching', M, 10, { width: usableW, align: 'right', lineBreak: false });
    doc.font('Body-Bold').fontSize(16).fillColor('#ffffff')
       .text(REPORT_TITLE, M, 16, { width: usableW * 0.6, lineBreak: false });
    doc.font('Body').fontSize(8).fillColor('#a8c8e0')
       .text('NERU', M, 36, { width: usableW * 0.6, lineBreak: false });

    const statsY = 60;
    const statsH = 34;
    const boxes = [
      { label: 'Total Actions', val: logs.length, fg: '#ffffff', bg: '#1e4060' },
      { label: 'Errors',        val: errorCount,  fg: '#dc2626', bg: '#fef2f2' },
    ];
    const gap = 5;
    const boxW = (usableW * 0.4 - gap * (boxes.length - 1)) / boxes.length;
    let bx = M;
    for (const b of boxes) {
      doc.roundedRect(bx, statsY, boxW, statsH, 5).fill(b.bg);
      doc.font('Body-Bold').fontSize(15).fillColor(b.fg)
         .text(String(b.val), bx, statsY + 4, { width: boxW, align: 'center', lineBreak: false });
      doc.font('Body').fontSize(6.5).fillColor(b.fg === '#ffffff' ? '#a8c8e0' : b.fg)
         .text(b.label, bx, statsY + 22, { width: boxW, align: 'center', lineBreak: false });
      bx += boxW + gap;
    }

    doc.font('Body').fontSize(7.5).fillColor('#6b7280')
       .text(`Date range: ${dateLabel}  ·  Generated: ${new Date().toLocaleString('en-IN')}`,
         M, statsY + statsH + 6, { width: usableW, lineBreak: false });

    return statsY + statsH + 22;
  };

  const drawDataRow = (log: any, idx: number, y: number) => {
    const isError = log.status === 'error';
    doc.rect(M, y, usableW, ROW_H).fill(isError ? '#fef2f2' : (idx % 2 === 0 ? '#f0f4f8' : '#ffffff'));
    doc.moveTo(M, y + ROW_H).lineTo(M + usableW, y + ROW_H).strokeColor('#e2e8f0').lineWidth(0.4).stroke();

    let x = M;
    doc.font('Body').fontSize(7).fillColor('#374151')
       .text(fmtDateTime(log.createdAt), x + 4, y + 8, { width: cols[0].w - 6, lineBreak: false });
    x += cols[0].w;

    doc.font(fontFor(log.actorUsername, true)).fontSize(7.5).fillColor('#111827')
       .text(log.actorUsername, x + 4, y + 7, { width: cols[1].w - 6, lineBreak: false, ellipsis: true });
    x += cols[1].w;

    doc.font('Body').fontSize(7).fillColor('#6b7280')
       .text(log.actorRole, x + 4, y + 8, { width: cols[2].w - 6, lineBreak: false });
    x += cols[2].w;

    const actionLabel = AUDIT_ACTION_LABELS[log.action] || log.action;
    doc.font('Body').fontSize(7).fillColor(isError ? '#dc2626' : '#1f2937')
       .text(actionLabel, x + 4, y + 8, { width: cols[3].w - 6, lineBreak: false, ellipsis: true });
    x += cols[3].w;

    const target = log.targetName || '—';
    doc.font(fontFor(target)).fontSize(7).fillColor('#374151')
       .text(target, x + 4, y + 8, { width: cols[4].w - 6, lineBreak: false, ellipsis: true });
    x += cols[4].w;

    const details = log.details || '—';
    doc.font(fontFor(details)).fontSize(7).fillColor('#374151')
       .text(details, x + 4, y + 8, { width: cols[5].w - 6, lineBreak: false, ellipsis: true });
  };

  const drawFooter = (pageNum: number) => drawReportFooter(doc, pageNum, usableW);

  let pageNum = 1;
  let tableTop = drawPage1Header();
  drawTableHeaderRow(doc, cols, tableTop, usableW, HDR_H);
  let y = tableTop + HDR_H;

  if (logs.length === 0) {
    doc.font('Body').fontSize(11).fillColor('#9ca3af')
       .text('No actions found for the selected filters.', M, y + 20, { align: 'center', width: usableW });
  }

  for (let i = 0; i < logs.length; i++) {
    if (y + ROW_H > CONTENT_BOT) {
      drawFooter(pageNum);
      doc.addPage();
      pageNum++;
      tableTop = drawContinuationHeader(doc, REPORT_TITLE, usableW);
      drawTableHeaderRow(doc, cols, tableTop, usableW, HDR_H);
      y = tableTop + HDR_H;
    }
    drawDataRow(logs[i], i, y);
    y += ROW_H;
  }

  drawFooter(pageNum);
  doc.end();
  await done;

  const buffer = Buffer.concat(chunks);
  return new NextResponse(new Blob([buffer], { type: 'application/pdf' }), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileBase}.pdf"`,
    },
  });
}
