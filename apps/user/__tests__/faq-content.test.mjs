import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const faqContentPath = new URL("../app/_content/faqs.ts", import.meta.url);

test("FAQ answers do not start sentences with the company name", async () => {
  const source = await readFile(faqContentPath, "utf8");

  assert.match(
    source,
    /"홈페이지에서 원하는 제품 카테고리를 선택해 사양·수량을 고르면 즉시 카드결제로 주문하실 수 있습니다\./,
  );
  assert.match(
    source,
    /"신용카드 즉시결제와 계좌이체를 지원합니다\./,
  );
  assert.match(
    source,
    /"사용 가능한 후가공 옵션은 유광 코팅, 무광 코팅, UV 코팅, 에폭시, 금박·은박 등이 있습니다\./,
  );
  assert.match(
    source,
    /"카카오톡 1:1 채널 상담으로 제품 종류·수량·기타사양·납기를 알려주시면 빠르게 견적을 드립니다\./,
  );

  assert.doesNotMatch(source, /answer:\s*\n?\s*"씨브레인/);
});
