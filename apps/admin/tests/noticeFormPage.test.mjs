import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appPath = new URL("../src/App.tsx", import.meta.url);
const formStylesPath = new URL("../src/pages/BlogFormPage.css", import.meta.url);
const formPath = new URL("../src/pages/NoticeFormPage.tsx", import.meta.url);
const listPath = new URL("../src/pages/NoticePage.tsx", import.meta.url);

test("notice admin exposes create and edit routes with notice-specific controls", async () => {
  const [appSource, formStylesSource, formSource, listSource] = await Promise.all([
    readFile(appPath, "utf8"),
    readFile(formStylesPath, "utf8"),
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
  assert.match(formSource, /신규 공지사항 등록/);
  assert.match(formSource, /공지사항 수정/);
  assert.match(formSource, /type="date"/);
  assert.match(formSource, /pattern="\[a-z0-9-\]\+"/);
  assert.match(formSource, /allowCustomValue/);
  assert.match(
    formSource,
    /setNoticeTypes\(\(current\) => mergeNoticeTypes\(current, type\)\)/,
  );
  assert.ok(formSource.includes("rawValue.replace(/[^a-z0-9-]/g, '')"));
  assert.match(formSource, /영문 소문자, 숫자, 하이픈만 입력해주세요\./);
  assert.match(formSource, /aria-invalid=\{slugError \? true : undefined\}/);
  assert.match(formStylesSource, /\.blog-form__control--date \{\n  cursor: pointer;/);
  assert.match(formSource, /name="isPinned"/);
  assert.match(formSource, /공지사항 요약/);
  assert.match(formSource, /공지사항 내용/);
  assert.match(listSource, /href: ["']\/notices\/new["']/);
  assert.match(listSource, /공지사항 제목으로 검색해주세요\./);
});
