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
} from "./utils/database";

const server = serve({
  fetch: (req) => {
    console.log(`Unhandled request: ${req.method} ${req.url}`);
    return new Response("Not Found", { status: 404 });
  },
  port: parseInt(cliArguments.port, 10),
  maxRequestBodySize: 1024 * 1024 * 1024, // 1 GB
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
          const formData = await request.formData();
          const { file } = APISaveFileInput.parse({
            file: formData.get("file"),
          });

          const arrayBuffer = await file.arrayBuffer();
          const fileHash = await hashFile(arrayBuffer);

          const fileExists = checkFileExists(fileHash);

          if (fileExists) {
            return new Response("File already exists", { status: 409 });
          }

          const path = `${cliArguments.fileDirectory}/${fileHash}`;

          await Bun.write(path, arrayBuffer);

          const insertedFileMetadata = insertFileMetadata({
            name: file.name,
            hash: fileHash,
            mimeType: file.type,
            path,
            createdAt: new Date().toISOString(),
            size: file.size,
          });

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
