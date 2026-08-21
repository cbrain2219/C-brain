import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

const read = (relativePath) =>
  readFileSync(path.join(repoRoot, relativePath), "utf8");

const normalizeWhitespace = (value) => value.replace(/\s+/g, " ");

const legalRoutes = {
  privacyCollection: {
    articleTitles: [
      "제1조 (수집하는 개인정보 항목)",
      "제2조 (개인정보의 수집 및 이용 목적)",
      "제3조 (개인정보의 보유 및 이용 기간)",
      "제4조 (개인정보의 제3자 제공)",
      "제5조 (이용자의 권리)",
      "제6조 (동의 거부 권리 및 불이익)",
    ],
    path: "apps/user/app/(site)/privacy-collection/page.tsx",
    title: "개인정보 수집 및 이용 동의",
  },
  privacyPolicy: {
    articleTitles: [
      "제1조 (개인정보처리방침의 목적)",
      "제2조 (개인정보의 수집 항목 및 수집 방법)",
      "제3조 (개인정보의 수집 및 이용 목적)",
      "제4조 (개인정보의 보유 및 이용 기간)",
      "제5조 (개인정보의 제3자 제공)",
      "제6조 (개인정보 처리의 위탁)",
      "제7조 (개인정보의 파기)",
      "제8조 (이용자의 권리와 행사 방법)",
      "제9조 (개인정보의 안전성 확보 조치)",
      "제10조 (개인정보 보호책임자)",
      "제11조 (개인정보처리방침의 변경)",
    ],
    path: "apps/user/app/(site)/privacy-policy/page.tsx",
    title: "개인정보처리방침",
  },
  refundPolicy: {
    articleTitles: [
      "제1조 (목적)",
      "제2조 (취소 규정)",
      "제3조 (환불 기준)",
      "제4조 (파손 상품 처리 절차)",
      "제5조 (환불 처리 기한)",
      "제6조 (환불 신청 방법)",
      "제7조 (분쟁 해결)",
    ],
    path: "apps/user/app/(site)/refund-policy/page.tsx",
    title: "취소 및 환불 규정",
  },
  terms: {
    articleTitles: [
      "제1조 (목적)",
      "제2조 (정의)",
      "제3조 (약관의 효력 및 변경)",
      "제4조 (서비스의 내용)",
      "제5조 (주문 및 계약 성립)",
      "제6조 (결제)",
      "제7조 (이용자의 콘텐츠 책임)",
      "제8조 (교정 및 최종 확인)",
      "제9조 (배송)",
      "제10조 (취소 및 환불)",
      "제11조 (지식재산권)",
      "제12조 (서비스의 중단)",
      "제13조 (면책 조항)",
      "제14조 (분쟁 해결)",
    ],
    path: "apps/user/app/(site)/terms/page.tsx",
    title: "이용약관",
  },
};

test("all four approved legal documents have complete public routes", () => {
  for (const [key, route] of Object.entries(legalRoutes)) {
    assert.equal(existsSync(path.join(repoRoot, route.path)), true, key);

    const source = read(route.path);

    assert.match(source, new RegExp(route.title));
    assert.match(source, new RegExp(`createPageMetadata\\("${key}"\\)`));
    assert.match(
      source,
      new RegExp(`createStaticPageStructuredData\\("${key}"\\)`),
    );
    assert.match(source, /<LegalDocument/);

    for (const articleTitle of route.articleTitles) {
      assert.ok(source.includes(articleTitle), `${key}: ${articleTitle}`);
    }
  }
});

test("approved legal wording, tables, warnings, and addenda are preserved", () => {
  const terms = read(legalRoutes.terms.path);
  const privacyCollection = read(legalRoutes.privacyCollection.path);
  const privacyPolicy = read(legalRoutes.privacyPolicy.path);
  const refundPolicy = read(legalRoutes.refundPolicy.path);

  assert.match(terms, /전자상거래 등에서의 소비자보호에 관한 법률/);
  assert.match(terms, /기본 수정 횟수는 총 5회/);
  assert.match(terms, /사업자등록번호: 120-07-84415/);
  assert.match(terms, /본 약관은 2025년 1월 1일부터 시행합니다/);

  assert.match(privacyCollection, /나이스페이먼츠 결제 모듈/);
  assert.match(privacyCollection, /배송 완료 후 즉시 파기/);
  assert.match(privacyCollection, /필수 항목에 대한 동의를 거부하는 경우/);
  assert.ok(
    (privacyCollection.match(/<LegalTable/g) ?? []).length >= 4,
    "privacy collection tables",
  );

  assert.match(privacyPolicy, /개인정보 침해신고센터/);
  assert.match(privacyPolicy, /정혜영 \(대표\)/);
  assert.match(
    normalizeWhitespace(privacyPolicy),
    /복구 및 재생이 불가능한 방법으로 영구 삭제/,
  );
  assert.ok(
    (privacyPolicy.match(/<LegalTable/g) ?? []).length >= 5,
    "privacy policy tables",
  );

  assert.match(refundPolicy, /결제 금액 100% 환불/);
  assert.match(refundPolicy, /영업일 기준\s*<strong>3~5일 이내<\/strong>/);
  assert.match(refundPolicy, /박스·송장·인쇄물 원물을 보존한 경우에만/);
  assert.match(refundPolicy, /본 규정은 2025년 1월 1일부터 시행합니다/);
});

test("footer policy navigation points to public legal routes", () => {
  const footer = read("apps/user/app/_components/Footer.tsx");

  assert.match(footer, /href: "\/terms", label: "이용약관"/);
  assert.match(
    footer,
    /href: "\/privacy-policy", isStrong: true, label: "개인정보처리방침"/,
  );
  assert.match(footer, /href: "\/refund-policy", label: "취소 및 환불 규정"/);
  assert.doesNotMatch(footer, /href: "#"/);
  assert.match(footer, /<Link[\s\S]*?href=\{policy\.href\}/);
});

test("shared legal layout follows responsive reading and table rules", () => {
  const component = read("apps/user/app/(site)/_components/LegalDocument.tsx");
  const styles = read(
    "apps/user/app/(site)/_components/LegalDocument.module.css",
  );

  assert.match(component, /export function LegalDocument/);
  assert.match(component, /export function LegalTable/);
  assert.match(component, /<header className=\{styles\.legalHeader\}>/);
  assert.match(component, /className=\{styles\.tableScroller\}/);
  assert.match(styles, /var\(--site-page-top-offset, 124px\)/);
  assert.match(styles, /font-family: var\(--font-sans\)/);
  assert.match(styles, /letter-spacing: -0\.015em/);
  assert.match(styles, /overflow-x: auto/);
  assert.match(styles, /min-width: 560px/);
  assert.match(styles, /@media \(min-width: 640px\)/);
});
