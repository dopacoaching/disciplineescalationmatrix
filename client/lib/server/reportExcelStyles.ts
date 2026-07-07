import ExcelJS from 'exceljs';

// Shared ARGB palette for all NERU Excel reports.
export const XL = {
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
  errFg:      'FFDC2626',
  errBg:      'FFFEF2F2',
};

export function xlFill(argb: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

export function xlBorder(style: ExcelJS.BorderStyle = 'thin', argb = 'FFD1D5DB'): Partial<ExcelJS.Borders> {
  const b = { style, color: { argb } } as ExcelJS.Border;
  return { top: b, bottom: b, left: b, right: b };
}

export function xlHairBorder(argb = 'FFE5E7EB'): Partial<ExcelJS.Borders> {
  const b: ExcelJS.Border = { style: 'hair', color: { argb } };
  return { top: b, bottom: b, left: b, right: b };
}
