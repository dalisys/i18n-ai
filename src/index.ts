import { TranslationConfig, TranslateFilesOptions } from "./types";
import { translateFiles } from "./translator";

export { translateFiles };
export type { TranslationConfig, TranslateFilesOptions };

// Re-export other modules as needed
export * from "./config";
export * from "./providers";
export { exportTranslationsToCSV } from "./export";
