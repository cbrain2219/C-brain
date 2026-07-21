# Admin Product CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing admin product list, new-product form, temporary save, and edit route persist real Supabase product records and enforce administrator-only access.

**Architecture:** Keep the existing Vite/React admin surface and its two-step form. Add one Supabase `products` table with RLS, expose small typed product queries through `@repo/supabase`, and let the admin browser client call those queries with the signed-in administrator session. Keep normalization, publish validation, price calculation, list filtering, and date formatting as pure functions so the React pages only coordinate I/O and rendering.

**Tech Stack:** React 19, React Router 7, Vite 8, TypeScript, Supabase Postgres/Auth, Node built-in test runner.

## Global Constraints

- Do not add a runtime dependency. Use the installed Supabase, React, React Router, Sonner, and Node test runner packages.
- Preserve the current page shell, table layout, two-step form layout, existing admin icons, and local Figma asset paths. Add only the product-name field and functional loading/error states needed by CRUD.
- Read design.md before changing any admin JSX/CSS. Keep Pretendard tokens, existing AdminIcon usage, parent gap spacing, and no custom focus styling.
- Product lifecycle is exactly `draft` (label: 임시저장) and `published` (label: 게시됨). A draft requires the complete step-one configuration but may have incomplete unit prices; a published product requires every paper/page/quantity unit price.
- A product has a required name and type. 상품가 in the list is the lowest entered unit price; show `-` when a draft has no unit price.
- Unit prices are stored as a JSON object keyed by `paperIndex:pageIndex:quantityIndex`. Paper types retain their input order; page counts and quantities are positive integers.
- Authentication is required. Use only the browser publishable key; never put SUPABASE_SECRET_KEY in the Vite app or any VITE_ variable.
- This plan deliberately excludes delete, pagination, image/file upload, public product presentation, sales integration, and a separate server API. Add each only when its UI and business rule are specified.
- No Figma MCP URL may be added to source. Final UI verification includes: rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages

---

## File Structure

| Path | Responsibility |
| --- | --- |
| supabase/migrations/20260721000000_create_products.sql | Products schema, timestamp trigger, and administrator-only RLS policies. |
| packages/supabase/src/types.ts | Adds the products table and product_status enum to the typed database contract. |
| packages/supabase/src/products.ts | Typed administrator list/read/create/update operations. |
| packages/supabase/src/index.ts | Exports product data access functions. |
| packages/supabase/src/client.ts | Accepts explicit public Supabase configuration for the Vite admin app. |
| packages/supabase/src/auth.ts | Verifies the authenticated user’s own profile, not an arbitrary administrator profile. |
| apps/admin/.env.example | Documents only VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY. |
| apps/admin/src/lib/supabase.ts | Creates the sole browser Supabase client from Vite public variables. |
| apps/admin/src/components/admin-auth/AdminSessionGate.tsx | Requires a signed-in profile with role admin before rendering protected routes. |
| apps/admin/src/pages/AdminLoginPage.tsx | Minimal email/password administrator sign-in form. |
| apps/admin/src/pages/AdminLoginPage.css | Login-only styling using existing admin tokens. |
| apps/admin/src/pages/productData.ts | Pure product form mapping, validation, filters, display formatting, and list row mapping. |
| apps/admin/tests/productData.test.mjs | Regression tests for price matrix validation, draft/published mapping, filtering, and display price. |
| apps/admin/src/components/admin-table/AdminDataTableSection.tsx | Optional controlled filter/search props while retaining all existing uncontrolled callers. |
| apps/admin/src/pages/ProductPage.tsx | Loads product records, exposes working filters/search, and links to edit. |
| apps/admin/src/pages/ProductFormPage.tsx | Loads an edit record, saves draft/published records, and handles request/error state. |
| apps/admin/src/App.tsx | Separates public login from authenticated admin routes. |
| apps/admin/src/components/AdminHeader.tsx | Adds a sign-out action to the authenticated header. |
| apps/admin/src/components/AdminHeader.css | Styles the sign-out action beside the existing home action. |

## Task 1: Add the protected product data contract

**Files:**
- Create: supabase/migrations/20260721000000_create_products.sql
- Create: packages/supabase/src/products.ts
- Modify: packages/supabase/src/types.ts
- Modify: packages/supabase/src/index.ts
- Modify: packages/supabase/src/auth.ts

**Interfaces:**
- Produces: `ProductStatus = "draft" | "published"`.
- Produces: `listAdminProducts(client)`, `getAdminProduct(client, id)`, `createProduct(client, input)`, and `updateProduct(client, id, input)`.
- Consumes: an authenticated `CBrainSupabaseClient`; every product operation calls `requireAdmin(client)`.

- [x] **Step 1: Create the migration**

Create supabase/migrations/20260721000000_create_products.sql with this exact schema. The policy predicate is repeated instead of using a service key, so the Vite browser client can never read or write a product as an anonymous/non-admin user.

~~~sql
create type public.product_status as enum ('draft', 'published');

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  type text not null check (char_length(trim(type)) > 0),
  status public.product_status not null default 'draft',
  design_print_estimate integer not null check (design_print_estimate >= 0),
  planning_estimate integer not null check (planning_estimate >= 0),
  paper_types text[] not null check (cardinality(paper_types) > 0),
  page_counts integer[] not null check (cardinality(page_counts) > 0),
  order_quantities integer[] not null check (cardinality(order_quantities) > 0),
  unit_prices jsonb not null default '{}'::jsonb check (jsonb_typeof(unit_prices) = 'object'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index products_created_at_desc_idx on public.products (created_at desc);
create index products_status_idx on public.products (status);
create index products_type_idx on public.products (type);

create function public.set_products_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger products_set_updated_at
before update on public.products
for each row
execute function public.set_products_updated_at();

alter table public.products enable row level security;

create policy "admins select products"
on public.products
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "admins insert products"
on public.products
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "admins update products"
on public.products
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);
~~~

- [ ] **Step 2: Apply and inspect the migration against the linked Supabase project**

Run:

~~~bash
supabase db push
supabase db lint --linked
~~~

Expected: the migration applies once and the database linter reports no errors. In the linked project’s SQL editor, run this read-only query and confirm it lists all 12 products columns from id through updated_at:

~~~sql
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'products'
order by ordinal_position;
~~~

If the repository is not linked yet, run supabase link --project-ref <project-ref> with the project owner before this step; do not substitute a service key into the frontend.

- [x] **Step 3: Extend the handwritten Database type**

In packages/supabase/src/types.ts, add `product_status: "draft" | "published"` beside the existing public enums, add `export type ProductStatus = PublicEnums["product_status"];`, and add this table entry after `portfolio_items`:

~~~ts
      products: {
        Row: {
          created_at: string;
          design_print_estimate: number;
          id: string;
          name: string;
          order_quantities: number[];
          page_counts: number[];
          paper_types: string[];
          planning_estimate: number;
          status: ProductStatus;
          type: string;
          unit_prices: Json;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          design_print_estimate: number;
          id?: string;
          name: string;
          order_quantities: number[];
          page_counts: number[];
          paper_types: string[];
          planning_estimate: number;
          status?: ProductStatus;
          type: string;
          unit_prices?: Json;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          design_print_estimate?: number;
          id?: string;
          name?: string;
          order_quantities?: number[];
          page_counts?: number[];
          paper_types?: string[];
          planning_estimate?: number;
          status?: ProductStatus;
          type?: string;
          unit_prices?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
~~~

- [x] **Step 4: Correct administrator identity lookup**

Replace the body of `requireAdmin` in packages/supabase/src/auth.ts so it first captures the current user and then checks that exact profile:

~~~ts
export async function requireAdmin(
  client: CBrainSupabaseClient,
): Promise<TableRow<"profiles">> {
  const user = await requireUser(client);

  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .eq("role", "admin")
    .single();
  const profile = unwrapSupabaseData(data, error);

  if (profile.role !== "admin") {
    throw new Error("Admin access required.");
  }

  return profile;
}
~~~

- [x] **Step 5: Add typed product operations**

Create packages/supabase/src/products.ts. Use the same shape and error handling as portfolio.ts; do not add delete because no product delete interaction exists.

~~~ts
import { requireAdmin } from "./auth.js";
import { unwrapSupabaseData } from "./result.js";
import type { CBrainSupabaseClient } from "./server.js";
import type { TableInsert, TableUpdate } from "./types.js";

export async function listAdminProducts(client: CBrainSupabaseClient) {
  await requireAdmin(client);

  const { data, error } = await client
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  return unwrapSupabaseData(data, error);
}

export async function getAdminProduct(client: CBrainSupabaseClient, id: string) {
  await requireAdmin(client);

  const { data, error } = await client
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  return unwrapSupabaseData(data, error);
}

export async function createProduct(
  client: CBrainSupabaseClient,
  input: TableInsert<"products">,
) {
  await requireAdmin(client);

  const { data, error } = await client
    .from("products")
    .insert(input)
    .select("*")
    .single();

  return unwrapSupabaseData(data, error);
}

export async function updateProduct(
  client: CBrainSupabaseClient,
  id: string,
  input: TableUpdate<"products">,
) {
  await requireAdmin(client);

  const { data, error } = await client
    .from("products")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  return unwrapSupabaseData(data, error);
}
~~~

Add `export * from "./products.js";` to packages/supabase/src/index.ts.

- [x] **Step 6: Verify the typed data layer**

Run:

~~~bash
pnpm --filter @repo/supabase check-types
pnpm --filter @repo/supabase lint
~~~

Expected: both commands exit 0.

- [x] **Step 7: Commit the data contract**

~~~bash
git add supabase/migrations/20260721000000_create_products.sql packages/supabase/src/auth.ts packages/supabase/src/index.ts packages/supabase/src/products.ts packages/supabase/src/types.ts
git commit -m "feat(products): add protected product data access"
~~~

## Task 2: Make the Vite admin a safe authenticated Supabase client

**Files:**
- Modify: packages/supabase/src/client.ts
- Modify: apps/admin/package.json
- Create: apps/admin/.env.example
- Create: apps/admin/src/lib/supabase.ts
- Create: apps/admin/src/components/admin-auth/AdminSessionGate.tsx
- Create: apps/admin/src/pages/AdminLoginPage.tsx
- Create: apps/admin/src/pages/AdminLoginPage.css
- Modify: apps/admin/src/App.tsx
- Modify: apps/admin/src/components/AdminHeader.tsx
- Modify: apps/admin/src/components/AdminHeader.css

**Interfaces:**
- Produces: `supabase`, a single `createBrowserSupabaseClient` instance configured by VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.
- Produces: an admin-only route boundary. Unauthenticated users go to /login; authenticated non-admin users are signed out and denied.
- Consumes: the products RLS policies from Task 1 and the existing profiles.role enum.

- [x] **Step 1: Allow public client configuration to be supplied by Vite**

Change packages/supabase/src/client.ts to accept an optional public configuration. Its default preserves the existing Next.js caller behavior.

~~~ts
import { createBrowserClient } from "@supabase/ssr";

import { getPublicSupabaseEnv } from "./env.js";
import type { PublicSupabaseEnv } from "./env.js";
import type { Database } from "./types.js";

export function createBrowserSupabaseClient(
  env: PublicSupabaseEnv = getPublicSupabaseEnv(),
) {
  return createBrowserClient<Database>(env.url, env.publishableKey);
}
~~~

- [x] **Step 2: Add only public Vite configuration**

Add `"@repo/supabase": "workspace:*"` to apps/admin/package.json dependencies. Create apps/admin/.env.example:

~~~dotenv
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
~~~

Create apps/admin/src/lib/supabase.ts:

~~~ts
import { createBrowserSupabaseClient } from "@repo/supabase/client";

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY.");
}

export const supabase = createBrowserSupabaseClient({ publishableKey, url });
~~~

Do not copy the root SUPABASE_SECRET_KEY into apps/admin/.env or the Vite environment.

- [x] **Step 3: Add the session boundary**

Create apps/admin/src/components/admin-auth/AdminSessionGate.tsx. It must call `supabase.auth.getUser()`, query the current profile by its own `id`, subscribe to `onAuthStateChange`, and render an `Outlet` only when the profile role is `admin`. Render plain loading/denied main elements during resolution; when a logged-in profile is not an admin, call `supabase.auth.signOut()` before navigating to /login.

Use these state and resolution rules:

~~~ts
type GateState = "loading" | "allowed" | "login";

async function getGateState(): Promise<GateState> {
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) return "login";

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || profile?.role !== "admin") {
    await supabase.auth.signOut();
    return "login";
  }

  return "allowed";
}
~~~

Use a boolean cleanup flag in the effect so an older async result does not set state after unmount. In the `login` state, return `<Navigate replace to="/login" />`; in the `allowed` state, return `<Outlet />`.

- [x] **Step 4: Add the minimal login form**

Create apps/admin/src/pages/AdminLoginPage.tsx with controlled email/password inputs and `supabase.auth.signInWithPassword`. On success, look up `profiles.role` by the authenticated user id; sign out and show `관리자 계정만 접근할 수 있습니다.` unless it equals `admin`; otherwise navigate to /products. Disable the submit button while the request is pending and render the returned error as `role="alert"`.

Use the following submit core:

~~~ts
const { data, error } = await supabase.auth.signInWithPassword({ email, password });

if (error || !data.user) {
  setErrorMessage(error?.message ?? "로그인에 실패했습니다.");
  return;
}

const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", data.user.id)
  .maybeSingle();

if (profileError || profile?.role !== "admin") {
  await supabase.auth.signOut();
  setErrorMessage("관리자 계정만 접근할 수 있습니다.");
  return;
}

navigate("/products", { replace: true });
~~~

Create the matching CSS with the existing `--admin-*` colors, 16px radius, Pretendard classes, flex column parents with `gap`, and no custom input focus state. It needs only a centered 400px form, native inputs, error text, and a 52px submit button.

- [x] **Step 5: Protect the current route tree and add sign-out**

Refactor apps/admin/src/App.tsx into:

1. a `/login` route rendering `AdminLoginPage`;
2. an `AdminSessionGate` layout route;
3. an authenticated shell containing `AdminHeader`, the existing invalid-control handler, the existing product/content routes, and `Toaster`.

Keep every existing route path unchanged. Put the root redirect to /products inside the protected shell.

In AdminHeader.tsx, add a `로그아웃` button next to the existing 홈페이지 link. Its handler calls `supabase.auth.signOut()` and then `navigate("/login", { replace: true })`. Add an `.admin-header__logout` selector that shares the existing compact action typography, is a button (not an anchor), and retains the existing focus-visible outline rule.

- [ ] **Step 6: Verify login and policy behavior**

Run:

~~~bash
pnpm --filter admin build
pnpm --filter @repo/supabase check-types
~~~

Expected: both commands exit 0. Then run the admin app and verify all four cases:

1. Visiting /products without a session redirects to /login.
2. An admin password login reaches /products.
3. A non-admin password login returns to /login and cannot query products.
4. The new 로그아웃 action clears the session and returns to /login.

- [x] **Step 7: Commit authentication support**

~~~bash
git add apps/admin/.env.example apps/admin/package.json apps/admin/src/App.tsx apps/admin/src/components/AdminHeader.css apps/admin/src/components/AdminHeader.tsx apps/admin/src/components/admin-auth/AdminSessionGate.tsx apps/admin/src/lib/supabase.ts apps/admin/src/pages/AdminLoginPage.css apps/admin/src/pages/AdminLoginPage.tsx packages/supabase/src/client.ts
git commit -m "feat(admin): protect product routes with Supabase auth"
~~~

## Task 3: Define and test pure product form behavior

**Files:**
- Create: apps/admin/src/pages/productData.ts
- Create: apps/admin/tests/productData.test.mjs

**Interfaces:**
- Produces: `createInitialProductForm()`, `formatNumericValue(value)`, `getUnitPriceKey(paperIndex, pageIndex, quantityIndex)`, `getMissingUnitPriceKey(form)`, `toProductMutationInput(form, status)`, `toProductFormState(product)`, `toProductListRow(product)`, and `filterProductRows(rows, filters)`.
- Consumes: `TableInsert<"products">`, `TableRow<"products">`, and `ProductStatus` from `@repo/supabase/types`.

- [x] **Step 1: Write failing behavior tests**

Create apps/admin/tests/productData.test.mjs. Import only pure functions from productData.ts and cover these exact cases:

~~~js
import assert from "node:assert/strict";
import test from "node:test";
import {
  createInitialProductForm,
  filterProductRows,
  getMissingUnitPriceKey,
  getUnitPriceKey,
  toProductMutationInput,
  toProductListRow,
} from "../src/pages/productData.ts";

function completeForm() {
  return {
    ...createInitialProductForm(),
    designPrintEstimate: "15,000",
    name: "브로슈어",
    orderQuantities: ["100", "200"],
    pageCounts: ["8"],
    paperTypes: ["랑데뷰"],
    planningEstimate: "10,000",
    productType: "일반상품",
    unitPrices: { "0:0:0": "1,200", "0:0:1": "1,000" },
  };
}

test("published product requires every price matrix cell", () => {
  const form = completeForm();
  delete form.unitPrices["0:0:1"];

  assert.equal(getMissingUnitPriceKey(form), "0:0:1");
});

test("draft and published input use numeric storage values", () => {
  const form = completeForm();

  assert.deepEqual(toProductMutationInput(form, "draft"), {
    design_print_estimate: 15000,
    name: "브로슈어",
    order_quantities: [100, 200],
    page_counts: [8],
    paper_types: ["랑데뷰"],
    planning_estimate: 10000,
    status: "draft",
    type: "일반상품",
    unit_prices: { "0:0:0": 1200, "0:0:1": 1000 },
  });
  assert.equal(toProductMutationInput(form, "published").status, "published");
});

test("list filtering matches selected status, type, and name query", () => {
  const rows = [
    { id: "a", name: "브로슈어", status: "published", type: "일반상품" },
    { id: "b", name: "명함", status: "draft", type: "명함" },
  ];

  assert.deepEqual(
    filterProductRows(rows, { query: "브로", status: "전체", type: "전체" }),
    [rows[0]],
  );
  assert.deepEqual(
    filterProductRows(rows, { query: "", status: "draft", type: "전체" }),
    [rows[1]],
  );
});

test("lowest unit price is rendered as product price", () => {
  const row = toProductListRow({
    created_at: "2026-07-21T00:00:00.000Z",
    design_print_estimate: 15000,
    id: "a",
    name: "브로슈어",
    order_quantities: [100],
    page_counts: [8],
    paper_types: ["랑데뷰"],
    planning_estimate: 10000,
    status: "published",
    type: "일반상품",
    unit_prices: { "0:0:0": 1200, "0:0:1": 1000 },
    updated_at: "2026-07-21T00:00:00.000Z",
  });

  assert.equal(getUnitPriceKey(0, 0, 1), "0:0:1");
  assert.equal(row.price, "1,000원");
  assert.equal(row.createdAt, "26. 07. 21");
});
~~~

- [x] **Step 2: Run the test to verify it fails**

Run:

~~~bash
pnpm --filter admin exec node --experimental-strip-types --test tests/productData.test.mjs
~~~

Expected: FAIL because productData.ts does not exist.

- [x] **Step 3: Implement the pure data module**

Create apps/admin/src/pages/productData.ts with these exact public types and rules:

~~~ts
import type { Json, ProductStatus, TableInsert, TableRow } from "@repo/supabase/types";

export type ProductFormState = {
  designPrintEstimate: string;
  name: string;
  orderQuantities: string[];
  pageCounts: string[];
  paperTypes: string[];
  planningEstimate: string;
  productType: string;
  unitPrices: Record<string, string>;
};

export type ProductListRow = {
  createdAt: string;
  detailHref: string;
  id: string;
  name: string;
  price: string;
  status: ProductStatus;
  type: string;
};

export function createInitialProductForm(): ProductFormState {
  return {
    designPrintEstimate: "",
    name: "",
    orderQuantities: [""],
    pageCounts: [""],
    paperTypes: [""],
    planningEstimate: "",
    productType: "",
    unitPrices: {},
  };
}
~~~

Implement `formatNumericValue` with the existing digit stripping and comma formatting behavior. Implement `getUnitPriceKey` as `[paperIndex, pageIndex, quantityIndex].join(":")`. Make `getMissingUnitPriceKey` iterate paper, page, and quantity indexes in ascending order and return the first missing/empty price key or `null`.

Implement `toProductMutationInput` so it trims text, converts formatted money/page/quantity values to safe non-negative integers, rejects an empty/duplicate text option, rejects a non-positive page count/quantity, and throws `Error("상품 정보를 확인해주세요.")` for an invalid base field. Its return type is:

~~~ts
export type ProductMutationInput = Pick<
  TableInsert<"products">,
  | "design_print_estimate"
  | "name"
  | "order_quantities"
  | "page_counts"
  | "paper_types"
  | "planning_estimate"
  | "status"
  | "type"
  | "unit_prices"
>;
~~~

For `unit_prices`, retain only non-empty form values, convert them to integers, and return the object as `Json`. The caller must invoke `getMissingUnitPriceKey` before passing `published`; this preserves partially priced draft records.

Implement `toProductFormState` by converting database integers to comma-formatted strings and JSON numeric values back to `Record<string, string>`; non-numeric JSON entries become absent. Implement `toProductListRow` with `detailHref: "/products/" + product.id`, a `new Intl.NumberFormat("ko-KR")` price, and `created_at.slice(2, 10).replaceAll("-", ". ") + ""`. Return `-` if the product has no numeric unit price. Implement `filterProductRows` with exact status/type matches unless their filter value is `전체`, plus case-insensitive Korean name substring matching for a trimmed query.

- [x] **Step 4: Run the focused and existing tests**

Run:

~~~bash
pnpm --filter admin test
~~~

Expected: productData tests and the existing adminTableFilters test pass.

- [x] **Step 5: Commit the tested product rules**

~~~bash
git add apps/admin/src/pages/productData.ts apps/admin/tests/productData.test.mjs
git commit -m "feat(products): add tested product form rules"
~~~

## Task 4: Make the list load, filter, search, and link to the editor

**Files:**
- Modify: apps/admin/src/components/admin-table/AdminDataTableSection.tsx
- Modify: apps/admin/src/pages/ProductPage.tsx

**Interfaces:**
- Consumes: `listAdminProducts(supabase)`, `toProductListRow(product)`, and `filterProductRows(rows, filters)`.
- Produces: a product table with controlled status/type filters, controlled search, loading/error empty messages, and a /products/:productId detail link.
- Preserves: every other caller of AdminDataTableSection remains uncontrolled and unchanged.

- [x] **Step 1: Write the controlled table prop contract**

Add these optional props to `AdminDataTableSectionProps<Row>`:

~~~ts
  readonly filterValues?: Readonly<Record<string, string>>;
  readonly onFilterValueChange?: (filterId: string, value: string) => void;
  readonly onSearchValueChange?: (value: string) => void;
  readonly searchValue?: string;
~~~

On each filter select, add:

~~~tsx
value={filterValues?.[filter.id]}
onChange={(event) => onFilterValueChange?.(filter.id, event.currentTarget.value)}
~~~

On the search input, add:

~~~tsx
value={searchValue}
onChange={(event) => onSearchValueChange?.(event.currentTarget.value)}
~~~

Leave these values undefined when no product caller supplies them, so the existing portfolio, complaint, blog, review, and notice controls retain their native uncontrolled behavior.

- [x] **Step 2: Replace the static ProductPage data**

In ProductPage.tsx:

1. Remove the empty `productRows` fixture and all null renderers.
2. Import `useEffect`, `useMemo`, and `useState`; `listAdminProducts`; `supabase`; `renderAdminContentStatus`; and the Task 3 product data helpers/types.
3. Load the rows once after mount. Keep an `isCurrent` flag in the effect cleanup. On failure set a Korean error message and call `toast.error("상품 목록을 불러오지 못했습니다.")`.
4. Initialize filters to `{ status: "전체", type: "전체" }` and the query to an empty string.
5. Build status options as `["전체", "임시저장", "게시됨"]`; build type options as `["전체", ...new Set(rows.map((row) => row.type))]`.
6. Pass `filterProductRows(rows, { query, status: filters.status, type: filters.type })` to the table.
7. Render the existing six columns: reusable status cell, type, bold name, date, price, and an anchor with `admin-data-table__link` to `row.detailHref`.
8. Use `상품명으로 검색해주세요.` as the search placeholder. Use `상품을 불러오는 중입니다.` while loading, the stored error message on failure, and the existing no-data message otherwise.

The essential load effect is:

~~~ts
useEffect(() => {
  let isCurrent = true;

  void listAdminProducts(supabase)
    .then((products) => {
      if (isCurrent) setRows(products.map(toProductListRow));
    })
    .catch(() => {
      if (!isCurrent) return;
      setLoadError("상품을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      toast.error("상품 목록을 불러오지 못했습니다.");
    })
    .finally(() => {
      if (isCurrent) setIsLoading(false);
    });

  return () => {
    isCurrent = false;
  };
}, []);
~~~

- [ ] **Step 3: Run the list regression checks**

Run:

~~~bash
pnpm --filter admin test
pnpm --filter admin build
~~~

Expected: both commands exit 0. With an administrator session, manually verify:

1. A saved draft and a published product both appear after navigating to /products.
2. Status/type filters narrow rows without a reload.
3. A name search narrows rows case-insensitively.
4. The 상품가 is the lowest unit price and a draft with no price shows `-`.
5. 상세 opens /products/:productId.

- [x] **Step 4: Commit the functional list**

~~~bash
git add apps/admin/src/components/admin-table/AdminDataTableSection.tsx apps/admin/src/pages/ProductPage.tsx
git commit -m "feat(products): load and filter product list"
~~~

## Task 5: Persist draft, publish, and edit actions in the existing form

**Files:**
- Modify: apps/admin/src/pages/ProductFormPage.tsx

**Interfaces:**
- Consumes: `createProduct(supabase, input)`, `getAdminProduct(supabase, id)`, `updateProduct(supabase, id, input)`, and all Task 3 form helpers.
- Produces: a form that creates or updates drafts, publishes complete price matrices, reloads a record at /products/:productId, and reports server failures without losing current input.

- [x] **Step 1: Replace local product domain declarations with Task 3 imports**

Remove the local `ProductFormState`, `initialFormState`, `formatNumericValue`, and `getUnitPriceKey` declarations. Import `createInitialProductForm`, `formatNumericValue`, `getMissingUnitPriceKey`, `getUnitPriceKey`, `toProductFormState`, and `toProductMutationInput` from ./productData. Initialize state with:

~~~ts
const [form, setForm] = useState(createInitialProductForm);
~~~

Add `name: string` to the rendering by inserting a required 상품명 text field immediately before 상품 유형. Reuse `product-form-field`, `product-form-field__label`, `product-form-control`, and `product-form-control__input`; do not create new layout CSS.

- [x] **Step 2: Load an existing product into edit mode**

When `productId` exists, use an effect to call `getAdminProduct(supabase, productId)`. While loading, render the existing form page container with `상품 정보를 불러오는 중입니다.`. On success:

1. call `setForm(toProductFormState(product))`;
2. append `product.type` to `productTypes` only if it is not already present under the existing Korean case-insensitive normalization;
3. reset step to 1 and clear validation errors.

On failure, show `상품 정보를 불러오지 못했습니다.` in the form and call `toast.error`. Do not render an empty edit form after a failed fetch.

- [x] **Step 3: Save a draft without weakening publish validation**

Give both 임시저장 buttons `type="submit"`, `name="intent"`, and `value="draft"`. Keep the normal next/publish submitters with `value="next"` and `value="publish"`.

Add this intent reader:

~~~ts
function getSubmitIntent(event: FormEvent<HTMLFormElement>) {
  const submitter = event.nativeEvent.submitter;

  return submitter instanceof HTMLButtonElement ? submitter.value : "";
}
~~~

Add one async `persist(status)` function:

~~~ts
async function persist(status: "draft" | "published") {
  setIsSaving(true);
  setSaveError("");

  try {
    const input = toProductMutationInput(form, status);
    const product = productId
      ? await updateProduct(supabase, productId, input)
      : await createProduct(supabase, input);

    toast.success(status === "draft" ? "임시저장했습니다." : "상품을 저장했습니다.");

    if (status === "draft") {
      navigate("/products/" + product.id, { replace: true });
      return;
    }

    navigate("/products");
  } catch {
    setSaveError("상품을 저장하지 못했습니다. 입력값과 권한을 확인해주세요.");
    toast.error("상품을 저장하지 못했습니다.");
  } finally {
    setIsSaving(false);
  }
}
~~~

In step one, a `draft` intent calls `void persist("draft")` after the existing committed-product-type check; a normal intent advances to step two. Native required inputs still enforce complete base configuration before the submit event fires.

In step two, a `draft` intent calls `void persist("draft")` immediately. A `publish` intent first calls `getMissingUnitPriceKey(form)`; if it returns a key, select its paper/page tabs, show `모든 단가 견적을 입력해주세요.`, and focus the corresponding price input. Otherwise call `void persist("published")`.

Remove `required` from step-two unit-price inputs: the explicit publish validation above is what permits a partially priced draft. Keep all step-one fields required. Disable every submit button while `isSaving` is true and add one visible `role="alert"` paragraph for `saveError`.

- [x] **Step 4: Preserve unit-price correctness**

Retain the current behavior that removes all unit prices after an option row is removed. Keep index-based keys unchanged; this exactly matches the persisted JSON contract. Remove the duplicate `setForm` call currently present in the 기획 견적 `onChange` handler so it performs one state update.

- [ ] **Step 5: Run end-to-end form acceptance checks**

Run:

~~~bash
pnpm --filter admin test
pnpm --filter admin build
~~~

Expected: both commands exit 0. With an administrator session, verify:

1. /products/new blocks an empty base form and an uncommitted custom 상품 유형.
2. A complete step-one form can 임시저장; the URL becomes /products/:id and the list shows 임시저장.
3. Reopening that URL restores name, type, estimates, options, and any entered prices.
4. Publishing with a missing matrix cell focuses the correct price input and does not write a published record.
5. Filling every price and publishing returns to /products; the list status becomes 게시됨 and 상품가 is the lowest entered unit price.
6. Editing the published product updates that same id rather than creating another row.
7. A failed network/RLS request leaves the form values in place and shows an error.

- [x] **Step 6: Commit the persisted form**

~~~bash
git add apps/admin/src/pages/ProductFormPage.tsx
git commit -m "feat(products): save drafts and publish products"
~~~

## Task 6: Run repository-wide verification and hand off

**Files:**
- No production files expected beyond Tasks 1–5.

**Interfaces:**
- Verifies the database contract, typed product service, authenticated Vite admin, and product UI work together.

- [x] **Step 1: Run all automated checks**

Run:

~~~bash
pnpm --filter @repo/supabase check-types
pnpm --filter @repo/supabase lint
pnpm --filter admin test
pnpm --filter admin lint
pnpm --filter admin build
rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages
git status --short
~~~

Expected: all checks exit 0; the Figma URL search prints no matches; git status contains only the intentional product/auth/migration changes before committing.

- [ ] **Step 2: Validate the RLS boundary**

Using the Supabase SQL editor or a temporary authenticated client, confirm:

~~~sql
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'products'
order by policyname;
~~~

Expected: select, insert, and update policies exist and each limits access to `profiles.id = auth.uid()` with role `admin`. Verify an unauthenticated client gets no product rows and cannot insert.

- [x] **Step 3: Commit verification-only corrections, if any**

If checks require a source correction, make the smallest correction in the owning task file, rerun the failing command, then commit it:

~~~bash
git add <corrected-files>
git commit -m "fix(products): resolve verification findings"
~~~

Do not add a speculative retry layer, cache, client state library, server API, or pagination during verification.

## Self-Review

- **Spec coverage:** Task 1 creates durable storage and role enforcement; Task 2 supplies a real authenticated Vite client; Task 3 isolates and tests transformation rules; Task 4 implements list/read/filter/search; Task 5 implements create, draft save, publish, and edit; Task 6 validates build, RLS, and the AGENTS.md Figma asset rule.
- **Deliberate exclusions:** Delete, pagination, media, public catalog, sales coupling, and server APIs have no current product UI or approved business rules. They are intentionally not invented.
- **Type consistency:** The database enum is `draft | published` everywhere. UI labels map only to 임시저장/게시됨. The unit-price key is only `paperIndex:pageIndex:quantityIndex`. The Vite client accepts only publishable configuration.
- **Placeholder scan:** Every new symbol and operation used by later tasks is defined in an earlier task.

## Execution Status — 2026-07-21

All local implementation, static checks, package checks, and 28 admin tests passed. The remaining unchecked steps require a linked Supabase project, VITE public credentials, and both administrator and non-administrator test accounts:

- Apply the migration and run the linked database lint.
- Confirm the products columns and RLS policies in the remote database.
- Exercise login, RLS rejection, draft creation, publishing, list filtering, and edit persistence in a browser.
