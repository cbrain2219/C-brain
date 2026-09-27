import "server-only";

import { createHash } from "node:crypto";
import { promisify } from "node:util";
import { gzip, gunzip } from "node:zlib";
import { unstable_cache } from "next/cache";

const compress = promisify(gzip);
const decompress = promisify(gunzip);

export type PublicContentEntity = "blog" | "portfolio";

export function publicContentListTag(entity: PublicContentEntity) {
  return `public-content:${entity}:list`;
}

export function publicContentDetailTag(
  entity: PublicContentEntity,
  slug: string,
) {
  return `public-content:${entity}:${createHash("sha256").update(slug).digest("hex")}`;
}

export async function readCachedPublicContent<T>(
  entity: PublicContentEntity,
  slug: string | null,
  read: () => Promise<T>,
) {
  const tag =
    slug === null
      ? publicContentListTag(entity)
      : publicContentDetailTag(entity, slug);
  // ponytail: compressed entries still have Next's 2 MB limit; split entries if real content exceeds it.
  const compressed = await unstable_cache(
    async () =>
      (await compress(JSON.stringify(await read()))).toString("base64"),
    ["public-content-v2", process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", tag],
    { revalidate: 86_400, tags: [tag] },
  )();
  return JSON.parse(
    (await decompress(Buffer.from(compressed, "base64"))).toString("utf8"),
  ) as T;
}
