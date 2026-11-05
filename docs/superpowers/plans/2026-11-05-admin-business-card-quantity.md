# 관리자 명함 기본 수량 삭제·재질 표기·수량표 수정계획

> **구현 담당자:** 구현 시 `superpowers:executing-plans`를 사용한다. 현재 요청은 계획 재작성이다. 와이어프레임 검토 후 사용자가 구현을 명시적으로 승인하기 전에는 구현 코드와 테스트 코드를 변경하지 않는다.

**목표:** 명함의 기본 수량 영역을 삭제하고 후속 번호를 앞당긴다. 재질명에 수량을 표시하고, 맨 아래에 수량·인쇄 단가·합계 입력 표를 추가한다.

**구조:** 기존 `OptionValuesEditor`, `QuantityPriceEditor`, 번호 생성 함수를 재사용한다. 기존 두께와 인원 항목은 유지한다. 재질명 수량과 하단 수량 선택을 둘 다 표시한다.

**기술:** React 19, TypeScript, Vite 관리자, Next.js 사용자 사이트, `@repo/supabase` 공유 상품 모델, Postgres JSONB, Node 테스트.

**현재 상태:** 2026-11-05 사용자가 관리자·유저의 ①·② 구현을 승인했다. 재질·두께 조합별 가격표와 첨부 초기값을 확인받아 구현했다. ③ 디자인비·기획비 고정 규칙은 새 표에서도 유지한다. 아래 계획의 승인 전 확인 사항은 후속 확정 내용과 실행 결과를 기준으로 해소했다.

**근거:** 최신 첨부 `codex-clipboard-6a2ddba6-8823-43d3-9ac9-bd1256f54758.png`, `AGENTS.md`, `design.md`. 첨부의 Notion 속성·상태·편집 안내는 제품 요구사항에 포함하지 않는다. 계획 재작성은 구현·운영 데이터 수정 승인이 아니다.

**현재·수정안 비교:** 한 장에 현재 Desktop과 수정안 Desktop을 나란히 표시한다. 현재는 코드·시드 기준이며 운영 화면 캡처가 아니다. Mobile은 확인 필요로 표시한다.

![명함 설정 현재·수정안 비교](/Users/sangkun/.codex/visualizations/2026/11/05/01a1aa2b-5579-7f83-9760-7cd6396e43b4/admin-business-card-quantity-wireframe.png)

**유저 주문 화면 비교:** [Desktop·Mobile 수정 전/후 와이어프레임](/Users/sangkun/.codex/visualizations/2026/11/05/01a1aa2b-5579-7f83-9760-7cd6396e43b4/user-business-card-quantity-and-price-review.png). 빨간 ①은 기본 수량 삭제·재질명 수량 표기, ②는 수량표·주문 요약 반영, ③은 인원 변경 시 디자인비 고정·인쇄비만 증가하는 계산 수정을 가리킨다. 기존 컴포넌트 경계·치수는 회색, 신규 수량표 데이터의 미정 항목은 검정 확인 박스로 구분한다. 표시 규칙은 전역 `/Users/sangkun/.codex/AGENTS.md`에 저장했다. 현재는 코드·시드의 기본 선택 예시이며, 신규 표 값·행 수·선택 수량·금액은 확인 필요다.

유저 Mobile 비교본은 `order/page.module.css`의 기존 동작을 재사용한다. 옵션 아래 주문 요약과 `gap: 32px`, `top: 0; left: 0; height: 64px` 상단 헤더, `position: sticky; bottom: 0` 하단 결제, 기존 수량표의 `overflow-x: auto`를 표현한다. 새로운 모바일 동작은 추가하지 않으며, 유저 와이어프레임의 구현 승인은 별도로 확인한다.

## 공통 제약

- 변경 범위는 기본 수량 삭제, 후속 번호 조정, 재질명 수량 표기, 마지막 수량표다. 다른 상품·화면·문구·알림·상태·애니메이션은 변경하지 않는다.
- 재질명 수량과 하단 수량 입력은 둘 다 유지한다. 두 값의 일치 검사, 자동 동기화, 수량 제한을 추가하지 않는다.
- 기존 입력·선택·추가·삭제 방식과 공통 디자인을 재사용한다. 섹션 `gap: 32px`, 옵션·표·행 `gap: 8px`, 표 입력 높이 `44px`는 현재 CSS 기준이다. 미지정 치수와 모바일 배치는 추정하지 않는다.
- 합계는 기존 독립 입력값 `printAmount`를 사용한다. 수량 × 단가로 덮어쓰지 않는다. 사용자가 후속 답변으로 승인한 초기 행은 `500장 / 120원 / 40,000원`, `1,000장 / 90원 / 60,000원`이다. 각 재질·두께 조합은 이 두 행으로 시작하고 이후 독립적으로 편집한다. 신규 상품의 빈 폼은 기존 방식을 유지한다.
- 기존 작업·데이터를 보존한다. 브랜치 생성, 커밋, 배포, 운영 데이터 갱신, 시뮬레이터·에뮬레이터 실행은 현재 작업에 포함하지 않는다.

## 확정 변경

| 현재 | 수정안 | 근거 |
| --- | --- | --- |
| IV. 기본 수량 | 해당 영역 삭제 | `기본 수량 삭제` |
| V. 재질 선택 | IV. 재질 선택 + 재질명 수량 표기 | `삭제에 따라 번호 앞당기기`, `재질 선택에 수량 텍스트 추가` |
| VI. 두께 선택 | V. 두께 선택 | 기존 항목 유지, 순번 조정 |
| VII. 인원 선택 | VI. 인원 선택 | 기존 항목 유지, 순번 조정 |
| 별도 수량표 없음 | VII. 수량 선택: 수량 / 인쇄 단가(원/단위) / 합계(원) | `해당 방식으로 변경 맨 밑 순번`, `수량 2번 확인하는게 맞음` |

재질 문구는 아래와 같이 변경한다. 재질 옵션의 현재 순서·인덱스와 서비스 견적 연결은 유지한다. 첨부의 문구 추가 요청을 옵션 재정렬 요청으로 확대하지 않는다.

| 현재 | 수정안 |
| --- | --- |
| `일반지(스노우, 무광코팅)` | `일반지(스노우, 무광코팅, 500장)` |
| `고급지(랑데뷰)` | `고급지(랑데뷰 200장)` |

최종 상세 옵션 순서는 `III. 사이즈 → IV. 재질 선택 → V. 두께 선택 → VI. 인원 선택 → VII. 수량 선택`이다. 기존 명함의 두께·인원을 유지하고, 기본 수량 삭제 후 마지막에 표를 배치해 번호를 다시 계산한 순서다.

## 후속 확정과 검증 범위

1. **가격표 연결:** 사용자가 “조합별로 다른 가격표”로 확인했다. 인쇄 가격 축은 `['material', 'thickness']`이며, 첨부 두 행을 각 조합의 초기값으로 사용한다.
2. **주문 계산:** 기존 서비스 견적에서 포함 인쇄 기준 20,000원을 뺀 디자인비를 유지한다. 새 표의 독립 합계에 인원수만 곱하고, 기획비도 인원 변경으로 증가하지 않는다.
3. **기존 데이터 전환:** 운영 DB를 직접 수정하지 않았다. 이전 `baseQuantity`가 있고 표가 비어 있는 명함만 읽을 때 승인값으로 전환한다. 관리자 저장 시 `quantityTableVersion: 1`을 기록해 이후 삭제·편집한 표를 재생성하지 않는다. 기존 옵션 순서·견적키·보관 키·봉투는 보존한다.
4. **모바일:** 기존 CSS를 그대로 재사용한다. 관리자 Mobile 배치는 여전히 미정이며, 유저 Mobile의 별도 렌더링 검증은 도구가 폭 변경을 적용하지 않아 미검증이다. 시뮬레이터는 실행하지 않았다.

기본 수량 삭제, 기존 두께·인원 유지, 번호 조정, 재질명과 수량표의 수량 중복 표시는 최신 자료로 확정됐으므로 다시 확인 대상으로 남기지 않는다.

## 영향 파일

| 파일 | 역할과 변경 범위 |
| --- | --- |
| `packages/supabase/src/productConfiguration.ts` | 명함의 `baseQuantity` 섹션 제거, 마지막 `quantity-prices` 섹션 추가. 두께·인원은 유지. 가격 축·인원 배수·인쇄 포함값 변경은 확인 후 결정 |
| `apps/admin/src/pages/ProductFormFields.tsx`, `ProductFormSectionEditors.tsx`, `productFormUi.ts` | 기존 편집기와 번호 생성 재사용. 프로필 변경만으로 충족하면 수정하지 않음 |
| `apps/admin/src/pages/productFormPersistence.ts` | 기존 옵션·가격표 로드·저장·발행 검증 재사용. 기존 JSON의 보관 값과 알 수 없는 키를 임의로 삭제하지 않음 |
| `supabase/seed_products.sql` | 승인된 명함 재질 문구 반영 후보. 수량 문구를 중복 추가하지 않고 기존 순서·인덱스 유지. 새 가격은 승인 데이터가 있을 때만 반영 |
| `packages/supabase/src/productCatalog.ts` | 프로필을 공유하는 주문 파싱·시작 가격·합계 영향 검증. 사용자 적용 승인 전 주문 동작 변경을 확정하지 않음 |
| `apps/user/app/(site)/order/OrderOptionSelection.tsx`, `apps/user/app/api/orders/checkout/route.ts` | 기존 데이터 기반 옵션 표시·수량표·서버 금액 재계산 경로 검증 |
| `apps/user/lib/paymentAlimtalk.ts` | 과거 `baseQuantity × people`와 신규 `quantity.label` 스냅샷 호환성 검증 |
| `packages/supabase/scripts/sync-product-print-unit-prices.mjs` | 공유 가격 축 변경 시 영향 검증. 운영 동기화는 실행하지 않음 |

화면에서 기본 수량을 삭제하는 작업을 과거 주문·저장 데이터의 물리 삭제로 확대하지 않는다. 공용 `baseQuantity` 타입 키와 과거 주문 읽기 코드는 호환성에 필요하면 유지한다. 새 컴포넌트·API·의존성·barrel 파일은 현재 필요하지 않다.

## 검토 초점

| 조건 | 확인할 결과 | 담당 단계 |
| --- | --- | --- |
| 기본 수량 삭제 후 순번 | III 사이즈, IV 재질, V 두께, VI 인원, VII 수량이며 기존 두께·인원이 남음 | 작업 1 |
| 재질명 수량 추가 후 재저장 | 두 문구가 정확하고 수량 접미사가 중복되지 않으며 견적 연결 인덱스가 유지됨 | 작업 1 |
| 표 합계가 수량 × 단가와 다름 | 입력한 `printAmount`를 그대로 저장하고 두 수량 표시를 별도로 유지 | 작업 2 |
| 기존 빈 가격표·인쇄 포함값·인원 배수 | 명함·봉투 묶음 노출과 승인한 가격 규칙을 보존하며 브라우저·서버 금액이 같음 | 작업 2·3 |
| 과거 주문·다른 상품 | 기존 스냅샷과 봉투·다른 상품의 값·문구·동작이 유지됨 | 작업 3 |

## 추가 계산 버그: 인원수에 따른 디자인비 증가 (③)

**재현:** 로컬 시드의 일반지·보통 두께·기획 미선택에서 현재 `calculateProductSelection()`을 실행했다. 1명은 디자인비 30,000원 + 인쇄비 20,000원 = 50,000원이다. 2명은 디자인비 60,000원 + 인쇄비 40,000원 = 100,000원으로 재현된다. 요청한 수정 후 금액은 디자인비 30,000원 + 인쇄비 40,000원 = 70,000원이다. 이 수치는 새 수량표 가격이 아니라 기존 시드의 재현 예시다.

**원인과 수정:** `getProductEstimateMultiplier()`가 명함 인원수를 반환하고, 공통 계산 함수가 디자인비와 포함 인쇄비에 같은 배수를 곱했다. 명함의 서비스 비용 배수를 1로 분리해 디자인비·선택 기획비를 고정하고 인쇄비에만 기존 인원 배수를 유지했다. 기존 카탈로그 테스트의 잘못된 기대 금액을 수정하고 1명·2명·3명 및 기획 선택 여부의 회귀 검증을 추가했다.

**수정 범위:** 공유 `packages/supabase/src/productCatalog.ts`와 `packages/supabase/tests/product-catalog.test.mjs`. 화면과 checkout이 같은 함수를 사용하므로 한 곳에서 수정한다. `productConfiguration.ts`의 옵션 구성, 관리자·유저 배치, 운영 가격·기존 주문 데이터는 이 계산 버그 수정에 포함하지 않는다.

- [x] 모든 호출부를 검색하고 화면·checkout·상품 시작가가 공통 계산 함수를 사용하는 것을 확인했다.
- [x] 현재 시드에서 1명 → 2명 변경 시 디자인비까지 증가하는 문제를 재현했다.
- [x] 최신 와이어프레임 검토 후 사용자가 “③ 계산 오류부터 수정해줘”라고 명시적으로 승인했다.
- [x] 1명·2명·3명에서 디자인비 고정·인쇄비 증가와 기획비 고정을 검증하는 회귀 테스트를 추가하고 공통 함수만 최소 수정했다. 기존 숫자 검증·오버플로 차단과 다른 상품의 배수 규칙은 유지했다.
- [x] 공유 패키지 테스트 97개, 공유 패키지·유저 타입 검사, 수정 계산 파일 lint가 통과했다. 선택한 주문·결제·알림 테스트는 12개 중 11개가 통과했고, 나머지 1개는 변경하지 않은 기존 주문자 정보 제목 검사 불일치다. 로컬 브라우저에서 인원 1명·2명·3명 및 기획 선택을 확인했다. 배포·실제 결제는 실행하지 않았다.

브라우저의 현재 고급지·보통 두께 옵션에서는 디자인비 10,000원이 고정되고 인쇄비가 20,000원 → 40,000원 → 60,000원으로 증가했다. 기획 선택 시 20,000원도 고정된다. 위 30,000원 디자인비 예시는 별도의 로컬 시드 데이터이며 실제 옵션 금액과 구분한다. [2명 선택 검증 캡처](/Users/sangkun/.codex/visualizations/2026/11/05/01a1aa2b-5579-7f83-9760-7cd6396e43b4/business-card-two-people-verified.jpg).

## 작업 1: 기본 수량 삭제·순번 조정·재질 문구

**대상:** 공유 프로필, 승인된 명함 설정 데이터, `packages/supabase/tests/product-configuration.test.mjs`, `apps/admin/tests/productFormUi.test.mjs`.

**인터페이스:** `getProductUiProfile(productType, productSubtype)`, `formatProductSectionHeading(index, label)`와 기존 `material`, `thickness`, `people` 옵션을 재사용한다.

- [x] 사용자가 관리자·유저 ①·② 구현과 조합별 가격표·첨부 초기값을 명시적으로 승인했다.
- [x] 명함 섹션 키가 `['size', 'material', 'thickness', 'people', 'quantity']`, 제목이 `['III. 사이즈', 'IV. 재질 선택', 'V. 두께 선택', 'VI. 인원 선택', 'VII. 수량 선택']`인지 검사하는 테스트를 먼저 작성한다. `baseQuantity` 입력은 없어야 하며 두께·인원은 남아야 한다.
- [x] 재질 문구가 확정 표의 두 문자열과 같고, 로드·저장을 반복해도 수량 접미사가 한 번만 나타나는지 검사한다. 현재 재질 인덱스별 서비스 견적은 같은 옵션에 연결돼야 한다.
- [x] `pnpm --filter @repo/supabase test`와 `pnpm --filter admin test:model`로 새 요구사항 테스트의 실패를 확인한 뒤, 프로필과 승인 데이터만 최소 수정한다. 신규 폼에 임의 기본값·문구 변환기를 추가하지 않는다.
- [x] 같은 테스트를 다시 실행해 PASS를 확인한다. 기존 봉투와 다른 상품 프로필도 유지돼야 한다.

## 작업 2: 마지막 수량표와 저장

**대상:** 기존 관리자 가격표·저장 경로, `apps/admin/tests/productFormPersistence.test.mjs`, `packages/supabase/tests/product-catalog.test.mjs`. 시드를 수정하면 `packages/supabase/tests/product-grouping-contract.test.mjs`도 확인한다.

**인터페이스:** 마지막 섹션은 `{ key: 'quantity', kind: 'quantity-prices', label: '수량 선택', quantityUnit: '장' }`이다. `QuantityPriceDraft = { quantity: string; unitPrice: string; printAmount: string }`, `priceRowsBySelection`, `toProductFormDraft(product)`, `toProductWriteInput(draft, status, originalConfiguration?)`를 유지한다.

- [x] 가격표의 연결 축과 기존 상품 전환 방식을 확정한다. 재질명의 200장·500장을 파싱해 수량표·가격·선택 제한을 자동 생성하지 않는다.
- [x] 가격표 로드 → 편집 → 저장 → 재로드 테스트를 작성한다. 첨부 숫자는 테스트 입력으로만 사용해 `quantity: 500`, `unitPrice: 120`, `printAmount: 40000`이 그대로 저장되는지 확인한다. 재질의 수량 문구는 별도로 남아야 한다.
- [x] 기존 `QuantityPriceEditor`로 3열 입력과 행 추가·삭제를 연결한다. 합계 자동 계산, 새 오류 문구, 추가 버튼 제한을 만들지 않는다. 기존 숫자 변환·임시저장·발행 검증을 재사용한다.
- [x] 기존 JSON의 보관 값·알 수 없는 키·봉투 설정이 유지되는지 검사한다. 새 가격표가 필요한 프로필만 먼저 바꾸면 빈 가격표 때문에 `명함 · 봉투` 묶음 전체가 주문 카탈로그에서 제외될 수 있으므로, 기존·신규 데이터의 전환 검증을 함께 완료한다.
- [x] 관리자 모델·공유 패키지 테스트가 PASS인지 확인한다. 승인된 가격만 반영하며, 시드 수정이 기존 DB 행을 자동 갱신하지 않는다는 점을 구분한다. 운영 데이터는 현재 작업에서 수정하지 않는다.

## 작업 3: 주문 영향과 최종 검증

**대상:** 기존 카탈로그·주문·checkout·알림 경로. 테스트는 `packages/supabase/tests/product-catalog.test.mjs`, `apps/user/__tests__/order-page.test.mjs`, `apps/user/__tests__/payment-alimtalk.test.mjs`를 사용한다.

**인터페이스:** `calculateProductSelection(variant, selection)`과 checkout의 최신 상품 조회·금액 재계산을 유지한다. 사용자 주문도 변경하기로 확인된 경우에만 새 수량 선택을 연결한다.

- [x] 승인한 가격 규칙으로 인원 1명·3명, 서로 다른 재질·두께·수량의 기대 금액을 검사한다. 기존 인쇄 포함값을 임의 삭제하거나 새 인원 배수를 추정하지 않는다.
- [x] 과거 `baseQuantity × people`와 신규 `quantity.label` 결제 스냅샷을 모두 검사한다. 과거 주문 문구·알림, 봉투·다른 상품은 보존한다. 관리자만 변경하기로 한 경우 기존 주문 결과가 유지돼야 한다.
- [ ] 아래 검사를 실행해 테스트 PASS, 타입 오류 없음, 관리자 빌드 성공을 확인한다. 사용자 검사는 사용자 연동 범위에 따라 수행한다.

```bash
pnpm --filter @repo/supabase test
pnpm --filter @repo/supabase check-types
pnpm --filter admin test:model
pnpm --filter admin build
pnpm --filter user test
pnpm --filter user check-types
```

- [ ] 브라우저에서 기본 수량 영역 삭제, IV~VII 제목, 정확한 재질 문구, 두 수량 표시의 공존, 마지막 표의 추가·삭제·저장 후 재로드를 확인한다. 모바일은 합의한 범위만 확인하며 시뮬레이터는 실행하지 않는다.
- [ ] 작업 전후 diff를 승인 범위와 비교한다. 완료 보고에는 삭제한 기본 수량 영역, 바뀐 재질 문구와 번호, 추가한 수량표, 실제 검증과 미실행 범위를 명시한다.

## 실행 결과와 남은 검증

- 관리자·유저에서 기본 수량을 제거하고 IV 재질·V 두께·VI 인원·VII 수량 순서로 표시한다. 재질 수량 문구와 하단 수량 표시를 함께 유지한다.
- 공유 테스트 100/100, 관리자 모델 160/160·단위 96/96, 공유·유저 타입 검사, 관리자 빌드, 수정 소스 lint, 결제·알림 선택 테스트 8/8이 통과했다. Figma 원격 asset URL 검색 결과는 없다.
- 관리자 브라우저에서 기존 상품 로드, 두 초기 행, 새 행 추가·입력·삭제, 조합 변경 시 독립 가격표를 확인했다. 테스트 입력은 원상 복원했으며 DB에 저장하지 않았다. 저장·재로드와 빈 표 재생성 방지는 모델 테스트로 검증했다.
- 유저 브라우저에서 섹션 순서, 재질·두께·인원·수량 선택과 요약을 확인했다. 고급지·보통·500장에서는 1명 디자인 10,000원 + 인쇄 40,000원, 2명 디자인 10,000원 + 인쇄 80,000원, 3명 디자인 10,000원 + 인쇄 120,000원이다. 2명·1,000장은 인쇄 120,000원이다.
- 운영 DB 갱신·실제 결제·배포·시뮬레이터 실행은 하지 않았다. 관리자 실제 DB 저장·재조회와 모바일 렌더링은 미검증이다. 로컬 Next 웹 서버는 공유 코드 변경을 읽도록 재시작했다.

| 기존 유저 테스트 실패 | 확인한 불일치 |
| --- | --- |
| `blog list cards request high-quality oversized thumbnails` | 썸네일 sizes 예상값 |
| `blog hero applies the Figma white dim below the fold breakpoint` | 기존 오버레이 CSS 예상값 |
| `FAQ mobile category navigation matches the scrolled header glass surface` | 기존 배경 투명도 예상값 |
| `landing about reason items follow the Figma card and desktop list styles` | 기존 구분선 CSS 예상값 |
| `order page route, content, responsive styles, and navigation are wired` | 기존 주문자 정보 제목의 III 접두사 예상값 |
| `portfolio grid keeps three columns from the 960px breakpoint` | 기존 썸네일 sizes 예상값 |

위 6개 검사 대상의 소스는 이번 ①·②에서 수정하지 않았다. 범위 밖 CSS·제목은 변경하지 않았다.

**전환 판단:** 운영 상품을 일괄 덮어쓰는 대신 관리자·주문·가격 동기화의 공용 읽기 경로에서 구형 명함만 전환한다. 최초 전환은 승인된 초기 가격을 사용하며, 이후 저장한 조합별 금액은 보존한다. 코드 배포 시 이전 상품에도 새 수량표 가격이 적용되는 점이 영향 범위다.

**독립 리뷰:** 기존 v3·빈 명함 가격표가 272행인 상태에서 가격 동기화의 새 280행 검사가 실패하는 문제를 발견했다. 같은 전환 helper를 동기화 경로에도 연결했다. 재현 테스트의 실패→수정→공유 전체 100개 통과를 확인했다. 미해결 리뷰 지적은 없다.

[관리자 확인 캡처](/Users/sangkun/.codex/visualizations/2026/11/05/01a1aa2b-5579-7f83-9760-7cd6396e43b4/business-card-quantity-admin.jpg) · [유저 확인 캡처](/Users/sangkun/.codex/visualizations/2026/11/05/01a1aa2b-5579-7f83-9760-7cd6396e43b4/business-card-quantity-desktop.jpg)
