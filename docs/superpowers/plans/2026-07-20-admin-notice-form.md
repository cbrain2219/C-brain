# Admin Notice Create/Edit Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add working client-side admin notice create and edit pages at `/notices/new` and `/notices/:noticeId`.

**Architecture:** Add one page-local `NoticeFormPage` that composes the existing `AdminFormLayout`, `AdminTypeCombobox`, `AdminIcon`, and blog form styles. Keep state local because the repository has no notice mutation API; valid submission returns to `/notices`, matching the existing Blog and Portfolio form convention.

**Tech Stack:** React 19, TypeScript, React Router 7, Vite 8, existing admin CSS, Node built-in test runner.

## Global Constraints

- Reuse the existing 640px admin form shell and form control styles; do not add a dependency or another layout abstraction.
- Include only notice data used by the public list/detail UI: type, title, slug, date, excerpt, content, content mode, and pinned state.
- Use the public notice taxonomy exactly: `공지`, `이벤트`, `휴무 안내`, `서비스 변경`, `수상 · 소식`.
- Use native `input type="date"` and native `pattern="[a-z0-9-]+"`; do not add picker or slug libraries.
- Creation and editing are client-only until an API exists. Edit mode changes page/submit copy but does not fabricate persistence or duplicate public fixtures.
- Follow `design.md`: Pretendard, parent `gap`, existing `currentColor` icons, no custom focus style, and no Figma API URL.
- Preserve unrelated dirty worktree changes and do not commit unless requested.

---

### Task 1: Add the notice form contract check

**Files:**

- Create: `apps/admin/tests/noticeFormPage.test.mjs`

**Interfaces:**

- Consumes: `apps/admin/src/App.tsx`, `apps/admin/src/pages/NoticePage.tsx`, and the planned `NoticeFormPage.tsx`.
- Produces: One runnable source contract covering routes and required notice controls.

- [x] **Step 1: Write the failing test.**

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appPath = new URL("../src/App.tsx", import.meta.url);
const formPath = new URL("../src/pages/NoticeFormPage.tsx", import.meta.url);
const listPath = new URL("../src/pages/NoticePage.tsx", import.meta.url);

test("notice admin exposes create and edit routes with notice-specific controls", async () => {
  const [appSource, formSource, listSource] = await Promise.all([
    readFile(appPath, "utf8"),
    readFile(formPath, "utf8"),
    readFile(listPath, "utf8"),
  ]);

  assert.match(
    appSource,
    /<Route element=\{<NoticeFormPage \/>\} path="\/notices\/new" \/>/,
  );
  assert.match(
    appSource,
    /<Route element=\{<NoticeFormPage \/>\} path="\/notices\/:noticeId" \/>/,
  );
  assert.match(formSource, /'신규 공지사항 등록'/);
  assert.match(formSource, /'공지사항 수정'/);
  assert.match(formSource, /type="date"/);
  assert.match(formSource, /pattern="\[a-z0-9-\]\+"/);
  assert.match(formSource, /name="isPinned"/);
  assert.match(formSource, /공지사항 요약/);
  assert.match(formSource, /공지사항 내용/);
  assert.match(listSource, /href: '\/notices\/new'/);
  assert.match(listSource, /공지사항 제목으로 검색해주세요\./);
});
```

- [x] **Step 2: Run the test and confirm it fails because the form file does not exist.**

Run: `node --test apps/admin/tests/noticeFormPage.test.mjs`

Expected: FAIL with `ENOENT` for `NoticeFormPage.tsx`.

### Task 2: Implement the shared create/edit form and routes

**Files:**

- Create: `apps/admin/src/pages/NoticeFormPage.tsx`
- Modify: `apps/admin/src/App.tsx`
- Modify: `apps/admin/src/pages/NoticePage.tsx`

**Interfaces:**

- Consumes: `AdminFormLayout`, `AdminTypeCombobox`, `AdminIcon`, and `BlogFormPage.css`.
- Produces: `NoticeFormPage`, `/notices/new`, `/notices/:noticeId`, and a notice-specific list search placeholder.

- [x] **Step 1: Add the minimal controlled notice form.**

```tsx
import { useId, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AdminIcon } from "../components/AdminIcon";
import { AdminFormLayout } from "../components/admin-form/AdminFormLayout";
import { AdminTypeCombobox } from "../components/admin-form/AdminTypeCombobox";
import "./BlogFormPage.css";

type NoticeContentMode = "html" | "text";

type NoticeFormState = {
  readonly content: string;
  readonly contentMode: NoticeContentMode;
  readonly excerpt: string;
  readonly isPinned: boolean;
  readonly publishedAt: string;
  readonly slug: string;
  readonly title: string;
  readonly type: string;
};

const noticeTypes = [
  "공지",
  "이벤트",
  "휴무 안내",
  "서비스 변경",
  "수상 · 소식",
] as const;
const initialNoticeForm: NoticeFormState = {
  content: "",
  contentMode: "html",
  excerpt: "",
  isPinned: false,
  publishedAt: "",
  slug: "",
  title: "",
  type: "",
};

export function NoticeFormPage() {
  const formId = useId().replaceAll(":", "");
  const navigate = useNavigate();
  const { noticeId } = useParams<{ noticeId: string }>();
  const [form, setForm] = useState<NoticeFormState>(initialNoticeForm);
  const [typeError, setTypeError] = useState("");
  const isEditing = noticeId !== undefined;

  function updateForm<Key extends keyof NoticeFormState>(
    key: Key,
    value: NoticeFormState[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.type) {
      setTypeError("공지사항 유형을 선택해주세요.");
      window.requestAnimationFrame(() =>
        document.getElementById(formId + "-type")?.focus(),
      );
      return;
    }

    navigate("/notices");
  }

  return (
    <AdminFormLayout
      actions={
        <>
          <Link
            className="admin-form__button admin-form__button--outline"
            to="/notices"
          >
            목록으로
          </Link>
          <div className="admin-form__actions-group">
            <button
              className="admin-form__button admin-form__button--outline"
              type="button"
            >
              임시저장
            </button>
            <button
              className="admin-form__button admin-form__button--solid"
              type="submit"
            >
              <span>{isEditing ? "수정하기" : "등록하기"}</span>
              <AdminIcon name="arrow-right" />
            </button>
          </div>
        </>
      }
      onSubmit={handleSubmit}
      title={isEditing ? "공지사항 수정" : "신규 공지사항 등록"}
    >
      <label className="blog-form__field" htmlFor={formId + "-type"}>
        <span className="blog-form__label">공지사항 유형</span>
        <AdminTypeCombobox
          errorMessage={typeError}
          inputId={formId + "-type"}
          name="type"
          onClear={() => {
            updateForm("type", "");
            setTypeError("");
          }}
          onCommit={(type) => {
            updateForm("type", type);
            setTypeError("");
          }}
          options={noticeTypes}
          placeholder="공지사항 유형을 선택해주세요."
          value={form.type}
        />
        {typeError ? (
          <span
            className="blog-form__error"
            id={formId + "-type-error"}
            role="alert"
          >
            {typeError}
          </span>
        ) : null}
      </label>

      <label className="blog-form__field" htmlFor={formId + "-title"}>
        <span className="blog-form__label">공지사항 제목</span>
        <input
          autoComplete="off"
          className="blog-form__control"
          id={formId + "-title"}
          name="title"
          onChange={(event) => updateForm("title", event.currentTarget.value)}
          placeholder="공지사항 제목을 입력해주세요."
          required
          type="text"
          value={form.title}
        />
      </label>

      <label className="blog-form__field" htmlFor={formId + "-slug"}>
        <span className="blog-form__label">공지사항 Slug</span>
        <input
          autoComplete="off"
          className="blog-form__control"
          id={formId + "-slug"}
          name="slug"
          onChange={(event) => updateForm("slug", event.currentTarget.value)}
          pattern="[a-z0-9-]+"
          placeholder="공지사항 Slug를 입력해주세요. (영문 소문자, 숫자, 하이픈)"
          required
          type="text"
          value={form.slug}
        />
      </label>

      <label className="blog-form__field" htmlFor={formId + "-published-at"}>
        <span className="blog-form__label">공지사항 작성일</span>
        <input
          className="blog-form__control blog-form__control--date"
          id={formId + "-published-at"}
          name="publishedAt"
          onChange={(event) =>
            updateForm("publishedAt", event.currentTarget.value)
          }
          onPointerDown={(event) => {
            if (!event.currentTarget.showPicker) return;
            event.preventDefault();
            event.currentTarget.showPicker();
          }}
          required
          type="date"
          value={form.publishedAt}
        />
      </label>

      <label className="blog-form__field" htmlFor={formId + "-excerpt"}>
        <span className="blog-form__label">공지사항 요약</span>
        <textarea
          className="blog-form__textarea blog-form__textarea--seo"
          id={formId + "-excerpt"}
          maxLength={180}
          name="excerpt"
          onChange={(event) => updateForm("excerpt", event.currentTarget.value)}
          placeholder="목록에 표시할 요약을 입력해주세요."
          required
          value={form.excerpt}
        />
      </label>

      <fieldset className="blog-form__content-field">
        <legend className="blog-form__label">공지사항 내용</legend>
        <div className="blog-form__mode-tabs">
          {(["html", "text"] as const).map((mode) => (
            <button
              aria-pressed={form.contentMode === mode}
              className={
                form.contentMode === mode
                  ? "blog-form__mode-tab blog-form__mode-tab--active"
                  : "blog-form__mode-tab"
              }
              key={mode}
              onClick={() => updateForm("contentMode", mode)}
              type="button"
            >
              {mode === "html" ? "HTML 작성" : "TEXT Editor 작성"}
            </button>
          ))}
        </div>
        <textarea
          className="blog-form__textarea blog-form__textarea--content"
          name="content"
          onChange={(event) => updateForm("content", event.currentTarget.value)}
          placeholder="공지사항 내용을 입력해주세요."
          required
          value={form.content}
        />
      </fieldset>

      <label className="blog-form-setting">
        <input
          checked={form.isPinned}
          className="blog-form__visually-hidden"
          name="isPinned"
          onChange={(event) =>
            updateForm("isPinned", event.currentTarget.checked)
          }
          type="checkbox"
        />
        <span className="blog-form-setting__content">
          <span className="blog-form-setting__label">
            <span
              className={
                form.isPinned
                  ? "blog-form-setting__check blog-form-setting__check--checked"
                  : "blog-form-setting__check"
              }
            >
              <AdminIcon name="check" />
            </span>
            <span>상단고정 설정</span>
          </span>
        </span>
      </label>
    </AdminFormLayout>
  );
}
```

- [x] **Step 2: Register both routes and correct the notice search copy.**

In `App.tsx`, import `NoticeFormPage` and add:

```tsx
<Route element={<NoticeFormPage />} path="/notices/new" />
<Route element={<NoticeFormPage />} path="/notices/:noticeId" />
```

In `NoticePage.tsx`, set the existing search placeholder to `공지사항 제목으로 검색해주세요.`.

- [x] **Step 3: Run the focused test.**

Run: `node --test apps/admin/tests/noticeFormPage.test.mjs`

Expected: PASS, 1 test.

### Task 3: Verify the implementation

**Files:**

- Verify: `apps/admin/src/pages/NoticeFormPage.tsx`
- Verify: `apps/admin/src/App.tsx`
- Verify: `apps/admin/src/pages/NoticePage.tsx`

**Interfaces:**

- Consumes: completed notice form and routes.
- Produces: a linted, compiled, visually checked admin flow.

- [x] **Step 1: Run automated checks.**

Run:

```bash
pnpm --filter admin test
pnpm --filter admin lint
pnpm --filter admin build
```

Expected: all commands exit 0.

- [x] **Step 2: Verify create and edit behavior in the browser.**

At `http://localhost:5173/notices/new`, confirm the create title, all seven controls, type selection, date picker, pinned toggle, required validation, list button, and valid submit return. At `http://localhost:5173/notices/update-2-1-0`, confirm the edit title and `수정하기` button. Check 1289x936 and 390x844 for horizontal overflow.

- [x] **Step 3: Run repository policy checks.**

Run:

```bash
pnpm exec prettier --check apps/admin/src/App.tsx apps/admin/src/pages/NoticePage.tsx apps/admin/src/pages/NoticeFormPage.tsx apps/admin/tests/noticeFormPage.test.mjs docs/superpowers/plans/2026-07-20-admin-notice-form.md
git diff --check
rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages
```

Expected: Prettier and diff check exit 0; Figma URL scan prints no matches.

## Self-Review

- Spec coverage: create/edit routes, labels, notice taxonomy, native date, slug, excerpt, body, pinning, validation, and list return are covered.
- Reuse: the existing form layout, controls, icon, CSS, and router pattern are reused; no dependency or speculative API layer is added.
- Type consistency: `NoticeFormState` keys match every controlled input and the submit handler.
- Placeholder scan: the plan contains no deferred implementation placeholders.
