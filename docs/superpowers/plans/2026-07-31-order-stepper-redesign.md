# Order Stepper Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/order`의 4단계 진행 표시를 Figma 노드 `1101:4506`의 숫자 칩,
텍스트 라벨, chevron 조합으로 교체하고 주문 완료 화면까지 같은 표시 규칙을
사용하게 한다.

**Architecture:** 주문 단계 데이터는 숫자와 라벨만 보유하고, 현재 단계 인덱스를
받는 `OrderProgress`가 접근 가능한 `<ol>` 마크업을 한 곳에서 렌더링한다. 주문
선택 화면과 결제 결과 화면은 이 공용 컴포넌트를 사용하며, 상태 전환 로직은
기존 `activeStepIndex`와 `resultStepIndex`를 그대로 유지한다. 시각 규칙은 기존
CSS Module과 공용 `Icon` 레지스트리에만 추가한다.

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS Modules, Node test runner

## Global Constraints

- 구현 기준은 Figma 파일 `qZcNE6of4hWidBcayhacSI`, 노드 `1101:4506`이다.
- `design.md`의 Pretendard GOV Variable 타이포, `gap` 기반 간격, 공용 `Icon`
  사용 규칙을 따른다.
- Tailwind나 새 패키지를 설치하지 않는다.
- 제품 UI 아이콘은 `apps/user/components/Icon.tsx`에 `currentColor` 기반 SVG로
  등록한다.
- `https://www.figma.com/api/mcp/asset/*` 또는 다른 Figma API URL을 앱 소스에
  남기지 않는다.
- 스텝퍼는 `461px × 24px` 크기의 콘텐츠를 주문 콘텐츠 왼쪽에 정렬한다.
- 단계 사이 간격은 `12px`, 숫자 칩과 라벨 사이는 `4px`이다.
- 숫자 칩은 `24px × 24px`; 숫자는 12/18, weight 500이다.
- 라벨은 14/21, 비활성 weight 500, 활성 weight 700이다. `design.md`에 따라
  letter-spacing은 `-0.015em`을 사용한다.
- 활성 단계는 `--landing-brand-500`; 비활성 및 완료 단계는
  `--landing-gray-600`의 동일한 중립 상태로 표시한다. 제공된 Figma 노드에는
  별도의 완료 상태가 없으므로 기존 `stepItemComplete` 표현은 제거한다.
- 세 번째 스텝퍼 라벨은 Figma 원문인 `정보 선택`을 사용한다. 실제 폼 화면의
  헤더 `III. 정보 입력`은 이번 스텝퍼 범위 밖이므로 유지한다.
- 제공된 Figma 노드는 데스크톱/태블릿용이며 모바일 변형이 없으므로 기존
  동작대로 `640px` 미만에서 스텝퍼를 숨긴다.
- 주문 단계 전환, 스크롤, 뒤로 가기, 결제 로직은 변경하지 않는다.

---

### Task 1: 공용 스텝퍼의 데이터·아이콘·마크업 계약 추가

**Files:**

- Create: `apps/user/app/(site)/order/OrderProgress.tsx`
- Modify: `apps/user/app/_content/order.ts:17-25`
- Modify: `apps/user/components/Icon.tsx:15-42, 111-171, 775-810`
- Modify: `apps/user/__tests__/order-page.test.mjs:45-110, 215-245, 890-910`

**Interfaces:**

- Consumes: `orderSteps`, `Icon`, `page.module.css`
- Produces: `OrderProgress({ activeStepIndex }: { activeStepIndex: number })`
- Produces: `IconName` 값 `"chevron-right"`
- Produces: `orderSteps` 항목 `{ number: 1 | 2 | 3 | 4; label: string }`

- [x] **Step 1: 공용 스텝퍼 계약을 검사하는 실패 테스트 작성**

  `order-page.test.mjs`의 첫 번째 subtest에 공용 컴포넌트 경로와 소스를 추가한다.

  ```js
  const progressPath = "apps/user/app/(site)/order/OrderProgress.tsx";

  assert.equal(existsSync(path.join(repoRoot, progressPath)), true);

  const progressSource = read(progressPath);
  const chevronRightIconSource = extractBetween(
    iconSource,
    "function ChevronRightIcon",
    "function BookOpenIcon",
  );
  ```

  같은 subtest에 아래 계약 검사를 추가한다.

  ```js
  assert.match(progressSource, /type OrderProgressProps = \{/);
  assert.match(progressSource, /activeStepIndex:\s*number/);
  assert.match(progressSource, /aria-label="주문 진행 단계"/);
  assert.match(
    progressSource,
    /aria-current=\{isActive \? "step" : undefined\}/,
  );
  assert.match(progressSource, /styles\.stepChip/);
  assert.match(progressSource, /styles\.stepLabel/);
  assert.match(progressSource, /name="chevron-right"/);
  assert.match(progressSource, /size=\{16\}/);
  assert.doesNotMatch(progressSource, /stepItemComplete/);

  assert.match(contentSource, /number:\s*1,\s*label:\s*"카테고리 선택"/);
  assert.match(contentSource, /number:\s*2,\s*label:\s*"옵션 선택"/);
  assert.match(contentSource, /number:\s*3,\s*label:\s*"정보 선택"/);
  assert.match(contentSource, /number:\s*4,\s*label:\s*"결제 완료"/);

  assert.match(iconSource, /\| "chevron-right"/);
  assert.match(iconSource, /function ChevronRightIcon/);
  assert.match(chevronRightIconSource, /stroke="currentColor"/);
  assert.match(chevronRightIconSource, /strokeWidth="1\.5"/);
  assert.match(iconSource, /"chevron-right": ChevronRightIcon/);
  ```

- [x] **Step 2: 테스트가 새 계약 부재로 실패하는지 확인**

  Run:

  ```bash
  cd apps/user
  node --test __tests__/order-page.test.mjs
  ```

  Expected: `OrderProgress.tsx`가 존재하지 않아 첫 번째 subtest가 FAIL한다.

- [x] **Step 3: 주문 단계 데이터를 숫자와 라벨로 분리**

  `apps/user/app/_content/order.ts`의 `orderSteps`를 아래 값으로 교체한다.

  ```ts
  export const orderSteps = [
    { number: 1, label: "카테고리 선택" },
    { number: 2, label: "옵션 선택" },
    { number: 3, label: "정보 선택" },
    { number: 4, label: "결제 완료" },
  ] as const;
  ```

  `OrderMethod.state`가 계속 `OrderStepState`를 사용하므로 해당 타입은 삭제하지
  않는다.

- [x] **Step 4: Figma chevron을 공용 아이콘으로 등록**

  `IconName`에 `"chevron-right"`를 추가하고, Figma 벡터를 16px viewBox에 맞춘
  컴포넌트를 `ChevronDownIcon` 다음, `BookOpenIcon` 앞에 추가한다.

  ```tsx
  function ChevronRightIcon({ size = 24, ...props }: Omit<IconProps, "name">) {
    return (
      <svg
        aria-hidden="true"
        fill="none"
        height={size}
        viewBox="0 0 16 16"
        width={size}
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path
          d="M6.33333 4.66667L9.66667 8L6.33333 11.3333"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    );
  }
  ```

  `icons` 레지스트리에 아래 항목을 추가한다.

  ```ts
  "chevron-right": ChevronRightIcon,
  ```

  원격 SVG URL이나 별도 이미지 파일은 추가하지 않는다.

- [x] **Step 5: 접근 가능한 공용 `OrderProgress` 구현**

  `OrderProgress.tsx`를 아래 구조로 생성한다. separator는 `<ol>`의 직접 자식이
  되지 않도록 각 `<li>` 안에 둔다.

  ```tsx
  import { Icon } from "../../../components/Icon";
  import { orderSteps } from "../../_content/order";
  import styles from "./page.module.css";

  type OrderProgressProps = {
    activeStepIndex: number;
  };

  export function OrderProgress({ activeStepIndex }: OrderProgressProps) {
    return (
      <ol className={styles.stepList} aria-label="주문 진행 단계">
        {orderSteps.map((step, index) => {
          const isActive = index === activeStepIndex;

          return (
            <li
              aria-current={isActive ? "step" : undefined}
              className={`${styles.stepItem} ${
                isActive ? styles.stepItemActive : ""
              }`}
              key={step.number}
            >
              <span className={styles.stepContent}>
                <span className={styles.stepChip}>{step.number}</span>
                <span className={styles.stepLabel}>{step.label}</span>
              </span>
              {index < orderSteps.length - 1 ? (
                <Icon
                  className={styles.stepChevron}
                  name="chevron-right"
                  size={16}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    );
  }
  ```

- [x] **Step 6: 포맷과 타입 계약 확인**

  Run:

  ```bash
  pnpm prettier --write \
    'apps/user/app/(site)/order/OrderProgress.tsx' \
    'apps/user/app/_content/order.ts' \
    'apps/user/components/Icon.tsx' \
    'apps/user/__tests__/order-page.test.mjs' \
    'docs/superpowers/plans/2026-07-31-order-stepper-redesign.md'
  pnpm --filter user check-types
  ```

  Expected: TypeScript 오류 없이 종료한다. CSS 클래스는 Task 2에서 추가하므로
  `page.module.css` 타입 생성 방식 때문에 별도 타입 오류가 발생하지 않는다.

- [x] **Step 7: 작업 단위 커밋**

  ```bash
  git add \
    'apps/user/app/(site)/order/OrderProgress.tsx' \
    'apps/user/app/_content/order.ts' \
    'apps/user/components/Icon.tsx' \
    'apps/user/__tests__/order-page.test.mjs'
  git commit -m "refactor(user): add shared order progress"
  ```

---

### Task 2: 두 주문 화면을 새 스텝퍼와 Figma 스타일로 교체

**Files:**

- Modify: `apps/user/app/(site)/order/OrderFlowSection.tsx:5-13, 118-132`
- Modify: `apps/user/app/(site)/order/OrderPaymentResult.tsx:8-14, 335-357`
- Modify: `apps/user/app/(site)/order/page.module.css:232-264, 1393-1420, 1786-1810`
- Modify: `apps/user/__tests__/order-page.test.mjs:215-245, 565-610, 1028-1045`

**Interfaces:**

- Consumes: `OrderProgress({ activeStepIndex })` from Task 1
- Produces: `/order`에서 `activeStepIndex` 0, 1, 2를 표시하는 공용 스텝퍼
- Produces: `/order/success`와 `/order/fail`에서 `resultStepIndex` 3을 표시하는
  공용 스텝퍼

- [x] **Step 1: 두 호출부와 정확한 CSS를 요구하는 실패 테스트 작성**

  기존 `stepItemComplete` 및 4열 상단선 assertion을 제거한다. `flowSectionSource`,
  `stylesSource`, `tabletMediaStyles` 검사는 첫 번째 subtest에, `resultSource`
  검사는 두 번째 subtest에 아래와 같이 추가한다.

  ```js
  assert.match(flowSectionSource, /import \{ OrderProgress \}/);
  assert.match(
    flowSectionSource,
    /<OrderProgress activeStepIndex=\{activeStepIndex\} \/>/,
  );
  assert.doesNotMatch(flowSectionSource, /orderSteps\.map/);
  assert.doesNotMatch(flowSectionSource, /stepItemComplete/);

  assert.match(resultSource, /import \{ OrderProgress \}/);
  assert.match(
    resultSource,
    /<OrderProgress activeStepIndex=\{resultStepIndex\} \/>/,
  );
  assert.doesNotMatch(resultSource, /orderSteps\.map/);
  assert.doesNotMatch(resultSource, /stepItemComplete/);

  assert.match(
    stylesSource,
    /\.stepList\s*\{[^}]*width:\s*fit-content[^}]*max-width:\s*100%[^}]*margin:\s*0;[^}]*display:\s*none/s,
  );
  assert.match(
    stylesSource,
    /\.stepItem\s*\{[^}]*display:\s*flex[^}]*align-items:\s*center[^}]*gap:\s*12px/s,
  );
  assert.match(stylesSource, /\.stepContent\s*\{[^}]*gap:\s*4px/s);
  assert.match(
    stylesSource,
    /\.stepChip\s*\{[^}]*width:\s*24px[^}]*height:\s*24px[^}]*border-radius:\s*100px/s,
  );
  assert.match(
    stylesSource,
    /\.stepItemActive \.stepChip\s*\{[^}]*background:\s*var\(--landing-brand-500\)/s,
  );
  assert.match(
    stylesSource,
    /\.stepItemActive \.stepLabel\s*\{[^}]*font-weight:\s*700/s,
  );
  assert.match(
    stylesSource,
    /\.stepChevron\s*\{[^}]*width:\s*16px[^}]*height:\s*16px/s,
  );
  assert.match(
    tabletMediaStyles,
    /\.stepList\s*\{[^}]*display:\s*flex[^}]*justify-content:\s*flex-start/s,
  );
  assert.doesNotMatch(stylesSource, /\.stepItemComplete/);
  assert.doesNotMatch(stylesSource, /\.resultStepList/);
  ```

- [x] **Step 2: 테스트가 기존 line/grid 스텝퍼 때문에 실패하는지 확인**

  Run:

  ```bash
  cd apps/user
  node --test __tests__/order-page.test.mjs
  ```

  Expected: 호출부에 `OrderProgress`가 없고 `.stepList`가 기존 4열 grid를
  사용하므로 FAIL한다.

- [x] **Step 3: 주문 선택 화면의 중복 렌더링 교체**

  `OrderFlowSection.tsx`에서 `orderSteps` import를 제거하고 공용 컴포넌트를
  import한다.

  ```tsx
  import { OrderProgress } from "./OrderProgress";
  ```

  기존 `<ol>` 전체를 아래 호출로 교체한다.

  ```tsx
  <OrderProgress activeStepIndex={activeStepIndex} />
  ```

  `activeStepIndex` 계산식은 수정하지 않는다.

- [x] **Step 4: 결제 결과 화면의 중복 렌더링 교체**

  `OrderPaymentResult.tsx`에서 `orderSteps` import를 제거하고 공용 컴포넌트를
  import한다.

  ```tsx
  import { OrderProgress } from "./OrderProgress";
  ```

  `showProgress` 조건 안의 기존 `<ol>`을 아래 호출로 교체한다.

  ```tsx
  <OrderProgress activeStepIndex={resultStepIndex} />
  ```

  `resultStepIndex = 3`, 뒤로 가기 링크, 결제 성공/실패 콘텐츠는 유지한다.

- [x] **Step 5: Figma 치수와 색상을 CSS Module로 구현**

  기존 `.stepList`, `.stepItem`, `.stepItemActive`, `.stepItemComplete` 블록을
  아래 규칙으로 교체한다.

  ```css
  .stepList {
    width: fit-content;
    max-width: 100%;
    margin: 0;
    padding: 0;
    list-style: none;
    display: none;
    align-items: center;
    gap: 12px;
  }

  .stepItem {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--landing-gray-600);
  }

  .stepContent {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
  }

  .stepChip {
    width: 24px;
    height: 24px;
    box-sizing: border-box;
    border: 1px solid var(--landing-gray-100);
    border-radius: 100px;
    background: var(--landing-gray-50);
    color: var(--landing-gray-600);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 24px;
    font-family: var(--font-sans);
    font-size: 12px;
    font-weight: 500;
    line-height: 18px;
    letter-spacing: -0.015em;
  }

  .stepLabel {
    color: var(--landing-gray-600);
    font-family: var(--font-sans);
    font-size: 14px;
    font-weight: 500;
    line-height: 21px;
    letter-spacing: -0.015em;
  }

  .stepItemActive .stepChip {
    border-color: var(--landing-brand-500);
    background: var(--landing-brand-500);
    color: #fefefe;
  }

  .stepItemActive .stepLabel {
    color: var(--landing-brand-500);
    font-weight: 700;
  }

  .stepChevron {
    width: 16px;
    height: 16px;
    color: var(--landing-gray-800);
    display: block;
    flex: 0 0 16px;
  }
  ```

  `@media (min-width: 640px)`의 `.stepList`를 아래처럼 바꾸고 4열 grid 규칙을
  제거한다.

  ```css
  .stepList {
    display: flex;
    justify-content: flex-start;
  }
  ```

  `.resultStepList` 기본 규칙과 640px media override는 삭제한다. 결과 화면은
  640px 미만에서 기존 `resultBackLink`만 유지하고, 640px 이상에서 공용
  스텝퍼를 함께 표시한다.

- [x] **Step 6: 타깃 테스트와 타입 검사를 통과시킴**

  Run:

  ```bash
  pnpm prettier --write \
    'apps/user/app/(site)/order/OrderFlowSection.tsx' \
    'apps/user/app/(site)/order/OrderPaymentResult.tsx' \
    'apps/user/app/(site)/order/page.module.css' \
    'apps/user/__tests__/order-page.test.mjs'
  pnpm --filter user test
  pnpm --filter user check-types
  ```

  Verification (HEAD `633221c`): 타깃 주문 테스트는 2/2 PASS했고 사용자 앱
  `check-types`도 PASS했다. 전체 사용자 테스트도 실행했으나 스텝퍼 커밋 범위 밖인
  notice/portfolio 관련 실패 2건이 남아 있다.

- [x] **Step 7: 작업 단위 커밋**

  ```bash
  git add \
    'apps/user/app/(site)/order/OrderFlowSection.tsx' \
    'apps/user/app/(site)/order/OrderPaymentResult.tsx' \
    'apps/user/app/(site)/order/page.module.css' \
    'apps/user/__tests__/order-page.test.mjs'
  git commit -m "fix(user): match Figma order stepper"
  ```

---

### Task 3: 반응형 시각 QA와 최종 게이트

**Files:**

- Verify: `apps/user/app/(site)/order/OrderProgress.tsx`
- Verify: `apps/user/app/(site)/order/page.module.css`
- Verify: `apps/user/components/Icon.tsx`
- Verify: `apps/user/__tests__/order-page.test.mjs`

**Interfaces:**

- Consumes: 실행 중인 `http://localhost:3000/order`
- Produces: Figma 노드 `1101:4506`과 일치하는 461px × 24px 스텝퍼 및 회귀
  검사 결과

- [x] **Step 1: 데스크톱 첫 단계 확인**

  `1512px` 너비에서 `/order`를 열고 계산된 레이아웃을 확인한다.
  - 스텝 콘텐츠 전체: `461px × 24px`, 주문 콘텐츠 왼쪽 정렬
  - 첫 항목: 브랜드 배경의 24px 숫자 칩, 브랜드색 700 라벨
  - 나머지 항목: gray-50 칩, gray-100 테두리, gray-600 텍스트
  - chevron: `16px × 16px`, gray-800
  - 기존 상단 2px 선과 4열 균등 분할이 보이지 않음

  Verification (HEAD `633221c`): 1512px에서 스텝퍼가 표시되고
  `461.3125px × 24px`이며 주문 콘텐츠 왼쪽과의 delta는 0이다. 첫 단계의 활성
  표현과 나머지 단계의 중립 표현을 확인했다.

- [x] **Step 2: 단계 전환 확인**

  `/order`에서 표준 상품을 선택해 옵션 단계로 이동하고, 결제 직전의 정보 입력
  단계까지 이동한다. 각 화면에서 활성 칩과 라벨만 각각 2, 3으로 이동하고 이전
  단계는 비활성 중립색으로 돌아가는지 확인한다. 결제나 개인정보 입력은 수행하지
  않는다.

  Verification (HEAD `633221c`): 1, 2, 3단계 상태를 확인했고 활성 칩과 라벨만
  해당 단계로 이동했다.

- [x] **Step 3: 결과 화면의 네 번째 단계 확인**

  `/order/success`와 `/order/fail`을 열어 진행 표시가 노출되는 상태에서는 네 번째
  칩과 `결제 완료` 라벨만 활성인지 확인한다. 성공/실패 메시지와 뒤로 가기 링크는
  기존과 동일해야 한다.

  Verification (HEAD `633221c`): 실패 결과 화면에서 4단계 활성 상태를 확인했다.
  성공 경로는 현재 의도된 리다이렉트 동작으로 결과 화면을 직접 표시하지 않는다.

- [x] **Step 4: 반응형 경계 확인**
  - `639px`: 스텝퍼가 숨겨지고 가로 overflow가 없음
  - `640px`: 461px 스텝퍼가 한 줄로 보임
  - `1080px`, `1440px`: 스텝퍼가 주문 콘텐츠 왼쪽에 유지됨

  Verification (HEAD `633221c`): 639px에서는 예상대로 숨겨지고, 640px, 1080px,
  1440px, 1512px에서는 표시됐다. 표시된 모든 폭에서 크기는 `461.3125px × 24px`,
  왼쪽 정렬 delta는 0이다.

- [x] **Step 5: 자동 품질 게이트 실행**

  Run:

  ```bash
  pnpm --filter user test
  pnpm --filter user lint
  pnpm --filter user check-types
  pnpm --filter user build
  git diff --check
  rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages
  ```

  Verification (HEAD `633221c`): 타깃 주문 테스트, lint, typecheck, build,
  scoped diff check, 금지된 Figma URL 검사가 PASS했다. 전체 사용자 테스트는
  실행했으나 스텝퍼와 무관한 notice/portfolio 실패 2건이 동일하게 남아 있다.
  증빙은 커밋하지 않는 `.omo/evidence/order-stepper-qa-633221c/`에만 보관한다.

- [x] **Step 6: 최종 커밋**

  시각 QA 중 보정이 발생한 경우에만 관련 파일과 이 계획 문서를 커밋한다.

  ```bash
  git add \
    'apps/user/app/(site)/order/OrderProgress.tsx' \
    'apps/user/app/(site)/order/OrderFlowSection.tsx' \
    'apps/user/app/(site)/order/OrderPaymentResult.tsx' \
    'apps/user/app/(site)/order/page.module.css' \
    'apps/user/app/_content/order.ts' \
    'apps/user/components/Icon.tsx' \
    'apps/user/__tests__/order-page.test.mjs' \
    'docs/superpowers/plans/2026-07-31-order-stepper-redesign.md'
  git commit -m "test(user): verify responsive order stepper"
  ```

  Verification record: 이 문서 커밋이 최종 검증 기록이다.
