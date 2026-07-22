import { requireAdmin } from "./auth.ts";
import { assertSupabaseSuccess, unwrapSupabaseData } from "./result.ts";
import type { CBrainSupabaseClient } from "./server.ts";

export const STORAGE_BUCKETS = {
  privateAttachments: "private-attachments",
  publicAssets: "public-assets",
} as const;

export type StorageBucket =
  (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];
export type UploadBody = ArrayBuffer | Blob | FormData | string;

export function createStoragePath(scope: string, fileName: string) {
  const safeScope = scope
    .split("/")
    .map((segment) => segment.replace(/[^a-zA-Z0-9_-]/g, ""))
    .filter(Boolean)
    .join("/");
  const extension = (fileName.includes(".") ? fileName.split(".").pop() : "")
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  if (!safeScope) throw new Error("A storage scope is required.");

  return `${safeScope}/${crypto.randomUUID()}.${extension || "bin"}`;
}

export async function uploadFile(
  client: CBrainSupabaseClient,
  bucket: StorageBucket,
  path: string,
  body: UploadBody,
  options?: {
    contentType?: string;
    upsert?: boolean;
  },
) {
  const { data, error } = await client.storage
    .from(bucket)
    .upload(path, body, options);

  return unwrapSupabaseData(data, error);
}

export async function createSignedFileUrl(
  client: CBrainSupabaseClient,
  bucket: StorageBucket,
  path: string,
  expiresInSeconds = 60 * 10,
) {
  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);

  return unwrapSupabaseData(data, error);
}

export async function createSignedFileUpload(
  client: CBrainSupabaseClient,
  bucket: StorageBucket,
  path: string,
) {
  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUploadUrl(path);

  return unwrapSupabaseData(data, error);
}

export async function getFileInfo(
  client: CBrainSupabaseClient,
  bucket: StorageBucket,
  path: string,
): Promise<{ contentType?: string; size?: number }> {
  const { data, error } = await client.storage.from(bucket).info(path);

  return unwrapSupabaseData(data, error);
}

export function getPublicAssetUrl(
  client: CBrainSupabaseClient,
  path: string,
) {
  return getPublicFileUrl(client, STORAGE_BUCKETS.publicAssets, path);
}

export function createPrivateAttachmentUrl(
  client: CBrainSupabaseClient,
  path: string,
  expiresInSeconds = 60 * 10,
) {
  return createSignedFileUrl(
    client,
    STORAGE_BUCKETS.privateAttachments,
    path,
    expiresInSeconds,
  );
}

export function getPublicFileUrl(
  client: CBrainSupabaseClient,
  bucket: StorageBucket,
  path: string,
) {
  return client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export async function deleteFiles(
  client: CBrainSupabaseClient,
  bucket: StorageBucket,
  paths: string[],
) {
  await requireAdmin(client);

  const { error } = await client.storage.from(bucket).remove(paths);

  assertSupabaseSuccess(error);
}
