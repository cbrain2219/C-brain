# 사용자 공지사항 리스트·상세 페이지 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 제공된 두 레퍼런스 이미지와 같은 공지사항 리스트와 상세 화면을 `/notice`, `/notice/[id]`에서 데이터가 보이는 상태로 완성한다.

**Architecture:** 기존 Next.js App Router의 서버 페이지, `NoticeBoard`/`NoticeItem`/`NoticeDetailArticle`, 카테고리 query string, 목록 위치 복원 로직을 그대로 재사용한다. 현재 저장소에는 공지 전용 Supabase 테이블과 서비스가 없으므로 이 UI 작업에서는 `_data/notices.ts`의 타입 안전한 fixture를 단일 데이터 소스로 두고, 리스트와 상세가 같은 레코드를 조회하게 한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9, CSS Modules, Node.js 내장 test runner

## Global Constraints

- 디자인 기준은 사용자가 첨부한 공지사항 리스트 이미지와 상세 이미지다.
- 구현 또는 수정 전 확인한 `design.md`의 Pretendard typography, 공용 SVG `Icon`, `currentColor`, 부모 `gap` 기반 간격 규칙을 지킨다.
- 이미 구현된 `/notice`, `/notice/[id]`, `NoticeBoard`, `NoticeItem`, `NoticeDetailArticle`, 카테고리 query, 목록 scroll 복원 코드를 새 구조로 재작성하지 않는다.
- 현재 미커밋 상태인 `apps/user/app/(site)/notice/_data/notices.ts`의 빈 adapter는 이 계획 실행 시 아래의 최소 fixture로 교체한다. 그 외 사용자·어드민 미커밋 변경은 건드리지 않는다.
- Supabase schema/service, 어드민 CRUD, 페이지네이션, 검색, 무한 스크롤, 조회수는 이번 이미지 구현 범위 밖이다.
- 신규 패키지를 설치하지 않는다. 테스트는 저장소에 이미 쓰이는 `node:test`와 소스 계약 검사 방식으로 작성한다.
- 공지 hero는 기존 로컬 asset `/figma-assets/notice-hero-background.webp`를 재사용한다. 신규 이미지 asset은 없다.
- 리스트 레퍼런스는 board 구간을 중심으로 잘린 이미지이므로 기존 page hero, site header, footer를 제거하지 않는다.
- 리스트 이미지의 반복 row 수는 feed 예시로 보고 같은 문구의 record를 8개 복제하지 않는다. pinned와 regular variant를 각각 한 건으로 검증한다.
- 제품 UI용 핀 아이콘은 `apps/user/components/Icon.tsx`에 등록하고 `currentColor`를 사용한다. 작성자 원형 마크는 씨브레인 brand mark이므로 기존 `NoticeAuthorMark`를 유지한다.
- 카테고리 tab은 `전체`, `공지`, `이벤트`, `휴무 안내`, `서비스 변경`, `수상 · 소식` 순서를 유지하고 현재 항목에 `aria-current="page"`를 제공한다.
- 존재하지 않는 상세 ID는 `notFound()`로 404를 반환하고, 상세 metadata는 공지 제목과 요약으로 생성한다.
- 최종 검사 `rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages`는 출력이 없어야 한다.

---

## File Structure

- Create: `apps/user/__tests__/notice-pages.test.mjs` — 데이터, 리스트, 상세, 공용 아이콘의 핵심 계약을 한 번에 검증한다.
- Modify: `apps/user/app/(site)/notice/_data/notices.ts` — 리스트와 상세가 함께 사용하는 최소 공지 fixture, category filter, 날짜 정렬, ID 조회를 소유한다.
- Modify: `apps/user/components/Icon.tsx` — 재사용 가능한 `pin` SVG icon을 registry에 등록한다.
- Modify: `apps/user/app/(site)/notice/_components/NoticeItem.tsx` — 로컬 `PinIcon`을 제거하고 공용 `Icon`을 사용한다.
- Reuse unchanged: `apps/user/app/(site)/notice/page.tsx` — hero, 전체 개수, 활성 category와 `NoticeBoard`를 조합한다.
- Reuse unchanged: `apps/user/app/(site)/notice/_components/NoticeBoard.tsx` — category navigation, 고정/일반 분리, 빈 상태를 렌더링한다.
- Reuse unchanged: `apps/user/app/(site)/notice/page.module.css` — 리스트의 tab, pinned card, 일반 row, 반응형 배치를 제공한다.
- Reuse unchanged: `apps/user/app/(site)/notice/[id]/page.tsx` — ID 조회, dynamic metadata, 404, 복귀 category를 처리한다.
- Reuse unchanged: `apps/user/app/(site)/notice/[id]/_components/NoticeDetailArticle.tsx` — badge, 제목, meta, 본문 block, 목록 버튼을 렌더링한다.
- Reuse unchanged: `apps/user/app/(site)/notice/[id]/page.module.css` — 상세의 640px 본문 폭, typography, list, 버튼을 제공한다.
- Reuse unchanged: `apps/user/app/(site)/notice/_utils/noticeListHistory.ts` — 목록 category와 scroll 위치 복원을 담당한다.

### Task 1: 공지 페이지 계약 테스트 추가

**Files:**

- Create: `apps/user/__tests__/notice-pages.test.mjs`
- Verify: `apps/user/app/(site)/notice/page.tsx`
- Verify: `apps/user/app/(site)/notice/_components/NoticeBoard.tsx`
- Verify: `apps/user/app/(site)/notice/_components/NoticeItem.tsx`
- Verify: `apps/user/app/(site)/notice/[id]/page.tsx`
- Verify: `apps/user/app/(site)/notice/[id]/_components/NoticeDetailArticle.tsx`

**Interfaces:**

- Consumes: 현재 notice route/component의 source contract
- Produces: `node --test apps/user/__tests__/notice-pages.test.mjs`로 실행 가능한 회귀 검사

- [ ] **Step 1: 현재 빈 데이터와 로컬 핀 아이콘을 잡는 실패 테스트를 작성한다**

  `apps/user/__tests__/notice-pages.test.mjs`를 아래 내용으로 생성한다.

  ```js
  import assert from "node:assert/strict";
  import { readFile } from "node:fs/promises";
  import test from "node:test";

  const paths = {
    board: new URL(
      "../app/(site)/notice/_components/NoticeBoard.tsx",
      import.meta.url,
    ),
    data: new URL("../app/(site)/notice/_data/notices.ts", import.meta.url),
    detailArticle: new URL(
      "../app/(site)/notice/[id]/_components/NoticeDetailArticle.tsx",
      import.meta.url,
    ),
    detailPage: new URL("../app/(site)/notice/[id]/page.tsx", import.meta.url),
    icon: new URL("../components/Icon.tsx", import.meta.url),
    item: new URL(
      "../app/(site)/notice/_components/NoticeItem.tsx",
      import.meta.url,
    ),
    listPage: new URL("../app/(site)/notice/page.tsx", import.meta.url),
  };

  async function source(name) {
    return readFile(paths[name], "utf8");
  }

  test("notice data feeds pinned, regular, filtered, and detail views", async () => {
    const data = await source("data");

    assert.match(data, /const noticeFixtures = \[/);
    assert.match(data, /isPinned: true/);
    assert.match(data, /isPinned: false/);
    assert.match(data, /activeCategory === "all"/);
    assert.match(data, /Date\.parse/);
    assert.match(
      data,
      /noticeFixtures\.find\(\(notice\) => notice\.id === id\)/,
    );
  });

  test("notice list keeps category, pinned, detail-link, and shared-icon contracts", async () => {
    const [listPage, board, item, icon] = await Promise.all([
      source("listPage"),
      source("board"),
      source("item"),
      source("icon"),
    ]);

    assert.match(listPage, /resolveNoticeCategory\(category\)/);
    assert.match(listPage, /getNoticePageData\(activeCategory\)/);
    assert.match(board, /notice\.isPinned/);
    assert.match(board, /!notice\.isPinned/);
    assert.match(board, /aria-current=\{isActive \? "page" : undefined\}/);
    assert.match(item, /\?from=\$\{activeCategory\}/);
    assert.match(item, /<Icon[^>]*name="pin"[^>]*\/>/s);
    assert.doesNotMatch(item, /function PinIcon/);
    assert.match(icon, /\| "pin"/);
    assert.match(icon, /pin: PinIcon/);
  });

  test("notice detail keeps metadata, 404, structured content, and list return", async () => {
    const [page, article] = await Promise.all([
      source("detailPage"),
      source("detailArticle"),
    ]);

    assert.match(page, /notFound\(\)/);
    assert.match(page, /title: `\$\{notice\.title\} \| 씨브레인`/);
    assert.match(article, /<time dateTime=\{notice\.publishedAt\}>/);
    assert.match(article, /notice\.content\.map/);
    assert.match(article, /block\.type === "paragraph"/);
    assert.match(article, /<NoticeBackButton/);
  });
  ```

- [ ] **Step 2: 테스트가 의도한 이유로 실패하는지 확인한다**

  ```bash
  node --test apps/user/__tests__/notice-pages.test.mjs
  ```

  Expected: 첫 테스트가 `const noticeFixtures` 또는 `isPinned: true` 부재로 실패하고, 두 번째 테스트가 `<Icon name="pin">` 부재로 실패한다. 상세 계약 검사는 통과한다.

### Task 2: 리스트와 상세가 공유하는 최소 공지 데이터 구현

**Files:**

- Modify: `apps/user/app/(site)/notice/_data/notices.ts`
- Test: `apps/user/__tests__/notice-pages.test.mjs`

**Interfaces:**

- Consumes: `NoticeCategoryValue`, `NoticeDetail`, `NoticePageData`, `noticeCategories`
- Produces: `resolveNoticeCategory(category)`, `getNoticePageData(activeCategory)`, `getNoticeById(id)`
- Guarantees: 전체 count는 filter와 무관하게 2, 반환 목록은 최신순, 상세 ID는 리스트 ID와 동일

- [ ] **Step 1: 빈 adapter를 두 이미지 상태를 모두 재현하는 fixture로 교체한다**

  `apps/user/app/(site)/notice/_data/notices.ts`를 아래 내용으로 교체한다.

  ```ts
  import { noticeCategories } from "../_constants/noticeCategories";
  import type {
    NoticeCategoryValue,
    NoticeDetail,
    NoticePageData,
  } from "../_types/notice";

  const noticeFixtures = [
    {
      id: "summer-sale",
      category: "notice",
      title: "여름 특별 할인 프로모션 — 최대 30% 할인",
      excerpt:
        "6월 한 달 간 홈페이지 제작 패키지 전 상품 최대 30% 할인 이벤트를 진행합니다. 상담 신청 시 추가 혜택도 제공됩니다.",
      author: "씨브레인",
      publishedAt: "2026-11-02T00:00:00+09:00",
      isPinned: true,
      content: [
        {
          type: "paragraph",
          text: "6월 한 달 간 홈페이지 제작 패키지 전 상품 최대 30% 할인 이벤트를 진행합니다. 상담 신청 시 추가 혜택도 제공됩니다.",
        },
      ],
    },
    {
      id: "update-2-1-0",
      category: "notice",
      title: "2026년 2월 정기 업데이트 안내 (Ver 2.1.0)",
      excerpt:
        "사용자분들께 더 나은 경험을 제공하기 위해 2.1.0 버전 업데이트가 진행되었습니다.",
      author: "씨브레인",
      publishedAt: "2026-02-09T00:00:00+09:00",
      isPinned: false,
      content: [
        {
          type: "paragraph",
          text: "안녕하세요, [서비스명] 팀입니다. 사용자분들께 더 나은 경험을 제공하기 위해 2.1.0 버전 업데이트가 진행되었습니다.",
        },
        {
          type: "paragraph",
          text: "이번 업데이트에서는 많은 분들이 요청해주셨던 다크 모드(Dark Mode) 지원과 검색 속도 개선에 중점을 두었습니다. 상세 내용은 아래를 확인해 주세요.",
        },
        { type: "paragraph", text: "[주요 업데이트 내역]" },
        {
          type: "ordered-list",
          items: [
            {
              title: "다크 모드 공식 지원",
              details: [
                "이제 어두운 환경에서도 눈의 피로 없이 서비스를 이용하실 수 있습니다.",
                "설정 방법: [마이페이지] > [설정] > [화면 테마]에서 '다크 모드'를 선택하세요.",
              ],
            },
            {
              title: "검색 엔진 성능 최적화",
              details: [
                "데이터 검색 로직을 개선하여, 검색 결과 로딩 속도가 기존 대비 약 2배 빨라졌습니다.",
                "오타가 있어도 유사한 결과를 찾아주는 '추천 검색어' 기능이 고도화되었습니다.",
              ],
            },
            {
              title: "버그 수정 및 안정성 향상",
              details: [
                "간헐적으로 푸시 알림이 중복 발송되던 현상을 수정했습니다.",
                "iOS 환경에서 일부 이미지가 깨져 보이던 문제를 해결했습니다.",
                "기타 서버 안정화 작업이 진행되었습니다.",
              ],
            },
          ],
        },
        {
          type: "paragraph",
          text: "항상 [서비스명]을 이용해 주셔서 감사합니다. 앞으로도 소중한 의견을 반영하여 발전하는 서비스가 되겠습니다.",
        },
        { type: "paragraph", text: "감사합니다." },
      ],
    },
  ] as const satisfies readonly NoticeDetail[];

  export function resolveNoticeCategory(
    category: string | undefined,
  ): NoticeCategoryValue {
    return noticeCategories.some((item) => item.value === category) && category
      ? (category as NoticeCategoryValue)
      : "all";
  }

  export function getNoticePageData(
    activeCategory: NoticeCategoryValue,
  ): NoticePageData {
    const filteredNotices =
      activeCategory === "all"
        ? noticeFixtures
        : noticeFixtures.filter((notice) => notice.category === activeCategory);

    return {
      categories: noticeCategories,
      notices: [...filteredNotices].sort(
        (firstNotice, secondNotice) =>
          Date.parse(secondNotice.publishedAt) -
          Date.parse(firstNotice.publishedAt),
      ),
      totalCount: noticeFixtures.length,
    };
  }

  export function getNoticeById(id: string): NoticeDetail | undefined {
    return noticeFixtures.find((notice) => notice.id === id);
  }
  ```

  두 record만 둔다. 첫 record가 pinned card를, 두 번째가 일반 row와 상세 본문을 검증하므로 반복 placeholder row는 추가하지 않는다.

- [ ] **Step 2: 데이터 관련 계약이 통과하고 공용 아이콘 계약만 남는지 확인한다**

  ```bash
  node --test apps/user/__tests__/notice-pages.test.mjs
  ```

  Expected: 첫 번째와 세 번째 테스트는 PASS, 두 번째 테스트만 `<Icon name="pin">` 부재로 FAIL한다.

- [ ] **Step 3: TypeScript 데이터 계약을 확인한다**

  ```bash
  pnpm --filter user check-types
  ```

  Expected: exit code 0. `NoticeDetail` fixture가 `NoticePageData.notices`의 `NoticeSummary` 계약에도 구조적으로 호환된다.

### Task 3: 핀 아이콘을 공용 registry로 이동

**Files:**

- Modify: `apps/user/components/Icon.tsx:15-46,499-552`
- Modify: `apps/user/app/(site)/notice/_components/NoticeItem.tsx:1-30,47-50`
- Test: `apps/user/__tests__/notice-pages.test.mjs`

**Interfaces:**

- Consumes: 기존 `IconProps`, `IconComponent`, `icons` registry
- Produces: `<Icon name="pin" size={12} />`
- Preserves: 핀 path, 12×12 viewBox, `currentColor`, `aria-hidden`

- [ ] **Step 1: `pin`을 공용 `Icon` 이름과 registry에 등록한다**

  `apps/user/components/Icon.tsx`의 `IconName` union에 아래 항목을 추가한다.

  ```ts
  | "pin"
  ```

  `XCloseIcon` 앞에 아래 component를 추가한다.

  ```tsx
  function PinIcon({ size = 24, ...props }: Omit<IconProps, "name">) {
    return (
      <svg
        aria-hidden="true"
        fill="none"
        height={size}
        viewBox="0 0 12 12"
        width={size}
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path
          d="m7.85 1.5 2.65 2.65-1.7.57-1.65 1.65.25 1.8-.72.72-1.78-1.8-2.68 2.68-.7-.7L4.2 6.39 2.4 4.61l.72-.72 1.8.25 1.65-1.65.58-1.7.7.71Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  ```

  `icons` object에 아래 entry를 추가한다.

  ```ts
  pin: PinIcon,
  ```

- [ ] **Step 2: `NoticeItem`의 로컬 SVG를 공용 `Icon`으로 교체한다**

  `apps/user/app/(site)/notice/_components/NoticeItem.tsx` 상단에 import를 추가한다.

  ```tsx
  import { Icon } from "../../../../components/Icon";
  ```

  기존 `function PinIcon()` 전체를 삭제하고 pinned tag 내부를 아래처럼 바꾼다.

  ```tsx
  <span className={styles.pinnedTag}>
    <Icon className={styles.pinIcon} name="pin" size={12} />
    고정됨
  </span>
  ```

- [ ] **Step 3: 공지 계약 테스트 전체를 통과시킨다**

  ```bash
  node --test apps/user/__tests__/notice-pages.test.mjs
  ```

  Expected: 3 tests, 3 pass, 0 fail.

### Task 4: 리스트 페이지 시각·상호작용 검증

**Files:**

- Verify unchanged: `apps/user/app/(site)/notice/page.tsx`
- Verify unchanged: `apps/user/app/(site)/notice/_components/NoticeBoard.tsx`
- Verify unchanged: `apps/user/app/(site)/notice/_components/NoticeItem.tsx`
- Verify unchanged: `apps/user/app/(site)/notice/page.module.css`
- Verify unchanged: `apps/user/components/PageHero.tsx`
- Verify unchanged: `apps/user/components/HorizontalDragScroll.tsx`

**Interfaces:**

- Consumes: `getNoticePageData(activeCategory)`의 `NoticePageData`
- Produces: `/notice`, `/notice?category=notice`, `/notice?category=<invalid>`
- Guarantees: query 기반 filter, pinned-first grouping, 상세 link의 `from`, mobile horizontal category rail

- [ ] **Step 1: user app을 실행한다**

  ```bash
  pnpm --filter user dev
  ```

  Expected: `http://localhost:3000`에서 Next.js dev server가 시작된다.

- [ ] **Step 2: 1172px 너비에서 리스트 DOM과 핵심 치수를 검증한다**

  `http://localhost:3000/notice`를 viewport 1172px 이상으로 열고 콘솔에서 실행한다.

  ```js
  const labels = Array.from(
    document.querySelectorAll('[aria-label="공지사항 카테고리"] a'),
  ).map((node) => node.textContent?.trim());
  const pinned = document.querySelector('a[href^="/notice/summer-sale"]');
  const regular = document.querySelector('a[href^="/notice/update-2-1-0"]');
  const active = document.querySelector(
    '[aria-label="공지사항 카테고리"] [aria-current="page"]',
  );

  if (
    JSON.stringify(labels) !==
    JSON.stringify([
      "전체",
      "공지",
      "이벤트",
      "휴무 안내",
      "서비스 변경",
      "수상 · 소식",
    ])
  ) {
    throw new Error(`Unexpected categories: ${labels.join(", ")}`);
  }
  if (active?.textContent?.trim() !== "전체")
    throw new Error("전체 tab is not active");
  if (!document.body.innerText.includes("전체 공지사항 2"))
    throw new Error("Wrong total count");
  if (!pinned || getComputedStyle(pinned).borderRadius !== "16px") {
    throw new Error("Pinned notice card is missing");
  }
  if (!regular) throw new Error("Regular notice row is missing");
  if (!pinned.getAttribute("href")?.endsWith("?from=all"))
    throw new Error("Missing list origin");
  ```

  Expected: 오류 없이 끝난다. pinned record는 연한 회색 16px radius card, regular record는 배경 없는 row로 표시되고 meta는 우측에 정렬된다.

- [ ] **Step 3: category query와 잘못된 query fallback을 검증한다**

  `http://localhost:3000/notice?category=notice`에서 두 공지가 모두 보이고 `공지` tab이 `aria-current="page"`인지 확인한다. `http://localhost:3000/notice?category=event`에서는 `등록된 공지사항이 없습니다.`가 보인다. `http://localhost:3000/notice?category=unknown`에서는 `전체` tab과 두 공지가 다시 보여야 한다.

- [ ] **Step 4: mobile reflow와 접근성을 검증한다**

  390×844 viewport에서 `/notice`를 열고 아래를 실행한다.

  ```js
  const pinned = document.querySelector('a[href^="/notice/summer-sale"]');
  const title = pinned?.querySelector("h3");
  const rail = document.querySelector('[aria-label="공지사항 카테고리"]');

  if (
    document.documentElement.scrollWidth !==
    document.documentElement.clientWidth
  ) {
    throw new Error("Unexpected page-level horizontal overflow");
  }
  if (!rail || rail.scrollWidth <= rail.clientWidth) {
    throw new Error("Category rail should scroll horizontally on mobile");
  }
  if (!title || getComputedStyle(title).textOverflow !== "ellipsis") {
    throw new Error("Long notice title should truncate");
  }
  ```

  Expected: category rail만 가로로 스크롤되고 페이지 자체는 넘치지 않는다. tag → 제목/요약 → 작성자/날짜 순서로 쌓이고 긴 제목은 한 줄 ellipsis, 요약은 최대 두 줄이다.

### Task 5: 상세 페이지와 목록 복귀 검증

**Files:**

- Verify unchanged: `apps/user/app/(site)/notice/[id]/page.tsx`
- Verify unchanged: `apps/user/app/(site)/notice/[id]/_components/NoticeDetailArticle.tsx`
- Verify unchanged: `apps/user/app/(site)/notice/[id]/_components/NoticeBackButton.tsx`
- Verify unchanged: `apps/user/app/(site)/notice/[id]/page.module.css`
- Verify unchanged: `apps/user/app/(site)/notice/_utils/noticeListHistory.ts`

**Interfaces:**

- Consumes: `getNoticeById(id)`, `from` search param
- Produces: structured notice article, dynamic metadata, 404, category-aware list return
- Guarantees: 직접 진입은 fallback href로 이동하고 리스트에서 진입하면 history와 scroll 위치를 복원

- [ ] **Step 1: 상세 화면의 레퍼런스 문구와 구조를 검증한다**

  `http://localhost:3000/notice/update-2-1-0?from=all`을 열고 콘솔에서 실행한다.

  ```js
  const heading = document.querySelector("h1");
  const badge = document.querySelector("main section > div > p");
  const orderedItems = document.querySelectorAll("article ol > li");
  const details = document.querySelectorAll("article ol ul > li");
  const time = document.querySelector("time");
  const backButton = Array.from(document.querySelectorAll("button")).find(
    (node) => node.textContent?.trim() === "목록으로",
  );

  if (badge?.textContent?.trim() !== "공지")
    throw new Error("Wrong category badge");
  if (
    heading?.textContent?.trim() !== "2026년 2월 정기 업데이트 안내 (Ver 2.1.0)"
  ) {
    throw new Error("Wrong notice title");
  }
  if (time?.textContent?.trim() !== "2026. 02. 09")
    throw new Error("Wrong published date");
  if (orderedItems.length !== 3 || details.length !== 7) {
    throw new Error("Structured update list is incomplete");
  }
  if (!backButton) throw new Error("Missing list button");
  ```

  Expected: 오류 없이 끝나며 badge, 제목, 작성자, 작성일, 두 개의 도입 문단, `[주요 업데이트 내역]`, 3개 번호 항목, 7개 bullet, 맺음말, 목록 버튼이 이미지 순서대로 표시된다.

- [ ] **Step 2: 상세 반응형 치수를 확인한다**

  838×1036과 390×844 viewport에서 상세 페이지를 확인한다. computed style 기준으로 `.detailInner`는 `max-width: 640px`, section 좌우 padding은 `20px`, badge 최소 높이는 `40px`, 제목은 `20px/30px`, 본문은 `16px/24px`, 본문 block gap은 `24px`, 목록 버튼 최소 높이는 `52px`여야 한다. 두 viewport 모두 본문이 잘리거나 가로 overflow가 생기지 않아야 한다.

- [ ] **Step 3: metadata와 404를 확인한다**

  ```bash
  curl -s http://localhost:3000/notice/update-2-1-0 | rg "2026년 2월 정기 업데이트 안내 \(Ver 2.1.0\) \| 씨브레인"
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/notice/not-found
  ```

  Expected: 첫 명령은 제목 metadata를 출력하고, 두 번째 명령은 `404`를 출력한다.

- [ ] **Step 4: 목록 위치 복원 flow를 검증한다**

  `/notice`에서 regular 공지가 viewport 중간에 오도록 스크롤한 뒤 클릭하고 `목록으로`를 누른다. Expected: `/notice`로 돌아가며 이전 scroll 위치가 복원된다. `/notice/update-2-1-0?from=notice`에 직접 진입한 뒤 `목록으로`를 누르면 `/notice?category=notice`로 이동한다.

### Task 6: 전체 품질 gate와 변경 범위 확인

**Files:**

- Test: `apps/user/__tests__/notice-pages.test.mjs`
- Verify: 계획에서 수정한 모든 파일

**Interfaces:**

- Consumes: Tasks 1-5 결과
- Produces: lint, types, build, source-policy, whitespace 검사를 통과한 구현

- [ ] **Step 1: 자동 검사를 실행한다**

  ```bash
  node --test apps/user/__tests__/notice-pages.test.mjs
  pnpm --filter user lint
  pnpm --filter user check-types
  pnpm --filter user build
  ```

  Expected: notice tests는 `3 pass, 0 fail`, 나머지 세 명령은 exit code 0으로 종료한다.

- [ ] **Step 2: Figma URL과 diff hygiene를 검사한다**

  ```bash
  rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages
  git diff --check
  git diff -- \
    'apps/user/__tests__/notice-pages.test.mjs' \
    'apps/user/app/(site)/notice/_data/notices.ts' \
    'apps/user/app/(site)/notice/_components/NoticeItem.tsx' \
    'apps/user/components/Icon.tsx'
  ```

  Expected: `rg`는 출력 없이 exit code 1, `git diff --check`는 exit code 0이다. source diff는 테스트, 공지 fixture, 공용 pin icon 전환만 포함하며 기존 리스트·상세 구조를 재작성하지 않는다.

- [ ] **Step 3: 사용자가 요청한 경우에만 구현을 커밋한다**

  ```bash
  git add \
    apps/user/__tests__/notice-pages.test.mjs \
    'apps/user/app/(site)/notice/_data/notices.ts' \
    'apps/user/app/(site)/notice/_components/NoticeItem.tsx' \
    apps/user/components/Icon.tsx
  git commit -m "feat(user): complete notice list and detail data"
  ```

## Self-Review

- Spec coverage: 리스트의 category tab, active underline, pinned card, 일반 row, 제목/요약 truncation, 작성자/날짜, 상세 badge/title/meta/body/list/button, mobile reflow를 Tasks 2, 4, 5에 각각 고정했다.
- Existing-code fit: 이미 존재하는 route, CSS, scroll restoration, hero, section layout을 재사용하고 실제 source 변경을 네 파일로 제한했다.
- Data consistency: `NoticeDetail` 두 record가 `NoticeSummary`로도 사용되며 list link ID와 detail lookup ID가 동일하다. `from` 값은 `NoticeCategoryValue`로 정규화된다.
- Scope gap: 저장소에 공지 전용 DB contract가 없으므로 Supabase와 어드민 CRUD 연결은 포함하지 않았다. 이 연결이 필요하면 fixture 교체만 별도 계획으로 다룬다.
- Placeholder scan: 미정 단계 없이 fixture 문구, 파일 경로, 함수 이름, 검증 명령과 기대 결과를 모두 명시했다.
