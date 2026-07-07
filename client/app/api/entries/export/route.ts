import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/server/db';
import Entry from '@/lib/server/models/Entry';
import Student from '@/lib/server/models/Student';
import '@/lib/server/models/Staff';
import '@/lib/server/models/Batch';
import AuditLog from '@/lib/server/models/AuditLog';
import { getAuthUser, adminBatchScope } from '@/lib/server/auth';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { fontFor, registerReportFonts } from '@/lib/server/reportFonts';
import { parseDate, fmtDate, fmtDateTime } from '@/lib/server/reportFormat';
import { XL, xlFill, xlBorder, xlHairBorder } from '@/lib/server/reportExcelStyles';
import { PAGE_W, PAGE_H, MARGIN as M, drawReportFooter, drawContinuationHeader, drawTableHeaderRow } from '@/lib/server/reportPdfChrome';
import { AUDIT_ACTION_LABELS, STUDENT_AUDIT_ACTIONS } from '@/lib/server/auditActions';
import { remarkLabel } from '@/lib/server/remarks';

interface Stats {
  total: number; high: number; medium: number; low: number;
  level1: number; level2: number; level3: number;
}

function calcStats(entries: any[]): Stats {
  return {
    total:  entries.length,
    high:   entries.filter(e => e.severity === 'high').length,
    medium: entries.filter(e => e.severity === 'medium').length,
    low:    entries.filter(e => e.severity === 'low').length,
    level1: entries.filter(e => e.escalationLevel === 1).length,
    level2: entries.filter(e => e.escalationLevel === 2).length,
    level3: entries.filter(e => e.escalationLevel === 3).length,
  };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }
    await connectDB();

    const sp = req.nextUrl.searchParams;
    const format = sp.get('format');
    const fromDate = sp.get('fromDate');
    const toDate = sp.get('toDate');
    const batchId = sp.get('batchId');
    const sort = sp.get('sort') || 'newest';

    if (format !== 'pdf' && format !== 'excel') {
      return NextResponse.json({ message: 'Invalid format. Use pdf or excel.' }, { status: 400 });
    }

    const studentId = sp.get('studentId');

    // Scoped admins may only export entries for students in their assigned batches.
    const scope = adminBatchScope(user);
    const filter: Record<string, unknown> = {};
    if (studentId) {
      if (!mongoose.Types.ObjectId.isValid(studentId)) return NextResponse.json({ message: 'Invalid studentId' }, { status: 400 });
      if (scope) {
        const student = await Student.findById(studentId).select('batchId').lean();
        if (!student || !scope.some(id => id.toString() === student.batchId.toString())) {
          return NextResponse.json({ message: 'Access denied to this student' }, { status: 403 });
        }
      }
      filter.studentId = new mongoose.Types.ObjectId(studentId);
    } else if (batchId) {
      if (!mongoose.Types.ObjectId.isValid(batchId)) return NextResponse.json({ message: 'Invalid batchId' }, { status: 400 });
      if (scope && !scope.some(id => id.toString() === batchId)) return NextResponse.json({ message: 'Access denied to this batch' }, { status: 403 });
      const studentsInBatch = await Student.find({ batchId: new mongoose.Types.ObjectId(batchId) }).select('_id').lean();
      filter.studentId = { $in: studentsInBatch.map(s => s._id) };
    } else if (scope) {
      const studentsInScope = await Student.find({ batchId: { $in: scope } }).select('_id').lean();
      filter.studentId = { $in: studentsInScope.map(s => s._id) };
    }
    const from = parseDate(fromDate);
    const to = parseDate(toDate);
    if (from || to) {
      filter.createdAt = {
        ...(from ? { $gte: from } : {}),
        ...(to ? { $lte: new Date(to!.getTime() + 86399999) } : {}),
      };
    }

    // For a single-student report, also surface admin actions taken on that
    // student (flag clears, edits, deletions) so the report is a full history.
    // Runs alongside the entries query since neither depends on the other.
    const [entries, adminActions] = await Promise.all([
      Entry.find(filter)
        .populate({ path: 'studentId', select: 'fullName registerNumber batchId', populate: { path: 'batchId', select: 'name' } })
        .populate('staffId', 'fullName username')
        .sort(sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 })
        .lean(),
      studentId
        ? AuditLog.find({ targetType: 'student', targetId: studentId, action: { $in: STUDENT_AUDIT_ACTIONS } })
            .select('createdAt actorUsername action details')
            .sort({ createdAt: 1 })
            .lean()
        : Promise.resolve([]),
    ]);

    const dateLabel =
      fromDate && toDate ? `${fmtDate(fromDate)} – ${fmtDate(toDate)}`
      : fromDate         ? `From ${fmtDate(fromDate)}`
      : toDate           ? `Until ${fmtDate(toDate)}`
      : 'All time';

    const fileBase = `NERU-Entries-${fromDate || 'all'}-to-${toDate || 'all'}`;
    const stats = calcStats(entries);

    if (format === 'excel') return await generateExcel(entries, dateLabel, fileBase, stats, adminActions);
    return await generatePDF(entries, dateLabel, fileBase, stats, adminActions);
  } catch (err) {
    console.error('[entries/export]', err);
    return NextResponse.json({ message: 'Export failed' }, { status: 500 });
  }
}

// ─── Excel ────────────────────────────────────────────────────────────────────

async function generateExcel(
  entries: any[], dateLabel: string, fileBase: string, stats: Stats, adminActions: any[],
): Promise<NextResponse> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'NERU – DOPA Coaching';
  wb.created = new Date();

  buildEntriesSheet(wb, entries, dateLabel, stats);
  buildSummarySheet(wb, entries, dateLabel, stats);
  if (adminActions.length > 0) buildAdminActionsSheet(wb, adminActions, dateLabel);

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(
    new Blob([buffer as ArrayBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileBase}.xlsx"`,
      },
    },
  );
}

function buildEntriesSheet(wb: ExcelJS.Workbook, entries: any[], dateLabel: string, stats: Stats) {
  const ws = wb.addWorksheet('Entries', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
    properties: { tabColor: { argb: XL.navy } },
  });

  ws.columns = [
    { key: 'num',     width: 5.5  },
    { key: 'date',    width: 15   },
    { key: 'student', width: 24   },
    { key: 'regNo',   width: 14   },
    { key: 'batch',   width: 17   },
    { key: 'remark',  width: 42   },
    { key: 'sev',     width: 12   },
    { key: 'lvl',     width: 11   },
    { key: 'staff',   width: 22   },
  ];

  // ── Row 1: Title ──────────────────────────────────────────────────────
  ws.mergeCells('A1:I1');
  Object.assign(ws.getCell('A1'), {
    value: 'Discipline Entries Report',
    font:  { name: 'Calibri', size: 18, bold: true, color: { argb: XL.white } },
    fill:  xlFill(XL.navy),
    alignment: { vertical: 'middle', horizontal: 'center' },
  });
  ws.getRow(1).height = 40;

  // ── Row 2: Subtitle ───────────────────────────────────────────────────
  ws.mergeCells('A2:I2');
  Object.assign(ws.getCell('A2'), {
    value: `DOPA Coaching  ·  ${dateLabel}`,
    font:  { name: 'Calibri', size: 10, color: { argb: 'FFB8D4EC' } },
    fill:  xlFill(XL.navyMid),
    alignment: { vertical: 'middle', horizontal: 'center' },
  });
  ws.getRow(2).height = 22;

  // ── Row 3: Meta stats ─────────────────────────────────────────────────
  ws.mergeCells('A3:I3');
  Object.assign(ws.getCell('A3'), {
    value: `Total: ${stats.total}   ·   High: ${stats.high}   ·   Medium: ${stats.medium}   ·   Low: ${stats.low}   ·   Level 3 (Critical): ${stats.level3}   ·   Generated: ${new Date().toLocaleString('en-IN')}`,
    font:  { name: 'Calibri', size: 9, color: { argb: XL.gray600 } },
    fill:  xlFill(XL.gray50),
    alignment: { vertical: 'middle', horizontal: 'center' },
  });
  ws.getRow(3).height = 18;

  // ── Row 4: spacer ─────────────────────────────────────────────────────
  ws.getRow(4).height = 5;

  // ── Row 5: Column headers ─────────────────────────────────────────────
  const hdrs = ['#', 'Date', 'Student Name', 'Register No', 'Batch', 'Remark', 'Severity', 'Level', 'Reported By'];
  const hdrRow = ws.getRow(5);
  hdrRow.height = 22;
  hdrs.forEach((h, i) => {
    const cell = hdrRow.getCell(i + 1);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: XL.white } };
    cell.fill = xlFill(XL.navyLight);
    cell.alignment = { vertical: 'middle', horizontal: i === 0 ? 'center' : 'left', indent: i > 0 ? 1 : 0 };
    cell.border = xlBorder('medium', XL.navyMid);
  });

  // Freeze header rows, auto-filter
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 5, showGridLines: false }];
  ws.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: 9 } };

  // ── Data rows ─────────────────────────────────────────────────────────
  entries.forEach((e, i) => {
    const rn = i + 6;
    const row = ws.getRow(rn);
    row.height = 18;
    const isEven = i % 2 === 0;
    const defaultBg = isEven ? XL.altRow : XL.white;

    const sev = e.severity as string;
    const lvl = String(e.escalationLevel);
    const sevFg = sev === 'high' ? XL.highFg : sev === 'medium' ? XL.mediumFg : XL.lowFg;
    const sevBg = sev === 'high' ? XL.highBg : sev === 'medium' ? XL.mediumBg : XL.lowBg;
    const lvlFg = lvl === '3' ? XL.l3Fg : lvl === '2' ? XL.l2Fg : XL.l1Fg;
    const lvlBg = lvl === '3' ? XL.l3Bg : lvl === '2' ? XL.l2Bg : XL.l1Bg;

    const vals: any[] = [
      i + 1,
      fmtDate(e.createdAt),
      e.studentId?.fullName || '—',
      e.studentId?.registerNumber || '—',
      (e.studentId?.batchId as any)?.name || '—',
      remarkLabel(e.remarkId, e.customRemark),
      sev.charAt(0).toUpperCase() + sev.slice(1),
      `Level ${lvl}`,
      e.staffId?.fullName || '—',
    ];

    vals.forEach((val, ci) => {
      const cell = row.getCell(ci + 1);
      cell.value = val;
      cell.alignment = {
        vertical: 'middle',
        horizontal: ci === 0 ? 'center' : 'left',
        wrapText: ci === 5,
        indent: ci > 0 ? 1 : 0,
      };
      cell.border = xlHairBorder();

      if (ci === 6) {
        // Severity
        cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: sevFg } };
        cell.fill = xlFill(sevBg);
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (ci === 7) {
        // Level
        cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: lvlFg } };
        cell.fill = xlFill(lvlBg);
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (ci === 2) {
        // Student name – bold
        cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: XL.gray900 } };
        cell.fill = xlFill(defaultBg);
      } else {
        cell.font = { name: 'Calibri', size: 9, color: { argb: XL.gray900 } };
        cell.fill = xlFill(defaultBg);
      }
    });
  });

  if (entries.length === 0) {
    ws.mergeCells('A6:I6');
    Object.assign(ws.getCell('A6'), {
      value: 'No entries found for the selected date range.',
      font: { name: 'Calibri', size: 11, italic: true, color: { argb: XL.gray400 } },
      alignment: { vertical: 'middle', horizontal: 'center' },
    });
    ws.getRow(6).height = 40;
  }
}

function buildSummarySheet(wb: ExcelJS.Workbook, entries: any[], dateLabel: string, stats: Stats) {
  const ws = wb.addWorksheet('Summary', {
    properties: { tabColor: { argb: XL.navyLight } },
  });
  ws.views = [{ showGridLines: false }];
  ws.columns = [
    { key: 'a', width: 26 },
    { key: 'b', width: 12 },
    { key: 'c', width: 14 },
    { key: 'd', width: 14 },
  ];

  let r = 1;

  const addTitle = (label: string) => {
    ws.mergeCells(`A${r}:D${r}`);
    Object.assign(ws.getCell(`A${r}`), {
      value: label,
      font: { name: 'Calibri', size: 16, bold: true, color: { argb: XL.white } },
      fill: xlFill(XL.navy),
      alignment: { vertical: 'middle', horizontal: 'center' },
    });
    ws.getRow(r).height = 36;
    r++;
    ws.mergeCells(`A${r}:D${r}`);
    Object.assign(ws.getCell(`A${r}`), {
      value: dateLabel,
      font: { name: 'Calibri', size: 10, color: { argb: 'FFB8D4EC' } },
      fill: xlFill(XL.navyMid),
      alignment: { vertical: 'middle', horizontal: 'center' },
    });
    ws.getRow(r).height = 20;
    r += 2;
  };

  const addSectionHeader = (label: string) => {
    ws.mergeCells(`A${r}:D${r}`);
    Object.assign(ws.getCell(`A${r}`), {
      value: label,
      font: { name: 'Calibri', size: 11, bold: true, color: { argb: XL.white } },
      fill: xlFill(XL.navyLight),
      alignment: { vertical: 'middle', horizontal: 'left', indent: 1 },
    });
    ws.getRow(r).height = 20;
    r++;
  };

  const addTableHeader = (headers: string[]) => {
    const row = ws.getRow(r);
    row.height = 18;
    headers.forEach((h, i) => {
      const cell = row.getCell(i + 1);
      cell.value = h;
      cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: XL.gray900 } };
      cell.fill = xlFill(XL.gray100);
      cell.border = xlBorder('thin', 'FFD1D5DB');
      cell.alignment = { vertical: 'middle', horizontal: i === 0 ? 'left' : 'center', indent: i === 0 ? 1 : 0 };
    });
    r++;
  };

  const addDataRow = (vals: any[], colors?: { fg: string; bg: string }[]) => {
    const row = ws.getRow(r);
    row.height = 18;
    vals.forEach((v, i) => {
      const cell = row.getCell(i + 1);
      cell.value = v;
      const c = colors?.[i];
      cell.font = { name: 'Calibri', size: 9, bold: !!c, color: { argb: c ? c.fg : XL.gray900 } };
      cell.fill = xlFill(c ? c.bg : XL.white);
      cell.border = xlHairBorder();
      cell.alignment = { vertical: 'middle', horizontal: i === 0 ? 'left' : 'center', indent: i === 0 ? 1 : 0 };
    });
    r++;
  };

  const addSpacer = () => { ws.getRow(r).height = 10; r++; };

  const pct = (n: number) => stats.total ? `${((n / stats.total) * 100).toFixed(1)}%` : '0%';

  addTitle('Summary Report');

  // Severity breakdown
  addSectionHeader('Severity Breakdown');
  addTableHeader(['Severity', 'Count', '% of Total', '']);
  addDataRow(['High',   stats.high,   pct(stats.high),   ''], [{ fg: XL.highFg, bg: XL.highBg }, { fg: XL.highFg, bg: XL.highBg }, undefined as any, undefined as any]);
  addDataRow(['Medium', stats.medium, pct(stats.medium), ''], [{ fg: XL.mediumFg, bg: XL.mediumBg }, { fg: XL.mediumFg, bg: XL.mediumBg }, undefined as any, undefined as any]);
  addDataRow(['Low',    stats.low,    pct(stats.low),    ''], [{ fg: XL.lowFg, bg: XL.lowBg }, { fg: XL.lowFg, bg: XL.lowBg }, undefined as any, undefined as any]);
  addSpacer();

  // Escalation level breakdown
  addSectionHeader('Escalation Level Breakdown');
  addTableHeader(['Level', 'Count', '% of Total', 'Description']);
  addDataRow(['Level 1 – Monitoring',         stats.level1, pct(stats.level1), 'Observation stage'], [{ fg: XL.l1Fg, bg: XL.l1Bg }, { fg: XL.l1Fg, bg: XL.l1Bg }, undefined as any, undefined as any]);
  addDataRow(['Level 2 – Flagged',            stats.level2, pct(stats.level2), 'Parental advisory'], [{ fg: XL.l2Fg, bg: XL.l2Bg }, { fg: XL.l2Fg, bg: XL.l2Bg }, undefined as any, undefined as any]);
  addDataRow(['Level 3 – Admin Action Req.',  stats.level3, pct(stats.level3), 'Immediate action'], [{ fg: XL.l3Fg, bg: XL.l3Bg }, { fg: XL.l3Fg, bg: XL.l3Bg }, undefined as any, undefined as any]);
  addSpacer();

  // Top batches
  const batchMap: Record<string, { name: string; count: number }> = {};
  for (const e of entries) {
    const bid = (e.studentId?.batchId as any)?._id?.toString() || 'unknown';
    const bname = (e.studentId?.batchId as any)?.name || 'Unknown';
    if (!batchMap[bid]) batchMap[bid] = { name: bname, count: 0 };
    batchMap[bid].count++;
  }
  const topBatches = Object.values(batchMap).sort((a, b) => b.count - a.count).slice(0, 6);
  if (topBatches.length > 0) {
    addSectionHeader('Top Batches by Entry Count');
    addTableHeader(['Batch', 'Entries', '% of Total', '']);
    topBatches.forEach(b => addDataRow([b.name, b.count, pct(b.count), '']));
    addSpacer();
  }

  // Most flagged students
  const studentMap: Record<string, { name: string; regNo: string; batch: string; count: number; level: number }> = {};
  for (const e of entries) {
    const sid = e.studentId?._id?.toString() || 'unknown';
    if (!studentMap[sid]) {
      studentMap[sid] = {
        name:  e.studentId?.fullName || '—',
        regNo: e.studentId?.registerNumber || '—',
        batch: (e.studentId?.batchId as any)?.name || '—',
        count: 0,
        level: e.escalationLevel,
      };
    }
    studentMap[sid].count++;
    if (e.escalationLevel > studentMap[sid].level) studentMap[sid].level = e.escalationLevel;
  }
  const topStudents = Object.values(studentMap).sort((a, b) => b.count - a.count).slice(0, 10);

  if (topStudents.length > 0) {
    ws.columns = [
      { key: 'a', width: 26 },
      { key: 'b', width: 14 },
      { key: 'c', width: 18 },
      { key: 'd', width: 10 },
    ];
    addSectionHeader('Most Flagged Students (Top 10)');
    addTableHeader(['Student Name', 'Register No', 'Batch', 'Entries']);
    topStudents.forEach(s => addDataRow([s.name, s.regNo, s.batch, s.count]));
  }
}

function buildAdminActionsSheet(wb: ExcelJS.Workbook, adminActions: any[], dateLabel: string) {
  const ws = wb.addWorksheet('Admin Actions', {
    properties: { tabColor: { argb: XL.navy } },
  });
  ws.views = [{ showGridLines: false }];
  ws.columns = [
    { key: 'a', width: 20 },
    { key: 'b', width: 18 },
    { key: 'c', width: 28 },
    { key: 'd', width: 50 },
  ];

  let r = 1;
  ws.mergeCells(`A${r}:D${r}`);
  Object.assign(ws.getCell(`A${r}`), {
    value: 'Admin Actions on This Student',
    font: { name: 'Calibri', size: 16, bold: true, color: { argb: XL.white } },
    fill: xlFill(XL.navy),
    alignment: { vertical: 'middle', horizontal: 'center' },
  });
  ws.getRow(r).height = 36;
  r++;
  ws.mergeCells(`A${r}:D${r}`);
  Object.assign(ws.getCell(`A${r}`), {
    value: dateLabel,
    font: { name: 'Calibri', size: 10, color: { argb: 'FFB8D4EC' } },
    fill: xlFill(XL.navyMid),
    alignment: { vertical: 'middle', horizontal: 'center' },
  });
  ws.getRow(r).height = 20;
  r += 2;

  const hdrs = ['Date', 'Admin', 'Action', 'Details'];
  const hdrRow = ws.getRow(r);
  hdrRow.height = 20;
  hdrs.forEach((h, i) => {
    const cell = hdrRow.getCell(i + 1);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: XL.white } };
    cell.fill = xlFill(XL.navyLight);
    cell.border = xlBorder('medium', XL.navyMid);
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  });
  r++;

  adminActions.forEach(a => {
    const row = ws.getRow(r);
    row.height = 18;
    const vals = [fmtDateTime(a.createdAt), a.actorUsername, AUDIT_ACTION_LABELS[a.action] || a.action, a.details || '—'];
    vals.forEach((v, i) => {
      const cell = row.getCell(i + 1);
      cell.value = v;
      cell.font = { name: 'Calibri', size: 9, color: { argb: XL.gray900 } };
      cell.border = xlHairBorder();
      cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1, wrapText: i === 3 };
    });
    r++;
  });
}

// ─── PDF ──────────────────────────────────────────────────────────────────────

async function generatePDF(
  entries: any[], dateLabel: string, fileBase: string, stats: Stats, adminActions: any[],
): Promise<NextResponse> {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40, autoFirstPage: true });
  registerReportFonts(doc);

  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));
  const done = new Promise<void>(resolve => doc.on('end', resolve));

  const usableW       = PAGE_W - M * 2;
  const CONTENT_BOT   = PAGE_H - 32; // content must end above footer

  // Table columns
  const cols = [
    { label: '#',           w: 28  },
    { label: 'Date & Time', w: 92  },
    { label: 'Student',     w: 118 },
    { label: 'Reg. No',     w: 72  },
    { label: 'Batch',       w: 83  },
    { label: 'Remark',      w: 173 },
    { label: 'Severity',    w: 60  },
    { label: 'Level',       w: 42  },
    { label: 'Reported By', w: 94  },
  ];
  const ROW_H = 22;
  const HDR_H = 26;

  // ── Page 1 header ──────────────────────────────────────────────────────
  const drawPage1Header = (): number => {
    // Full-width navy band
    doc.rect(0, 0, PAGE_W, 52).fill('#0f2942');
    // Org name (right)
    doc.font('Body').fontSize(7.5).fillColor('#7fa8c8')
       .text('DOPA Coaching', M, 10, { width: usableW, align: 'right', lineBreak: false });
    // Report title
    doc.font('Body-Bold').fontSize(16).fillColor('#ffffff')
       .text('Discipline Entries Report', M, 16, { width: usableW * 0.6, lineBreak: false });
    // Subtitle
    doc.font('Body').fontSize(8).fillColor('#a8c8e0')
       .text('NERU', M, 36, { width: usableW * 0.6, lineBreak: false });

    // Stats row
    const statsY = 60;
    const statsH = 34;
    const boxes = [
      { label: 'Total Entries',      val: stats.total,  fg: '#ffffff', bg: '#1e4060' },
      { label: 'High Severity',      val: stats.high,   fg: '#dc2626', bg: '#fef2f2' },
      { label: 'Medium Severity',    val: stats.medium, fg: '#d97706', bg: '#fffbeb' },
      { label: 'Low Severity',       val: stats.low,    fg: '#16a34a', bg: '#f0fdf4' },
      { label: 'Level 3 – Critical', val: stats.level3, fg: '#ef4444', bg: '#fef2f2' },
    ];
    const gap = 5;
    const boxW = (usableW - gap * (boxes.length - 1)) / boxes.length;
    let bx = M;
    for (const b of boxes) {
      doc.roundedRect(bx, statsY, boxW, statsH, 5).fill(b.bg);
      doc.font('Body-Bold').fontSize(15).fillColor(b.fg)
         .text(String(b.val), bx, statsY + 4, { width: boxW, align: 'center', lineBreak: false });
      doc.font('Body').fontSize(6.5).fillColor(b.fg === '#ffffff' ? '#a8c8e0' : b.fg)
         .text(b.label, bx, statsY + 22, { width: boxW, align: 'center', lineBreak: false });
      bx += boxW + gap;
    }

    // Date label
    doc.font('Body').fontSize(7.5).fillColor('#6b7280')
       .text(
         `Date range: ${dateLabel}  ·  Generated: ${new Date().toLocaleString('en-IN')}`,
         M, statsY + statsH + 6, { width: usableW, lineBreak: false },
       );

    return statsY + statsH + 22; // y where table starts
  };

  // ── Data row ───────────────────────────────────────────────────────────
  const drawDataRow = (entry: any, idx: number, y: number) => {
    const isEven = idx % 2 === 0;

    // Row background
    if (isEven) doc.rect(M, y, usableW, ROW_H).fill('#f0f4f8');
    else        doc.rect(M, y, usableW, ROW_H).fill('#ffffff');

    // Left accent bar for level 3
    if (entry.escalationLevel === 3) {
      doc.rect(M, y, 3, ROW_H).fill('#ef4444');
    } else if (entry.escalationLevel === 2) {
      doc.rect(M, y, 3, ROW_H).fill('#f59e0b');
    }

    // Bottom divider
    doc.moveTo(M, y + ROW_H).lineTo(M + usableW, y + ROW_H)
       .strokeColor('#e2e8f0').lineWidth(0.4).stroke();

    // ── Cell values ───────────────────────────────────────────────────
    const sev = entry.severity as string;
    const sevColors: Record<string, { fg: string; pill: string; text: string }> = {
      high:   { fg: '#dc2626', pill: '#fee2e2', text: '#dc2626' },
      medium: { fg: '#d97706', pill: '#fef3c7', text: '#d97706' },
      low:    { fg: '#16a34a', pill: '#dcfce7', text: '#16a34a' },
    };
    const sc = sevColors[sev] || { fg: '#1f2937', pill: '#f3f4f6', text: '#1f2937' };

    const lvlColors: Record<string, string> = { '1': '#3b82f6', '2': '#f59e0b', '3': '#ef4444' };
    const lvlFg = lvlColors[String(entry.escalationLevel)] || '#6b7280';

    let x = M;

    // # col
    doc.font('Body').fontSize(7).fillColor('#9ca3af')
       .text(String(idx + 1), x + 3, y + 8, { width: cols[0].w - 5, align: 'center', lineBreak: false });
    x += cols[0].w;

    // Date col (shows datetime)
    doc.font('Body').fontSize(7).fillColor('#374151')
       .text(fmtDateTime(entry.createdAt), x + 4, y + 8, { width: cols[1].w - 6, lineBreak: false });
    x += cols[1].w;

    // Student name (bold)
    const studentName = entry.studentId?.fullName || '—';
    doc.font(fontFor(studentName, true)).fontSize(7.5).fillColor('#111827')
       .text(studentName, x + 4, y + 7, { width: cols[2].w - 6, lineBreak: false, ellipsis: true });
    x += cols[2].w;

    // Reg No
    const regNo = entry.studentId?.registerNumber || '—';
    doc.font(fontFor(regNo)).fontSize(7).fillColor('#6b7280')
       .text(regNo, x + 4, y + 8, { width: cols[3].w - 6, lineBreak: false });
    x += cols[3].w;

    // Batch
    const batchName = (entry.studentId?.batchId as any)?.name || '—';
    doc.font(fontFor(batchName)).fontSize(7).fillColor('#374151')
       .text(batchName, x + 4, y + 8, { width: cols[4].w - 6, lineBreak: false, ellipsis: true });
    x += cols[4].w;

    // Remark
    const remarkText = remarkLabel(entry.remarkId, entry.customRemark);
    doc.font(fontFor(remarkText)).fontSize(7.5).fillColor('#1f2937')
       .text(remarkText, x + 4, y + 7, { width: cols[5].w - 6, lineBreak: false, ellipsis: true });
    x += cols[5].w;

    // Severity pill
    const pillH = 13;
    const pillW = cols[6].w - 10;
    const pillX = x + 5;
    const pillY = y + (ROW_H - pillH) / 2;
    doc.roundedRect(pillX, pillY, pillW, pillH, 3).fill(sc.pill);
    doc.font('Body-Bold').fontSize(6.5).fillColor(sc.fg)
       .text(sev.toUpperCase(), pillX, pillY + 3.5, { width: pillW, align: 'center', lineBreak: false });
    x += cols[6].w;

    // Level badge
    const lvlLabel = `L${entry.escalationLevel}`;
    doc.roundedRect(x + 7, y + (ROW_H - 13) / 2, cols[7].w - 12, 13, 3).fill(
      entry.escalationLevel === 3 ? '#fef2f2' : entry.escalationLevel === 2 ? '#fffbeb' : '#eff6ff',
    );
    doc.font('Body-Bold').fontSize(8).fillColor(lvlFg)
       .text(lvlLabel, x + 6, y + 7, { width: cols[7].w - 10, align: 'center', lineBreak: false });
    x += cols[7].w;

    // Reported by
    const staffName = entry.staffId?.fullName || '—';
    doc.font(fontFor(staffName)).fontSize(7).fillColor('#374151')
       .text(staffName, x + 4, y + 8, { width: cols[8].w - 6, lineBreak: false, ellipsis: true });
  };

  const REPORT_TITLE = 'Discipline Entries Report';
  const drawFooter = (pageNum: number) => drawReportFooter(doc, pageNum, usableW);

  // ── Render ─────────────────────────────────────────────────────────────
  let pageNum = 1;
  let tableTop = drawPage1Header();
  drawTableHeaderRow(doc, cols, tableTop, usableW, HDR_H);
  let y = tableTop + HDR_H;

  if (entries.length === 0) {
    doc.font('Body').fontSize(11).fillColor('#9ca3af')
       .text('No entries found for the selected date range.', M, y + 20, { align: 'center', width: usableW });
  }

  for (let i = 0; i < entries.length; i++) {
    if (y + ROW_H > CONTENT_BOT) {
      drawFooter(pageNum);
      doc.addPage();
      pageNum++;
      tableTop = drawContinuationHeader(doc, REPORT_TITLE, usableW);
      drawTableHeaderRow(doc, cols, tableTop, usableW, HDR_H);
      y = tableTop + HDR_H;
    }
    drawDataRow(entries[i], i, y);
    y += ROW_H;
  }

  // ── Admin actions section (single-student reports only) ────────────────
  if (adminActions.length > 0) {
    const aaCols = [
      { label: 'Date',   w: 92  },
      { label: 'Admin',  w: 110 },
      { label: 'Action', w: 150 },
      { label: 'Details', w: usableW - 92 - 110 - 150 },
    ];
    const AA_ROW_H = 24;
    const AA_HDR_H = 26;
    const AA_TITLE_H = 30;

    const spaceNeeded = AA_TITLE_H + AA_HDR_H + AA_ROW_H;
    if (y + spaceNeeded > CONTENT_BOT) {
      drawFooter(pageNum);
      doc.addPage();
      pageNum++;
      y = drawContinuationHeader(doc, REPORT_TITLE, usableW);
    } else {
      y += 14;
    }

    doc.font('Body-Bold').fontSize(11).fillColor('#0f2942')
       .text('Admin Actions on This Student', M, y, { width: usableW, lineBreak: false });
    y += AA_TITLE_H;

    drawTableHeaderRow(doc, aaCols, y, usableW, AA_HDR_H);
    y += AA_HDR_H;

    for (let i = 0; i < adminActions.length; i++) {
      if (y + AA_ROW_H > CONTENT_BOT) {
        drawFooter(pageNum);
        doc.addPage();
        pageNum++;
        y = drawContinuationHeader(doc, REPORT_TITLE, usableW);
        drawTableHeaderRow(doc, aaCols, y, usableW, AA_HDR_H);
        y += AA_HDR_H;
      }
      const a = adminActions[i];
      const isEven = i % 2 === 0;
      doc.rect(M, y, usableW, AA_ROW_H).fill(isEven ? '#f0f4f8' : '#ffffff');
      doc.moveTo(M, y + AA_ROW_H).lineTo(M + usableW, y + AA_ROW_H)
         .strokeColor('#e2e8f0').lineWidth(0.4).stroke();

      let ax = M;
      doc.font('Body').fontSize(7).fillColor('#374151')
         .text(fmtDateTime(a.createdAt), ax + 4, y + 8, { width: aaCols[0].w - 6, lineBreak: false });
      ax += aaCols[0].w;
      doc.font(fontFor(a.actorUsername)).fontSize(7).fillColor('#111827')
         .text(a.actorUsername, ax + 4, y + 8, { width: aaCols[1].w - 6, lineBreak: false, ellipsis: true });
      ax += aaCols[1].w;
      const actionLabel = AUDIT_ACTION_LABELS[a.action] || a.action;
      doc.font('Body').fontSize(7).fillColor('#374151')
         .text(actionLabel, ax + 4, y + 8, { width: aaCols[2].w - 6, lineBreak: false, ellipsis: true });
      ax += aaCols[2].w;
      const details = a.details || '—';
      doc.font(fontFor(details)).fontSize(7).fillColor('#374151')
         .text(details, ax + 4, y + 8, { width: aaCols[3].w - 6, lineBreak: false, ellipsis: true });

      y += AA_ROW_H;
    }
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
