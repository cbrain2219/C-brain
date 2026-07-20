# 어드민 포트폴리오 등록·수정 및 공통 폼 레이아웃 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Figma 노드 232:3174와 동일한 /portfolio/new 등록 화면 및 /portfolio/:portfolioId 수정 화면을 만들고, 상품 등록 화면과 반복되는 폼 골격·하단 액션·아이콘만 공통화한다.

**Architecture:** AdminFormLayout은 640px 중심 폼, 제목, 본문, 하단 액션만 제공하는 얇은 form 레이아웃이다. 상품과 포트폴리오는 이 레이아웃과 공통 아이콘만 공유하고, 상품의 2단계 가격 조합·상품 유형 combobox와 포트폴리오의 이미지 슬롯·본문 모드·노출 설정은 각 페이지에 남긴다. 서버 API 계약이 없으므로 제출과 임시저장은 기존 상품 폼과 같이 클라이언트 검증·목록 이동까지만 구현한다.

**Tech Stack:** React 19, TypeScript, React Router 7, Vite 8, CSS, Node 22 내장 테스트 러너

## Global Constraints

- 기준 디자인은 Figma qZcNE6of4hWidBcayhacSI, 노드 232:3174이다. 브라우저 chrome과 footer는 구현 범위가 아니며 현재 AdminHeader와 admin shell을 사용한다.
- 폼의 PC 폭은 640px, 페이지 상단 여백은 52px, 컨트롤 높이는 52px, 컨트롤 반경은 16px, 필드 간격은 20px, 하단 액션 간격은 52px이다.
- design.md의 Pretendard 타이포그래피, 부모 gap 기반 간격, input/select/textarea의 추가 focus 스타일 금지 규칙을 따른다.
- 제품 UI 아이콘은 공유 아이콘 컴포넌트로 렌더링하고 currentColor를 사용한다. Figma MCP URL을 소스에 넣지 않는다.
- Figma의 이미지 영역은 동적 사용자 업로드 입력이다. 새 Figma 이미지 asset은 추가하지 않으며 PNG/JPEG/WEBP, 각 50MB 이하만 클라이언트에서 허용한다.
- 필수값은 포트폴리오 유형, 제목, Slug, 기업명, 내용이다. 활성 이미지 슬롯은 파일을 선택했을 때만 형식·크기를 검사하며, 이미지 자체는 필수가 아니다.
- Slug는 영문 대소문자와 하이픈만 허용한다. API 계약이 생기기 전에는 slug 중복 여부를 조회하거나 자동 변환하지 않는다.
- 본문 모드의 HTML 작성/TEXT Editor 작성은 편집기 라이브러리를 추가하지 않고 선택 상태와 하나의 textarea만 전환한다.
- Figma의 9개 등록됨, 2개 등록됨은 데이터 소스가 없으므로 각각 랜딩/상단고정 설정의 정적 보조 문구로 둔다.
- 최종 확인은 rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages가 출력 없이 끝나야 한다.

## Abstraction Boundary

공통화한다:

- 중심 폭·제목·본문·하단 버튼 영역을 가진 AdminFormLayout.
- outline/solid 액션 버튼과 기본 필드·컨트롤 CSS 토큰.
- check, chevron-down, folder-up, arrow-right의 AdminIcon registry.
- Slug 및 업로드 파일 검증처럼 페이지의 실제 분기에서 사용하는 순수 함수.

공통화하지 않는다:

- 상품의 ProductTypeCombobox, 동적 옵션 행, 2단계 단가 행렬.
- 포트폴리오의 이미지 배열, drag-and-drop, 본문 모드, 랜딩/상단고정 설정.
- JSON schema 기반 폼 렌더러, 범용 업로더, rich-text 편집기, 서버 저장 계층.

## Files

- Create: apps/admin/src/components/admin-form/AdminFormLayout.tsx
- Create: apps/admin/src/components/admin-form/AdminFormLayout.css
- Create: apps/admin/src/components/AdminIcon.tsx
- Create: apps/admin/src/pages/portfolioFormState.ts
- Create: apps/admin/src/pages/PortfolioFormPage.tsx
- Create: apps/admin/src/pages/PortfolioFormPage.css
- Create: apps/admin/tests/portfolioFormState.test.mjs
- Modify: apps/admin/src/pages/ProductFormPage.tsx
- Modify: apps/admin/src/pages/ProductFormPage.css
- Modify: apps/admin/src/App.tsx
- Modify: apps/admin/package.json

---

### Task 1: 공통 폼 골격과 아이콘을 만든다

**Files:**

- Create: apps/admin/src/components/admin-form/AdminFormLayout.tsx
- Create: apps/admin/src/components/admin-form/AdminFormLayout.css
- Create: apps/admin/src/components/AdminIcon.tsx

**Interfaces:**

    export type AdminFormLayoutProps = {
      readonly actions: ReactNode
      readonly children: ReactNode
      readonly onSubmit: FormEventHandler<HTMLFormElement>
      readonly title: string
    }

    export type AdminIconName =
      | 'arrow-right'
      | 'check'
      | 'chevron-down'
      | 'folder-up'

    export function AdminFormLayout(props: AdminFormLayoutProps): ReactElement
    export function AdminIcon(props: { name: AdminIconName; size?: number }): ReactElement

- [ ] **Step 1: Write the shared semantic form wrapper.**

    import { useId, type FormEventHandler, type ReactNode } from 'react'
    import './AdminFormLayout.css'

    export type AdminFormLayoutProps = {
      readonly actions: ReactNode
      readonly children: ReactNode
      readonly onSubmit: FormEventHandler<HTMLFormElement>
      readonly title: string
    }

    export function AdminFormLayout({ actions, children, onSubmit, title }: AdminFormLayoutProps) {
      const titleId = useId()

      return (
        <main className="admin-form-page" aria-labelledby={titleId}>
          <form className="admin-form" onSubmit={onSubmit}>
            <div className="admin-form__body">
              <h1 className="admin-form__title pretendard-bold-18" id={titleId}>
                {title}
              </h1>
              {children}
            </div>
            <div className="admin-form__actions">{actions}</div>
          </form>
        </main>
      )
    }

- [ ] **Step 2: Add shared layout/action styles, not product-specific form behavior.**

    .admin-form-page {
      width: 100%;
      min-height: calc(100svh - 80px);
      flex: 1 0 auto;
      padding: 52px 40px 104px;
      border-top: 1px solid #f1f5f9;
      background: var(--admin-surface);
      color: var(--admin-gray-800);
      display: flex;
      justify-content: center;
    }

    .admin-form {
      width: min(640px, 100%);
      display: flex;
      flex-direction: column;
      gap: 52px;
    }

    .admin-form__body,
    .admin-form__actions,
    .admin-form__actions-group {
      display: flex;
    }

    .admin-form__body {
      flex-direction: column;
      gap: 20px;
    }

    .admin-form__actions {
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .admin-form__actions-group {
      align-items: center;
      gap: 8px;
    }

    .admin-form__button {
      min-height: 52px;
      padding: 8px 16px;
      border-radius: 16px;
      font-family: var(--font-sans);
      font-size: 14px;
      font-weight: 700;
      line-height: 21px;
      letter-spacing: -0.015em;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      white-space: nowrap;
      cursor: pointer;
    }

    .admin-form__button--outline {
      border: 1px solid var(--admin-brand-500);
      background: var(--admin-surface);
      color: var(--admin-brand-500);
    }

    .admin-form__button--solid {
      border: 1px solid var(--admin-brand-500);
      background: var(--admin-brand-500);
      color: var(--admin-text-inverse);
    }

    @media (max-width: 720px) {
      .admin-form-page { padding: 40px 20px 72px; }
    }

    @media (max-width: 520px) {
      .admin-form__actions { align-items: stretch; flex-direction: column; }
      .admin-form__actions-group,
      .admin-form__button { width: 100%; }
      .admin-form__button { flex: 1 1 0; }
    }

Do not move combobox, option-row, tab, or unit-price CSS.

- [ ] **Step 3: Centralize the four glyphs used by the two forms.**

Move the exact current ProductFormPage check, chevron-down, and arrow-right paths into AdminIcon. Add the Figma folder-up-02 path as folder-up. Every SVG must set explicit width and height, fill="none", stroke="currentColor", round linecap/linejoin, and a 1.5px stroke. Do not use img tags or Figma URLs.

    import type { ReactNode } from 'react'

    const iconDefinitions: Record<
      AdminIconName,
      { readonly glyph: ReactNode; readonly viewBox: string }
    > = {
      'arrow-right': {
        glyph: <path d="M8.889 12.667L13.333 8L8.889 3.333M13.333 8H2.667" />,
        viewBox: '0 0 16 16',
      },
      check: {
        glyph: <path d="M1 4L3.75 6.5L9 1" />,
        viewBox: '0 0 12 10',
      },
      'chevron-down': {
        glyph: <path d="M7 10L12 15L17 10" />,
        viewBox: '0 0 24 24',
      },
      'folder-up': {
        glyph: (
          <path d="M10.7106 14.2352H3.00044C1.89586 14.2352 1.00043 13.3397 1.00045 12.2352L1.00052 4.63158C1.00053 3.86998 1.00024 2.7852 1 1.99974C0.99983 1.44731 1.44761 1 2.00004 1H6.76522L9.06941 3.46136H15.9997C16.5519 3.46136 16.9997 3.90908 16.9997 4.46136V7.11768M17.0446 11.5611L15.0898 9.61768L13.0446 11.6532M15.0898 9.61768V14.6177" />
        ),
        viewBox: '0 0 18.0446 15.6177',
      },
    }

    export function AdminIcon({ name, size = 20 }: { name: AdminIconName; size?: number }) {
      const icon = iconDefinitions[name]

      return (
        <svg
          aria-hidden="true"
          fill="none"
          height={size}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          viewBox={icon.viewBox}
          width={size}
        >
          {icon.glyph}
        </svg>
      )
    }

- [ ] **Step 4: Compile the standalone code.**

Run: pnpm --filter admin build

Expected: PASS; the new shared components compile before page migration.

- [ ] **Step 5: Commit the shared foundation.**

    git add apps/admin/src/components/admin-form/AdminFormLayout.tsx \
      apps/admin/src/components/admin-form/AdminFormLayout.css \
      apps/admin/src/components/AdminIcon.tsx
    git commit -m "refactor(admin): add shared form layout"

### Task 2: 상품 폼을 공통 골격으로 옮기되 동작은 바꾸지 않는다

**Files:**

- Modify: apps/admin/src/pages/ProductFormPage.tsx
- Modify: apps/admin/src/pages/ProductFormPage.css

**Consumes:** AdminFormLayout, AdminIcon

**Produces:** 기존 /products/new, /products/:productId의 Step 1/2 검증과 문구를 유지한 공통 레이아웃 사용 예시

- [ ] **Step 1: Delete page-local CheckIcon, ChevronDownIcon, ArrowRightIcon and import shared components.**

    import { AdminIcon } from '../components/AdminIcon'
    import { AdminFormLayout } from '../components/admin-form/AdminFormLayout'

    <AdminIcon name="chevron-down" size={24} />
    <AdminIcon name="check" size={12} />
    <AdminIcon name="arrow-right" size={16} />

Keep all existing aria labels, checked state, input formatting, and native required behavior.

- [ ] **Step 2: Replace both duplicated main/form/title/action shells with AdminFormLayout.**

Use the existing Step 1 fields unchanged as children, with its current submit handler and actions:

    <AdminFormLayout
      actions={
        <>
          <Link className="admin-form__button admin-form__button--outline" to="/products">
            목록으로
          </Link>
          <div className="admin-form__actions-group">
            <button className="admin-form__button admin-form__button--outline" type="button">
              임시저장
            </button>
            <button className="admin-form__button admin-form__button--solid" type="submit">
              <span>다음으로</span>
              <AdminIcon name="arrow-right" size={16} />
            </button>
          </div>
        </>
      }
      onSubmit={handleStepOneSubmit}
      title={pageTitle}
    >
      {/* existing Step 1 controls only */}
    </AdminFormLayout>

For Step 2, retain 뒤로가기, 임시저장, submitLabel, handleFinalSubmit, and all current controls. Only replace the structural wrapper and button class names.

- [ ] **Step 3: Delete only migrated CSS.**

Delete product-form-page, product-form, product-form__body, product-form__title, product-form-actions, product-form-actions__group, and product-form-button selectors. Keep selectors for comboboxes, option rows, tabs, validation, unit-price rows, and the 720px/520px special controls. Replace responsive action selectors with the generic rules in AdminFormLayout.css.

- [ ] **Step 4: Verify product regression before adding portfolio code.**

Run: pnpm --filter admin lint && pnpm --filter admin build

Expected: PASS.

Manual check: /products/new blocks an empty Step 1, preserves formatted prices, and retains Step 2 prices after changing a tab.

- [ ] **Step 5: Commit without unrelated admin-table changes.**

    git add apps/admin/src/pages/ProductFormPage.tsx apps/admin/src/pages/ProductFormPage.css
    git commit -m "refactor(admin): reuse form layout in product form"

### Task 3: Add tested portfolio-only validation and form state

**Files:**

- Create: apps/admin/src/pages/portfolioFormState.ts
- Create: apps/admin/tests/portfolioFormState.test.mjs
- Modify: apps/admin/package.json

**Interfaces:**

    export const MAX_PORTFOLIO_IMAGE_BYTES: number
    export type PortfolioUploadFile = Pick<File, 'size' | 'type'>
    export function getPortfolioImageError(file: PortfolioUploadFile): string | null
    export function isValidPortfolioSlug(value: string): boolean

- [ ] **Step 1: Write the failing Node built-in test.**

    import assert from 'node:assert/strict'
    import test from 'node:test'
    import {
      MAX_PORTFOLIO_IMAGE_BYTES,
      getPortfolioImageError,
      isValidPortfolioSlug,
    } from '../src/pages/portfolioFormState.ts'

    test('slug accepts English letters and hyphens only', () => {
      assert.equal(isValidPortfolioSlug('cbrain-portfolio'), true)
      assert.equal(isValidPortfolioSlug('포트폴리오-01'), false)
    })

    test('image validation permits allowed files at 50MB and rejects invalid files', () => {
      assert.equal(
        getPortfolioImageError({ size: MAX_PORTFOLIO_IMAGE_BYTES, type: 'image/webp' }),
        null,
      )
      assert.match(
        getPortfolioImageError({ size: 1, type: 'application/pdf' }) ?? '',
        /PNG, JPEG, WEBP/,
      )
      assert.match(
        getPortfolioImageError({
          size: MAX_PORTFOLIO_IMAGE_BYTES + 1,
          type: 'image/png',
        }) ?? '',
        /50MB/,
      )
    })

Add the no-dependency script:

    {
      "scripts": {
        "test": "node --experimental-strip-types --test tests/portfolioFormState.test.mjs"
      }
    }

- [ ] **Step 2: Verify the test fails before implementation.**

Run: pnpm --filter admin test

Expected: FAIL with ERR_MODULE_NOT_FOUND for portfolioFormState.ts.

- [ ] **Step 3: Implement the smallest validation module.**

    export const MAX_PORTFOLIO_IMAGE_BYTES = 50 * 1024 * 1024

    const acceptedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

    export type PortfolioUploadFile = Pick<File, 'size' | 'type'>

    export function isValidPortfolioSlug(value: string) {
      return /^[A-Za-z-]+$/.test(value)
    }

    export function getPortfolioImageError(file: PortfolioUploadFile) {
      if (!acceptedImageTypes.has(file.type)) {
        return 'PNG, JPEG, WEBP 파일만 업로드할 수 있습니다.'
      }

      if (file.size > MAX_PORTFOLIO_IMAGE_BYTES) {
        return '이미지 파일은 최대 50MB까지 업로드할 수 있습니다.'
      }

      return null
    }

- [ ] **Step 4: Run the focused check.**

Run: pnpm --filter admin test

Expected: PASS with two passing tests.

- [ ] **Step 5: Commit helpers and their test.**

    git add apps/admin/src/pages/portfolioFormState.ts \
      apps/admin/tests/portfolioFormState.test.mjs \
      apps/admin/package.json
    git commit -m "test(admin): cover portfolio form validation"

### Task 4: Implement the portfolio create/edit page without a generic upload or editor abstraction

**Files:**

- Create: apps/admin/src/pages/PortfolioFormPage.tsx
- Create: apps/admin/src/pages/PortfolioFormPage.css

**Consumes:** AdminFormLayout, AdminIcon, getPortfolioImageError, isValidPortfolioSlug

**Produces:** /portfolio/new and /portfolio/:portfolioId form state:

    type PortfolioContentMode = 'html' | 'text'

    type PortfolioImageSlot = {
      readonly id: string
      readonly alt: string
      readonly file: File | null
    }

    type PortfolioFormState = {
      readonly clientName: string
      readonly content: string
      readonly contentMode: PortfolioContentMode
      readonly images: readonly PortfolioImageSlot[]
      readonly isLandingEnabled: boolean
      readonly isPinned: boolean
      readonly slug: string
      readonly title: string
      readonly type: string
    }

- [ ] **Step 1: Build controlled state and mode copy.**

Use the types already represented in PortfolioPage; do not create a new taxonomy:

    const portfolioTypes = [
      '브로슈어 · 카탈로그',
      '리플렛 · 팜플렛',
      '명함 · 봉투',
      '배너 · 족자 · 현수막',
      '촬영',
    ] as const

    const initialPortfolioForm: PortfolioFormState = {
      clientName: '',
      content: '',
      contentMode: 'html',
      images: [
        { alt: '', file: null, id: 'image-1' },
        { alt: '', file: null, id: 'image-2' },
      ],
      isLandingEnabled: false,
      isPinned: true,
      slug: '',
      title: '',
      type: '',
    }

Derive isEditing from useParams<{ portfolioId: string }>(). Use 포트폴리오 수정/수정하기 on a detail route, otherwise 신규 포트폴리오 등록/등록하기.

- [ ] **Step 2: Render the four required metadata controls with native validation.**

    <label className="portfolio-form__field" htmlFor="portfolio-slug">
      <span className="portfolio-form__label">포트폴리오 Slug</span>
      <input
        className="portfolio-form__control"
        id="portfolio-slug"
        name="slug"
        onChange={handleSlugChange}
        pattern="[A-Za-z-]+"
        placeholder="포트폴리오 Slug를 입력해주세요. (영문만 작성)"
        required
        type="text"
        value={form.slug}
      />
    </label>

Use the same label/control shape for title and company name. Use a native required select for type with an empty disabled placeholder option. On submit, call isValidPortfolioSlug; when false set an inline role="alert" error, focus the slug input, and do not navigate.

- [ ] **Step 3: Implement the Figma image-slot interaction locally.**

Each active slot contains its 52px 이미지 추가 toggle/alt-text row plus the 240px upload dropzone. Clicking the dropzone must activate that slot's hidden file input; dropping or selecting one file calls getPortfolioImageError before updating the slot.

    <input
      accept="image/png,image/jpeg,image/webp"
      multiple={false}
      type="file"
    />

Initialize the two active slots visible in Figma and render one inactive 이미지 추가 row after them. Activating it appends { id: crypto.randomUUID(), alt: '', file: null }, then creates the next inactive row. Do not create a separate Uploader component: alt text, one-file limit, and add-row mechanics belong only to this form.

- [ ] **Step 4: Render local content-mode and exposure controls.**

Use aria-pressed buttons for the 52px segmented HTML 작성/TEXT Editor 작성 control, then a single required 200px textarea. Render 랜딩 설정 and 상단고정 설정 as labelled native checkboxes styled as the Figma 52px rows. Their initial checked states are false and true; right-side labels are 9개 등록됨 and 2개 등록됨.

- [ ] **Step 5: Use existing action semantics only.**

    <AdminFormLayout
      actions={
        <>
          <Link className="admin-form__button admin-form__button--outline" to="/portfolio">
            목록으로
          </Link>
          <div className="admin-form__actions-group">
            <button className="admin-form__button admin-form__button--outline" type="button">
              임시저장
            </button>
            <button className="admin-form__button admin-form__button--solid" type="submit">
              <span>{submitLabel}</span>
              <AdminIcon name="arrow-right" size={16} />
            </button>
          </div>
        </>
      }
      onSubmit={handleSubmit}
      title={pageTitle}
    >
      {/* metadata, images, content, settings */}
    </AdminFormLayout>

handleSubmit must use browser validity, then apply the slug check, then navigate to /portfolio only when valid. 임시저장 stays a non-submit button until a persistence API exists.

- [ ] **Step 6: Match portfolio-specific geometry in CSS.**

    .portfolio-form__field,
    .portfolio-form__image-slot,
    .portfolio-form__content-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .portfolio-form__control,
    .portfolio-form__select,
    .portfolio-form__alt-input {
      width: 100%;
      height: 52px;
      padding: 0 16px;
      border: 1px solid #f1f5f9;
      border-radius: 16px;
      background: var(--admin-surface);
      color: var(--admin-gray-800);
    }

    .portfolio-form__dropzone {
      height: 240px;
      border: 0;
      border-radius: 16px;
      background: var(--admin-gray-50);
    }

    .portfolio-form__textarea {
      min-height: 200px;
      resize: vertical;
    }

Match the Figma 8px slot gaps, 52px tab/toggle rows, 16px card radius, colors, and text sizes. Add responsive 720px/520px rules only for page padding and the generic action-button stacking. Do not add focus styles, image preview UI, editor chrome, or hover-only features absent from the design.

- [ ] **Step 7: Verify implementation.**

Run: pnpm --filter admin test && pnpm --filter admin lint && pnpm --filter admin build

Expected: all commands PASS.

- [ ] **Step 8: Commit the isolated portfolio implementation.**

    git add apps/admin/src/pages/PortfolioFormPage.tsx \
      apps/admin/src/pages/PortfolioFormPage.css
    git commit -m "feat(admin): add portfolio form"

### Task 5: Wire routes and verify the complete flow

**Files:**

- Modify: apps/admin/src/App.tsx

**Consumes:** PortfolioFormPage

**Produces:** creation and modification routes reachable from the existing portfolio list action

- [ ] **Step 1: Add concrete routes next to the current portfolio list route.**

    import { PortfolioFormPage } from './pages/PortfolioFormPage'

    <Route element={<PortfolioPage />} path="/portfolio" />
    <Route element={<PortfolioFormPage />} path="/portfolio/new" />
    <Route element={<PortfolioFormPage />} path="/portfolio/:portfolioId" />

Do not alter PortfolioPage.tsx: its bottom action already links to /portfolio/new.

- [ ] **Step 2: Run the full automated verification.**

Run: pnpm --filter admin test && pnpm --filter admin lint && pnpm --filter admin build && git diff --check

Expected: all commands exit 0.

- [ ] **Step 3: Verify visible paths against Figma.**

Run: pnpm --filter admin dev -- --host 127.0.0.1

Check in a browser:

1. /portfolio/new shows the 640px Figma form, two active 300px image slots, a third add row, active HTML tab, unchecked 랜딩, and checked 상단고정.
2. Empty submit is blocked by native required validation and scrolls to the first invalid control through the existing app-level handler.
3. cbrain-portfolio is accepted; 포트폴리오-01 shows the slug error and stays on the form.
4. PDF and over-50MB image files show errors; a 50MB WEBP is accepted; adding a slot preserves earlier alt/file state.
5. /portfolio/example-id changes only the title and submit copy to 수정; 목록으로 returns to /portfolio.
6. /products/new still behaves as before the layout extraction.

- [ ] **Step 4: Run the required asset leak check.**

Run: rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages

Expected: no output and exit code 1, which is the expected no-match result.

- [ ] **Step 5: Commit only route integration.**

    git add apps/admin/src/App.tsx
    git commit -m "feat(admin): route portfolio form"

## Self-Review

- Every Figma control is covered: type/title/slug/company fields, two image cards plus add row, mode segment, textarea, two exposure rows, and three actions.
- The abstraction is limited to actual repetition between ProductFormPage and PortfolioFormPage; special business controls remain local.
- No dependency, remote image configuration, API assumption, generic uploader, or rich-text editor is introduced.
- The Node test covers the non-trivial validation branches; lint, build, visual paths, and the required asset scan cover integration.

## Execution Handoff

Plan complete and saved to docs/superpowers/plans/2026-07-20-admin-portfolio-form-and-shared-layout.md.

1. **Inline Execution** — execute the five tasks in this session with verification after each task.
2. **Separate Execution** — start a fresh implementation session and run the plan task by task with superpowers:executing-plans.
