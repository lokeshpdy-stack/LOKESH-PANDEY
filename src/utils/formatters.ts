import { SubjectMark } from '../types/school';

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateIN(isoDate: string): string {
  if (!isoDate) return '-';
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function calculateGrade(pct: number): { grade: string; status: string } {
  if (pct >= 91) return { grade: 'A+', status: 'Distinction' };
  if (pct >= 81) return { grade: 'A', status: 'First Division' };
  if (pct >= 71) return { grade: 'B+', status: 'First Division' };
  if (pct >= 61) return { grade: 'B', status: 'First Division' };
  if (pct >= 51) return { grade: 'C', status: 'Second Division' };
  if (pct >= 36) return { grade: 'D', status: 'Pass / Promoted' };
  return { grade: 'E', status: 'Needs Improvement' };
}

export function summarizeMarks(marks: SubjectMark[]) {
  const totalMax = marks.reduce((acc, m) => acc + m.maxMarks, 0);
  const totalObtained = marks.reduce((acc, m) => acc + m.obtainedMarks, 0);
  const percentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 1000) / 10 : 0;
  const { grade, status } = calculateGrade(percentage);
  return { totalMax, totalObtained, percentage, grade, status };
}

export function downloadCSV(filename: string, headers: string[], rows: (string | number | boolean)[][]): void {
  const escapeCell = (val: string | number | boolean) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvLines = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ];

  // UTF-8 BOM ensures Microsoft Excel opens Indian names & ₹ symbols cleanly
  const csvContent = '\uFEFF' + csvLines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseCSVText(csvText: string): { headers: string[]; rows: string[][] } {
  const lines = csvText
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    return cells;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}
