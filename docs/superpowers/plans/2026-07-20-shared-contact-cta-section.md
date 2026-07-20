# 공용 Contact CTA 섹션 구현 계획

> **에이전트 작업 필수 지침:** 이 계획은 `superpowers:subagent-driven-development`(권장) 또는 `superpowers:executing-plans`를 사용해 작업별로 실행합니다. 진행 상태는 체크박스로 관리합니다.

**목표:** 메인과 FAQ의 중복 Contact 섹션을 Figma에서 확인한 변형만 지원하는 하나의 `CtaSection`으로 통합합니다.

**구조:** `CtaSection.tsx`가 선택적인 배지·설명·두 번째 링크를 렌더링하고, 전용 `CtaSection.module.css`가 배경과 반응형 배치를 소유합니다. 페이지는 문구와 실제 동작만 전달하며 페이지별 CTA 레이아웃 CSS는 제거합니다.

**기술:** Next.js 16, React 19, TypeScript, CSS Modules, Node 내장 테스트 러너

## 전체 제약

- 새 라이브러리를 추가하지 않습니다.
- 기존 `Button`, `Icon`, `createGradientBorderButtonStyle`을 재사용합니다.
- 배경 이미지는 `/figma-assets/landing-cta-background.jpg`로 고정합니다.
- 카카오 상담 버튼은 항상 표시하며 현재 동작을 변경하지 않습니다.
- 두 번째 액션은 이동이므로 Next.js `Link`로 렌더링합니다.
- 이번 브랜치에서는 `main`에 존재하는 메인과 FAQ만 교체합니다.
- 포트폴리오, 고객후기, 상품유형은 각 기능 브랜치에서 후속 적용합니다.

---

### 작업 1: 공용 CTA 계약을 테스트로 고정

**파일:**
- 수정: `apps/user/__tests__/cta-section.test.mjs`
- 테스트: `apps/user/__tests__/cta-section.test.mjs`

**인터페이스:**
- 입력: `CtaSectionProps`
- 보장: 선택적 배지·설명·설명 크기·두 번째 액션과 전용 CSS Module 사용

- [ ] **1단계: 기존 테스트를 새 계약에 맞게 수정**

다음 검사를 추가하고 `backgroundImage` 검사와 `app/page.module.css` 의존 검사를 제거합니다.

```js
const stylesPath = new URL(
  "../app/_components/CtaSection.module.css",
  import.meta.url,
);
const faqPagePath = new URL("../app/(site)/faq/page.tsx", import.meta.url);

test("CTA section exposes only confirmed content variations", async () => {
  const source = await readFile(ctaPath, "utf8");

  assert.match(source, /badge\?: string/);
  assert.match(source, /description\?: string/);
  assert.match(source, /descriptionSize\?: "sm" \| "md"/);
  assert.match(source, /titleLines: readonly ReactNode\[\]/);
  assert.match(source, /secondaryAction\?: \{/);
  assert.match(source, /label: string/);
  assert.match(source, /href: string/);
  assert.doesNotMatch(source, /backgroundImage\?:/);
});

test("CTA section owns its styles and conditionally renders the second action", async () => {
  const source = await readFile(ctaPath, "utf8");
  const styles = await readFile(stylesPath, "utf8");

  assert.match(source, /CtaSection\.module\.css/);
  assert.match(source, /secondaryAction \?/);
  assert.match(source, /<Link/);
  assert.match(styles, /\.descriptionSm/);
  assert.match(styles, /\.descriptionMd/);
});
```

- [ ] **2단계: 테스트가 실패하는지 확인**

실행:

```bash
node --test apps/user/__tests__/cta-section.test.mjs
```

예상 결과: `CtaSection.module.css`가 없거나 새 props가 없어 실패합니다.

- [ ] **3단계: 테스트 변경만 커밋**

```bash
git add apps/user/__tests__/cta-section.test.mjs
git commit -m "test(user): define shared CTA variants"
```

---

### 작업 2: 공용 컴포넌트와 전용 스타일 구현

**파일:**
- 수정: `apps/user/app/_components/CtaSection.tsx`
- 생성: `apps/user/app/_components/CtaSection.module.css`
- 수정: `apps/user/app/(site)/page.tsx`
- 수정: `apps/user/app/page.module.css`
- 테스트: `apps/user/__tests__/cta-section.test.mjs`

**인터페이스:**
- 생성: `CtaSection(props: CtaSectionProps)`
- `secondaryAction`: `{ label: string; href: string } | undefined`
- `descriptionSize`: `"sm" | "md"`, 기본값 `"sm"`

- [ ] **1단계: `CtaSection.tsx`를 최소 props로 구현**

```tsx
import { Button } from "@repo/ui/button";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { Icon } from "../../components/Icon";
import styles from "./CtaSection.module.css";
import { createGradientBorderButtonStyle } from "./buttonStyles";

const actionWidth = "var(--cta-action-width)";
const actionPadding = "8px 23px";

const kakaoButtonStyle: CSSProperties = {
  ...createGradientBorderButtonStyle({
    padding: actionPadding,
    tone: "contactKakao",
  }),
  width: actionWidth,
};

const secondaryActionStyle: CSSProperties = {
  ...createGradientBorderButtonStyle({ padding: actionPadding }),
  width: actionWidth,
};

type CtaSectionProps = {
  id?: string;
  badge?: string;
  titleLines: readonly ReactNode[];
  description?: string;
  descriptionSize?: "sm" | "md";
  secondaryAction?: {
    label: string;
    href: string;
  };
};

export function CtaSection({
  id,
  badge,
  titleLines,
  description,
  descriptionSize = "sm",
  secondaryAction,
}: CtaSectionProps) {
  return (
    <section className={styles.section} id={id}>
      <div aria-hidden="true" className={styles.background} />
      <div className={styles.content}>
        {badge ? <p className={styles.badge}>{badge}</p> : null}
        <div className={styles.copy}>
          <h2 className={styles.title}>
            {titleLines.map((line, index) => (
              <span key={typeof line === "string" ? line : index}>{line}</span>
            ))}
          </h2>
          {description ? (
            <p
              className={
                descriptionSize === "md"
                  ? styles.descriptionMd
                  : styles.descriptionSm
              }
            >
              {description}
            </p>
          ) : null}
        </div>
        <div className={styles.actions}>
          <Button style={kakaoButtonStyle}>
            <span>실시간 카톡상담</span>
            <Icon className={styles.icon} name="message-typing" size={24} />
          </Button>
          {secondaryAction ? (
            <Link
              className={styles.secondaryAction}
              href={secondaryAction.href}
              style={secondaryActionStyle}
            >
              <span>{secondaryAction.label}</span>
              <Icon className={styles.icon} name="arrow-right" size={24} />
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **2단계: `CtaSection.module.css`에 공통 스타일 작성**

```css
.section {
  --cta-action-width: 100%;
  min-height: 408px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--landing-gray-900);
}

.background {
  position: absolute;
  inset: 0;
  background-image: url("/figma-assets/landing-cta-background.jpg");
  background-position: center;
  background-size: cover;
  opacity: 0.94;
  pointer-events: none;
}

.content {
  width: min(100%, 390px);
  padding: 72px 20px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  text-align: center;
}

.badge {
  width: fit-content;
  min-height: 40px;
  border: 1px solid #ffffff;
  border-radius: 32px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--landing-gray-50);
  padding: 8px 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 700;
  line-height: 21px;
  white-space: nowrap;
}

.copy {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.title {
  color: #ffffff;
  font-family: var(--font-sans);
  font-size: 28px;
  font-weight: 700;
  line-height: 36px;
  display: flex;
  flex-direction: column;
  word-break: keep-all;
}

.title strong {
  color: var(--landing-brand-500);
}

.descriptionSm,
.descriptionMd {
  color: var(--landing-gray-50);
  font-family: var(--font-sans);
  font-weight: 500;
  word-break: keep-all;
}

.descriptionSm {
  font-size: 14px;
  line-height: 20px;
}

.descriptionMd {
  font-size: 16px;
  line-height: 24px;
}

.actions {
  width: 100%;
  margin-top: 32px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.secondaryAction {
  height: 52px;
  border-radius: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 700;
  line-height: 21px;
  text-decoration: none;
  white-space: nowrap;
}

.icon {
  flex: 0 0 auto;
}

@media (min-width: 640px) {
  .section {
    --cta-action-width: 164px;
  }

  .content {
    width: min(100%, 640px);
  }

  .actions {
    width: auto;
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
  }
}

@media (min-width: 1080px) {
  .content {
    width: min(100%, 1080px);
  }
}

@media (min-width: 1440px) {
  .section {
    min-height: 500px;
  }

  .content {
    width: 1360px;
    padding: 104px 0;
  }

  .title {
    font-size: 36px;
    line-height: 48px;
  }
}
```

- [ ] **3단계: 메인 페이지에 명시적인 설정 전달**

```tsx
<CtaSection
  badge="지금 바로 시작하세요"
  description="빠른 상담 · 전국 납품 · 소량부터 대량까지"
  descriptionSize="md"
  id="contact"
  secondaryAction={{
    label: "정찰제 가격 보기",
    href: "/#services",
  }}
  titleLines={[
    "실패 없는 홍보물 디자인 제작,",
    <>
      지금 바로 <strong>씨브레인</strong>에 맡기세요
    </>,
  ]}
/>
```

- [ ] **4단계: `page.module.css`의 CTA 전용 선택자 제거**

제거 대상은 `.ctaSection`, `.ctaBackground`, `.ctaContent`, `.ctaBadge`,
`.ctaText`, `.ctaRow`와 이 선택자들의 미디어 쿼리 규칙입니다. 다른 선택자와 묶인
`.blogCopy`, `.serviceCopy`, `.footerInfo`, `.customerCenter`, `.companyInfo`의 공통
`display` 규칙은 유지하고 `.ctaText`만 목록에서 제거합니다.

- [ ] **5단계: 공용 CTA 테스트 실행**

```bash
node --test apps/user/__tests__/cta-section.test.mjs
```

예상 결과: 모든 CTA 테스트 통과.

- [ ] **6단계: 공용 컴포넌트 커밋**

```bash
git add apps/user/app/_components/CtaSection.tsx apps/user/app/_components/CtaSection.module.css apps/user/app/(site)/page.tsx apps/user/app/page.module.css apps/user/__tests__/cta-section.test.mjs
git commit -m "refactor(user): extract shared contact CTA"
```

---

### 작업 3: FAQ의 중복 Contact 섹션 교체

**파일:**
- 수정: `apps/user/app/(site)/faq/page.tsx`
- 수정: `apps/user/app/(site)/faq/page.module.css`
- 수정: `apps/user/__tests__/cta-section.test.mjs`

**인터페이스:**
- 사용: `CtaSection`
- FAQ 설정: 배지 있음, `sm` 설명, 두 번째 액션 없음

- [ ] **1단계: FAQ 적용 테스트 추가**

```js
test("FAQ uses the shared CTA without a secondary action", async () => {
  const source = await readFile(faqPagePath, "utf8");

  assert.match(source, /import \{ CtaSection \}/);
  assert.match(source, /id="faq-contact"/);
  assert.match(source, /badge="상담 가능 시간 : 평일 오전 9시 ~ 오후 6시"/);
  assert.match(source, /description="씨브레인에 직접 물어보세요\. 빠르게 답변드립니다\."/);
  assert.match(source, /titleLines=\{\["찾으시는 답변이 없으신가요\?"\]\}/);
  assert.doesNotMatch(source, /secondaryAction=/);
  assert.doesNotMatch(source, /contactSection/);
});
```

- [ ] **2단계: 테스트가 실패하는지 확인**

```bash
node --test apps/user/__tests__/cta-section.test.mjs
```

예상 결과: FAQ가 아직 중복 마크업을 사용하므로 실패.

- [ ] **3단계: FAQ 중복 마크업을 공용 컴포넌트로 교체**

`Button`, `Icon`, `createGradientBorderButtonStyle`, `contactButtonStyle`을 제거하고
`CtaSection`을 가져옵니다.

```tsx
<CtaSection
  badge="상담 가능 시간 : 평일 오전 9시 ~ 오후 6시"
  description="씨브레인에 직접 물어보세요. 빠르게 답변드립니다."
  id="faq-contact"
  titleLines={["찾으시는 답변이 없으신가요?"]}
/>
```

- [ ] **4단계: FAQ CSS에서 Contact 전용 규칙 제거**

`.contactSection`, `.contactBackground`, `.contactContent`, `.contactCopy`,
`.contactBadge`, `.contactHeading`, `.contactButton`과 관련 미디어 쿼리 규칙만
제거합니다. FAQ 목록과 사이드바의 `.sidebarContact*` 규칙은 별도 UI이므로 유지합니다.

- [ ] **5단계: 테스트 실행 후 커밋**

```bash
node --test apps/user/__tests__/cta-section.test.mjs
git add apps/user/app/(site)/faq/page.tsx apps/user/app/(site)/faq/page.module.css apps/user/__tests__/cta-section.test.mjs
git commit -m "refactor(user): reuse CTA on FAQ page"
```

예상 결과: 모든 CTA 테스트 통과.

---

### 작업 4: 전체 검증

**파일:**
- 확인: `apps/user/app/_components/CtaSection.tsx`
- 확인: `apps/user/app/_components/CtaSection.module.css`
- 확인: `apps/user/app/(site)/page.tsx`
- 확인: `apps/user/app/(site)/faq/page.tsx`

**인터페이스:**
- 결과: 메인과 FAQ가 동일한 공용 CTA를 사용하고 전체 앱이 정상 빌드됨

- [ ] **1단계: 코드 검사 실행**

```bash
node --test apps/user/__tests__/cta-section.test.mjs
node --test apps/user/__tests__/complaint-page.test.mjs
pnpm --filter user check-types
pnpm --filter user lint
pnpm --filter user build
```

예상 결과: 모든 명령 종료 코드 `0`, 불편 접수 테스트 `15/15` 통과.

- [ ] **2단계: 개발 서버에서 화면 확인**

```bash
pnpm --filter user dev
```

확인 주소:

- `http://localhost:3000/`
- `http://localhost:3000/faq`

확인 항목:

- 메인은 배지, 2줄 제목, `씨브레인` 강조, 설명, 버튼 2개가 표시됩니다.
- FAQ는 상담 시간 배지, 제목, 설명, 카카오 버튼 1개만 표시됩니다.
- 모바일에서는 버튼이 세로로 배치되고 데스크톱에서는 가로로 배치됩니다.
- 제목과 버튼이 배경 밖으로 넘치지 않습니다.

- [ ] **3단계: 최종 상태 확인**

```bash
git status --short --branch
git log -4 --oneline
```

예상 결과: 커밋되지 않은 소스 변경이 없고 공용 CTA 관련 커밋이 표시됩니다.
