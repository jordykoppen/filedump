import { z } from "zod";

export type BunStoreFile = z.infer<typeof BunStoreFile>;
export const BunStoreFile = z.object({
  name: z.string().describe("Name of the file"),
  mimeType: z.string().describe("MIME type of the file"),
  hash: z.string().describe("Hash of the file content"),
  path: z.string().describe("Path to the file on disk"),
  size: z.number().describe("Size of the file in bytes"),
  createdAt: z.string().describe("ISO timestamp of when the file was created"),
});

export type APISaveFileInput = z.infer<typeof APISaveFileInput>;
export const APISaveFileInput = z.object({
  file: z.file(),
});

export type APIGetFileInput = z.infer<typeof APIGetFileInput>;
export const APIGetFileInput = z.object({
  hash: z.string(),
});
