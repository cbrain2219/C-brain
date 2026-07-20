# 어드민 상품 등록·수정 폼 Implementation Plan

**Goal:** Figma 노드 `227:7114`, `227:9133`을 기준으로 `/products/new`에 필수값 검증이 있는 2단계 상품 등록 폼을 구현하고, `/products/:productId`에서는 같은 폼을 수정 문구로 제공한다.

**Architecture:** 하나의 `ProductFormPage`가 생성/수정 모드와 Step 1/2 상태를 함께 관리한다. Step 1의 용지·페이지·수량은 활성 입력 행과 마지막 비활성 추가 행으로 표현하고, 추가 행을 누르면 빈 필수 입력이 하나 늘어난다. Step 2는 Step 1 값을 탭과 단가 행으로 재사용하며 가격 상태를 용지×페이지×수량 조합별로 보존한다.

**Tech Stack:** React 19, TypeScript, React Router 7, Vite 8, 기존 admin CSS 및 Pretendard 토큰

## Constraints

- `design.md`의 Pretendard, inline SVG/currentColor, 부모 `gap` 간격 규칙을 따른다.
- Figma의 브라우저 chrome과 footer는 기존 상품 리스트와 동일하게 외곽 프레임으로 보고, 기존 `AdminHeader`와 흰색 admin page shell을 재사용한다.
- Figma 예시 가격 `1,040`, `700`, `520`, `463` 및 예시 용지·페이지·수량은 목데이터로 넣지 않는다.
- 상품 유형 외 모든 Step 2 선택지는 Step 1 입력값에서 만든다.
- 가격 입력은 문자열의 숫자만 보존해 세 자리마다 쉼표를 붙인다. `Number` 변환은 큰 금액의 정밀도 손실 때문에 사용하지 않는다.
- 활성화된 모든 입력·select·radio는 `required`다. 비활성 추가 행의 표시용 input은 `disabled required`로 유지한다.
- `/products/:productId`에서는 제목을 `상품 수정`, 최종 버튼을 `수정하기`로 바꾼다.
- 새 이미지 asset은 없다. 체크·chevron·화살표는 inline SVG로 작성하며 Figma MCP URL을 소스에 남기지 않는다.

## Files

- Create: `apps/admin/src/pages/ProductFormPage.tsx`
- Create: `apps/admin/src/pages/ProductFormPage.css`
- Modify: `apps/admin/src/App.tsx`

## Task 1: 공통 상태와 Step 1 구현

- [x] `ProductFormPage.tsx`에 문자열 기반 `formatNumericValue`를 작성한다.
- [x] 상품 유형 select, 디자인 + 인쇄 견적, 기획 견적을 controlled required field로 구현한다.
- [x] 용지 종류는 일반 문자열, 페이지 수는 숫자, 주문 수량은 쉼표 숫자로 관리하는 동적 입력 그룹을 구현한다.
- [x] 각 그룹은 최소 한 개의 활성 필수 입력과 마지막 비활성 추가 행을 렌더링한다. 추가 행의 checkbox를 누르면 활성 입력이 하나 늘어난다.
- [x] Step 1의 `다음으로`는 native form validation을 통과한 경우에만 Step 2로 이동한다.
- [x] `목록으로`는 `/products`로 연결하고 `임시저장`은 submit하지 않는 버튼으로 둔다.

## Task 2: Step 2와 생성/수정 문구 구현

- [x] Step 1에서 입력한 용지와 페이지를 required radio 탭으로 렌더링한다.
- [x] 현재 선택한 용지·페이지와 각 주문 수량의 조합마다 빈 required 단가 입력을 렌더링한다.
- [x] 탭을 바꿔도 조합별 단가 값이 유지되도록 key 기반 state를 사용한다.
- [x] 단가 입력은 숫자 이외 문자를 제거하고 천 단위 쉼표를 즉시 적용한다.
- [x] 제출 시 모든 용지×페이지×수량 조합이 채워졌는지 검사하고, 누락 조합이 있으면 해당 탭으로 이동한다.
- [x] `/products/new`는 `신규 상품 등록`/`등록하기`, `/products/:productId`는 `상품 수정`/`수정하기`를 표시한다.
- [x] `뒤로가기`는 Step 1 상태를 보존한 채 이동한다.

## Task 3: Figma 스타일과 라우트 연결

- [x] `ProductFormPage.css`에 640px 폼, 52px control, 16px radius, 20px field gap, 52px action gap, teal/gray 상태를 구현한다.
- [x] checkbox, tab radio, disabled input, 단위 suffix를 키보드·스크린리더에서도 이해 가능한 구조로 만든다.
- [x] `App.tsx`에 `/products/new`, `/products/:productId` 라우트를 추가한다.
- [x] 기존 `/products` 목록과 다른 콘텐츠 페이지 라우트는 변경하지 않는다.

## Task 4: Verification

- [x] `pnpm --filter admin lint`
- [x] `pnpm --filter admin build`
- [ ] 브라우저에서 빈 Step 1이 진행되지 않는지, 숫자 필터/쉼표, 추가 행, Step 2 탭/단가 상태를 확인한다. (현재 세션에 연결 가능한 브라우저가 없어 정적 렌더·formatter 검사로 대체)
- [x] `/products/example-id`의 생성/수정 문구 분기를 Vite SSR 정적 렌더로 확인한다.
- [x] `git diff --check`
- [x] `rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages`가 출력 없이 끝나는지 확인한다.

## Self-Review

- 두 Figma 화면의 중앙 폼 구조와 버튼 문구를 모두 포함했다.
- 목데이터 없이 Step 1 입력을 Step 2의 실제 옵션과 단가 조합으로 연결한다.
- 별도 폼 라이브러리·상태 라이브러리·공용 추상화를 추가하지 않는다.
- API 계약이 없으므로 최종 제출의 서버 저장은 범위 밖이며, 클라이언트 필수값 검증까지만 구현한다.
