// Excel export helper. SheetJS is loaded lazily via dynamic import() so its
// weight stays out of the main bundle — admins rarely export, and we only ever
// WRITE files here (never parse untrusted input), so the parser-side advisories
// on xlsx@0.18.5 don't apply.

export interface ExportColumn<T> {
  header: string;
  /** Cell value for a row; null/undefined renders as an empty cell. */
  value: (row: T) => string | number | null | undefined;
}

export interface ExportOptions<T> {
  /** File name WITHOUT the .xlsx extension. */
  filename: string;
  sheetName?: string;
  columns: ExportColumn<T>[];
  rows: T[];
}

export async function exportToExcel<T>({
  filename,
  sheetName = "Sheet1",
  columns,
  rows,
}: ExportOptions<T>): Promise<void> {
  const XLSX = await import("xlsx");

  const header = columns.map((c) => c.header);
  const body = rows.map((r) => columns.map((c) => c.value(r) ?? ""));
  const aoa: (string | number)[][] = [header, ...body];

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Auto-size each column to its longest cell (clamped) so the sheet is readable.
  ws["!cols"] = columns.map((_, i) => {
    const longest = aoa.reduce(
      (max, row) => Math.max(max, String(row[i] ?? "").length),
      0,
    );
    return { wch: Math.min(60, Math.max(10, longest + 2)) };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/** yyyymmdd-hhmm stamp for export filenames, e.g. "20260713-0942". */
export function fileStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(
    d.getHours(),
  )}${p(d.getMinutes())}`;
}
