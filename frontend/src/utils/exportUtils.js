export function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCsv(headers, rows) {
  const headerLine = headers.map(csvEscape).join(',');
  const body = rows.map((row) => row.map(csvEscape).join(',')).join('\n');
  return `${headerLine}\n${body}`;
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function pdfEscape(text) {
  return String(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

export function createSimplePdf(lines, { title } = {}) {
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 48;
  const lineHeight = 16;
  const fontSize = 12;

  const finalLines = title ? [title, '', ...lines] : lines;
  const maxLines = Math.floor((pageHeight - margin * 2) / lineHeight);
  const visibleLines = finalLines.slice(0, maxLines);

  let content = `BT\n/F1 ${fontSize} Tf\n`;
  visibleLines.forEach((line, index) => {
    const y = pageHeight - margin - index * lineHeight;
    content += `1 0 0 1 ${margin} ${y} Tm (${pdfEscape(line)}) Tj\n`;
  });
  content += 'ET';

  const stream = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj',
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj`,
    `4 0 obj\n${stream}\nendobj`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj',
  ];

  const encoder = new TextEncoder();
  const byteLength = (str) => encoder.encode(str).length;

  let offset = 0;
  const header = '%PDF-1.3\n';
  offset += byteLength(header);

  const offsets = [];
  let body = '';
  objects.forEach((obj) => {
    offsets.push(offset);
    body += `${obj}\n`;
    offset += byteLength(`${obj}\n`);
  });

  const xrefOffset = offset;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((off) => {
    xref += `${String(off).padStart(10, '0')} 00000 n \n`;
  });

  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  const pdf = header + body + xref + trailer;

  return new Blob([pdf], { type: 'application/pdf' });
}
