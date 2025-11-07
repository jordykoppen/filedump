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
    maxFileSize: {
      type: "string",
      short: "m",
      default: "1GB",
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
  -m, --maxFileSize <size>    Maximum file size (default: 1GB)
                              Supports: KB, MB, GB (e.g., 500MB, 2GB)
  -h, --help                  Show this help message

Examples:
  bun src/index.tsx
  bun src/index.tsx --port 8080
  bun src/index.tsx -p 8080 -d /var/files --db /var/db/files.db
  bun src/index.tsx -m 2GB     # Set max file size to 2GB
  bun src/index.tsx -m 500MB   # Set max file size to 500MB
`);
  process.exit(0);
}

export default cliArguments;
