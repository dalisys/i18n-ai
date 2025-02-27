import { TranslationConfig, TranslateFilesOptions } from "./types";
import { translateFiles } from "./translator";
import { getAvailableProviders } from "./providers";

export { translateFiles, getAvailableProviders };
export type { TranslationConfig, TranslateFilesOptions };

// Re-export other modules as needed
export * from "./config";
export * from "./providers";
export { exportTranslationsToCSV } from "./export";
