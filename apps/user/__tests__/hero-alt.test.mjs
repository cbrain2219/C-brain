import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const paths = {
  blog: new URL("../app/(site)/blog/page.tsx", import.meta.url),
  pageHeroStyles: new URL("../components/PageHero.module.css", import.meta.url),
  landing: new URL("../app/_components/Hero.tsx", import.meta.url),
  notice: new URL("../app/(site)/notice/page.tsx", import.meta.url),
  pageHero: new URL("../components/PageHero.tsx", import.meta.url),
  portfolio: new URL("../app/(site)/portfolio/page.tsx", import.meta.url),
  about: new URL("../app/(site)/about/page.tsx", import.meta.url),
  reviews: new URL("../app/(site)/reviews/page.tsx", import.meta.url),
  order: new URL("../app/(site)/order/page.tsx", import.meta.url),
};

test("shared PageHero requires descriptive background alternative text", async () => {
  const source = await readFile(paths.pageHero, "utf8");

  assert.match(source, /backgroundAlt: string/);
  assert.match(source, /alt=\{backgroundAlt\}/);
});

test("page hero images expose the requested alternative text", async () => {
  const expectedAltByPage = [
    [
      paths.landing,
      "backgroundAlt=\"편집디자인 전문회사 씨브레인 브랜드 이미지\"",
    ],
    [
      paths.portfolio,
      "alt=\"MBC 베이비페어 박람회 포스터 디자인 및 인쇄 제작 사례, 핑크 톤 베이비 일러스트가 돋보이는 행사 홍보물\"",
    ],
    [
      paths.blog,
      "backgroundAlt=\"대전화병원 브로슈어 디자인 및 인쇄 제작 사례, 화이트 톤 표지와 병원 외관 사진을 활용한 내지 구성\"",
    ],
    [paths.notice, "backgroundAlt=\"편집디자인 전문회사 씨브레인 로고\""],
    [paths.about, "alt=\"편집디자인 전문회사 씨브레인 로고\""],
    [
      paths.reviews,
      "alt=\"씨브레인 편집디자인 팀이 고객 브로슈어 시안을 함께 검토하는 사무실 장면\"",
    ],
    [
      paths.order,
      "alt=\"씨브레인 팀원들이 화이트보드 앞에서 디자인 컨셉과 레이아웃을 논의하는 기획 회의 장면\"",
    ],
  ];

  for (const [path, expectedAlt] of expectedAltByPage) {
    const source = await readFile(path, "utf8");

    assert.ok(source.includes(expectedAlt), `${path.pathname} should include ${expectedAlt}`);
  }
});

test("shared page hero keeps frame padding without a fixed hero height", async () => {
  const stylesSource = await readFile(paths.pageHeroStyles, "utf8");
  const foldMediaStart = stylesSource.indexOf("@media (min-width: 640px)");
  const desktopMediaStart = stylesSource.indexOf("@media (min-width: 1080px)");
  const pcMediaStart = stylesSource.indexOf(
    "@media (min-width: 1440px)",
    desktopMediaStart,
  );

  assert.notEqual(foldMediaStart, -1);
  assert.notEqual(desktopMediaStart, -1);
  assert.notEqual(pcMediaStart, -1);

  const foldMediaStyles = stylesSource.slice(foldMediaStart, desktopMediaStart);
  const desktopMediaStyles = stylesSource.slice(desktopMediaStart, pcMediaStart);
  const pcMediaStyles = stylesSource.slice(pcMediaStart);

  assert.doesNotMatch(stylesSource, /\.hero(?:\.subpage|\.landing)?\s*\{[^}]*min-height:/);
  assert.match(
    stylesSource,
    /\.content\s*\{[\s\S]*?padding:\s*104px 20px;/,
  );
  assert.match(
    foldMediaStyles,
    /\.subpage \.content\s*\{[\s\S]*?width:\s*min\(100%, 640px\);[\s\S]*?padding:\s*136px 20px 72px;/,
  );
  assert.match(
    foldMediaStyles,
    /\.landing \.content\s*\{[\s\S]*?padding:\s*136px 20px 72px;/,
  );
  assert.match(
    desktopMediaStyles,
    /\.subpage \.content\s*\{[\s\S]*?width:\s*min\(100%, 1080px\);[\s\S]*?padding:\s*152px 80px 72px;/,
  );
  assert.match(
    desktopMediaStyles,
    /\.landing \.content\s*\{[\s\S]*?padding:\s*152px 80px 72px;/,
  );
  assert.match(
    pcMediaStyles,
    /\.subpage \.content\s*\{[\s\S]*?width:\s*1360px;[\s\S]*?padding:\s*184px 0 104px;/,
  );
  assert.match(
    pcMediaStyles,
    /\.landing \.content\s*\{[\s\S]*?padding-top:\s*184px;[\s\S]*?padding-bottom:\s*104px;/,
  );
});
