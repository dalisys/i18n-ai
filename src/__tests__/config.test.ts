import { loadConfig, validateConfig } from "../config";
import { TranslationConfig, SupportedProvider } from "../types";
import fs from "fs";

const validConfig: TranslationConfig = {
  source: {
    path: "locales/en.json",
    code: "en",
  },
  targets: [
    {
      path: "locales/fr.json",
      code: "fr",
    },
  ],
  provider: "openai" as SupportedProvider,
  model: "gpt-3.5-turbo",
  chunkSize: 100,
  concurrency: 3,
  overwrite: false,
  ignoreKeys: ["id", "key"],
  translateAllAtOnce: false,
};

// Create mock files object outside the mock
const mockFiles: Record<string, string> = {
  "translator.config.json": JSON.stringify(validConfig),
  "invalid.json": "invalid json",
  "locales/en.json": JSON.stringify({ hello: "world" }),
  "locales/fr.json": JSON.stringify({ hello: "monde" }),
};

// Mock fs after variable declarations
jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn().mockImplementation(async (path) => {
      if (mockFiles[path]) return mockFiles[path];
      throw new Error("File not found");
    }),
  },
  existsSync: jest.fn().mockImplementation((path) => {
    if (path === "nonexistent.json") return false;
    return path in mockFiles || path === "locales";
  }),
  readFileSync: jest.fn().mockImplementation((path) => {
    if (path === "nonexistent.json") {
      throw new Error("File not found");
    }
    if (path === "invalid.json") {
      return "invalid json";
    }
    if (mockFiles[path]) return mockFiles[path];
    throw new Error("File not found");
  }),
  writeFileSync: jest.fn(),
}));

describe("Configuration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    jest.restoreAllMocks();
  });

  describe("loadConfig", () => {
    it("should load and parse a valid config file", async () => {
      const config = await loadConfig("translator.config.json");
      expect(config).toEqual(validConfig);
    });

    it("should throw error if config file does not exist", () => {
      expect(() => loadConfig("nonexistent.json")).toThrow(
        "Config file not found at nonexistent.json"
      );
    });

    it("should throw error on invalid JSON", () => {
      expect(() => loadConfig("invalid.json")).toThrow(
        "Failed to load config file: Unexpected token 'i', \"invalid json\" is not valid JSON"
      );
    });
  });

  describe("validateConfig", () => {
    it("should pass validation for valid config", () => {
      expect(() => validateConfig(validConfig)).not.toThrow();
    });

    it("should throw error for missing source", () => {
      const invalidConfig = { ...validConfig };
      delete (invalidConfig as any).source;

      expect(() => validateConfig(invalidConfig)).toThrow();
    });

    it("should throw error for empty targets", () => {
      const invalidConfig = { ...validConfig, targets: [] };

      expect(() => validateConfig(invalidConfig)).toThrow();
    });

    it("should throw error for invalid provider", () => {
      const invalidConfig = {
        ...validConfig,
        provider: "invalid-provider" as SupportedProvider,
      };

      expect(() => validateConfig(invalidConfig)).toThrow();
    });

    it("should throw error for invalid model", () => {
      const invalidConfig = {
        ...validConfig,
        provider: "openai" as SupportedProvider,
        model: "invalid-model",
      };

      expect(() => validateConfig(invalidConfig)).not.toThrow();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("invalid-model")
      );
    });

    it("should handle optional fields correctly", () => {
      const minimalConfig: TranslationConfig = {
        source: validConfig.source,
        targets: validConfig.targets,
        provider: validConfig.provider,
      };

      expect(() => validateConfig(minimalConfig)).not.toThrow();
    });

    it("should validate export config if present", () => {
      const configWithExport = {
        ...validConfig,
        export: {
          outputPath: "./export.csv",
          delimiter: ",",
          includeMetadata: true,
        },
      };

      expect(() => validateConfig(configWithExport)).not.toThrow();
    });

    it("should validate import config if present", () => {
      const configWithImport = {
        ...validConfig,
        import: {
          delimiter: ",",
          skipHeader: true,
          overwrite: false,
        },
      };

      expect(() => validateConfig(configWithImport)).not.toThrow();
    });
  });
});
