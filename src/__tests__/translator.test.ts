import { translateFiles } from "../translator";
import {
  TranslateFilesOptions,
  TranslationConfig,
  LanguageFile,
} from "../types";
import fs from "fs";
import path from "path";

const mockSourceContent = {
  greeting: "Hello",
  farewell: "Goodbye",
};

const mockConfig: TranslationConfig = {
  source: {
    path: "locales/en.json",
    code: "en",
  },
  targets: [
    {
      path: "locales/fr.json",
      code: "fr",
    },
    {
      path: "locales/es.json",
      code: "es",
    },
  ],
  provider: "openai",
  model: "gpt-3.5-turbo",
  chunkSize: 100,
  concurrency: 3,
  overwrite: false,
  ignoreKeys: ["id", "key"],
  translateAllAtOnce: false,
};

// Create mock files object outside the mock
const mockFiles: Record<string, string> = {
  "translator.config.json": JSON.stringify(mockConfig),
  "locales/en.json": JSON.stringify(mockSourceContent),
};

// Mock fs after variable declarations
jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn().mockImplementation(async (path) => {
      if (mockFiles[path]) return mockFiles[path];
      throw new Error("File not found");
    }),
    writeFile: jest.fn(),
    access: jest.fn(),
  },
  existsSync: jest.fn().mockImplementation((path) => {
    return path in mockFiles || path.startsWith("locales");
  }),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn().mockImplementation((path) => {
    if (mockFiles[path]) return mockFiles[path];
    throw new Error("File not found");
  }),
  writeFileSync: jest.fn(),
}));

// Mock the spinner
jest.mock("../utils/spinner", () => ({
  Spinner: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    update: jest.fn(),
    succeed: jest.fn(),
    fail: jest.fn(),
  })),
}));

// Mock the translation provider
jest.mock("../providers", () => ({
  createProvider: jest.fn(() => ({
    translate: jest.fn().mockImplementation((text) => {
      const input = JSON.parse(text);
      const output = { ...input };
      // Translate non-ignored keys
      if (output.text) output.text = "Texte traduit";
      return Promise.resolve(JSON.stringify(output));
    }),
  })),
}));

describe("Translator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  describe("translateFiles", () => {
    const mockOptions: TranslateFilesOptions = {
      configPath: "translator.config.json",
      overwrite: false,
    };

    it("should process translation files correctly", async () => {
      await translateFiles(mockOptions);

      // Verify file operations
      expect(fs.readFileSync).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it("should respect ignore keys configuration", async () => {
      const mockSourceWithIgnored = {
        id: "do-not-translate",
        text: "Translate this",
      };

      const mockExistingTranslation = {
        id: "existing-translation",
        text: "Old translation",
      };

      // Mock the source file read
      (fs.readFileSync as jest.Mock)
        .mockReturnValueOnce(JSON.stringify(mockConfig))
        .mockReturnValueOnce(JSON.stringify(mockSourceWithIgnored))
        // Mock the target file read to simulate existing translation
        .mockReturnValueOnce(JSON.stringify(mockExistingTranslation));

      // Mock existsSync to indicate target file exists
      (fs.existsSync as jest.Mock).mockImplementation((path) => true);

      await translateFiles(mockOptions);

      // Verify that ignored keys preserve existing translations
      const writeFileCalls = (fs.writeFileSync as jest.Mock).mock.calls;
      expect(writeFileCalls.length).toBeGreaterThan(0);

      const writtenContent = JSON.parse(writeFileCalls[0][1]);
      expect(writtenContent.id).toBe("existing-translation"); // Should keep existing translation
      expect(writtenContent.text).toBe("Texte traduit"); // Non-ignored key should be translated
    });

    it("should create target directories if they do not exist", async () => {
      (fs.existsSync as jest.Mock)
        .mockReturnValueOnce(true) // Config exists
        .mockReturnValueOnce(true) // Source dir exists
        .mockReturnValueOnce(false); // Target dir doesn't exist

      await translateFiles(mockOptions);

      expect(fs.mkdirSync).toHaveBeenCalled();
    });
  });
});
