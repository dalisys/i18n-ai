/**
 * A lightweight CSV parser that handles basic CSV format
 * - Supports custom delimiters
 * - Handles quoted fields with escaped quotes
 * - Skips empty lines
 */

export function parseCSV(content: string, delimiter: string = ","): string[][] {
  const lines = content.split(/\r?\n/);
  const result: string[][] = [];

  for (const line of lines) {
    if (!line.trim()) continue; // Skip empty lines

    const fields: string[] = [];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Handle escaped quotes
          field += '"';
          i++;
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        // End of field
        fields.push(field);
        field = "";
      } else {
        field += char;
      }
    }

    // Add the last field
    fields.push(field);
    result.push(fields);
  }

  return result;
}
