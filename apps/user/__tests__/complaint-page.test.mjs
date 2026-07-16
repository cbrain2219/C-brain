import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import test from "node:test";
import assert from "node:assert/strict";

const pagePath = new URL("../app/(site)/complaint/page.tsx", import.meta.url);
const formPath = new URL(
  "../app/(site)/complaint/ComplaintForm.tsx",
  import.meta.url,
);
const validationPath = new URL(
  "../app/(site)/complaint/validation.ts",
  import.meta.url,
);
const phoneVerificationPath = new URL(
  "../app/(site)/complaint/phoneVerification.ts",
  import.meta.url,
);
const footerPath = new URL("../app/_components/Footer.tsx", import.meta.url);
const attachmentsPath = new URL(
  "../app/(site)/complaint/attachments.ts",
  import.meta.url,
);
const complaintConstantsPath = new URL(
  "../constants/complaint.ts",
  import.meta.url,
);
const stylesPath = new URL("../app/page.module.css", import.meta.url);

async function importTypescriptModule(path) {
  let source = await readFile(path, "utf8");
  if (source.includes('from "../../../constants/complaint"')) {
    const constantsSource = await readFile(complaintConstantsPath, "utf8");
    source = `${constantsSource}\n${source
      .replace(
        /import \{[\s\S]*?\} from "\.\.\/\.\.\/\.\.\/constants\/complaint";\n/,
        "",
      )
      .replace(
        /export \{[\s\S]*?\} from "\.\.\/\.\.\/\.\.\/constants\/complaint";\n/,
        "",
      )}`;
  }
  const ts = await import("typescript");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const encoded = Buffer.from(outputText).toString("base64");

  return import(`data:text/javascript;base64,${encoded}`);
}

test("complaint page exposes the required intake form content", async () => {
  const source = `${await readFile(pagePath, "utf8")}\n${await readFile(
    formPath,
    "utf8",
  )}`;

  const requiredTexts = [
    "씨브레인 불편 접수",
    "서비스 이용 중 불편했던 점을 알려주세요.",
    "이름*",
    "이메일*",
    "휴대폰 번호*",
    "인증요청",
    "인증번호 ${COMPLAINT_VERIFICATION_CODE_LENGTH}자리를 입력해주세요.",
    "이용 서비스*",
    "불편 유형*",
    "상세 내용*",
    "첨부 파일",
    "개인정보 수집 및 이용 동의",
    "불편사항 접수하기",
  ];

  for (const text of requiredTexts) {
    assert.match(
      source,
      new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }
});

test("complaint validation returns invalid required fields in visual order", async () => {
  const { getInvalidRequiredComplaintFields } =
    await importTypescriptModule(validationPath);

  assert.deepEqual(
    getInvalidRequiredComplaintFields({
      complaintType: "",
      detail: "   ",
      email: "user@example.com",
      name: "",
      phone: "",
      service: "",
      verificationCode: "",
    }),
    [
      "name",
      "phone",
      "verificationCode",
      "service",
      "complaintType",
      "detail",
      "privacy",
    ],
  );
});

test("complaint validation requires a six digit verification code", async () => {
  const {
    COMPLAINT_VERIFICATION_CODE_LENGTH,
    getInvalidRequiredComplaintFields,
  } = await importTypescriptModule(validationPath);

  assert.equal(COMPLAINT_VERIFICATION_CODE_LENGTH, 6);

  const validValues = {
    complaintType: "상담/응대",
    detail: "상세 내용입니다.",
    email: "user@example.com",
    name: "홍길동",
    phone: "01012345678",
    privacy: "on",
    service: "디자인",
  };

  assert.deepEqual(
    getInvalidRequiredComplaintFields({
      ...validValues,
      verificationCode: "12345",
    }),
    ["verificationCode"],
  );
  assert.deepEqual(
    getInvalidRequiredComplaintFields({
      ...validValues,
      verificationCode: "abcdef",
    }),
    ["verificationCode"],
  );
  assert.deepEqual(
    getInvalidRequiredComplaintFields({
      ...validValues,
      verificationCode: "123456",
    }),
    [],
  );
});

test("complaint form reuses a single verification code length setting", async () => {
  const formSource = await readFile(formPath, "utf8");
  const validationSource = await readFile(validationPath, "utf8");

  assert.match(validationSource, /COMPLAINT_VERIFICATION_CODE_LENGTH = 6/);
  assert.match(formSource, /COMPLAINT_VERIFICATION_CODE_LENGTH/);
  assert.match(formSource, /COMPLAINT_VERIFICATION_CODE_INPUT_PATTERN/);
  assert.doesNotMatch(formSource, /maxLength=\{6\}/);
  assert.doesNotMatch(formSource, /minLength=\{6\}/);
  assert.doesNotMatch(formSource, /pattern="\[0-9\]\{6\}"/);
});

test("complaint validation treats unchecked privacy consent as required", async () => {
  const { getInvalidRequiredComplaintFields } =
    await importTypescriptModule(validationPath);

  assert.deepEqual(
    getInvalidRequiredComplaintFields({
      complaintType: "상담/응대",
      detail: "상세 내용입니다.",
      email: "user@example.com",
      name: "홍길동",
      phone: "01012345678",
      privacy: false,
      service: "디자인",
      verificationCode: "123456",
    }),
    ["privacy"],
  );
});

test("complaint form exposes a stable phone verification integration boundary", async () => {
  const formSource = await readFile(formPath, "utf8");
  const { normalizePhoneNumber, requestPhoneVerification } =
    await importTypescriptModule(phoneVerificationPath);

  assert.match(formSource, /requestPhoneVerification/);
  assert.equal(normalizePhoneNumber("010-1234-5678"), "01012345678");
  assert.deepEqual(await requestPhoneVerification({ phone: "010-1234-5678" }), {
    normalizedPhone: "01012345678",
    status: "not-configured",
  });
});

test("complaint attachments are formatted for the selected file list", async () => {
  const {
    MAX_COMPLAINT_ATTACHMENT_COUNT,
    MAX_COMPLAINT_ATTACHMENT_SIZE_BYTES,
    formatAttachmentFileSize,
    getAcceptedAttachmentFiles,
    getDisplayAttachmentFiles,
  } = await importTypescriptModule(attachmentsPath);

  const files = [
    {
      lastModified: 1,
      name: "불만 접수 내역 01.png",
      size: 12 * 1024 * 1024,
    },
    {
      lastModified: 2,
      name: "작은 파일.png",
      size: 1536,
    },
    {
      lastModified: 3,
      name: "너무 큰 파일.png",
      size: MAX_COMPLAINT_ATTACHMENT_SIZE_BYTES + 1,
    },
    ...Array.from({ length: 10 }, (_, index) => ({
      lastModified: 100 + index,
      name: `추가 파일 ${index + 1}.png`,
      size: 500,
    })),
  ];

  const acceptedFiles = getAcceptedAttachmentFiles(files);
  const displayFiles = getDisplayAttachmentFiles(acceptedFiles);

  assert.equal(MAX_COMPLAINT_ATTACHMENT_COUNT, 10);
  assert.equal(MAX_COMPLAINT_ATTACHMENT_SIZE_BYTES, 50 * 1024 * 1024);
  assert.equal(formatAttachmentFileSize(12 * 1024 * 1024), "12MB");
  assert.equal(formatAttachmentFileSize(1536), "2KB");
  assert.equal(formatAttachmentFileSize(500), "500B");
  assert.equal(
    acceptedFiles.some((file) => file.name === "너무 큰 파일.png"),
    false,
  );
  assert.equal(displayFiles.length, 10);
  assert.deepEqual(displayFiles[0], {
    id: "불만 접수 내역 01.png-12582912-1-0",
    name: "불만 접수 내역 01.png",
    sizeLabel: "12MB",
  });
  assert.deepEqual(displayFiles[1], {
    id: "작은 파일.png-1536-2-1",
    name: "작은 파일.png",
    sizeLabel: "2KB",
  });
});

test("complaint attachment limits are managed from shared constants", async () => {
  const attachmentsSource = await readFile(attachmentsPath, "utf8");
  const constantsSource = await readFile(complaintConstantsPath, "utf8");

  assert.match(attachmentsSource, /from "..\/..\/..\/constants\/complaint"/);
  assert.doesNotMatch(
    attachmentsSource,
    /MAX_COMPLAINT_ATTACHMENT_COUNT\s*=\s*10/,
  );
  assert.match(constantsSource, /MAX_COMPLAINT_ATTACHMENT_COUNT = 10/);
  assert.match(
    constantsSource,
    /MAX_COMPLAINT_ATTACHMENT_SIZE_BYTES =\s*50 \* COMPLAINT_ATTACHMENT_BYTES_IN_MEGABYTE/,
  );
});

test("footer logo images rely on image dimensions without duplicate inline sizing", async () => {
  const footerSource = await readFile(footerPath, "utf8");

  assert.match(footerSource, /height=\{21\}/);
  assert.match(footerSource, /width=\{77\}/);
  assert.match(footerSource, /height=\{4\}/);
  assert.match(footerSource, /width=\{76\}/);
  assert.doesNotMatch(footerSource, /style=\{\{ height: 21, width: 77 \}\}/);
  assert.doesNotMatch(footerSource, /style=\{\{ height: 4, width: 76 \}\}/);
});

test("complaint form keeps review-sensitive handlers and focus states explicit", async () => {
  const formSource = await readFile(formPath, "utf8");
  const stylesSource = await readFile(stylesPath, "utf8");

  assert.doesNotMatch(formSource, /onChange=\{\(event\) =>/);
  assert.doesNotMatch(formSource, /onClick=\{\(\) => handleRemoveAttachment/);
  assert.match(formSource, /onChange=\{handleRequiredFieldChange\}/);
  assert.match(formSource, /onClick=\{handleRemoveAttachmentClick\}/);
  assert.match(
    stylesSource,
    /\.complaintConsent input:focus-visible \+ \.complaintConsentBox/,
  );
});
