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
import { Spinner } from "./utils/spinner";
import { BatchProcessor } from "./utils/batch-processor";

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

  const pushCurrentChunk = () => {
    if (currentChunk.length > 0) {
      chunks.push([...currentChunk]);
      currentChunk = [];
    }
  };

  for (let i = 0; i < entries.length; i++) {
    const [key, value] = entries[i];
    const topLevelKey = getTopLevelKey(key);

    // Start new chunk if:
    // 1. Current chunk is at max size
    // 2. We're switching to a new top-level key and current chunk is substantial
    if (
      currentChunk.length >= maxKeysPerChunk ||
      (topLevelKey !== currentPrefix &&
        currentChunk.length >= Math.min(maxKeysPerChunk * 0.8, 10))
    ) {
      pushCurrentChunk();
      currentPrefix = topLevelKey;
    }

    // If starting a new chunk, set the prefix
    if (currentChunk.length === 0) {
      currentPrefix = topLevelKey;
    }

    currentChunk.push({
      key,
      value: typeof value === "string" ? value : JSON.stringify(value),
    });
  }

  // Add the last chunk if not empty
  pushCurrentChunk();

  return chunks;
}

function shouldIgnoreKey(key: string, ignoreKeys: string[] = []): boolean {
  return ignoreKeys.some(
    (ignoreKey) =>
      key === ignoreKey || // Exact match
      key.startsWith(ignoreKey + ".") // Child of ignored key
  );
}

function formatTranslationInput(entries: [string, string][]): string {
  // Convert entries to a JSON object
  const jsonObject = entries.reduce((obj, [key, value]) => {
    obj[key] = value;
    return obj;
  }, {} as Record<string, string>);

  return JSON.stringify(jsonObject, null, 2);
}

function parseTranslatedText(
  text: string,
  originalKeys: string[]
): Record<string, string> {
  try {
    // Try to parse the response as JSON
    const parsed = JSON.parse(text.trim());
    const result: Record<string, string> = {};

    // Validate and extract translations
    originalKeys.forEach((key) => {
      if (typeof parsed[key] === "string") {
        const value = parsed[key].trim();
        if (value && value.length > 0) {
          result[key] = value;
        } else {
          console.warn(`Empty translation found for key: ${key}`);
        }
      } else {
        console.warn(`Missing or invalid translation for key: ${key}`);
      }
    });

    return result;
  } catch (error) {
    console.error("Failed to parse translation response as JSON:", error);
    // Fallback to line-by-line parsing if JSON parsing fails
    const result: Record<string, string> = {};
    const lines = text.trim().split("\n");

    lines.forEach((line, index) => {
      const originalKey = originalKeys[index];
      if (!originalKey) return;

      try {
        const colonIndex = line.indexOf(":");
        if (colonIndex === -1) {
          console.warn(`No separator found in line: ${line}`);
          return;
        }

        const value = line
          .substring(colonIndex + 1)
          .trim()
          .replace(/^["']|["']$/g, "")
          .trim();

        if (value && value.length > 0) {
          result[originalKey] = value;
        } else {
          console.warn(`Empty translation found for key: ${originalKey}`);
        }
      } catch (error) {
        console.error(`Error parsing line: ${line}`, error);
      }
    });

    return result;
  }
}

async function translateFile(
  sourceFile: string,
  targetFile: string,
  targetLang: string,
  config: TranslationConfig
): Promise<TranslationStats> {
  const spinner = new Spinner();
  const stats: TranslationStats = {
    totalKeys: 0,
    newKeys: 0,
    skippedKeys: 0,
    errors: 0,
    totalChunks: 0,
    processedChunks: 0,
    failedChunkIndex: null,
    errorDetails: null,
  };

  // Read and flatten source file
  spinner.start("Reading source file...");
  const sourceContent = fs.readFileSync(sourceFile, "utf-8");
  const sourceData = JSON.parse(sourceContent);
  const flattenedSource = flattenObject(sourceData);
  stats.totalKeys = Object.keys(flattenedSource).length;
  spinner.succeed();

  // Read existing translations if available
  spinner.start("Reading existing translations...");
  let existingTranslations: Record<string, any> = {};
  try {
    if (fs.existsSync(targetFile)) {
      const existingContent = fs.readFileSync(targetFile, "utf-8");
      existingTranslations = flattenObject(JSON.parse(existingContent));
      spinner.succeed();
    }
  } catch (error) {
    spinner.fail();
    console.warn(
      `Warning: Could not read existing translations from ${targetFile}`
    );
  }

  // Identify keys that need translation
  spinner.start("Analyzing translation needs...");
  const keysToTranslate: Record<string, string> = {};
  for (const [key, value] of Object.entries(flattenedSource)) {
    // Skip if key should be ignored
    if (shouldIgnoreKey(key, config.ignoreKeys)) {
      stats.skippedKeys++;
      // If the key exists in existing translations, keep it
      if (existingTranslations[key]) {
        keysToTranslate[key] = existingTranslations[key];
      } else {
        // If no existing translation, keep the source value
        keysToTranslate[key] = value;
      }
      continue;
    }
    // If key exists in existing translations and we're not overwriting
    if (existingTranslations[key] && !config.overwrite) {
      stats.skippedKeys++;
      keysToTranslate[key] = existingTranslations[key];
    } else {
      keysToTranslate[key] = value;
    }
  }
  spinner.succeed();

  if (Object.keys(keysToTranslate).length === 0) {
    console.log("No new keys to translate");
    return stats;
  }

  // Initialize provider
  spinner.start("Initializing translation provider...");
  const provider = createProvider(
    config.provider,
    process.env[`${config.provider.toUpperCase()}_API_KEY`] || "",
    config,
    config.model
  );
  spinner.succeed();

  // Display which provider is being used
  const isCustom = config.customProvider && config.customProvider.url;
  const providerInfo = isCustom
    ? `Custom provider (${config.customProvider!.url})`
    : `${config.provider.toUpperCase()} (model: ${provider.model})`;
  console.log(`Using translation provider: ${providerInfo}`);

  const translatedChunks: Record<string, any> = {};
  const batchProcessor = new BatchProcessor({
    maxConcurrent: 3,
    delayBetweenBatches: 2000,
    retryAttempts: 3,
  });

  if (config.translateAllAtOnce) {
    spinner.start(
      `Translating ${
        Object.keys(keysToTranslate).length
      } keys to ${targetLang} all at once...`
    );
    try {
      const entries = Object.entries(keysToTranslate);
      const formattedText = formatTranslationInput(entries);
      const translatedText = await provider.translate(
        formattedText,
        targetLang
      );

      try {
        const keys = Object.keys(keysToTranslate);
        const parsed = parseTranslatedText(translatedText, keys);

        Object.entries(parsed).forEach(([key, value]) => {
          translatedChunks[key] = value;
          stats.newKeys++;
        });
        spinner.succeed();
      } catch (error) {
        spinner.fail();
        console.error("Error parsing translation:", error);
        stats.errors++;
        stats.errorDetails =
          error instanceof Error ? error : new Error(String(error));

        // Save any successfully translated chunks before exiting
        if (Object.keys(translatedChunks).length > 0) {
          await saveTranslations(
            targetFile,
            translatedChunks,
            existingTranslations
          );
          spinner.succeed(
            `Saved ${
              Object.keys(translatedChunks).length
            } successfully translated keys to ${targetFile}`
          );
        }
      }
    } catch (error) {
      spinner.fail();
      console.error("Error translating:", error);
      stats.errors++;
      stats.errorDetails =
        error instanceof Error ? error : new Error(String(error));

      // Save any successfully translated chunks before exiting
      if (Object.keys(translatedChunks).length > 0) {
        await saveTranslations(
          targetFile,
          translatedChunks,
          existingTranslations
        );
        spinner.succeed(
          `Saved ${
            Object.keys(translatedChunks).length
          } successfully translated keys to ${targetFile}`
        );
      }
    }
  } else {
    // Translate in chunks
    const chunks = chunkObject(keysToTranslate, config.chunkSize || 10000);
    stats.totalChunks = chunks.length;

    spinner.start(
      `Translating ${
        Object.keys(keysToTranslate).length
      } keys to ${targetLang}...`
    );
    spinner.succeed(`Split into ${chunks.length} chunks`);

    if (config.provider === "anthropic") {
      // Use batch processing for Anthropic
      spinner.start("Using batch processing for Anthropic");
      let batchError = false;

      const maxConcurrent = batchProcessor.getMaxConcurrent();
      for (
        let batchStart = 0;
        batchStart < chunks.length && !batchError;
        batchStart += maxConcurrent
      ) {
        const batchEnd = Math.min(batchStart + maxConcurrent, chunks.length);
        const currentBatch = chunks.slice(batchStart, batchEnd);

        spinner.start(
          `Processing batch ${batchStart + 1}-${batchEnd} of ${
            chunks.length
          }...`
        );

        const results = await batchProcessor.processBatch(
          currentBatch,
          async (chunk) => {
            const entries = chunk.map(
              (item) => [item.key, item.value] as [string, string]
            );
            const formattedText = formatTranslationInput(entries);
            const translatedText = await provider.translate(
              formattedText,
              targetLang
            );

            const keys = chunk.map((item) => item.key);
            return { translatedText, keys };
          }
        );

        // Process results
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          const chunkIndex = batchStart + i;
          stats.processedChunks++;

          if (result.success && result.result) {
            const { translatedText, keys } = result.result;
            try {
              const parsed = parseTranslatedText(translatedText, keys);
              Object.entries(parsed).forEach(([key, value]) => {
                translatedChunks[key] = value;
                stats.newKeys++;
              });
              spinner.succeed(
                `Chunk ${chunkIndex + 1}/${chunks.length} completed`
              );
            } catch (error) {
              spinner.fail(
                `Error parsing translation for chunk ${chunkIndex + 1}`
              );
              console.error("Error details:", error);
              stats.errors++;
              stats.failedChunkIndex = chunkIndex + 1;
              stats.errorDetails =
                error instanceof Error ? error : new Error(String(error));
              batchError = true;
              break;
            }
          } else {
            spinner.fail(`Failed to translate chunk ${chunkIndex + 1}`);
            console.error("Error details:", result.error);
            stats.errors++;
            stats.failedChunkIndex = chunkIndex + 1;
            stats.errorDetails = result.error || null;
            batchError = true;
            break;
          }
        }

        // If we encountered an error in this batch, save progress and stop
        if (batchError) {
          spinner.start(
            `Translation stopped at chunk ${stats.failedChunkIndex} due to an error`
          );
          spinner.stop();
          break;
        }

        // After each batch, delay before the next one
        if (batchStart + batchEnd < chunks.length) {
          spinner.start(`Waiting before next batch...`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      // Save progress if we have any successful translations
      if (Object.keys(translatedChunks).length > 0) {
        await saveTranslations(
          targetFile,
          translatedChunks,
          existingTranslations
        );
        spinner.succeed(
          `Saved ${
            Object.keys(translatedChunks).length
          } successfully translated keys to ${targetFile}`
        );
      }

      // Check if all chunks are processed and we should stop
      if (stats.totalKeys > 0 && stats.processedChunks === stats.totalChunks) {
        spinner.start(`All translations complete`);
        spinner.stop();
      }
    } else {
      // Sequential processing for other providers
      let chunkError = false;

      for (let i = 0; i < chunks.length && !chunkError; i++) {
        const chunk = chunks[i];
        spinner.start(`Translating chunk ${i + 1}/${chunks.length}...`);
        stats.processedChunks++;

        try {
          const entries = chunk.map(
            (item) => [item.key, item.value] as [string, string]
          );
          const formattedText = formatTranslationInput(entries);
          const translatedText = await provider.translate(
            formattedText,
            targetLang
          );

          const keys = chunk.map((item) => item.key);
          const parsed = parseTranslatedText(translatedText, keys);

          Object.entries(parsed).forEach(([key, value]) => {
            translatedChunks[key] = value;
            stats.newKeys++;
          });
          spinner.succeed(`Chunk ${i + 1}/${chunks.length} completed`);

          // Always save progress after each chunk is processed
          await saveTranslations(
            targetFile,
            translatedChunks,
            existingTranslations
          );
          spinner.succeed(
            `Progress saved (${
              Object.keys(translatedChunks).length
            } keys so far)`
          );
        } catch (error) {
          spinner.fail(`Error in chunk ${i + 1}/${chunks.length}`);
          console.error("Error translating chunk:", error);
          stats.errors++;
          stats.failedChunkIndex = i + 1;
          stats.errorDetails =
            error instanceof Error ? error : new Error(String(error));
          chunkError = true;

          // Save progress if we have any successful translations
          if (Object.keys(translatedChunks).length > 0) {
            await saveTranslations(
              targetFile,
              translatedChunks,
              existingTranslations
            );
            spinner.succeed(
              `Saved ${
                Object.keys(translatedChunks).length
              } successfully translated keys to ${targetFile}`
            );
          }

          break;
        }
      }

      // If no error occurred and we haven't already saved progress (in case of an error),
      // save translations now
      if (!chunkError && Object.keys(translatedChunks).length > 0) {
        await saveTranslations(
          targetFile,
          translatedChunks,
          existingTranslations
        );
        spinner.succeed(`Translations saved to ${targetFile}`);
      }
    }
  }

  // If there's an error, don't attempt to save the translations again because we already did it above
  if (stats.errors === 0) {
    // Save any translations that haven't been saved yet
    if (Object.keys(translatedChunks).length > 0) {
      await saveTranslations(
        targetFile,
        translatedChunks,
        existingTranslations
      );
      spinner.succeed(`Translation saved to ${targetFile}`);
    }
  } else {
    // Display error information
    if (stats.failedChunkIndex !== null) {
      console.error(
        `\nTranslation process stopped at chunk ${stats.failedChunkIndex}/${stats.totalChunks}`
      );
    }
    if (stats.errorDetails) {
      console.error(`Error details: ${stats.errorDetails.message}`);
    }
    console.info(
      `\nPartial translations were saved. Successfully translated ${
        stats.processedChunks - 1
      } of ${stats.totalChunks} chunks.`
    );
  }

  return stats;
}

// Helper function to save translations
async function saveTranslations(
  targetFile: string,
  translatedChunks: Record<string, any>,
  existingTranslations: Record<string, any>
): Promise<void> {
  // Always save progress on errors (this is now the default behavior)
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

  // Ensure the directory exists
  const targetDir = path.dirname(targetFile);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Save the result
  const finalTranslations = unflattenObject(translatedData);
  fs.writeFileSync(targetFile, JSON.stringify(finalTranslations, null, 2));
}

export async function translateFiles(
  options: TranslateFilesOptions = {}
): Promise<void> {
  const config = loadConfig(options.configPath);
  validateConfig(config);

  if (options.overwrite !== undefined) {
    config.overwrite = options.overwrite;
  }

  // Get provider info for summary
  const isCustom = config.customProvider && config.customProvider.url;
  const providerName = isCustom
    ? "Custom provider"
    : config.provider.toUpperCase();
  const modelName = isCustom
    ? config.customProvider!.url.split("/").pop() || "custom endpoint"
    : config.model || "default model";

  const stats: TranslationStats = {
    totalKeys: 0,
    newKeys: 0,
    skippedKeys: 0,
    errors: 0,
    totalChunks: 0,
    processedChunks: 0,
    failedChunkIndex: null,
    errorDetails: null,
  };

  let stopOnFirstError = config.stopOnError !== false; // Default to true if not specified
  let hasErrors = false;

  for (const target of config.targets) {
    console.log(`\nProcessing target language: ${target.code}`);
    try {
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
      stats.totalChunks += targetStats.totalChunks;
      stats.processedChunks += targetStats.processedChunks;

      if (targetStats.errors > 0) {
        hasErrors = true;
        if (stopOnFirstError) {
          console.log(
            `\nStopping translation process due to errors in ${target.code}`
          );
          break;
        }
      }
    } catch (error) {
      console.error(`\nUnexpected error processing ${target.code}:`, error);
      stats.errors++;
      hasErrors = true;
      if (stopOnFirstError) {
        break;
      }
    }
  }

  console.log("\nTranslation Summary:");
  console.log(`Provider: ${providerName}`);
  console.log(`Model: ${modelName}`);
  console.log(`Total keys: ${stats.totalKeys}`);
  console.log(`New translations: ${stats.newKeys}`);
  console.log(`Skipped existing: ${stats.skippedKeys}`);
  console.log(
    `Chunks processed: ${stats.processedChunks}/${stats.totalChunks}`
  );
  console.log(`Errors: ${stats.errors}`);

  if (hasErrors) {
    console.log("\nNote: Some translations were not completed due to errors.");
    console.log(
      "The successfully translated chunks were saved to preserve progress."
    );
  }

  // If there were errors with the custom provider, show log file paths in the summary
  if (isCustom && stats.errors > 0) {
    try {
      // Import the CustomProvider class dynamically to avoid circular dependencies
      const { CustomProvider } = require("./providers/custom");

      if (
        CustomProvider.logFilePaths &&
        CustomProvider.logFilePaths.length > 0
      ) {
        console.log("\nError Logs:");

        // Display unique log file paths
        const uniqueErrorLogs = new Set<string>();
        const uniqueResponseLogs = new Set<string>();

        CustomProvider.logFilePaths.forEach(
          (paths: { errorLogPath?: string; responseLogPath?: string }) => {
            if (paths.errorLogPath) uniqueErrorLogs.add(paths.errorLogPath);
            if (paths.responseLogPath)
              uniqueResponseLogs.add(paths.responseLogPath);
          }
        );

        if (uniqueErrorLogs.size > 0) {
          console.log("\nError details:");
          uniqueErrorLogs.forEach((path) => console.log(`- ${path}`));
        }

        if (uniqueResponseLogs.size > 0) {
          console.log("\nResponse data:");
          uniqueResponseLogs.forEach((path) => console.log(`- ${path}`));
        }
      }
    } catch (error) {
      // Silently ignore any issues with displaying log paths
      console.debug("Failed to display log file paths:", error);
    }
  }
}
