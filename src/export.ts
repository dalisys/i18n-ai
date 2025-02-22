import fs from "fs";
import path from "path";
import { flattenObject } from "./utils/flatten";
import { TranslationConfig } from "./types";

interface ExportOptions {
  /**
   * The output file path for the CSV
   * @default './translations-export.csv'
   */
  outputPath?: string;

  /**
   * The delimiter to use in the CSV
   * @default ','
   */
  delimiter?: string;

  /**
   * Whether to include metadata columns (e.g., last modified date)
   * @default false
   */
  includeMetadata?: boolean;
}

/**
 * Exports all translations to a CSV file
 * CSV Structure:
 * - First column: Translation key (flattened with dots)
 * - Following columns: One column per language
 * - Optional metadata columns if includeMetadata is true
 */
export async function exportTranslationsToCSV(
  config: TranslationConfig,
  options: ExportOptions = {}
): Promise<void> {
  // Merge options with config file settings
  const {
    outputPath = config.export?.outputPath || "./translations-export.csv",
    delimiter = config.export?.delimiter || ",",
    includeMetadata = config.export?.includeMetadata || false,
  } = options;

  // Read source file
  const sourceContent = JSON.parse(
    fs.readFileSync(config.source.path, "utf-8")
  );
  const flattenedSource = flattenObject(sourceContent);
  const allKeys = Object.keys(flattenedSource);

  // Read all target files
  const translations: Record<string, Record<string, string>> = {
    [config.source.code]: flattenedSource,
  };

  for (const target of config.targets) {
    try {
      if (fs.existsSync(target.path)) {
        const targetContent = JSON.parse(fs.readFileSync(target.path, "utf-8"));
        translations[target.code] = flattenObject(targetContent);
      } else {
        console.warn(`Warning: Target file not found: ${target.path}`);
        translations[target.code] = {};
      }
    } catch (error) {
      console.error(`Error reading target file ${target.path}:`, error);
      translations[target.code] = {};
    }
  }

  // Prepare CSV header
  const languages = [config.source.code, ...config.targets.map((t) => t.code)];
  const headerRow = ["Key", ...languages];

  if (includeMetadata) {
    headerRow.push("Last Modified");
  }

  // Prepare CSV rows
  const rows = [headerRow.join(delimiter)];

  for (const key of allKeys) {
    const row = [
      // Escape the key if it contains the delimiter
      key.includes(delimiter) ? `"${key}"` : key,
      // Add translations for each language
      ...languages.map((lang) => {
        const value = translations[lang]?.[key] || "";
        // Escape the value if it contains the delimiter or newlines
        return value.includes(delimiter) || value.includes("\n")
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      }),
    ];

    if (includeMetadata) {
      const sourceStats = fs.statSync(config.source.path);
      row.push(sourceStats.mtime.toISOString());
    }

    rows.push(row.join(delimiter));
  }

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write CSV file
  fs.writeFileSync(outputPath, rows.join("\n"), "utf-8");

  console.log(`Translations exported to: ${outputPath}`);
  console.log(`Total keys: ${allKeys.length}`);
  console.log(`Languages: ${languages.join(", ")}`);
}
