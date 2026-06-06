import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/server/db';
import Entry from '@/lib/server/models/Entry';
import Student from '@/lib/server/models/Student';
import '@/lib/server/models/Staff';
import '@/lib/server/models/Batch';
import { getAuthUser } from '@/lib/server/auth';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

// PDFKit's built-in Helvetica/Times/Courier only support Latin-1 — Malayalam and
// other non-Latin characters render as gibberish. We embed Noto Sans (Latin) and
// Noto Sans Malayalam, then pick per text run based on whether the string contains
// any Malayalam codepoints.
const FONT_DIR = path.join(process.cwd(), 'lib', 'server', 'fonts');
const FONT_LATIN_REGULAR  = path.join(FONT_DIR, 'NotoSans-Regular.ttf');
const FONT_LATIN_BOLD     = path.join(FONT_DIR, 'NotoSans-Bold.ttf');
const FONT_ML_REGULAR     = path.join(FONT_DIR, 'NotoSansMalayalam-Regular.ttf');
const FONT_ML_BOLD        = path.join(FONT_DIR, 'NotoSansMalayalam-Bold.ttf');
const MALAYALAM_RE = /[ഀ-ൿ]/;

function fontFor(text: string, bold = false): string {
  if (MALAYALAM_RE.test(text)) return bold ? 'BodyMl-Bold' : 'BodyMl';
  return bold ? 'Body-Bold' : 'Body';
}

// ─── Constants ───────────────────────────────────────────────────────────────

const REMARK_LABELS: Record<string, string> = {
  late_to_class:       'Being late to class',
  leaving_early:       'Leaving class early without permission',
  sleeping_in_room:    'Sleeping in room during class hours',
  bunking_class:       'Bunking class',
  talking_in_class:    'Talking in class',
  causing_disturbance: 'Causing disturbance in class',
  timing_violation:    'Timing violation',
  curfew_violation:    'Curfew violation',
  misuse_devices:      'Misuse of digital devices',
  misuse_social_media: 'Misuse of social media',
  unauthorized_phone:  'Possession of unauthorized phone',
  exam_malpractice:    'Exam malpractice',
  cheating:            'Cheating',
  other:               'Other',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseDate(val: string | null): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function remarkLabel(remarkId: string, customRemark?: string): string {
  if (remarkId === 'other' && customRemark?.trim()) return customRemark.trim();
  return REMARK_LABELS[remarkId] || remarkId;
}

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

    const filter: Record<string, unknown> = {};
    if (studentId) {
      if (!mongoose.Types.ObjectId.isValid(studentId)) return NextResponse.json({ message: 'Invalid studentId' }, { status: 400 });
      filter.studentId = new mongoose.Types.ObjectId(studentId);
    } else if (batchId) {
      if (!mongoose.Types.ObjectId.isValid(batchId)) return NextResponse.json({ message: 'Invalid batchId' }, { status: 400 });
      const studentsInBatch = await Student.find({ batchId: new mongoose.Types.ObjectId(batchId) }).select('_id').lean();
      filter.studentId = { $in: studentsInBatch.map(s => s._id) };
    }
    const from = parseDate(fromDate);
    const to = parseDate(toDate);
    if (from || to) {
      filter.createdAt = {
        ...(from ? { $gte: from } : {}),
        ...(to ? { $lte: new Date(to!.getTime() + 86399999) } : {}),
      };
    }

    const entries = await Entry.find(filter)
      .populate({ path: 'studentId', select: 'fullName registerNumber batchId', populate: { path: 'batchId', select: 'name' } })
      .populate('staffId', 'fullName username')
      .sort(sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 })
      .lean();

    const dateLabel =
      fromDate && toDate ? `${fmtDate(fromDate)} – ${fmtDate(toDate)}`
      : fromDate         ? `From ${fmtDate(fromDate)}`
      : toDate           ? `Until ${fmtDate(toDate)}`
      : 'All time';

    const fileBase = `DEM-Entries-${fromDate || 'all'}-to-${toDate || 'all'}`;
    const stats = calcStats(entries);

    if (format === 'excel') return await generateExcel(entries, dateLabel, fileBase, stats);
    return await generatePDF(entries, dateLabel, fileBase, stats);
  } catch (err) {
    console.error('[entries/export]', err);
    return NextResponse.json({ message: 'Export failed' }, { status: 500 });
  }
}

// ─── Excel ────────────────────────────────────────────────────────────────────

async function generateExcel(
  entries: any[], dateLabel: string, fileBase: string, stats: Stats,
): Promise<NextResponse> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Discipline Escalation Matrix – DOPA Coaching';
  wb.created = new Date();

  buildEntriesSheet(wb, entries, dateLabel, stats);
  buildSummarySheet(wb, entries, dateLabel, stats);

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

// Shared ARGB palettes
const XL = {
  navy:       'FF0F2942',
  navyMid:    'FF1E4060',
  navyLight:  'FF2C5F85',
  white:      'FFFFFFFF',
  gray50:     'FFF8FAFC',
  gray100:    'FFF1F5F9',
  gray400:    'FF9CA3AF',
  gray600:    'FF4B5563',
  gray900:    'FF111827',
  altRow:     'FFF0F4F8',
  highFg:     'FFDC2626',
  highBg:     'FFFEF2F2',
  mediumFg:   'FFD97706',
  mediumBg:   'FFFFFBEB',
  lowFg:      'FF16A34A',
  lowBg:      'FFF0FDF4',
  l1Fg:       'FF3B82F6',
  l1Bg:       'FFEFF6FF',
  l2Fg:       'FFF59E0B',
  l2Bg:       'FFFFFBEB',
  l3Fg:       'FFEF4444',
  l3Bg:       'FFFEF2F2',
};

function xlFill(argb: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

function xlBorder(style: ExcelJS.BorderStyle = 'thin', argb = 'FFD1D5DB'): Partial<ExcelJS.Borders> {
  const b = { style, color: { argb } } as ExcelJS.Border;
  return { top: b, bottom: b, left: b, right: b };
}

function xlHairBorder(argb = 'FFE5E7EB'): Partial<ExcelJS.Borders> {
  const b: ExcelJS.Border = { style: 'hair', color: { argb } };
  return { top: b, bottom: b, left: b, right: b };
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

// ─── PDF ──────────────────────────────────────────────────────────────────────

async function generatePDF(
  entries: any[], dateLabel: string, fileBase: string, stats: Stats,
): Promise<NextResponse> {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40, autoFirstPage: true });
  doc.registerFont('Body',         FONT_LATIN_REGULAR);
  doc.registerFont('Body-Bold',    FONT_LATIN_BOLD);
  doc.registerFont('BodyMl',       FONT_ML_REGULAR);
  doc.registerFont('BodyMl-Bold',  FONT_ML_BOLD);

  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));
  const done = new Promise<void>(resolve => doc.on('end', resolve));

  const PAGE_W        = 841.89;
  const PAGE_H        = 595.28;
  const M             = 40;           // left/right margin
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
       .text('Discipline Escalation Matrix', M, 36, { width: usableW * 0.6, lineBreak: false });

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

  // ── Page 2+ mini-header ────────────────────────────────────────────────
  const drawContinuationHeader = (): number => {
    doc.rect(0, 0, PAGE_W, 24).fill('#0f2942');
    doc.font('Body-Bold').fontSize(8.5).fillColor('#ffffff')
       .text('Discipline Entries Report (continued)', M, 8, { lineBreak: false });
    doc.font('Body').fontSize(7.5).fillColor('#7fa8c8')
       .text('DOPA Coaching', M, 8, { width: usableW, align: 'right', lineBreak: false });
    return 28; // y where table starts
  };

  // ── Table header ───────────────────────────────────────────────────────
  const drawTableHeader = (y: number) => {
    // Header row bg
    doc.rect(M, y, usableW, HDR_H).fill('#1e4060');
    // Subtle top accent line
    doc.rect(M, y, usableW, 2).fill('#3b82f6');

    let x = M;
    for (const col of cols) {
      doc.font('Body-Bold').fontSize(7.5).fillColor('#ffffff')
         .text(col.label, x + 4, y + 9, { width: col.w - 6, lineBreak: false });
      x += col.w;
    }
    // Column dividers in header
    x = M;
    for (let i = 0; i < cols.length - 1; i++) {
      x += cols[i].w;
      doc.moveTo(x, y + 4).lineTo(x, y + HDR_H - 4)
         .strokeColor('#2c5f85').lineWidth(0.5).stroke();
    }
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

  // ── Footer ─────────────────────────────────────────────────────────────
  const drawFooter = (pageNum: number) => {
    const fy = PAGE_H - 24;
    doc.moveTo(M, fy).lineTo(M + usableW, fy)
       .strokeColor('#e2e8f0').lineWidth(0.5).stroke();
    doc.font('Body').fontSize(7).fillColor('#9ca3af')
       .text('DOPA Coaching · Discipline Escalation Matrix · Confidential', M, fy + 4, { lineBreak: false });
    doc.font('Body').fontSize(7).fillColor('#9ca3af')
       .text(`Page ${pageNum}`, M, fy + 4, { width: usableW, align: 'right', lineBreak: false });
  };

  // ── Render ─────────────────────────────────────────────────────────────
  let pageNum = 1;
  let tableTop = drawPage1Header();
  drawTableHeader(tableTop);
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
      tableTop = drawContinuationHeader();
      drawTableHeader(tableTop);
      y = tableTop + HDR_H;
    }
    drawDataRow(entries[i], i, y);
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
