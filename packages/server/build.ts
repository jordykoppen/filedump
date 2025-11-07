import bunPluginTailwind from "bun-plugin-tailwind";
import { parseArgs } from "util";
import zod from "zod";
import { resolve } from "node:path";

const Target = zod.union([
  zod.literal("bun-linux-x64"),
  zod.literal("bun-linux-arm64"),
  zod.literal("bun-windows-x64"),
  zod.literal("bun-darwin-x64"),
  zod.literal("bun-darwin-arm64"),
  zod.literal("bun-linux-x64-musl"),
  zod.literal("bun-linux-arm64-musl"),
]);

const Outfile = zod.string().min(1);

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
