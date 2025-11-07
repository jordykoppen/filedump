import { Database } from "bun:sqlite";
import cliArguments from "./cliArguments";
import { BunStoreFile } from "@filedump/shared";

let database: Database;

try {
  database = new Database(cliArguments.db);
  console.log(`✓ Database connected: ${cliArguments.db}`);
} catch (error) {
  console.error(`✗ Failed to connect to database: ${cliArguments.db}`, error);
  throw new Error(
    `Database connection failed: ${
      error instanceof Error ? error.message : "Unknown error"
    }`
  );
}

try {
  database.run(`
    CREATE TABLE IF NOT EXISTS files (
      hash TEXT PRIMARY KEY,
      name TEXT,
      mimeType TEXT,
      path TEXT,
      size INTEGER,
      createdAt TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_createdAt ON files(createdAt DESC);
  `);
  console.log("✓ Database schema initialized");
} catch (error) {
  console.error("✗ Failed to initialize database schema", error);
  throw new Error(
    `Database schema initialization failed: ${
      error instanceof Error ? error.message : "Unknown error"
    }`
  );
}

export { database };

export function getAllFiles(): BunStoreFile[] {
  try {
    return database.prepare<BunStoreFile, any>("SELECT * FROM files").all();
  } catch (error) {
    console.error("Database error in getAllFiles:", error);
    throw new Error(
      `Failed to retrieve files: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export function checkFileExists(hash: string): boolean {
  try {
    const result = database
      .prepare<{ count: number }, string>(
        "SELECT COUNT(*) as count FROM files WHERE hash = ?"
      )
      .get(hash);

    if (!result) {
      return false;
    }

    return result.count > 0;
  } catch (error) {
    console.error("Database error in checkFileExists:", error);
    throw new Error(
      `Failed to check file existence: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export function getFileByHash(hash: string): BunStoreFile | undefined {
  try {
    return (
      database
        .prepare<BunStoreFile, string>("SELECT * FROM files WHERE hash = ?")
        .get(hash) ?? undefined
    );
  } catch (error) {
    console.error("Database error in getFileByHash:", error);
    throw new Error(
      `Failed to get file by hash: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export function insertFileMetadata(input: BunStoreFile): BunStoreFile {
  try {
    const result = database
      .prepare<BunStoreFile, [string, string, string, string, number, string]>(
        "INSERT INTO files (name, mimeType, hash, path, size, createdAt) VALUES (?, ?, ?, ?, ?, ?) RETURNING *"
      )
      .get(
        input.name,
        input.mimeType,
        input.hash,
        input.path,
        input.size,
        input.createdAt
      );

    return BunStoreFile.parse(result);
  } catch (error) {
    console.error("Database error in insertFileMetadata:", error);
    throw error; // Re-throw to preserve PRIMARY KEY constraint error for duplicate detection
  }
}

export function deleteFileMetadataByHash(hash: string): void {
  try {
    database
      .prepare<void, string>("DELETE FROM files WHERE hash = ?")
      .run(hash);
  } catch (error) {
    console.error("Database error in deleteFileMetadataByHash:", error);
    throw new Error(
      `Failed to delete file metadata: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export function closeDatabase(): void {
  try {
    database.close();
    console.log("✓ Database connection closed");
  } catch (error) {
    console.error("✗ Failed to close database connection:", error);
  }
}
