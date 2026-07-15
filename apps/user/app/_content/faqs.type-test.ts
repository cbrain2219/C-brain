import { faqCategories } from "./faqs";

type Equal<Actual, Expected> = (<Value>() => Value extends Actual
  ? 1
  : 2) extends <Value>() => Value extends Expected ? 1 : 2
  ? true
  : false;

type Expect<Condition extends true> = Condition;

type FaqCategoryIds = (typeof faqCategories)[number]["id"];
type ExpectedFaqCategoryIds =
  | "order-payment"
  | "delivery"
  | "file-design"
  | "print-material"
  | "refund-cancel"
  | "company";

type FaqCategoryIdContract = Expect<
  Equal<FaqCategoryIds, ExpectedFaqCategoryIds>
>;

type FaqCategoryItem = (typeof faqCategories)[number]["items"][number];
type FaqCategoryItemContract = Expect<
  FaqCategoryItem extends { answer: string; question: string } ? true : false
>;

export type FaqContentContract = [
  FaqCategoryIdContract,
  FaqCategoryItemContract,
];
