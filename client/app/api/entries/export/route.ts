import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/server/db';
import Entry from '@/lib/server/models/Entry';
import '@/lib/server/models/Staff';
import '@/lib/server/models/Batch';
import { getAuthUser } from '@/lib/server/auth';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';

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

function parseDate(val: string | null): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function remarkLabel(remarkId: string, customRemark?: string): string {
  if (remarkId === 'other' && customRemark) return customRemark;
  return REMARK_LABELS[remarkId] || remarkId;
}

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
    const sort = sp.get('sort') || 'newest';

    if (format !== 'pdf' && format !== 'excel') {
      return NextResponse.json({ message: 'Invalid format. Use pdf or excel.' }, { status: 400 });
    }

    const filter: Record<string, unknown> = {};
    const from = parseDate(fromDate);
    const to = parseDate(toDate);
    if (from || to) {
      filter.createdAt = {
        ...(from ? { $gte: from } : {}),
        ...(to ? { $lte: new Date(to.getTime() + 86399999) } : {}),
      };
    }

    const sortOption: Record<string, 1 | -1> = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

    const entries = await Entry.find(filter)
      .populate({ path: 'studentId', select: 'fullName registerNumber batchId', populate: { path: 'batchId', select: 'name' } })
      .populate('staffId', 'fullName username')
      .sort(sortOption)
      .lean();

    const dateLabel =
      fromDate && toDate ? `${fmtDate(fromDate)} – ${fmtDate(toDate)}`
      : fromDate         ? `From ${fmtDate(fromDate)}`
      : toDate           ? `Until ${fmtDate(toDate)}`
      : 'All time';

    const fileBase = `entries-${fromDate || 'all'}-to-${toDate || 'all'}`;

    if (format === 'excel') return generateExcel(entries, dateLabel, fileBase);
    return await generatePDF(entries, dateLabel, fileBase);
  } catch (err) {
    console.error('[entries/export]', err);
    return NextResponse.json({ message: 'Export failed' }, { status: 500 });
  }
}

function generateExcel(entries: any[], dateLabel: string, fileBase: string): NextResponse {
  const rows = entries.map((e, i) => ({
    '#': i + 1,
    'Date': fmtDate(e.createdAt),
    'Student Name': e.studentId?.fullName || '—',
    'Register No': e.studentId?.registerNumber || '—',
    'Batch': (e.studentId?.batchId as any)?.name || '—',
    'Remark': remarkLabel(e.remarkId, e.customRemark),
    'Severity': e.severity,
    'Level': `Level ${e.escalationLevel}`,
    'Reported By': e.staffId?.fullName || '—',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ['Discipline Entries Report'],
    [`Date range: ${dateLabel}`],
    [`Generated: ${new Date().toLocaleString('en-IN')}   Total: ${entries.length}`],
    [],
  ]);
  XLSX.utils.sheet_add_json(ws, rows, { origin: 'A5' });
  ws['!cols'] = [
    { wch: 5 }, { wch: 14 }, { wch: 24 }, { wch: 15 },
    { wch: 18 }, { wch: 38 }, { wch: 10 }, { wch: 10 }, { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Entries');

  const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new NextResponse(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileBase}.xlsx"`,
    },
  });
}

async function generatePDF(entries: any[], dateLabel: string, fileBase: string): Promise<NextResponse> {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 });
  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));
  const done = new Promise<void>(resolve => doc.on('end', resolve));

  const PAGE_W = 841.89;
  const MARGIN = 40;
  const usableW = PAGE_W - MARGIN * 2;
  const PAGE_H = 595.28;
  const ROW_H = 22;
  const HDR_H = 26;

  const cols = [
    { label: '#',           w: 28  },
    { label: 'Date',        w: 82  },
    { label: 'Student',     w: 125 },
    { label: 'Reg. No',     w: 75  },
    { label: 'Batch',       w: 85  },
    { label: 'Remark',      w: 175 },
    { label: 'Severity',    w: 58  },
    { label: 'Level',       w: 40  },
    { label: 'Reported By', w: 94  },
  ];

  const drawHeader = (y: number) => {
    doc.rect(MARGIN, y, usableW, HDR_H).fill('#0f2942');
    let x = MARGIN;
    for (const col of cols) {
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff')
         .text(col.label, x + 4, y + 8, { width: col.w - 6, lineBreak: false });
      x += col.w;
    }
  };

  const drawRow = (entry: any, idx: number, y: number) => {
    if (idx % 2 === 0) doc.rect(MARGIN, y, usableW, ROW_H).fill('#f8fafc');
    doc.moveTo(MARGIN, y + ROW_H).lineTo(MARGIN + usableW, y + ROW_H)
       .strokeColor('#e5e7eb').lineWidth(0.5).stroke();

    const sevColor = entry.severity === 'high' ? '#dc2626'
                   : entry.severity === 'medium' ? '#d97706' : '#16a34a';

    const vals = [
      String(idx + 1),
      fmtDate(entry.createdAt),
      entry.studentId?.fullName || '—',
      entry.studentId?.registerNumber || '—',
      (entry.studentId?.batchId as any)?.name || '—',
      remarkLabel(entry.remarkId, entry.customRemark),
      entry.severity,
      `L${entry.escalationLevel}`,
      entry.staffId?.fullName || '—',
    ];

    let x = MARGIN;
    for (let i = 0; i < cols.length; i++) {
      const color = i === 6 ? sevColor : '#1f2937';
      const bold = i === 6;
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica')
         .fontSize(7.5)
         .fillColor(color)
         .text(vals[i], x + 4, y + 7, { width: cols[i].w - 7, lineBreak: false });
      x += cols[i].w;
    }
  };

  // Page title
  doc.font('Helvetica-Bold').fontSize(15).fillColor('#0f2942')
     .text('Discipline Entries Report', MARGIN, MARGIN);
  doc.font('Helvetica').fontSize(9).fillColor('#6b7280')
     .text(
       `Date range: ${dateLabel}  ·  Total: ${entries.length} entries  ·  Generated: ${new Date().toLocaleString('en-IN')}`,
       MARGIN, MARGIN + 22,
     );

  let y = MARGIN + 48;
  drawHeader(y);
  y += HDR_H;

  for (let i = 0; i < entries.length; i++) {
    if (y + ROW_H > PAGE_H - MARGIN) {
      doc.addPage();
      y = MARGIN;
      drawHeader(y);
      y += HDR_H;
    }
    drawRow(entries[i], i, y);
    y += ROW_H;
  }

  if (entries.length === 0) {
    doc.font('Helvetica').fontSize(11).fillColor('#9ca3af')
       .text('No entries found for the selected range.', MARGIN, y + 20, { align: 'center', width: usableW });
  }

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
