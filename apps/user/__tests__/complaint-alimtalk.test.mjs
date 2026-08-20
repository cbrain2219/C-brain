import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import test from "node:test";

const popbillPath = new URL("../lib/popbill.ts", import.meta.url);
const complaintAlimtalkPath = new URL(
  "../lib/complaintAlimtalk.ts",
  import.meta.url,
);

async function importComplaintAlimtalkModule() {
  const [popbillSource, complaintAlimtalkSource] = await Promise.all([
    readFile(popbillPath, "utf8"),
    readFile(complaintAlimtalkPath, "utf8"),
  ]);
  const ts = await import("typescript");
  const compilerOptions = {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  };
  const { outputText: popbillOutput } = ts.transpileModule(
    popbillSource.replace('import "server-only";\n', ""),
    { compilerOptions },
  );
  const popbillModuleUrl = `data:text/javascript;base64,${Buffer.from(
    popbillOutput,
  ).toString("base64")}`;
  const { outputText } = ts.transpileModule(
    complaintAlimtalkSource
      .replace('import "server-only";\n', "")
      .replace('from "./popbill";', `from "${popbillModuleUrl}";`),
    {
      compilerOptions,
    },
  );

  return import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
  );
}

const complaint = {
  complaintType: "불친절한 서비스",
  createdAt: "2026-08-20T00:34:00.000Z",
  email: "customer@example.com",
  id: "123e4567-e89b-42d3-a456-426614174000",
  name: "고객",
  phone: "010-1234-5678",
  service: "로고",
};

const validEnvironment = {
  ADMIN_APP_URL: "https://admin.example.com",
  POPBILL_ADMIN_PHONE_DEV: "010-1111-2222",
  POPBILL_ADMIN_PHONE_LIVE: "010-9999-8888",
  POPBILL_CORP_NUM: "1234567890",
  POPBILL_IS_TEST: "false",
  POPBILL_LINK_ID: "C_BRAIN",
  POPBILL_SECRET_KEY: "secret-key",
  POPBILL_TEMPLATE_COMPLAINT: "026070001072",
};

test("complaint AlimTalk renders the approved Popbill template", async () => {
  const { createComplaintAlimtalkContent } =
    await importComplaintAlimtalkModule();

  assert.equal(
    createComplaintAlimtalkContent(complaint),
    [
      "▪ 접수자: 고객",
      "▪ 연락처: 010-1234-5678",
      "▪ 이메일: customer@example.com",
      "▪ 이용 서비스: 로고",
      "▪ 불편 유형: 불친절한 서비스",
      "▪ 접수 시각: 2026-08-20 09:34",
      "",
      "상세 내용 및 첨부파일은 관리자 페이지에서 확인해주세요.",
    ].join("\n"),
  );
});

test("complaint AlimTalk uses the dev number outside Vercel production", async () => {
  const { getComplaintAlimtalkConfig } = await importComplaintAlimtalkModule();

  assert.equal(
    getComplaintAlimtalkConfig(validEnvironment).receiver,
    "01011112222",
  );
  assert.equal(
    getComplaintAlimtalkConfig({
      ...validEnvironment,
      VERCEL_ENV: "preview",
    }).receiver,
    "01011112222",
  );
  assert.equal(
    getComplaintAlimtalkConfig({
      ...validEnvironment,
      VERCEL_ENV: "production",
    }).receiver,
    "01099998888",
  );
});

test("complaint AlimTalk sends the approved detail button and request id", async () => {
  const { sendComplaintAlimtalk } = await importComplaintAlimtalkModule();
  let receivedArguments;
  const service = {
    sendATS_one(...args) {
      receivedArguments = args;
      args.at(-2)("receipt-123");
    },
  };

  const receiptNumber = await sendComplaintAlimtalk(complaint, {
    environment: validEnvironment,
    service,
    timeoutMs: 100,
  });

  assert.equal(receiptNumber, "receipt-123");
  assert.equal(receivedArguments[0], "1234567890");
  assert.equal(receivedArguments[1], "026070001072");
  assert.equal(receivedArguments[2], "");
  assert.equal(receivedArguments[6], "");
  assert.equal(receivedArguments[8], "01011112222");
  assert.equal(receivedArguments[9], "관리자");
  assert.equal(receivedArguments[10], complaint.id);
  assert.deepEqual(receivedArguments[11], [
    {
      n: "상세보기",
      t: "WL",
      u1: `https://admin.example.com/complaints/${complaint.id}`,
      u2: `https://admin.example.com/complaints/${complaint.id}`,
    },
  ]);
  assert.equal(receivedArguments[12], "");
  assert.equal(receivedArguments[13], "");
});

test("complaint AlimTalk rejects invalid server configuration", async () => {
  const { getComplaintAlimtalkConfig } = await importComplaintAlimtalkModule();

  assert.throws(
    () =>
      getComplaintAlimtalkConfig({
        ...validEnvironment,
        ADMIN_APP_URL: "",
      }),
    /ADMIN_APP_URL/,
  );
  assert.throws(
    () =>
      getComplaintAlimtalkConfig({
        ...validEnvironment,
        ADMIN_APP_URL: "http://localhost:5173",
      }),
    /HTTPS/,
  );
  assert.throws(
    () =>
      getComplaintAlimtalkConfig({
        ...validEnvironment,
        POPBILL_ADMIN_PHONE_DEV: "123",
      }),
    /POPBILL_ADMIN_PHONE_DEV/,
  );
  assert.throws(
    () =>
      getComplaintAlimtalkConfig({
        ...validEnvironment,
        POPBILL_TEMPLATE_COMPLAINT: "123",
      }),
    /POPBILL_TEMPLATE_COMPLAINT/,
  );
});
