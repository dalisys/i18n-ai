import axios from "axios";
import {
  CustomProviderConfig,
  TranslationConfig,
  TranslationProvider,
} from "../types";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

/**
 * Create a log directory if it doesn't exist
 * @param dirPath The directory path to create
 */
function ensureLogDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Get a timestamp string for file naming
 * @returns A formatted timestamp string
 */
function getTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace(/:/g, "-").replace(/\..+/, "");
}

/**
 * Extract text content from markdown code blocks or return the original text if not in a code block
 * @param text The potentially markdown formatted text
 * @returns The extracted content or original text
 */
function extractFromMarkdown(text: string): string {
  // Check if the text contains markdown code blocks
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
  const match = text.match(codeBlockRegex);

  if (match && match[1]) {
    return match[1].trim();
  }

  return text;
}

/**
 * A provider for custom translation services defined by the user
 */
export class CustomProvider implements TranslationProvider {
  private config: CustomProviderConfig;
  private translationConfig: TranslationConfig;
  public name = "custom" as const;
  public model = "custom-model" as const;
  // Static property to store log file paths
  public static logFilePaths: {
    errorLogPath?: string;
    responseLogPath?: string;
  }[] = [];

  constructor(
    config: CustomProviderConfig,
    translationConfig: TranslationConfig
  ) {
    this.config = config;
    this.translationConfig = translationConfig;
    // Clear the log file paths when creating a new provider instance
    CustomProvider.logFilePaths = [];
  }

  /**
   * Logs error information to a file and saves the provider response
   * @param error The error that occurred
   * @param response The provider response (if available)
   * @param requestData The request data sent to the provider
   * @returns An object containing the paths to the log files
   */
  private logErrorToFile(
    error: any,
    response?: any,
    requestData?: any
  ): { errorLogPath?: string; responseLogPath?: string } {
    try {
      // Ensure the logs directory exists
      const logsDir = path.join(process.cwd(), "i18n_ai_logs");
      ensureLogDirectoryExists(logsDir);

      const timestamp = getTimestamp();
      const errorLogPath = path.join(
        logsDir,
        `custom-provider-error-${timestamp}.log`
      );

      // Prepare error log content
      let errorContent = `[${new Date().toISOString()}] Custom Provider Error\n`;
      errorContent += `Error Message: ${error.message}\n`;

      if (error.stack) {
        errorContent += `Stack Trace: ${error.stack}\n`;
      }

      if (error.response) {
        errorContent += `Response Status: ${error.response.status}\n`;
        errorContent += `Response Status Text: ${error.response.statusText}\n`;
      }

      if (requestData) {
        errorContent += `Request Data: ${JSON.stringify(
          requestData,
          null,
          2
        )}\n`;
      }

      // Write error log
      fs.writeFileSync(errorLogPath, errorContent);
      console.error(`Error log written to: ${errorLogPath}`);

      let responseLogPath: string | undefined;

      // Save response data to JSON file if available
      if (response || error.response) {
        const responseData = response || error.response?.data;
        if (responseData) {
          responseLogPath = path.join(
            logsDir,
            `custom-provider-response-${timestamp}.json`
          );

          // If response is an object, save as JSON, otherwise save as text
          if (typeof responseData === "object") {
            fs.writeFileSync(
              responseLogPath,
              JSON.stringify(responseData, null, 2)
            );
          } else {
            fs.writeFileSync(responseLogPath, String(responseData));
          }

          console.error(`Response data written to: ${responseLogPath}`);
        }
      }

      // Store the log paths for the summary
      const logPaths = {
        errorLogPath: path.resolve(errorLogPath),
        responseLogPath: responseLogPath
          ? path.resolve(responseLogPath)
          : undefined,
      };

      // Add to the static array
      CustomProvider.logFilePaths.push(logPaths);

      return logPaths;
    } catch (logError) {
      console.error("Failed to write error log:", logError);
      return {};
    }
  }

  /**
   * Sends a request to the custom endpoint for translation
   * @param text The text to translate
   * @param targetLang The target language code
   * @returns The translated text
   */
  async translate(text: string, targetLang: string): Promise<string> {
    let requestBody: any;
    let response: any;

    try {
      const {
        url,
        method = "POST",
        headers = {},
        body,
        responsePath,
      } = this.config;

      // Prepare request body with placeholders replaced
      requestBody = this.prepareRequestBody(body, text, targetLang);

      // Make the request
      response = await axios({
        method,
        url,
        headers,
        data: method === "POST" ? requestBody : undefined,
        params: method === "GET" ? requestBody : undefined,
      });

      // Extract translation from response using the response path
      let translatedText: string;

      if (responsePath) {
        // Enhanced path navigation that supports both array.index and array[index] notations
        let result = response.data;

        // Check if we need to process the data as markdown first
        if (typeof result === "string") {
          const extractedContent = extractFromMarkdown(result);

          // Try to parse as JSON if it looks like JSON
          if (
            extractedContent.trim().startsWith("{") ||
            extractedContent.trim().startsWith("[")
          ) {
            try {
              result = JSON.parse(extractedContent);
            } catch (parseError: any) {
              // If parsing fails, log the error and continue with original string
              console.warn(
                "Failed to parse extracted content as JSON:",
                parseError.message
              );
              console.warn("Content:", extractedContent);
              // Keep the original result
            }
          } else {
            // Not JSON, just use the extracted content as result
            return extractedContent;
          }
        }

        // Process the path considering array indices
        // Convert path with array notation like data.candidates[0] to data.candidates.0
        const normalizedPath = responsePath.replace(/\[(\d+)\]/g, ".$1");
        const pathParts = normalizedPath.split(".");

        for (const part of pathParts) {
          if (!result) {
            const error = new Error(
              `Response path '${responsePath}' failed at '${part}': previous part was null or undefined`
            );
            const logPaths = this.logErrorToFile(
              error,
              response.data,
              requestBody
            );
            throw new Error(
              `Response path '${responsePath}' failed at '${part}': previous part was null or undefined. Logs created at: ${logPaths.errorLogPath}`
            );
          }

          // Handle array indices as numbers
          if (/^\d+$/.test(part) && Array.isArray(result)) {
            const index = parseInt(part, 10);
            if (index >= result.length) {
              const error = new Error(
                `Response path '${responsePath}' failed: array index ${index} is out of bounds (length: ${result.length})`
              );
              const logPaths = this.logErrorToFile(
                error,
                response.data,
                requestBody
              );
              throw new Error(
                `Response path '${responsePath}' failed: array index ${index} is out of bounds. Logs created at: ${logPaths.errorLogPath}`
              );
            }
            result = result[index];
          }
          // Handle regular object properties
          else if (typeof result === "object" && part in result) {
            result = result[part];
          }
          // Path part not found
          else {
            const error = new Error(
              `Response path '${responsePath}' failed: property '${part}' not found in ${JSON.stringify(
                result
              ).substring(0, 100)}...`
            );
            const logPaths = this.logErrorToFile(
              error,
              response.data,
              requestBody
            );
            throw new Error(
              `Response path '${responsePath}' failed: property '${part}' not found. Logs created at: ${logPaths.errorLogPath}`
            );
          }
        }

        // Check if the extracted result is a string or can be converted to a string
        if (typeof result === "string") {
          translatedText = result;
        } else if (result !== null && result !== undefined) {
          // Try to convert non-string values to string
          translatedText = String(result);
        } else {
          const error = new Error(
            `Translation result is not a string and cannot be converted to a string: ${JSON.stringify(
              result
            )}`
          );
          const logPaths = this.logErrorToFile(
            error,
            response.data,
            requestBody
          );
          throw new Error(
            `Translation result is not a string. Logs created at: ${logPaths.errorLogPath}`
          );
        }

        // Process the result for markdown if it's a string
        if (typeof translatedText === "string") {
          translatedText = extractFromMarkdown(translatedText);
        }
      } else {
        // If no path specified, assume the response is directly the translated text
        if (typeof response.data === "string") {
          // Check if it's markdown and extract the actual content
          translatedText = extractFromMarkdown(response.data);
        } else {
          // Convert object to string
          translatedText = JSON.stringify(response.data);
        }
      }

      return translatedText;
    } catch (error: any) {
      // If it's an error we already processed and logged, just rethrow it
      if (error.message.includes("Logs created at:")) {
        throw error;
      }

      // Otherwise log it and create a new error with the log path
      console.error("Custom provider translation failed:", error.message);
      const logPaths = this.logErrorToFile(error, response?.data, requestBody);

      const baseErrorMessage = `Custom provider translation failed: ${error.message}`;
      const logPathInfo = logPaths.errorLogPath
        ? `\nError details logged to: ${logPaths.errorLogPath}`
        : "";

      throw new Error(`${baseErrorMessage}${logPathInfo}`);
    }
  }

  /**
   * Prepares the request body with placeholders replaced
   */
  private prepareRequestBody(body: any, text: string, targetLang: string): any {
    let requestBody: any;

    if (typeof body === "string") {
      // If body is a string template, replace placeholders
      requestBody = body
        .replace(/{{text}}/g, text)
        .replace(/{{targetLang}}/g, targetLang)
        .replace(/{{sourceLang}}/g, this.translationConfig.source.code);

      try {
        // Try to parse it as JSON if it looks like JSON
        if (
          requestBody.trim().startsWith("{") ||
          requestBody.trim().startsWith("[")
        ) {
          requestBody = JSON.parse(requestBody);
        }
      } catch (e) {
        // If it's not valid JSON, keep it as a string
      }
    } else if (body && typeof body === "object") {
      // If body is an object, create a deep copy and replace placeholders in string values
      requestBody = JSON.parse(JSON.stringify(body));
      const replacePlaceholders = (obj: any) => {
        for (const key in obj) {
          if (typeof obj[key] === "string") {
            obj[key] = obj[key]
              .replace(/{{text}}/g, text)
              .replace(/{{targetLang}}/g, targetLang)
              .replace(/{{sourceLang}}/g, this.translationConfig.source.code);
          } else if (typeof obj[key] === "object" && obj[key] !== null) {
            replacePlaceholders(obj[key]);
          }
        }
      };
      replacePlaceholders(requestBody);
    } else {
      // Default minimal body if none provided
      requestBody = {
        text,
        targetLanguage: targetLang,
        sourceLanguage: this.translationConfig.source.code,
      };
    }

    return requestBody;
  }
}
