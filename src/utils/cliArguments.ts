import { parseArgs } from "util";

const { values: cliArguments } = parseArgs({
  args: Bun.argv,
  options: {
    port: {
      type: "string",
      short: "p",
      default: "3000",
    },
    fileDirectory: {
      type: "string",
      short: "d",
      default: "./files",
    },
    db: {
      type: "string",
      default: "./database.sqlite",
    },
  },
  strict: true,
  allowPositionals: true,
});

export default cliArguments;
