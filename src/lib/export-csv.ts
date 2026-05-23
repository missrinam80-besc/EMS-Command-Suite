function toCsvCell(value: unknown): string {
  const text = String(value ?? "");
  const escaped = text.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function toCsv(rows: Array<Record<string, unknown>>, columns: string[]): string {
  const header = columns.map((column) => toCsvCell(column)).join(",");
  const lines = rows.map((row) => columns.map((column) => toCsvCell(row[column])).join(","));
  return [header, ...lines].join("\n");
}
