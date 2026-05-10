import type jsPDF from 'jspdf';
import { format, parseISO } from 'date-fns';
import type { ExportBlock, ExportOptions } from './excel';
import { USER_INFO } from './constants';

type LoadedDeps = {
  default: typeof jsPDF;
};

let jspdfPromise: Promise<{ jsPDF: typeof jsPDF; autoTable: any }> | null = null;
async function loadJsPDF() {
  if (!jspdfPromise) {
    jspdfPromise = (async () => {
      const jspdfMod = (await import('jspdf')) as unknown as LoadedDeps & {
        jsPDF?: typeof jsPDF;
      };
      const autoTableMod: any = await import('jspdf-autotable');
      const jsPDFClass = (jspdfMod.default ?? jspdfMod.jsPDF) as typeof jsPDF;
      const autoTableFn = autoTableMod.default ?? autoTableMod;
      return { jsPDF: jsPDFClass, autoTable: autoTableFn };
    })();
  }
  return jspdfPromise;
}

const COLOR = {
  brand: [124, 58, 237] as [number, number, number],
  brandDark: [88, 28, 135] as [number, number, number],
  headerBg: [30, 41, 59] as [number, number, number],
  subHeaderBg: [51, 65, 85] as [number, number, number],
  tableHeader: [226, 232, 240] as [number, number, number],
  tableHeaderText: [15, 23, 42] as [number, number, number],
  rowAlt: [248, 250, 252] as [number, number, number],
  text: [15, 23, 42] as [number, number, number],
  muted: [71, 85, 105] as [number, number, number],
  footer: [185, 28, 28] as [number, number, number],
  footerBg: [254, 242, 242] as [number, number, number],
  totalAccent: [251, 191, 36] as [number, number, number],
};

const DATA_TARGET_ROWS = 16;

function drawLogo(doc: jsPDF, x: number, y: number, size = 18) {
  doc.setFillColor(...COLOR.brand);
  doc.roundedRect(x, y, size, size, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  const textWidth = doc.getTextWidth('3TC');
  doc.text('3TC', x + size / 2 - textWidth / 2, y + size / 2 + 1.5);
}

async function drawBlock(
  doc: jsPDF,
  autoTable: any,
  startY: number,
  block: ExportBlock,
  documentDate: Date,
  pageWidth: number,
  marginX: number,
): Promise<number> {
  let y = startY;
  const contentWidth = pageWidth - 2 * marginX;
  const logoSize = 16;
  const logoX = marginX;
  const headerLeft = logoX + logoSize + 3;
  const headerWidth = contentWidth - logoSize - 3;

  // ----- Banner principal -----
  const headerH = 12;
  doc.setFillColor(...COLOR.headerBg);
  doc.rect(headerLeft, y, headerWidth, headerH, 'F');
  drawLogo(doc, logoX, y, logoSize);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(
    `${USER_INFO.empresa} "${USER_INFO.empresaCorta}"`,
    headerLeft + headerWidth / 2,
    y + headerH / 2 + 1.5,
    { align: 'center' },
  );
  y += headerH;

  // ----- Sub-banner: CONTROL DE HORAS EXTRAS (range) -----
  const subH = 8;
  doc.setFillColor(...COLOR.subHeaderBg);
  doc.rect(headerLeft, y, headerWidth, subH, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(
    `CONTROL DE HORAS EXTRAS ${block.rangeLabel}`,
    headerLeft + headerWidth / 2,
    y + subH / 2 + 1.5,
    { align: 'center' },
  );
  y += subH;

  // ----- Metadata row -----
  const metaH = 7;
  const metaCols = [
    ['Código:', USER_INFO.formato],
    ['Fecha:', format(documentDate, 'dd/MM/yyyy')],
    ['Versión:', USER_INFO.version],
    ['Página:', '1/1'],
  ];
  const metaColW = contentWidth / metaCols.length;
  doc.setFillColor(241, 245, 249);
  doc.rect(marginX, y, contentWidth, metaH, 'F');
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.2);
  metaCols.forEach((col, i) => {
    const xCol = marginX + i * metaColW;
    if (i > 0) {
      doc.line(xCol, y, xCol, y + metaH);
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR.muted);
    doc.text(col[0], xCol + 2, y + metaH / 2 + 1);
    const labelW = doc.getTextWidth(col[0]);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR.text);
    doc.text(col[1], xCol + 2 + labelW + 1.5, y + metaH / 2 + 1);
  });
  doc.rect(marginX, y, contentWidth, metaH);
  y += metaH;

  // ----- NOMBRE -----
  const nameH = 8;
  doc.setFillColor(255, 255, 255);
  doc.rect(marginX, y, contentWidth, nameH, 'F');
  doc.rect(marginX, y, contentWidth, nameH);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR.muted);
  doc.text('NOMBRE:', marginX + 2.5, y + nameH / 2 + 1);
  const nombreLabelW = doc.getTextWidth('NOMBRE:');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLOR.text);
  doc.text(USER_INFO.nombre, marginX + 2.5 + nombreLabelW + 2, y + nameH / 2 + 1);
  y += nameH;

  // ----- CC -----
  doc.rect(marginX, y, contentWidth, nameH, 'F');
  doc.rect(marginX, y, contentWidth, nameH);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR.muted);
  doc.text('CC:', marginX + 2.5, y + nameH / 2 + 1);
  const ccLabelW = doc.getTextWidth('CC:');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLOR.text);
  doc.text(USER_INFO.cedulaFormatted, marginX + 2.5 + ccLabelW + 2, y + nameH / 2 + 1);
  y += nameH;

  // ----- Tabla con autoTable -----
  const dataRowsToDraw = Math.max(block.entries.length, DATA_TARGET_ROWS);
  const tableBody: string[][] = [];
  for (let i = 0; i < dataRowsToDraw; i++) {
    const e = block.entries[i];
    if (e) {
      tableBody.push([
        format(parseISO(e.fecha), 'dd/MM/yyyy'),
        e.hora_inicio.slice(0, 5),
        e.hora_final.slice(0, 5),
        Number(e.total_horas).toFixed(2),
        e.manifiesto ?? '',
        e.conductor || USER_INFO.conductorDefault,
        e.placa ?? '',
        '',
      ]);
    } else {
      tableBody.push(['', '', '', '', '', '', '', '']);
    }
  }

  autoTable(doc, {
    head: [[
      'FECHA',
      'HORA DE\nINICIO',
      'HORA\nFINAL',
      'TOTAL\nHORAS',
      'MANIFIESTO',
      'CONDUCTOR',
      'PLACA',
      'FIRMA DE\nAPROBACIÓN',
    ]],
    body: tableBody,
    startY: y,
    margin: { left: marginX, right: marginX },
    tableWidth: contentWidth,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: { top: 1.5, right: 1.5, bottom: 1.5, left: 1.5 },
      lineColor: COLOR.muted,
      lineWidth: 0.15,
      textColor: COLOR.text,
      halign: 'center',
      valign: 'middle',
      minCellHeight: 6.5,
      font: 'helvetica',
    },
    headStyles: {
      fillColor: COLOR.tableHeader,
      textColor: COLOR.tableHeaderText,
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center',
      valign: 'middle',
      minCellHeight: 10,
      lineColor: COLOR.muted,
      lineWidth: 0.2,
    },
    alternateRowStyles: {
      fillColor: COLOR.rowAlt,
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 18 },
      2: { cellWidth: 17 },
      3: { cellWidth: 17, fontStyle: 'bold', textColor: COLOR.brandDark },
      4: { cellWidth: 22 },
      5: { cellWidth: 'auto' },
      6: { cellWidth: 20 },
      7: { cellWidth: 30 },
    },
  });

  // jsPDF-autotable stores the last Y on the doc object
  y = (doc as any).lastAutoTable.finalY;

  // ----- Total row -----
  const totalH = 9;
  doc.setFillColor(...COLOR.headerBg);
  doc.rect(marginX, y, contentWidth, totalH, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TOTAL HORAS DEL PERIODO', marginX + contentWidth * 0.42, y + totalH / 2 + 1.5, {
    align: 'right',
  });
  const totalSum = block.entries.reduce(
    (acc, e) => acc + Number(e.total_horas),
    0,
  );
  doc.setTextColor(...COLOR.totalAccent);
  doc.setFontSize(12);
  doc.text(
    totalSum.toFixed(2),
    marginX + contentWidth * 0.49,
    y + totalH / 2 + 2,
    { align: 'left' },
  );
  y += totalH;

  // ----- Footer note -----
  const footH = 7;
  doc.setFillColor(...COLOR.footerBg);
  doc.rect(marginX, y, contentWidth, footH, 'F');
  doc.setDrawColor(...COLOR.muted);
  doc.rect(marginX, y, contentWidth, footH);
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR.footer);
  doc.text(
    '*** ENTREGAR ESTE FORMATO POR FAVOR ANTES DEL 13 Y 28 DE CADA MES ***',
    marginX + contentWidth / 2,
    y + footH / 2 + 1.2,
    { align: 'center' },
  );
  y += footH;

  return y;
}

export async function generatePDF(opts: ExportOptions): Promise<Blob> {
  const { jsPDF: jsPDFClass, autoTable } = await loadJsPDF();
  const doc = new jsPDFClass({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 10;
  let y = 12;

  for (let i = 0; i < opts.blocks.length; i++) {
    const blockHeightEstimate = 65 + Math.max(opts.blocks[i].entries.length, DATA_TARGET_ROWS) * 7;
    if (y + blockHeightEstimate > pageHeight - 8 && i > 0) {
      doc.addPage();
      y = 12;
    }
    y = await drawBlock(doc, autoTable, y, opts.blocks[i], opts.documentDate, pageWidth, marginX);
    y += 4; // gap between blocks
  }

  const blob = doc.output('blob');
  return blob;
}

export async function downloadPDF(opts: ExportOptions) {
  const blob = await generatePDF(opts);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const filename = opts.filename.replace(/\.xlsx?$/i, '') + '.pdf';
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}
