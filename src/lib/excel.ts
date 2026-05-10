import type ExcelJSType from 'exceljs';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { HoursEntry } from './supabase';
import { USER_INFO } from './constants';

type ExcelJSWorkbook = ExcelJSType.Workbook;
type ExcelJSWorksheet = ExcelJSType.Worksheet;
type ExcelJSCell = ExcelJSType.Cell;
type ExcelJSFill = ExcelJSType.Fill;
type ExcelJSBorderStyle = ExcelJSType.BorderStyle;

let excelJSPromise: Promise<typeof ExcelJSType> | null = null;
async function loadExcelJS(): Promise<typeof ExcelJSType> {
  if (!excelJSPromise) {
    excelJSPromise = import('exceljs').then((m) => m.default ?? m);
  }
  return excelJSPromise;
}

export type ExportBlock = {
  label: string;
  rangeLabel: string;
  entries: HoursEntry[];
  emptyRows?: number;
};

export type ExportOptions = {
  filename: string;
  documentDate: Date;
  blocks: ExportBlock[];
};

const COLS = [
  { key: 'fecha', header: 'FECHA', width: 12 },
  { key: 'hora_inicio', header: 'HORA DE INICIO', width: 14 },
  { key: 'hora_final', header: 'HORA FINAL', width: 13 },
  { key: 'total_horas', header: 'TOTAL HORAS', width: 13 },
  { key: 'manifiesto', header: 'MANIFIESTO', width: 14 },
  { key: 'conductor', header: 'CONDUCTOR', width: 18 },
  { key: 'placa', header: 'PLACA', width: 12 },
  { key: 'firma', header: 'FIRMA DE APROBACION', width: 22 },
] as const;

const TOTAL_COLS = COLS.length + 1; // +1 for logo column
const DATA_TARGET_ROWS = 16; // visual rows per block (filled or empty)

const COLORS = {
  headerBg: 'FF1E293B',
  headerText: 'FFFFFFFF',
  subHeaderBg: 'FF334155',
  brandAccent: 'FF7C3AED',
  tableHeaderBg: 'FFE2E8F0',
  tableHeaderText: 'FF0F172A',
  rowAlt: 'FFF8FAFC',
  border: 'FF94A3B8',
  borderDark: 'FF475569',
  footer: 'FFB91C1C',
};

function applyBorder(
  cell: ExcelJSCell,
  color = COLORS.border,
  style: ExcelJSBorderStyle = 'thin',
) {
  cell.border = {
    top: { style, color: { argb: color } },
    left: { style, color: { argb: color } },
    bottom: { style, color: { argb: color } },
    right: { style, color: { argb: color } },
  };
}

async function drawBlock(
  ws: ExcelJSWorksheet,
  startRow: number,
  block: ExportBlock,
  documentDate: Date,
): Promise<number> {
  let row = startRow;

  // ============ HEADER: Logo cell (merged 3 rows x 1 col) ============
  ws.mergeCells(row, 1, row + 2, 1);
  const logoCell = ws.getCell(row, 1);
  logoCell.value = {
    richText: [
      { text: '3TC', font: { bold: true, size: 26, color: { argb: 'FFFFFFFF' }, name: 'Arial Black' } },
      { text: '\n', font: { size: 6 } },
      { text: 'TRANSPORTE', font: { size: 6, color: { argb: 'FFE2E8F0' }, bold: true } },
    ],
  };
  logoCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  logoCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.brandAccent },
  };
  applyBorder(logoCell, COLORS.borderDark, 'medium');

  // Title (merged across data cols)
  ws.mergeCells(row, 2, row, TOTAL_COLS);
  const titleCell = ws.getCell(row, 2);
  titleCell.value = `${USER_INFO.empresa} "${USER_INFO.empresaCorta}"`;
  titleCell.font = { bold: true, size: 12, color: { argb: COLORS.headerText } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.headerBg },
  };
  applyBorder(titleCell, COLORS.borderDark, 'medium');
  ws.getRow(row).height = 26;
  row++;

  // Sub-title with block label
  ws.mergeCells(row, 2, row, TOTAL_COLS);
  const subTitleCell = ws.getCell(row, 2);
  subTitleCell.value = `CONTROL DE HORAS EXTRAS ${block.rangeLabel}`;
  subTitleCell.font = { bold: true, size: 11, color: { argb: COLORS.headerText } };
  subTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  subTitleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.subHeaderBg },
  };
  applyBorder(subTitleCell, COLORS.borderDark);
  ws.getRow(row).height = 20;
  row++;

  // Metadata row: Codigo | Fecha | Version | Pagina
  const metaCells: Array<[string, string]> = [
    ['Código:', USER_INFO.formato],
    ['Fecha:', format(documentDate, 'dd/MM/yyyy')],
    ['Versión:', USER_INFO.version],
    ['Página:', '1/1'],
  ];
  const metaSpan = Math.floor((TOTAL_COLS - 1) / metaCells.length);
  let mc = 2;
  metaCells.forEach(([label, val], i) => {
    const isLast = i === metaCells.length - 1;
    const endCol = isLast ? TOTAL_COLS : mc + metaSpan - 1;
    ws.mergeCells(row, mc, row, endCol);
    const cell = ws.getCell(row, mc);
    cell.value = {
      richText: [
        { text: `${label} `, font: { bold: true, size: 9, color: { argb: 'FF334155' } } },
        { text: val, font: { size: 9, color: { argb: 'FF0F172A' } } },
      ],
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' },
    };
    applyBorder(cell);
    mc = endCol + 1;
  });
  ws.getRow(row).height = 18;
  row++;

  // NOMBRE row (full width)
  ws.mergeCells(row, 1, row, TOTAL_COLS);
  const nombreCell = ws.getCell(row, 1);
  nombreCell.value = {
    richText: [
      { text: 'NOMBRE:  ', font: { bold: true, size: 10, color: { argb: 'FF334155' } } },
      { text: USER_INFO.nombre, font: { size: 10, color: { argb: 'FF0F172A' }, bold: true } },
    ],
  };
  nombreCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  nombreCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
  applyBorder(nombreCell);
  ws.getRow(row).height = 20;
  row++;

  // CC row (full width)
  ws.mergeCells(row, 1, row, TOTAL_COLS);
  const ccCell = ws.getCell(row, 1);
  ccCell.value = {
    richText: [
      { text: 'CC:  ', font: { bold: true, size: 10, color: { argb: 'FF334155' } } },
      { text: USER_INFO.cedulaFormatted, font: { size: 10, color: { argb: 'FF0F172A' }, bold: true } },
    ],
  };
  ccCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ccCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
  applyBorder(ccCell);
  ws.getRow(row).height = 20;
  row++;

  // Table column headers
  const tableHeaderRow = ws.getRow(row);
  COLS.forEach((col, i) => {
    const cell = ws.getCell(row, i + 2);
    cell.value = col.header;
    cell.font = { bold: true, size: 9, color: { argb: COLORS.tableHeaderText } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.tableHeaderBg },
    };
    applyBorder(cell, COLORS.borderDark);
  });
  // Empty first column for header alignment
  const firstHeader = ws.getCell(row, 1);
  firstHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.tableHeaderBg },
  };
  applyBorder(firstHeader, COLORS.borderDark);
  tableHeaderRow.height = 32;
  row++;

  // Data rows
  const dataRowsToDraw = Math.max(block.entries.length, DATA_TARGET_ROWS);
  for (let i = 0; i < dataRowsToDraw; i++) {
    const entry = block.entries[i];
    const isAlt = i % 2 === 1;
    const rowFill: ExcelJSFill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: isAlt ? COLORS.rowAlt : 'FFFFFFFF' },
    };

    // Empty first column (logo column space)
    const firstCell = ws.getCell(row, 1);
    firstCell.fill = rowFill;
    applyBorder(firstCell);

    const values: (string | number)[] = entry
      ? [
          format(parseISO(entry.fecha), 'dd/MM/yyyy'),
          entry.hora_inicio.slice(0, 5),
          entry.hora_final.slice(0, 5),
          Number(entry.total_horas),
          entry.manifiesto ?? '',
          entry.conductor || USER_INFO.conductorDefault,
          entry.placa ?? '',
          '',
        ]
      : ['', '', '', '', '', '', '', ''];

    values.forEach((val, ci) => {
      const cell = ws.getCell(row, ci + 2);
      cell.value = val;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.font = { size: 10, color: { argb: 'FF0F172A' } };
      cell.fill = rowFill;
      applyBorder(cell);
      if (ci === 3 && typeof val === 'number') {
        cell.numFmt = '0.00';
        cell.font = { size: 10, bold: true, color: { argb: 'FF7C3AED' } };
      }
    });

    ws.getRow(row).height = 22;
    row++;
  }

  // Totals row
  ws.mergeCells(row, 1, row, 4);
  const totalLabel = ws.getCell(row, 1);
  totalLabel.value = 'TOTAL HORAS DEL PERIODO';
  totalLabel.font = { bold: true, size: 10, color: { argb: COLORS.headerText } };
  totalLabel.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
  totalLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
  applyBorder(totalLabel, COLORS.borderDark);

  const totalSum = block.entries.reduce(
    (acc, e) => acc + Number(e.total_horas),
    0,
  );
  const totalCell = ws.getCell(row, 5);
  totalCell.value = totalSum;
  totalCell.numFmt = '0.00';
  totalCell.font = { bold: true, size: 12, color: { argb: 'FFFBBF24' } };
  totalCell.alignment = { vertical: 'middle', horizontal: 'center' };
  totalCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
  applyBorder(totalCell, COLORS.borderDark);

  ws.mergeCells(row, 6, row, TOTAL_COLS);
  const totalSpace = ws.getCell(row, 6);
  totalSpace.value = '';
  totalSpace.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
  applyBorder(totalSpace, COLORS.borderDark);
  ws.getRow(row).height = 24;
  row++;

  // Footer note
  ws.mergeCells(row, 1, row, TOTAL_COLS);
  const footerCell = ws.getCell(row, 1);
  footerCell.value = '*** ENTREGAR ESTE FORMATO POR FAVOR ANTES DEL 13 Y 28 DE CADA MES ***';
  footerCell.font = { bold: true, italic: true, size: 9, color: { argb: COLORS.footer } };
  footerCell.alignment = { vertical: 'middle', horizontal: 'center' };
  footerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF2F2' } };
  applyBorder(footerCell);
  ws.getRow(row).height = 20;
  row++;

  return row;
}

export async function generateXLSX(opts: ExportOptions): Promise<Blob> {
  const ExcelJS = await loadExcelJS();
  const wb: ExcelJSWorkbook = new ExcelJS.Workbook();
  wb.creator = '3TC Horas App';
  wb.created = new Date();

  const ws = wb.addWorksheet('Horas Extras', {
    pageSetup: {
      orientation: 'portrait',
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.4, right: 0.4, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2,
      },
    },
    views: [{ showGridLines: false }],
  });

  // Column widths
  ws.getColumn(1).width = 10; // logo
  COLS.forEach((col, i) => {
    ws.getColumn(i + 2).width = col.width;
  });

  let row = 1;
  for (let i = 0; i < opts.blocks.length; i++) {
    row = await drawBlock(ws, row, opts.blocks[i], opts.documentDate);
    if (i < opts.blocks.length - 1) {
      ws.getRow(row).height = 8; // spacer
      row += 2;
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export async function downloadXLSX(opts: ExportOptions) {
  const blob = await generateXLSX(opts);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = opts.filename.endsWith('.xlsx') ? opts.filename : `${opts.filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

export function periodFilename(label: string): string {
  const safe = label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `horas-cossio-${safe}.xlsx`;
}

export function quincenaLabelToRange(month: number, half: 1 | 2): string {
  const monthName = format(new Date(2024, month, 1), 'MMMM', { locale: es }).toUpperCase();
  if (half === 1) return `(01-15 ${monthName})`;
  return `(16-30 ${monthName})`;
}
