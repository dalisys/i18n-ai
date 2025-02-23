import { defineConfig } from "tsup";
import pkg from "./package.json";

export default defineConfig(({ format }) => ({
  entry: ["src/index.ts", "src/cli.ts"],
  format: ["cjs", "esm"],
  dts: true,
  splitting: true,
  sourcemap: false,
  clean: true,
  minify: true,
  treeshake: true,
  outDir: "dist",
  target: "node20",
  external: Object.keys(pkg.dependencies || {}),
  banner: {
    js: format === "esm" ? "#!/usr/bin/env node" : "",
  },
  footer: {
    js: format === "cjs" ? "\n#!/usr/bin/env node" : "",
  },
}));
