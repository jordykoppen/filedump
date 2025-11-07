import zod from "zod";

export type BunStoreFile = zod.infer<typeof BunStoreFile>;
export const BunStoreFile = zod.object({
  name: zod.string().describe("Name of the file"),
  mimeType: zod.string().describe("MIME type of the file"),
  hash: zod.string().describe("Hash of the file content"),
  path: zod.string().describe("Path to the file on disk"),
  size: zod.number().describe("Size of the file in bytes"),
  createdAt: zod
    .string()
    .describe("ISO timestamp of when the file was created"),
});

export type APISaveFileInput = zod.infer<typeof APISaveFileInput>;
export const APISaveFileInput = zod.object({
  file: zod.file(),
});

export type APIGetFileInput = zod.infer<typeof APIGetFileInput>;
export const APIGetFileInput = zod.object({
  hash: zod.string(),
});
