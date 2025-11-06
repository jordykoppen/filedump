import { BunStoreFile } from "@/schemas";
import { Database } from "bun:sqlite";
import cliArguments from "./cliArguments";

export const database = new Database(cliArguments.db);

database.run(`
  CREATE TABLE IF NOT EXISTS files (
    hash TEXT PRIMARY KEY,
    name TEXT,
    mimeType TEXT,
    path TEXT,
    size INTEGER,
    createdAt TEXT
  )
`);

export function getAllFiles(): BunStoreFile[] {
  return database.prepare<BunStoreFile, any>("SELECT * FROM files").all();
}

export function checkFileExists(hash: string): boolean {
  const result = database
    .prepare<{ count: number }, string>(
      "SELECT COUNT(*) as count FROM files WHERE hash = ?"
    )
    .get(hash);

  if (!result) {
    return false;
  }

  return result.count > 0;
}

export function getFileByHash(hash: string): BunStoreFile | undefined {
  return (
    database
      .prepare<BunStoreFile, string>("SELECT * FROM files WHERE hash = ?")
      .get(hash) ?? undefined
  );
}

export function insertFileMetadata(input: BunStoreFile): BunStoreFile {
  database
    .prepare<BunStoreFile, [string, string, string, string, number, string]>(
      "INSERT INTO files (name, mimeType, hash, path, size, createdAt) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(
      input.name,
      input.mimeType,
      input.hash,
      input.path,
      input.size,
      input.createdAt
    );

  return BunStoreFile.parse(
    database
      .prepare<BunStoreFile, string>("SELECT * FROM files WHERE hash = ?")
      .get(input.hash)
  );
}

export function deleteFileMetadataByHash(hash: string): void {
  database.prepare<void, string>("DELETE FROM files WHERE hash = ?").run(hash);
}
