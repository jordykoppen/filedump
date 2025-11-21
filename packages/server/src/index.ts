import cliArguments from "./utils/cliArguments";
import { serve } from "bun";
import index from "./index.html";
import { APIGetFileInput, parseFileSize } from "@filedump/shared";
import {
  checkFileExists,
  deleteFileMetadataByHash,
  getAllFiles,
  getFileByHash,
  insertFileMetadata,
  closeDatabase,
} from "./utils/database";

const maxFileSizeBytes = parseFileSize(cliArguments.maxFileSize);
console.log(
  `✓ Max file size: ${cliArguments.maxFileSize} (${maxFileSizeBytes} bytes)`
);

const server = serve({
  port: parseInt(cliArguments.port, 10),
  maxRequestBodySize: maxFileSizeBytes,
  routes: {
    "/*": index,
    "/api/files": {
      async GET(request) {
        return Response.json(getAllFiles());
      },
    },
    "/api/file": {
      async POST(request) {
        try {
          const fileName = request.headers.get("X-Filename");
          const fileType = request.headers.get("Content-Type");

          if (!fileName) {
            return new Response("Missing X-Filename header", { status: 400 });
          }

          if (!fileType) {
            return new Response("Missing Content-Type header", { status: 400 });
          }

          if (!request.body) {
            return new Response("Missing request body", { status: 400 });
          }

          // Write directly to the destination path (no temp file, no rename)
          const finalPath = `${cliArguments.fileDirectory}/${fileName}`;

          // Preflight: do not overwrite existing files with same name
          if (await Bun.file(finalPath).exists()) {
            return new Response("File already exists at destination", {
              status: 409,
            });
          }

          // Stream the file directly to disk without buffering in memory
          let totalBytes = 0;
          const fileWriter = Bun.file(finalPath).writer();
          const reader = request.body!.getReader();

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              totalBytes += value.byteLength;
              if (totalBytes > maxFileSizeBytes) {
                reader.releaseLock();
                fileWriter.end();
                // Delete the partially written file
                await Bun.file(finalPath).delete();
                return new Response("File size exceeds maximum limit", {
                  status: 413,
                });
              }

              fileWriter.write(value);
            }
          } finally {
            reader.releaseLock();
            fileWriter.end();
          }

          // Hash the file after it's written to disk (streaming from disk)
          const hasher = new Bun.CryptoHasher("sha256");
          const file = Bun.file(finalPath);
          const fileStream = file.stream();
          const fileReader = fileStream.getReader();

          try {
            while (true) {
              const { done, value } = await fileReader.read();
              if (done) break;
              hasher.update(value);
            }
          } finally {
            fileReader.releaseLock();
          }

          const fileHash = hasher.digest("hex");

          // Try to insert metadata; if hash already exists, just return the existing record without removing/renaming anything
          let insertedFileMetadata;
          try {
            insertedFileMetadata = insertFileMetadata({
              name: fileName,
              hash: fileHash,
              mimeType: fileType,
              path: finalPath,
              createdAt: new Date().toISOString(),
              size: totalBytes,
            });
          } catch (dbError) {
            const existing = getFileByHash(fileHash);
            if (existing) {
              console.log(
                `[UPLOAD DUPLICATE] kept new file at ${finalPath}, existing hash ${fileHash.slice(
                  0,
                  8
                )}...`
              );

              return Response.json(existing);
            }
            throw dbError;
          }

          console.log(
            `[UPLOAD] ${fileName} (${fileHash.slice(
              0,
              8
            )}...) - ${totalBytes} bytes`
          );

          return Response.json(insertedFileMetadata);
        } catch (error) {
          console.error("File upload error:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Invalid file data";
          return new Response(errorMessage, { status: 400 });
        }
      },
    },
    "/api/file/:hash": {
      async GET(request) {
        try {
          const { hash } = APIGetFileInput.parse(request.params);
          const fileRecord = getFileByHash(hash);

          if (!fileRecord) {
            return new Response("File not found", { status: 404 });
          }

          console.log(
            `[DOWNLOAD] ${fileRecord.name} (${hash.slice(0, 8)}...) - ${
              fileRecord.size
            } bytes`
          );

          const file = Bun.file(fileRecord.path);

          return new Response(file, {
            headers: {
              "Content-Disposition": `attachment; filename="${fileRecord.name}"`,
              "Content-Type": fileRecord.mimeType || "application/octet-stream",
              "Content-Length": fileRecord.size.toString(),
            },
          });
        } catch (error) {
          console.error("File download error:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Invalid request";
          return new Response(errorMessage, { status: 400 });
        }
      },
      async DELETE(request) {
        try {
          const { hash } = APIGetFileInput.parse(request.params);
          const fileRecord = getFileByHash(hash);

          if (!fileRecord) {
            return new Response("File not found", { status: 404 });
          }

          // Delete metadata first, then file to avoid orphaned metadata
          deleteFileMetadataByHash(hash);

          await Bun.file(fileRecord.path).delete();

          console.log(
            `[DELETE] ${fileRecord.name} (${hash.slice(0, 8)}...) - ${
              fileRecord.size
            } bytes`
          );

          return new Response("File deleted", { status: 200 });
        } catch (error) {
          console.error("File deletion error:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Invalid request";
          return new Response(errorMessage, { status: 400 });
        }
      },
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);

// Graceful shutdown handlers
function gracefulShutdown(signal: string) {
  console.log(`\n${signal} received, closing database connection...`);
  closeDatabase();
  process.exit(0);
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
