import bunPluginTailwind from "bun-plugin-tailwind";
import { parseArgs } from "util";
import { z } from "zod";
import { resolve } from "node:path";

const Target = z.union([
  z.literal("bun-linux-x64"),
  z.literal("bun-linux-arm64"),
  z.literal("bun-windows-x64"),
  z.literal("bun-darwin-x64"),
  z.literal("bun-darwin-arm64"),
  z.literal("bun-linux-x64-musl"),
  z.literal("bun-linux-arm64-musl"),
]);

const Outfile = z.string().min(1);

const { values } = parseArgs({
  args: Bun.argv,
  options: {
    outfile: {
      type: "string",
      short: "o",
      default: "filedump",
    },
    target: {
      type: "string",
      short: "t",
      default: "bun-darwin-arm64",
    },
  },
  strict: true,
  allowPositionals: true,
});

const target = Target.parse(values.target);
const outfile = Outfile.parse(values.outfile);

console.log(`Building filedump for target ${target} at ${outfile}`);

const result = await Bun.build({
  root: __dirname,
  entrypoints: [resolve(__dirname, "src/index.ts")],
  plugins: [bunPluginTailwind],
  compile: {
    outfile,
    target,
  },
});

if (!result.success) {
  console.error("Build failed:");
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

console.log("Build complete.");
