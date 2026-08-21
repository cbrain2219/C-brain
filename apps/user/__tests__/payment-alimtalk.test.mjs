import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import test from "node:test";

const popbillPath = new URL("../lib/popbill.ts", import.meta.url);
const paymentAlimtalkPath = new URL(
  "../lib/paymentAlimtalk.ts",
  import.meta.url,
);

async function importPaymentAlimtalkModule() {
  const [popbillSource, paymentAlimtalkSource] = await Promise.all([
    readFile(popbillPath, "utf8"),
    readFile(paymentAlimtalkPath, "utf8"),
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
    paymentAlimtalkSource
      .replace('import "server-only";\n', "")
      .replace('from "./popbill";', `from "${popbillModuleUrl}";`),
    { compilerOptions },
  );

  return import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
  );
}

const validEnvironment = {
  ADMIN_APP_URL: "https://admin.example.com",
  PAYMENT_ALIMTALK_USER_APP_URL: "https://user.example.com",
  POPBILL_ADMIN_PHONE_DEV: "010-1111-2222",
  POPBILL_ADMIN_PHONE_LIVE: "010-9999-8888",
  POPBILL_CORP_NUM: "1234567890",
  POPBILL_IS_TEST: "false",
  POPBILL_LINK_ID: "C_BRAIN",
  POPBILL_SECRET_KEY: "secret-key",
  POPBILL_TEMPLATE_PAYMENT_ADMIN: "026070001088",
  POPBILL_TEMPLATE_PAYMENT_USER: "026080000139",
};

function siteInput({
  category,
  options = [],
  planning = false,
  quantity = null,
  variant = category,
}) {
  return {
    amount: 100000,
    buyerCompany: null,
    buyerEmail: "customer@example.com",
    buyerName: "김철수",
    buyerPhone: "01012345678",
    channel: "site",
    itemSnapshot: {
      channel: "site",
      options,
      planning: { included: planning },
      product: { label: category },
      quantity: quantity ? { label: quantity, value: 1 } : null,
      service: { label: category },
      variant: { label: variant },
    },
    orderName: category,
    orderNumber: "58310427",
    paidAt: "2026-08-20T05:30:00.000Z",
    paymentId: "123e4567-e89b-42d3-a456-426614174000",
    providerOrderId: "CB123E4567E89B42D3A456426614174000",
    publicToken: "223e4567-e89b-42d3-a456-426614174000",
  };
}

test("all site products map to non-empty approved template variables", async () => {
  const { createPaymentAlimtalkOrderFields } =
    await importPaymentAlimtalkModule();
  const cases = [
    {
      input: siteInput({
        category: "브로슈어 · 카탈로그",
        options: [
          { key: "pageCount", value: "8p" },
          { key: "paper", value: "일반지(스노우지)" },
        ],
        quantity: "100부",
      }),
      output: {
        category: "브로슈어 · 카탈로그",
        pageCount: "8p",
        paper: "일반지(스노우지)",
        quantity: "100부",
        service: "디자인 + 인쇄",
      },
    },
    {
      input: siteInput({
        category: "리플렛 · 팜플렛",
        options: [{ key: "paper", value: "일반지(스노우지)" }],
        quantity: "100부",
      }),
      output: {
        category: "리플렛 · 팜플렛",
        pageCount: "해당 없음",
        paper: "일반지(스노우지)",
        quantity: "100부",
        service: "디자인 + 인쇄",
      },
    },
    ...[
      ["포스터", "100장"],
      ["전단지", "100장"],
    ].map(([variant, quantity]) => ({
      input: siteInput({
        category: "포스터 · 전단지",
        options: [{ key: "paper", value: "일반지(아트지)" }],
        quantity,
        variant,
      }),
      output: {
        category: "포스터 · 전단지",
        pageCount: "해당 없음",
        paper: "일반지(아트지)",
        quantity,
        service: `${variant} · 디자인 + 인쇄`,
      },
    })),
    ...[
      ["배너", "패트지"],
      ["족자", "현수막천"],
      ["현수막", "현수막천"],
    ].map(([variant, material]) => ({
      input: siteInput({
        category: "배너 · 족자 · 현수막",
        options: [{ key: "material", value: material }],
        quantity: "1개",
        variant,
      }),
      output: {
        category: "배너 · 족자 · 현수막",
        pageCount: "해당 없음",
        paper: `${material} (재질)`,
        quantity: "1개",
        service: `${variant} · 디자인 + 인쇄`,
      },
    })),
    {
      input: siteInput({
        category: "명함 · 봉투",
        options: [
          { key: "baseQuantity", value: "일반지 500장" },
          { key: "material", value: "일반지(스노우, 무광코팅)" },
          { key: "people", value: "1명" },
        ],
        variant: "명함",
      }),
      output: {
        category: "명함 · 봉투",
        pageCount: "해당 없음",
        paper: "일반지(스노우, 무광코팅) (재질)",
        quantity: "일반지 500장 × 1명",
        service: "명함 · 디자인 + 인쇄",
      },
    },
    {
      input: siteInput({
        category: "명함 · 봉투",
        options: [{ key: "material", value: "일반 봉투재질(백모조지)" }],
        quantity: "500장",
        variant: "봉투",
      }),
      output: {
        category: "명함 · 봉투",
        pageCount: "해당 없음",
        paper: "일반 봉투재질(백모조지) (재질)",
        quantity: "500장",
        service: "봉투 · 디자인 + 인쇄",
      },
    },
    {
      input: siteInput({ category: "로고" }),
      output: {
        category: "로고",
        pageCount: "해당 없음",
        paper: "해당 없음",
        quantity: "해당 없음",
        service: "로고 디자인",
      },
    },
  ];

  for (const { input, output } of cases) {
    assert.deepEqual(createPaymentAlimtalkOrderFields(input), output);
  }
});

test("planning and LinkPay page/quantity values are rendered explicitly", async () => {
  const { createPaymentAlimtalkOrderFields } =
    await importPaymentAlimtalkModule();

  assert.equal(
    createPaymentAlimtalkOrderFields(
      siteInput({
        category: "포스터 · 전단지",
        planning: true,
        variant: "포스터",
      }),
    ).service,
    "포스터 · 디자인 + 인쇄 + 기획",
  );
  assert.deepEqual(
    createPaymentAlimtalkOrderFields({
      channel: "linkpay",
      itemSnapshot: {
        category: "브로슈어 · 카탈로그",
        pageQuantity: "12p / 500부",
        paper: "고급지(랑데뷰)",
        service: "맞춤 브로슈어 제작",
      },
      orderName: "맞춤 브로슈어 제작",
    }),
    {
      category: "브로슈어 · 카탈로그",
      pageCount: "12p",
      paper: "고급지(랑데뷰)",
      quantity: "500부",
      service: "맞춤 브로슈어 제작",
    },
  );
  assert.deepEqual(
    createPaymentAlimtalkOrderFields({
      channel: "linkpay",
      itemSnapshot: {
        category: "기타",
        pageQuantity: "500부",
        paper: "백모조지",
        service: "맞춤 제작",
      },
      orderName: "맞춤 제작",
    }),
    {
      category: "기타",
      pageCount: "해당 없음",
      paper: "백모조지",
      quantity: "500부",
      service: "맞춤 제작",
    },
  );
});

test("payment AlimTalk contents exactly render the approved templates", async () => {
  const {
    createPaymentAdminAlimtalkContent,
    createPaymentUserAlimtalkContent,
  } = await importPaymentAlimtalkModule();
  const input = {
    ...siteInput({
      category: "브로슈어 · 카탈로그",
      options: [
        { key: "pageCount", value: "8p" },
        { key: "paper", value: "일반지(스노우지)" },
      ],
      quantity: "100부",
    }),
    amount: 850000,
  };

  assert.equal(
    createPaymentAdminAlimtalkContent(input),
    [
      "[고객 정보]",
      "▪ 담당자명: 김철수",
      "▪ 회사명: -",
      "▪ 연락처: 010-1234-5678",
      "▪ 이메일: customer@example.com",
      "",
      "[주문 정보]",
      "▪ 주문번호: 58310427",
      "▪ 카테고리: 브로슈어 · 카탈로그",
      "▪ 서비스: 디자인 + 인쇄",
      "▪ 용지: 일반지(스노우지)",
      "▪ 페이지 수: 8p",
      "▪ 수량: 100부",
      "▪ 결제금액: 850,000원",
      "▪ 결제일시: 2026-08-20 14:30",
      "",
      "채팅방 문의 확인 후 상담 진행해주세요.",
    ].join("\n"),
  );
  assert.equal(
    createPaymentUserAlimtalkContent(input),
    [
      "[결제 완료 안내]",
      "",
      "김철수님, 주문 결제가 완료되었습니다.",
      "",
      "▪ 주문번호: 58310427",
      "▪ 카테고리: 브로슈어 · 카탈로그",
      "▪ 서비스: 디자인 + 인쇄",
      "▪ 용지: 일반지(스노우지)",
      "▪ 페이지 수: 8p",
      "▪ 수량: 100부",
      "▪ 결제금액: 850,000원",
      "▪ 결제일시: 2026-08-20 14:30",
      "",
      "▶ 다음 절차 안내",
      '본 채팅방에 "결제완료" 남겨주시면',
      "담당자 확인 후 ",
      "빠른 상담 도와드리겠습니다.",
      "",
      "감사합니다.",
    ].join("\n"),
  );
});

test("a newly paid payment sends once to the admin and buyer", async () => {
  const { notifyNewPaidPayment } = await importPaymentAlimtalkModule();
  const calls = [];
  const service = {
    sendATS_one(...args) {
      calls.push(args);
      args.at(-2)(`receipt-${args[1]}`);
    },
  };
  const input = siteInput({ category: "로고" });
  const payment = {
    amount: input.amount,
    id: input.paymentId,
    order: {
      amount: input.amount,
      buyerCompany: input.buyerCompany,
      buyerEmail: input.buyerEmail,
      buyerName: input.buyerName,
      buyerPhone: input.buyerPhone,
      channel: input.channel,
      id: "order-id",
      itemSnapshot: input.itemSnapshot,
      orderName: input.orderName,
      orderNumber: input.orderNumber,
      publicToken: input.publicToken,
      status: "payment_pending",
    },
    paidAt: null,
    providerOrderId: input.providerOrderId,
    status: "ready",
  };
  const finishedPayment = {
    ...payment,
    orderId: "order-id",
    paidAt: input.paidAt,
    status: "paid",
  };

  assert.equal(
    await notifyNewPaidPayment(payment, finishedPayment, {
      environment: validEnvironment,
      service,
      timeoutMs: 100,
    }),
    true,
  );
  assert.equal(calls.length, 2);

  const adminCall = calls.find(
    (call) => call[1] === validEnvironment.POPBILL_TEMPLATE_PAYMENT_ADMIN,
  );
  const userCall = calls.find(
    (call) => call[1] === validEnvironment.POPBILL_TEMPLATE_PAYMENT_USER,
  );
  assert.equal(adminCall[8], "01011112222");
  assert.equal(adminCall[9], "관리자");
  assert.equal(adminCall[10], "pa123e4567e89b42d3a456426614174000");
  assert.equal(userCall[8], "01012345678");
  assert.equal(userCall[9], "김철수");
  assert.equal(userCall[10], "pu123e4567e89b42d3a456426614174000");
  assert.deepEqual(adminCall[11], [
    {
      n: "주문상세 확인",
      t: "WL",
      u1: "https://admin.example.com/sales",
      u2: "https://admin.example.com/sales",
    },
  ]);
  assert.equal(adminCall[12], "고객 결제 알림");
  assert.deepEqual(userCall[11], [
    { n: "채널 추가", t: "AC" },
    {
      n: "주문상세 확인",
      t: "WL",
      u1: "https://user.example.com/payment/result/223e4567-e89b-42d3-a456-426614174000",
      u2: "https://user.example.com/payment/result/223e4567-e89b-42d3-a456-426614174000",
    },
  ]);
  assert.equal(userCall[12], "");

  assert.equal(
    await notifyNewPaidPayment(
      { ...payment, status: "paid" },
      finishedPayment,
      { environment: validEnvironment, service, timeoutMs: 100 },
    ),
    false,
  );
  assert.equal(calls.length, 2);
});

test("all verified paid entry points invoke the shared notifier", async () => {
  const paths = [
    new URL("../app/api/payments/nicepay/return/route.ts", import.meta.url),
    new URL("../app/api/payments/nicepay/webhook/route.ts", import.meta.url),
    new URL(
      "../app/api/admin/payments/[paymentId]/reconcile/route.ts",
      import.meta.url,
    ),
  ];

  for (const path of paths) {
    const source = await readFile(path, "utf8");
    assert.match(source, /import \{ notifyNewPaidPayment \}/);
    assert.match(source, /await notifyNewPaidPayment\(/);
  }
});
