import type { JsonLdData } from "../_content/structured-data";

export function stringifyJsonLd(data: JsonLdData) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function JsonLdScript({ data }: { data: JsonLdData }) {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: stringifyJsonLd(data),
      }}
      type="application/ld+json"
    />
  );
}
