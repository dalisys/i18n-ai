import { defineConfig } from "tsup";

export default defineConfig(({ format }) => ({
  entry: ["src/index.ts", "src/cli.ts"],
  format: ["cjs", "esm"],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  minify: true,
  treeshake: true,
  outDir: "dist",
  target: "node20",
  banner: {
    js: format === "esm" ? "#!/usr/bin/env node" : "",
  },
  footer: {
    js: format === "cjs" ? "\n#!/usr/bin/env node" : "",
  },
}));
