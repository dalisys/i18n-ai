import fs from "fs";
import path from "path";
import { TranslationConfig } from "./types";
import { unflattenObject } from "./utils/flatten";
import { parseCSV } from "./utils/csv";

interface ImportOptions {
  /**
   * The input CSV file path
   */
  inputPath: string;

  /**
   * The delimiter used in the CSV
   * @default ','
   */
  delimiter?: string;

  /**
   * Whether to skip the first row (header)
   * @default true
   */
  skipHeader?: boolean;

  /**
   * Whether to overwrite existing translations
   * @default false
   */
  overwrite?: boolean;
}

/**
 * Imports translations from a CSV file and updates the translation files
 * Expected CSV Structure:
 * - First column: Translation key (flattened with dots)
 * - Following columns: One column per language (matching config language codes)
 */
export async function importTranslationsFromCSV(
  config: TranslationConfig,
  options: ImportOptions
): Promise<void> {
  const {
    inputPath,
    delimiter = ",",
    skipHeader = true,
    overwrite = false,
  } = options;

  if (!fs.existsSync(inputPath)) {
    throw new Error(`CSV file not found: ${inputPath}`);
  }

  // Read and parse CSV file
  const csvContent = fs.readFileSync(inputPath, "utf-8");
  const records = parseCSV(csvContent, delimiter);

  if (records.length === 0) {
    throw new Error("CSV file is empty");
  }

  // Get header row to map columns to languages
  const headerRow = skipHeader ? records[0] : null;
  const dataStartIndex = skipHeader ? 1 : 0;

  // Validate header row if present
  if (headerRow) {
    const [, ...languageCodes] = headerRow;
    const configLanguages = [
      config.source.code,
      ...config.targets.map((t) => t.code),
    ];

    // Check if all config languages are present in CSV
    const missingLanguages = configLanguages.filter(
      (lang) => !languageCodes.includes(lang)
    );
    if (missingLanguages.length > 0) {
      throw new Error(
        `Missing language columns in CSV: ${missingLanguages.join(", ")}`
      );
    }
  }

  // Process each language file
  const languages = [
    { ...config.source, index: 1 },
    ...config.targets.map((target, idx) => ({ ...target, index: idx + 2 })),
  ];

  for (const lang of languages) {
    const translations: Record<string, string> = {};
    let existingTranslations: Record<string, any> = {};

    // Read existing translations if file exists
    if (fs.existsSync(lang.path)) {
      existingTranslations = JSON.parse(fs.readFileSync(lang.path, "utf-8"));
    }

    // Process each row in CSV
    for (let i = dataStartIndex; i < records.length; i++) {
      const row = records[i];
      const key = row[0];
      const value = row[lang.index];

      if (key && value) {
        translations[key] = value;
      }
    }

    // Merge with existing translations
    const mergedTranslations = overwrite
      ? { ...existingTranslations, ...unflattenObject(translations) }
      : { ...unflattenObject(translations), ...existingTranslations };

    // Ensure output directory exists
    const outputDir = path.dirname(lang.path);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write updated translations
    fs.writeFileSync(
      lang.path,
      JSON.stringify(mergedTranslations, null, 2),
      "utf-8"
    );

    console.log(`Updated translations for ${lang.code}: ${lang.path}`);
  }

  console.log("\nCSV import completed successfully!");
}
