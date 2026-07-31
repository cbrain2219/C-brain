import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const faqContentPath = new URL("../app/_content/faqs.ts", import.meta.url);

test("FAQ answers keep the approved wording", async () => {
  const source = await readFile(faqContentPath, "utf8");

  const approvedCopy = [
    "씨브레인 홈페이지에서 원하는 제품 카테고리를 선택해",
    "씨브레인 카카오톡 1:1 채널 상담으로 제품 종류·수량·기타사양·납기를 알려주시면",
    "정찰제 가격으로 운영하고 있어 홈페이지에서 사양을 선택하면",
    "브로슈어·리플렛 등 소량은 3~5일",
    "씨브레인에서 제작하는 모든 홍보물은 전국 어디든",
    "씨브레인은 경기도 성남시 중원구 사기막골로 99",
    "씨브레인은 박람회·전시회 홍보물 제작 경험이 풍부하며",
    "씨브레인은 기획·디자인·인쇄를 원스톱으로 제공합니다.",
    "씨브레인에서 두 가지 모두 제작 가능합니다.",
    'answer: "표기 방식만 다를 뿐 동일한 인쇄물입니다."',
    "씨브레인 본사는 경기도 성남시 중원구에",
    "씨브레인은 기획·디자인·인쇄를 한 곳에서 원스톱으로 처리하기 때문에",
    "일정 관리도 저희가 한 곳에서 책임지기 때문에 납기 지연 리스크가 낮습니다.",
    "씨브레인은 2000년 설립 이후 26년간",
    "씨브레인은 2010년부터 코리아나라장터엑스포와",
  ];

  for (const copy of approvedCopy) {
    assert.ok(source.includes(copy), `Missing approved FAQ copy: ${copy}`);
  }

  assert.doesNotMatch(source, /브로슈어, 리플렛 등 소량은 3~5일/);
  assert.doesNotMatch(
    source,
    /브로슈어·브로셔, 카탈로그·카달로그 모두 제작 가능합니다\./,
  );
  assert.doesNotMatch(
    source,
    /일정 관리도 씨브레인 한 곳에서 책임지기 때문에 납기 지연 리스크가 줄어듭니다\./,
  );
});
