import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sectionPath = new URL(
  "../app/_components/ServicesSection.tsx",
  import.meta.url,
);
const iconPath = new URL("../components/Icon.tsx", import.meta.url);

test("landing services render the shared six-category collection", async () => {
  const source = await readFile(sectionPath, "utf8");

  assert.doesNotMatch(source, /"use client"/);
  assert.match(source, /import Link from "next\/link"/);
  assert.match(source, /import \{ services \} from "\.\.\/_content\/services"/);
  assert.match(source, /getOrderDirectServiceHref/);
  assert.doesNotMatch(source, /useState|OrderConsultDialog/);
  assert.doesNotMatch(source, /@repo\/supabase/);
  assert.doesNotMatch(source, /createUserSupabaseClient/);
  assert.doesNotMatch(source, /listPublishedProducts/);
  assert.doesNotMatch(source, /loadLandingServices/);
  assert.match(source, /\{services\.map\(\(service\) =>/);
  assert.match(source, /href=\{getOrderDirectServiceHref\(service\.id\)\}/);
  assert.match(source, /<Link[\s\S]*?className=\{styles\.serviceCard\}/);
  assert.match(
    source,
    /<span style=\{serviceButtonStyle\}>[\s\S]*?정찰제 즉시결제/,
  );
  assert.doesNotMatch(source, /quoteButtonStyle|견적 후 주문\(카카오톡\)/);
  assert.match(source, /className=\{styles\.serviceConsultCard\}/);
});

test("camera icon keeps the supplied Figma glyph", async () => {
  const source = await readFile(iconPath, "utf8");
  const cameraBlock = source.slice(
    source.indexOf("function CameraIcon"),
    source.indexOf("function CreditCardIcon"),
  );

  assert.match(cameraBlock, /viewBox="0 0 22 18"/);
  assert.match(cameraBlock, /height=\{\(size \* 18\) \/ 24\}/);
  assert.match(cameraBlock, /width=\{\(size \* 22\) \/ 24\}/);
  assert.match(cameraBlock, /d="M14\.0217 1\.28239/);
  assert.match(cameraBlock, /stroke="currentColor"/);
  assert.match(cameraBlock, /strokeWidth="2"/);
  assert.match(cameraBlock, /<circle[\s\S]*?cx="11"/);
  assert.match(cameraBlock, /cy="10\.5"/);
  assert.match(cameraBlock, /r="3"/);
});
