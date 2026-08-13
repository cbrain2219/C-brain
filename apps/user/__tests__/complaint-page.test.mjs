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
const complaintTypesPath = new URL(
  "../app/(site)/complaint/complaintTypes.ts",
  import.meta.url,
);
const footerPath = new URL("../app/_components/Footer.tsx", import.meta.url);
const companyContentPath = new URL(
  "../app/_content/company.ts",
  import.meta.url,
);
const contactContentPath = new URL(
  "../app/_content/contact.ts",
  import.meta.url,
);
const attachmentsPath = new URL(
  "../app/(site)/complaint/attachments.ts",
  import.meta.url,
);
const complaintSubmissionPath = new URL(
  "../app/(site)/complaint/complaintSubmission.ts",
  import.meta.url,
);
const complaintConstantsPath = new URL(
  "../constants/complaint.ts",
  import.meta.url,
);
const stylesPath = new URL("../app/page.module.css", import.meta.url);

async function importTypescriptModule(path) {
  let source = await readFile(path, "utf8");
  if (source.includes('from "./contact.ts"')) {
    const contactSource = await readFile(contactContentPath, "utf8");
    source = `${contactSource}\n${source.replace(
      /import \{ KAKAO_CHANNEL_URL \} from "\.\/contact\.ts";\n/,
      "",
    )}`;
  }
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

function extractCssBlock(source, marker) {
  const markerIndex = source.indexOf(marker);
  assert.notEqual(markerIndex, -1, `${marker} marker should exist`);

  const openIndex = source.indexOf("{", markerIndex);
  assert.notEqual(openIndex, -1, `${marker} block should open`);

  let depth = 0;

  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];

    if (char === "{") {
      depth += 1;
    }

    if (char === "}") {
      depth -= 1;
    }

    if (depth === 0) {
      return source.slice(openIndex + 1, index);
    }
  }

  assert.fail(`${marker} block should close`);
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

test("complaint container fills the one-column layout width", async () => {
  const stylesSource = await readFile(stylesPath, "utf8");
  const baseComplaintInner = extractCssBlock(stylesSource, ".complaintInner");
  const tabletMedia = extractCssBlock(
    stylesSource,
    "@media (min-width: 640px)",
  );
  const desktopMedia = extractCssBlock(
    stylesSource,
    "@media (min-width: 1080px)",
  );
  const pcMedia = extractCssBlock(stylesSource, "@media (min-width: 1440px)");

  assert.match(baseComplaintInner, /width:\s*100%;/);
  assert.match(baseComplaintInner, /max-width:\s*100%;/);
  assert.doesNotMatch(
    tabletMedia,
    /\.complaintInner\s*\{[\s\S]*?width:\s*min\(100%,\s*600px\)/,
  );
  assert.doesNotMatch(
    desktopMedia,
    /\.complaintInner\s*\{[\s\S]*?width:\s*min\(100%,\s*640px\)/,
  );
  assert.match(pcMedia, /\.complaintInner\s*\{[\s\S]*?max-width:\s*1360px;/);
});

test("complaint page includes the fixed mobile header in compact top padding", async () => {
  const stylesSource = await readFile(stylesPath, "utf8");
  const baseComplaintSection = extractCssBlock(
    stylesSource,
    ".complaintSection",
  );
  const tabletMedia = extractCssBlock(
    stylesSource,
    "@media (min-width: 640px)",
  );
  const desktopMedia = extractCssBlock(
    stylesSource,
    "@media (min-width: 1080px)",
  );

  assert.match(
    baseComplaintSection,
    /padding:\s*var\(--site-page-top-offset\) 20px 72px;/,
  );
  assert.match(
    tabletMedia,
    /\.complaintSection\s*\{[\s\S]*?padding-top:\s*var\(--site-page-top-offset\);/,
  );
  assert.match(
    desktopMedia,
    /\.complaintSection\s*\{[\s\S]*?padding-top:\s*var\(--site-page-top-offset\);/,
  );
});

test("complaint text inputs use baseline-aligned compact placeholders", async () => {
  const formSource = await readFile(formPath, "utf8");
  const stylesSource = await readFile(stylesPath, "utf8");

  assert.doesNotMatch(formSource, /COMPLAINT_COMPACT_PLACEHOLDER_MEDIA/);
  assert.doesNotMatch(formSource, /matchMedia/);
  assert.match(formSource, /ResizeObserver/);
  assert.match(formSource, /getComplaintPlaceholderFitsInput/);
  assert.equal(
    (formSource.match(/phone: "전화번호를 입력해주세요\."/g) ?? []).length,
    2,
  );
  assert.match(
    formSource,
    /`인증번호 \$\{COMPLAINT_VERIFICATION_CODE_LENGTH\}자리\.\.\.`/,
  );
  assert.doesNotMatch(stylesSource, /\.complaintField input\s*\{[^}]*…/);
  assert.doesNotMatch(
    stylesSource,
    /\.complaintField input\s*\{[\s\S]*?text-overflow:\s*ellipsis;/,
  );
});

test("complaint service options match the service cards in visual order", async () => {
  const submissionSource = await readFile(complaintSubmissionPath, "utf8");
  assert.match(
    submissionSource,
    /import \{ productTypes \} from "@repo\/supabase\/categories"/,
  );
  assert.match(submissionSource, /export const serviceOptions = productTypes/);
});

test("complaint privacy consent starts unchecked and links to its notice page", async () => {
  const formSource = await readFile(formPath, "utf8");

  assert.match(formSource, /privacy: false/);
  assert.match(
    formSource,
    /<Link[\s\S]*?href="\/privacy-collection"[\s\S]*?>[\s\S]*?보기[\s\S]*?<\/Link>/,
  );
  assert.doesNotMatch(formSource, /<details/);
  assert.doesNotMatch(formSource, /<summary/);
  assert.doesNotMatch(formSource, /href="#privacy-policy"/);
  assert.match(formSource, /register\("website"\)/);
  assert.match(formSource, /aria-hidden="true"/);
  assert.match(formSource, /tabIndex=\{-1\}/);
});

test("complaint types provide the supplied descriptions in order", async () => {
  const { complaintTypeOptions, getComplaintTypeDescription } =
    await importTypescriptModule(complaintTypesPath);

  assert.deepEqual(complaintTypeOptions, [
    {
      title: "대표에게 제보하기",
      description:
        "서비스 전반에 대한 의견이나 제안을 대표에게 직접 전달합니다",
    },
    {
      title: "불친절한 서비스",
      description: "상담·응대 과정에서 불편했던 점을 알려주세요",
    },
    {
      title: "결과물의 결함",
      description: "완성된 제작물의 품질·오류에 대한 내용입니다",
    },
    {
      title: "기타",
      description: "위 항목에 해당하지 않는 내용을 자유롭게 작성해주세요",
    },
  ]);
  assert.equal(
    getComplaintTypeDescription("불친절한 서비스"),
    "상담·응대 과정에서 불편했던 점을 알려주세요",
  );
  assert.equal(getComplaintTypeDescription(""), "");
  assert.equal(getComplaintTypeDescription("알 수 없는 유형"), "");
});

test("complaint form shows the selected type description in the Figma layout", async () => {
  const formSource = await readFile(formPath, "utf8");
  const stylesSource = await readFile(stylesPath, "utf8");

  assert.match(formSource, /from "\.\/complaintTypes"/);
  assert.match(formSource, /watch\("complaintType"\)/);
  assert.match(formSource, /getComplaintTypeDescription/);
  assert.match(formSource, /selectedComplaintTypeDescription \?/);
  assert.match(formSource, /aria-live="polite"/);
  assert.match(formSource, /id="complaint-type-label"/);
  assert.match(formSource, /aria-labelledby="complaint-type-label"/);
  assert.match(
    formSource,
    /aria-describedby=\{[\s\S]*selectedComplaintTypeDescription[\s\S]*\? "complaint-type-description"[\s\S]*: undefined[\s\S]*\}/,
  );
  assert.match(formSource, /id="complaint-type-description"/);
  assert.match(formSource, /className=\{styles\.complaintTypeControl\}/);
  assert.match(formSource, /className=\{styles\.complaintTypeDescription\}/);
  assert.match(formSource, /option\.title/);

  assert.match(stylesSource, /\.complaintTypeControl\s*\{[\s\S]*?gap:\s*4px;/);
  assert.match(
    stylesSource,
    /\.complaintTypeDescription\s*\{[\s\S]*?color:\s*var\(--landing-gray-600\);/,
  );
  assert.match(
    stylesSource,
    /\.complaintTypeDescription\s*\{[\s\S]*?font-size:\s*12px;/,
  );
  assert.match(
    stylesSource,
    /\.complaintTypeDescription\s*\{[\s\S]*?font-weight:\s*500;/,
  );
  assert.match(
    stylesSource,
    /\.complaintTypeDescription\s*\{[\s\S]*?line-height:\s*16px;/,
  );
  assert.doesNotMatch(
    stylesSource,
    /\.complaintTypeDescription[^}]*white-space:\s*nowrap/,
  );
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

test("complaint validation rejects malformed contact details", async () => {
  const { getInvalidRequiredComplaintFields } =
    await importTypescriptModule(validationPath);
  const validValues = {
    complaintType: "대표에게 제보하기",
    detail: "상세 내용입니다.",
    email: "user@example.com",
    name: "홍길동",
    phone: "010-1234-5678",
    privacy: true,
    service: "브로슈어 · 카탈로그",
    verificationCode: "123456",
  };

  assert.deepEqual(
    getInvalidRequiredComplaintFields({
      ...validValues,
      email: "user",
    }),
    ["email"],
  );
  assert.deepEqual(
    getInvalidRequiredComplaintFields({
      ...validValues,
      phone: "a",
    }),
    ["phone"],
  );
  assert.deepEqual(getInvalidRequiredComplaintFields(validValues), []);
});

test("complaint phone input keeps digits only and formats an 010 number", async () => {
  const formSource = await readFile(formPath, "utf8");
  const {
    COMPLAINT_PHONE_INPUT_MAX_LENGTH,
    COMPLAINT_PHONE_INPUT_PATTERN,
    formatComplaintPhoneNumber,
    isPhoneValid,
  } = await importTypescriptModule(validationPath);

  assert.equal(COMPLAINT_PHONE_INPUT_MAX_LENGTH, 13);
  assert.equal(COMPLAINT_PHONE_INPUT_PATTERN, "010-[0-9]{4}-[0-9]{4}");
  assert.equal(formatComplaintPhoneNumber("01012345678"), "010-1234-5678");
  assert.equal(
    formatComplaintPhoneNumber("010-12ab34-567890"),
    "010-1234-5678",
  );
  assert.equal(formatComplaintPhoneNumber("01012"), "010-12");
  assert.equal(isPhoneValid("010-1234-5678"), true);
  assert.equal(isPhoneValid("01012345678"), false);
  assert.equal(isPhoneValid("011-1234-5678"), false);
  assert.match(formSource, /inputMode="numeric"/);
  assert.match(formSource, /maxLength=\{COMPLAINT_PHONE_INPUT_MAX_LENGTH\}/);
  assert.match(formSource, /pattern=\{COMPLAINT_PHONE_INPUT_PATTERN\}/);
  assert.match(formSource, /onChange=\{handlePhoneChange\}/);
});

test("complaint validation requires a six digit verification code", async () => {
  const {
    COMPLAINT_TEMP_VERIFICATION_CODE,
    COMPLAINT_VERIFICATION_CODE_LENGTH,
    getInvalidRequiredComplaintFields,
  } = await importTypescriptModule(validationPath);

  assert.equal(COMPLAINT_TEMP_VERIFICATION_CODE, "123456");
  assert.equal(COMPLAINT_VERIFICATION_CODE_LENGTH, 6);

  const validValues = {
    complaintType: "상담/응대",
    detail: "상세 내용입니다.",
    email: "user@example.com",
    name: "홍길동",
    phone: "010-1234-5678",
    privacy: true,
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
      verificationCode: COMPLAINT_TEMP_VERIFICATION_CODE,
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
});

test("complaint form exposes the phone verification integration boundary", async () => {
  const formSource = await readFile(formPath, "utf8");
  const { normalizePhoneNumber, requestPhoneVerification } =
    await importTypescriptModule(phoneVerificationPath);

  assert.match(formSource, /인증요청/);
  assert.match(formSource, /requestPhoneVerification/);
  assert.equal(normalizePhoneNumber("010-1234-5678"), "01012345678");
  assert.deepEqual(await requestPhoneVerification({ phone: "010-1234-5678" }), {
    normalizedPhone: "01012345678",
    status: "not-configured",
  });
});

test("complaint verification code appears only after a successful request", async () => {
  const formSource = await readFile(formPath, "utf8");
  const stylesSource = await readFile(stylesPath, "utf8");

  assert.match(
    formSource,
    /const isPhoneVerificationRequested\s*=\s*phoneVerificationResult\?\.status === "requested"/,
  );
  assert.match(
    formSource,
    /disabled=\{\s*isRequestingPhoneVerification\s*\|\|\s*isPhoneVerificationRequested\s*\}/,
  );
  assert.match(
    formSource,
    /isPhoneVerificationRequested \? \([\s\S]*?\{\.\.\.verificationCodeInputRegistration\}[\s\S]*?\) : null/,
  );
  assert.match(
    formSource,
    /isPhoneVerificationRequested\s*\? "발송완료"\s*: "인증요청"/,
  );
  assert.match(
    formSource,
    /!isPhoneVerificationRequested\s*\|\|\s*isComplaintRequiredFieldValid\("verificationCode", value\)/,
  );
  assert.match(formSource, /resetField\("verificationCode"\)/);
  assert.match(
    stylesSource,
    /\.complaintVerifyButton:disabled\s*\{[\s\S]*?cursor:\s*not-allowed;/,
  );
  assert.match(
    stylesSource,
    /\.complaintVerifyButton\[aria-busy="true"\]\s*\{[\s\S]*?cursor:\s*wait;/,
  );
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
      phone: "010-1234-5678",
      privacy: false,
      service: "디자인",
      verificationCode: "123456",
    }),
    ["privacy"],
  );
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
      type: "image/png",
    },
    {
      lastModified: 2,
      name: "작은 파일.png",
      size: 1536,
      type: "image/png",
    },
    {
      lastModified: 3,
      name: "너무 큰 파일.png",
      size: MAX_COMPLAINT_ATTACHMENT_SIZE_BYTES + 1,
      type: "image/png",
    },
    ...Array.from({ length: 10 }, (_, index) => ({
      lastModified: 100 + index,
      name: `추가 파일 ${index + 1}.png`,
      size: 500,
      type: "image/png",
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
  const { companyProfile } = await importTypescriptModule(companyContentPath);

  assert.match(
    footerSource,
    /<Link aria-label="씨브레인 홈" className=\{styles\.footerLogo\} href="\/">/,
  );
  assert.equal(companyProfile.logo.main.footerHeight, 21);
  assert.equal(companyProfile.logo.main.width, 77);
  assert.equal(companyProfile.logo.tagline.footerHeight, 4);
  assert.equal(companyProfile.logo.tagline.width, 76);
  assert.match(footerSource, /companyProfile\.logo\.main\.footerHeight/);
  assert.match(footerSource, /companyProfile\.logo\.main\.width/);
  assert.match(footerSource, /companyProfile\.logo\.tagline\.footerHeight/);
  assert.match(footerSource, /companyProfile\.logo\.tagline\.width/);
  assert.doesNotMatch(footerSource, /style=\{\{ height: 21, width: 77 \}\}/);
  assert.doesNotMatch(footerSource, /style=\{\{ height: 4, width: 76 \}\}/);
});

test("footer contains current C-Brain business information", async () => {
  const footerSource = await readFile(footerPath, "utf8");
  const { companyProfile } = await importTypescriptModule(companyContentPath);

  assert.equal(companyProfile.name, "씨브레인");
  assert.equal(companyProfile.representative, "정혜영");
  assert.equal(companyProfile.phone, "070-8830-2219");
  assert.equal(companyProfile.businessRegistrationNumber, "120-07-84415");
  assert.equal(companyProfile.mailOrderSalesNumber, "2022-성남중원-0006");
  assert.equal(companyProfile.privacyManager.email, "jhy@cbrain.kr");

  assert.match(footerSource, /companyProfile/);
  assert.match(footerSource, /companyProfile\.phone/);
  assert.match(footerSource, /companyProfile\.operatingHours\.footerWeekday/);
  assert.match(footerSource, /companyProfile\.representative/);
  assert.match(footerSource, /companyProfile\.businessRegistrationNumber/);
  assert.match(footerSource, /companyProfile\.mailOrderSalesNumber/);
  assert.match(footerSource, /companyProfile\.address\.full/);
  assert.match(footerSource, /companyProfile\.branches\.ilsan/);
  assert.match(footerSource, /companyProfile\.productionRooms\.seongsu/);
  assert.match(footerSource, /companyProfile\.productionRooms\.paju/);
  assert.match(footerSource, /companyProfile\.productionRooms\.osan/);
  assert.match(footerSource, /companyProfile\.privacyManager\.email/);
  assert.doesNotMatch(footerSource, /070-8830-2219/);
  assert.doesNotMatch(footerSource, /120-07-84415/);
  assert.doesNotMatch(footerSource, /2022-성남중원-0006/);
});

test("footer social links point to C-Brain channels", async () => {
  const footerSource = await readFile(footerPath, "utf8");
  const { companySocialLinks } =
    await importTypescriptModule(companyContentPath);

  assert.deepEqual(
    companySocialLinks.map((link) => link.href),
    [
      "https://blog.naver.com/cbrain_design_group",
      "https://instagram.com/cbrain_design_group",
      "https://www.youtube.com/@CreateDesigngroup",
    ],
  );

  assert.match(footerSource, /companySocialLinks/);
  assert.match(footerSource, /href=\{social\.href\}/);
  assert.doesNotMatch(
    footerSource,
    /https:\/\/instagram\.com\/cbrain_design_group/,
  );
  assert.doesNotMatch(
    footerSource,
    /https:\/\/blog\.naver\.com\/cbrain_design_group/,
  );
  assert.doesNotMatch(
    footerSource,
    /https:\/\/www\.youtube\.com\/@CreateDesigngroup/,
  );
  assert.match(footerSource, /target="_blank"/);
  assert.match(footerSource, /rel="noopener noreferrer"/);
});

test("company profile feeds reusable company info rows", async () => {
  const companySource = await readFile(companyContentPath, "utf8");
  const { companyInfoRows, companyProfile } =
    await importTypescriptModule(companyContentPath);

  assert.match(companySource, /export const companyProfile/);
  assert.match(companySource, /companyProfile\.phone/);
  assert.match(companySource, /companyProfile\.email/);
  assert.match(companySource, /companyProfile\.address\.lines/);
  assert.match(companySource, /companyProfile\.businessRegistrationNumber/);
  assert.match(companySource, /companyProfile\.mailOrderSalesNumber/);

  assert.deepEqual(
    companyInfoRows.find((row) => row.label === "전화")?.value,
    companyProfile.phone,
  );
  assert.deepEqual(
    companyInfoRows.find((row) => row.label === "이메일")?.value,
    companyProfile.email,
  );
  assert.deepEqual(
    companyInfoRows.find((row) => row.label === "소재지")?.value,
    companyProfile.address.lines,
  );
});

test("complaint form delegates required field state to react-hook-form", async () => {
  const formSource = await readFile(formPath, "utf8");
  const stylesSource = await readFile(stylesPath, "utf8");

  assert.match(formSource, /from "react-hook-form"/);
  assert.match(formSource, /useForm<ComplaintFormValues>/);
  assert.match(formSource, /formState:\s*\{\s*errors\s*\}/);
  assert.match(
    formSource,
    /handleSubmit\(handleValidSubmit, handleInvalidSubmit\)/,
  );
  assert.match(formSource, /const handlePhoneChange/);
  assert.match(formSource, /onChange=\{handlePhoneChange\}/);
  assert.match(formSource, /getValues\("phone"\)/);
  assert.match(formSource, /setError\("phone"/);

  for (const fieldName of [
    "name",
    "email",
    "phone",
    "verificationCode",
    "service",
    "complaintType",
    "detail",
    "privacy",
  ]) {
    assert.match(formSource, new RegExp(`register\\("${fieldName}"`));
  }

  assert.doesNotMatch(formSource, /invalidFieldNames/);
  assert.doesNotMatch(formSource, /handleRequiredFieldChange/);
  assert.doesNotMatch(formSource, /data-required-field-name/);
  assert.match(formSource, /onClick=\{handleRemoveAttachmentClick\}/);
  assert.match(
    stylesSource,
    /\.complaintConsent input:focus-visible \+ \.complaintConsentBox/,
  );
});

test("complaint form shows the Figma success dialog and resets on close", async () => {
  const formSource = await readFile(formPath, "utf8");
  const stylesSource = await readFile(stylesPath, "utf8");

  assert.match(formSource, /useRef<HTMLDialogElement>\(null\)/);
  assert.match(formSource, /successDialogRef\.current\?\.showModal\(\)/);
  assert.match(formSource, /const handleSuccessDialogClose/);
  assert.match(formSource, /successDialogRef\.current\?\.close\(\)/);
  assert.match(formSource, /\breset\(\)/);
  assert.match(formSource, /setAttachmentFiles\(\[\]\)/);
  assert.match(formSource, /syncAttachmentInputFiles\(\[\]\)/);
  assert.match(formSource, /setPhoneVerificationResult\(null\)/);
  assert.match(formSource, /setIsRequestingPhoneVerification\(false\)/);
  assert.match(formSource, /event\.target === event\.currentTarget/);
  assert.match(formSource, /event\.key === "Escape"/);

  for (const expectedSource of [
    "<dialog",
    'aria-describedby="complaint-success-description"',
    'aria-labelledby="complaint-success-title"',
    'aria-label="접수 완료 팝업 닫기"',
    "onCancel={handleSuccessDialogCancel}",
    "onClick={handleSuccessDialogBackdropClick}",
    "onClick={handleSuccessDialogClose}",
    "onKeyDown={handleSuccessDialogKeyDown}",
    "소중한 의견 감사합니다.",
    "대표님 확인 후 영업일 기준 1~2일 내 회신드리겠습니다.",
  ]) {
    assert.match(formSource, new RegExp(expectedSource));
  }
  assert.match(formSource, />\s*확인\s*</);

  assert.match(
    stylesSource,
    /\.complaintSuccessDialog::backdrop\s*\{[\s\S]*background:\s*rgba\(30, 41, 59, 0\.52\)/,
  );
  assert.match(
    stylesSource,
    /\.complaintSuccessPanel\s*\{[\s\S]*border-radius:\s*16px[\s\S]*padding:\s*16px 20px/,
  );
  assert.match(
    stylesSource,
    /\.complaintSuccessConfirmButton\s*\{[^}]*width:\s*56px[^}]*height:\s*52px[^}]*white-space:\s*nowrap[^}]*\}/,
  );
  assert.ok(
    stylesSource.indexOf(".complaintSuccessDialog {") <
      stylesSource.indexOf("@media (min-width: 640px)"),
  );
});
