import cliArguments from "./utils/cliArguments";
import { serve } from "bun";
import index from "./index.html";
import { APIGetFileInput, APISaveFileInput } from "./schemas";
import { hashFile } from "./utils/crypto";
import {
  checkFileExists,
  deleteFileMetadataByHash,
  getAllFiles,
  getFileByHash,
  insertFileMetadata,
  closeDatabase,
} from "./utils/database";
import { parseFileSize } from "./utils/parseFileSize";

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
    // raw binary. not multipart/form-data
    "/api/file": {
      async POST(request) {
        try {
          const arrayBuffer = await request.arrayBuffer();
          const fileName = request.headers.get("X-Filename");
          const fileType = request.headers.get("Content-Type");

          if (!fileName) {
            return new Response("Missing X-Filename header", { status: 400 });
          }

          if (!fileType) {
            return new Response("Missing Content-Type header", { status: 400 });
          }

          if (arrayBuffer.byteLength > maxFileSizeBytes) {
            return new Response("File size exceeds maximum limit", {
              status: 413,
            });
          }

          const fileHash = await hashFile(arrayBuffer);
          const path = `${cliArguments.fileDirectory}/${fileHash}`;

          // Try to insert metadata first to prevent race condition
          // If another request already inserted this hash, the PRIMARY KEY constraint will fail
          let insertedFileMetadata;
          try {
            insertedFileMetadata = insertFileMetadata({
              name: fileName,
              hash: fileHash,
              mimeType: fileType,
              path,
              createdAt: new Date().toISOString(),
              size: arrayBuffer.byteLength,
            });
          } catch (dbError) {
            // Check if duplicate file already exists
            if (checkFileExists(fileHash)) {
              return new Response("File already exists", { status: 409 });
            }
            // If not a duplicate, re-throw the error
            throw dbError;
          }

          // Only write file after successful database insert
          await Bun.write(path, arrayBuffer);

          console.log(
            `[UPLOAD] ${fileName} (${fileHash.slice(0, 8)}...) - ${
              arrayBuffer.byteLength
            } bytes`
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

          return new Response(Bun.file(fileRecord.path), {
            headers: {
              "Content-Disposition": `attachment; filename="${fileRecord.name}"`,
              "Content-Type": fileRecord.mimeType || "application/octet-stream",
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
