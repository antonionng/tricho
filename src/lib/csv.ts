/** One CSV cell, safe to open in a spreadsheet: quoted when needed and never read as a formula. */
export function csvCell(value: string | number | boolean | null | undefined) {
  let v = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function csvRow(values: (string | number | boolean | null | undefined)[]) {
  return values.map(csvCell).join(",");
}
