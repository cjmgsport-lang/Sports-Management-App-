// Minimal CSV writer for the "Excel sheet" style export buttons across
// Administration/Sport (staff directory, trials criteria, injuries,
// recruitment, rosters). Quotes any value containing a comma, quote or
// newline; everything else is written bare.
function csvCell(value: string | number | boolean | null | undefined): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: (string | number | boolean | null | undefined)[][]): string {
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export function csvResponse(filename: string, rows: (string | number | boolean | null | undefined)[][]): Response {
  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
