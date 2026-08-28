import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const resultPagePath = new URL(
  "../app/(site)/payment/result/[publicToken]/page.tsx",
  import.meta.url,
);
const resultComponentPath = new URL(
  "../app/(site)/order/OrderPaymentResult.tsx",
  import.meta.url,
);

test("the shared payment result page reads only the safe ledger result", async () => {
  const [resultPage, resultComponent] = await Promise.all([
    readFile(resultPagePath, "utf8"),
    readFile(resultComponentPath, "utf8"),
  ]);

  assert.match(resultPage, /getOrderResultByPublicToken/);
  assert.match(resultPage, /params: Promise<\{ publicToken: string \}>/);
  assert.match(resultPage, /createNoIndexMetadata/);
  assert.match(resultPage, /result\.status === "payment_pending"/);
  assert.match(resultPage, /summary: \{/);
  assert.match(resultPage, /result\.itemSummary\.categoryLabel/);
  assert.match(resultPage, /result\.itemSummary\.companyName/);
  assert.match(resultPage, /result\.itemSummary\.optionRows/);
  assert.match(resultPage, /result\.itemSummary\.serviceLabel/);
  assert.match(resultPage, /toLowerCase\(\) === "card"/);
  assert.doesNotMatch(resultPage, /label: "주문명"/);
  assert.match(resultComponent, /variant: "pending"/);
  assert.doesNotMatch(resultPage, /buyer_(?:name|phone|email)/);
});
