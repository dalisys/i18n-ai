import fs from "fs";
import path from "path";
import {
  TranslateFilesOptions,
  TranslationConfig,
  TranslationStats,
} from "./types";
import { createProvider } from "./providers";
import { loadConfig, validateConfig } from "./config";
import { flattenObject, unflattenObject } from "./utils/flatten";

interface ChunkResult {
  key: string;
  value: string;
}

function chunkObject(
  obj: Record<string, any>,
  maxKeysPerChunk: number
): ChunkResult[][] {
  const entries = Object.entries(obj);
  const chunks: ChunkResult[][] = [];
  let currentChunk: ChunkResult[] = [];
  let currentPrefix = "";

  // Helper to get the top-level key
  const getTopLevelKey = (key: string): string => key.split(".")[0];

  for (let i = 0; i < entries.length; i++) {
    const [key, value] = entries[i];
    const topLevelKey = getTopLevelKey(key);

    // If we're starting a new chunk or continuing with the same top-level object
    if (currentChunk.length === 0 || topLevelKey === currentPrefix) {
      currentChunk.push({
        key,
        value: typeof value === "string" ? value : JSON.stringify(value),
      });
      currentPrefix = topLevelKey;
    } else if (currentChunk.length >= maxKeysPerChunk) {
      // Current chunk is full, start a new one
      chunks.push(currentChunk);
      currentChunk = [
        {
          key,
          value: typeof value === "string" ? value : JSON.stringify(value),
        },
      ];
      currentPrefix = topLevelKey;
    } else {
      // Check if adding this key would split an object
      const nextKey =
        i + 1 < entries.length ? getTopLevelKey(entries[i + 1][0]) : null;
      if (
        topLevelKey !== currentPrefix &&
        (nextKey === topLevelKey || currentChunk.length >= maxKeysPerChunk)
      ) {
        // Start a new chunk to keep the object together
        chunks.push(currentChunk);
        currentChunk = [
          {
            key,
            value: typeof value === "string" ? value : JSON.stringify(value),
          },
        ];
        currentPrefix = topLevelKey;
      } else {
        // Add to current chunk
        currentChunk.push({
          key,
          value: typeof value === "string" ? value : JSON.stringify(value),
        });
        currentPrefix = topLevelKey;
      }
    }
  }

  // Add the last chunk
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

async function translateFile(
  sourceFile: string,
  targetFile: string,
  targetLang: string,
  config: TranslationConfig
): Promise<TranslationStats> {
  const stats: TranslationStats = {
    totalKeys: 0,
    newKeys: 0,
    skippedKeys: 0,
    errors: 0,
  };

  // Read and flatten source file
  const sourceContent = fs.readFileSync(sourceFile, "utf-8");
  const sourceData = JSON.parse(sourceContent);
  const flattenedSource = flattenObject(sourceData);
  stats.totalKeys = Object.keys(flattenedSource).length;

  // Read existing translations if available
  let existingTranslations: Record<string, any> = {};
  try {
    if (fs.existsSync(targetFile)) {
      const existingContent = fs.readFileSync(targetFile, "utf-8");
      existingTranslations = flattenObject(JSON.parse(existingContent));
    }
  } catch (error) {
    console.warn(
      `Warning: Could not read existing translations from ${targetFile}`
    );
  }

  // Identify keys that need translation
  const keysToTranslate: Record<string, string> = {};
  for (const [key, value] of Object.entries(flattenedSource)) {
    if (!config.overwrite && existingTranslations[key]) {
      stats.skippedKeys++;
      continue;
    }
    keysToTranslate[key] = value;
  }

  if (Object.keys(keysToTranslate).length === 0) {
    console.log("No new keys to translate");
    return stats;
  }

  // Initialize provider
  const provider = createProvider(
    config.provider,
    process.env[`${config.provider.toUpperCase()}_API_KEY`] || "",
    config,
    config.model
  );

  const translatedChunks: Record<string, any> = {};

  if (config.translateAllAtOnce) {
    // Translate entire file at once
    try {
      console.log(
        `Translating ${
          Object.keys(keysToTranslate).length
        } keys to ${targetLang} all at once...`
      );
      const allText = Object.entries(keysToTranslate)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");
      const translatedText = await provider.translate(allText, targetLang);

      try {
        const translatedLines = translatedText.split("\n");
        Object.keys(keysToTranslate).forEach((key, index) => {
          const translatedLine = translatedLines[index];
          const value = translatedLine
            .substring(translatedLine.indexOf(":") + 1)
            .trim()
            .replace(/^["']|["'],?$/g, "")
            .trim();
          translatedChunks[key] = value;
          stats.newKeys++;
        });
      } catch (error) {
        console.error("Error parsing translation:", error);
        stats.errors++;
      }
    } catch (error) {
      console.error("Error translating:", error);
      stats.errors++;
    }
  } else {
    // Translate in chunks
    const chunks = chunkObject(keysToTranslate, config.chunkSize || 10000);

    console.log(
      `Translating ${
        Object.keys(keysToTranslate).length
      } keys to ${targetLang}...`
    );
    console.log(`Split into ${chunks.length} chunks`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      try {
        console.log(`Translating chunk ${i + 1}/${chunks.length}...`);
        const chunkText = chunk
          .map((item) => `${item.key}: ${item.value}`)
          .join("\n");
        const translatedText = await provider.translate(chunkText, targetLang);

        try {
          const translatedLines = translatedText.split("\n");
          for (let j = 0; j < chunk.length; j++) {
            const key = chunk[j].key;
            const translatedLine = translatedLines[j];
            const value = translatedLine
              .substring(translatedLine.indexOf(":") + 1)
              .trim()
              .replace(/^["']|["'],?$/g, "")
              .trim();
            translatedChunks[key] = value;
            stats.newKeys++;
          }
        } catch (error) {
          console.error(`Error parsing translation for chunk ${i + 1}:`, error);
          stats.errors++;
        }
      } catch (error) {
        console.error(`Error translating chunk ${i + 1}:`, error);
        stats.errors++;
      }
    }
  }

  // Merge translations
  const mergedTranslations = {
    ...existingTranslations,
    ...translatedChunks,
  };

  // Reconstruct the original structure
  const translatedData: Record<string, any> = {};
  for (const [key, value] of Object.entries(mergedTranslations)) {
    if (key.includes("_part")) {
      const [originalKey, _] = key.split("_part");
      if (!translatedData[originalKey]) {
        translatedData[originalKey] = "";
      }
      translatedData[originalKey] += value;
    } else {
      translatedData[key] = value;
    }
  }

  // Save the result
  const finalTranslations = unflattenObject(translatedData);
  fs.writeFileSync(targetFile, JSON.stringify(finalTranslations, null, 2));
  console.log(`Translation saved to ${targetFile}`);

  return stats;
}

export async function translateFiles(
  options: TranslateFilesOptions = {}
): Promise<void> {
  const config = loadConfig(options.configPath);
  validateConfig(config);

  if (options.overwrite !== undefined) {
    config.overwrite = options.overwrite;
  }

  const stats: TranslationStats = {
    totalKeys: 0,
    newKeys: 0,
    skippedKeys: 0,
    errors: 0,
  };

  for (const target of config.targets) {
    console.log(`\nProcessing target language: ${target.code}`);
    const targetStats = await translateFile(
      config.source.path,
      target.path,
      target.code,
      config
    );

    stats.totalKeys += targetStats.totalKeys;
    stats.newKeys += targetStats.newKeys;
    stats.skippedKeys += targetStats.skippedKeys;
    stats.errors += targetStats.errors;
  }

  console.log("\nTranslation Summary:");
  console.log(`Total keys: ${stats.totalKeys}`);
  console.log(`New translations: ${stats.newKeys}`);
  console.log(`Skipped existing: ${stats.skippedKeys}`);
  console.log(`Errors: ${stats.errors}`);
}
