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
    help: {
      type: "boolean",
      short: "h",
      default: false,
    },
  },
  strict: true,
  allowPositionals: true,
});

if (cliArguments.help) {
  console.log(`
FileDump - A stupid simple file server

Usage: bun src/index.tsx [options]

Options:
  -p, --port <port>           Server port (default: 3000)
  -d, --fileDirectory <path>  Directory to store files (default: ./files)
  --db <path>                 SQLite database path (default: ./database.sqlite)
  -h, --help                  Show this help message

Examples:
  bun src/index.tsx
  bun src/index.tsx --port 8080
  bun src/index.tsx -p 8080 -d /var/files --db /var/db/files.db
`);
  process.exit(0);
}

export default cliArguments;
