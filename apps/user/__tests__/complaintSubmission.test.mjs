import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import { register } from "node:module";
import test from "node:test";

const supabaseLoader = `
export async function resolve(specifier, context, nextResolve) {
  if (specifier.endsWith(".js") && context.parentURL?.includes("/packages/supabase/src/")) {
    return nextResolve(specifier.slice(0, -3) + ".ts", context);
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.endsWith(".ts")) {
    const { readFile } = await import("node:fs/promises");
    const { stripTypeScriptTypes } = await import("node:module");
    const source = await readFile(new URL(url), "utf8");
    return {
      format: "module",
      shortCircuit: true,
      source: stripTypeScriptTypes(source, { mode: "transform" }),
    };
  }
  return nextLoad(url, context);
}`;

register(
  `data:text/javascript,${encodeURIComponent(supabaseLoader)}`,
  import.meta.url,
);

const { createStoragePath } =
  await import("../../../packages/supabase/src/files.ts");

const submissionPath = new URL(
  "../app/(site)/complaint/complaintSubmission.ts",
  import.meta.url,
);
const validationPath = new URL(
  "../app/(site)/complaint/validation.ts",
  import.meta.url,
);
const complaintTypesPath = new URL(
  "../app/(site)/complaint/complaintTypes.ts",
  import.meta.url,
);
const constantsPath = new URL("../constants/complaint.ts", import.meta.url);
const formPath = new URL(
  "../app/(site)/complaint/ComplaintForm.tsx",
  import.meta.url,
);
const complaintRoutePath = new URL(
  "../app/api/complaints/route.ts",
  import.meta.url,
);
const uploadRoutePath = new URL(
  "../app/api/complaints/uploads/route.ts",
  import.meta.url,
);

async function importSubmissionModule() {
  const [constantsSource, submissionSource, validationSource, typesSource] =
    await Promise.all([
      readFile(constantsPath, "utf8"),
      readFile(submissionPath, "utf8"),
      readFile(validationPath, "utf8"),
      readFile(complaintTypesPath, "utf8"),
    ]);
  const source = `${constantsSource}\n${validationSource}\n${typesSource}\n${submissionSource.replace(
    /import \{[\s\S]*?\} from "(?:\.\.\/\.\.\/\.\.\/constants\/complaint|\.\/validation|\.\/complaintTypes)";\n/g,
    "",
  )}`;
  const ts = await import("typescript");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });

  return import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
  );
}

function validValues() {
  return {
    complaintType: "불친절한 서비스",
    detail: "상담 과정에서 불편했던 내용을 확인해주세요.",
    email: "customer@example.com",
    name: "고객",
    phone: "01012345678",
    privacy: true,
    service: "로고",
  };
}

test("complaint payload keeps file bytes out of the server request", async () => {
  const {
    createComplaintSubmissionPayload,
    createComplaintUploadRequest,
    getComplaintUploadPrefix,
    parseComplaintSubmission,
    parseComplaintUploadRequest,
  } = await importSubmissionModule();
  const submissionId = crypto.randomUUID();
  const file = new File(["evidence"], "증빙.png", { type: "image/png" });
  const uploadRequest = createComplaintUploadRequest(
    submissionId,
    [file],
    validValues(),
  );
  const uploadParsed = parseComplaintUploadRequest(uploadRequest);
  const path = `${getComplaintUploadPrefix(submissionId)}/${crypto.randomUUID()}.png`;
  const payload = createComplaintSubmissionPayload(
    validValues(),
    submissionId,
    [{ name: file.name, path, size: file.size, type: file.type }],
  );
  const parsed = parseComplaintSubmission(payload);

  assert.equal(uploadParsed.ok, true);
  assert.equal(
    parseComplaintUploadRequest({ ...uploadRequest, website: "bot.test" }).ok,
    false,
  );
  assert.equal(
    parseComplaintUploadRequest({
      ...uploadRequest,
      service: "알 수 없는 서비스",
    }).ok,
    false,
  );
  assert.equal(uploadRequest.attachments[0].name, "증빙.png");
  assert.equal("arrayBuffer" in uploadRequest.attachments[0], false);
  assert.equal(parsed.ok, true);
  assert.equal("verificationCode" in payload.values, false);
  assert.equal(parsed.attachments[0].name, "증빙.png");
  assert.equal(parsed.attachments[0].path, path);
});

test("complaint validation rejects invalid fields and attachment limits", async () => {
  const { validateComplaintSubmission } = await importSubmissionModule();

  assert.match(
    validateComplaintSubmission(
      { ...validValues(), email: "not-an-email" },
      [],
    ),
    /필수 항목/,
  );
  assert.match(
    validateComplaintSubmission(
      validValues(),
      Array.from({ length: 11 }, () => ({
        name: "evidence.png",
        size: 1,
        type: "image/png",
      })),
    ),
    /최대 10개/,
  );
  assert.match(
    validateComplaintSubmission(validValues(), [
      {
        name: "large.png",
        size: 50 * 1024 * 1024 + 1,
        type: "image/png",
      },
    ]),
    /최대 50MB/,
  );
  assert.match(
    validateComplaintSubmission(validValues(), [
      { name: "notes.pdf", size: 1, type: "application/pdf" },
    ]),
    /PNG, JPEG, WEBP/,
  );
  assert.match(
    validateComplaintSubmission(
      { ...validValues(), service: "서버에만 있는 값" },
      [],
    ),
    /필수 항목/,
  );
  assert.match(
    validateComplaintSubmission(
      { ...validValues(), complaintType: "알 수 없는 유형" },
      [],
    ),
    /필수 항목/,
  );
  assert.match(
    validateComplaintSubmission({ ...validValues(), website: "bot.test" }, []),
    /필수 항목/,
  );
});

test("complaint payload rejects paths outside its signed upload scope", async () => {
  const { parseComplaintCleanupRequest, parseComplaintSubmission } =
    await importSubmissionModule();
  const submissionId = crypto.randomUUID();
  const attachment = {
    name: "증빙.png",
    path: `inquiry-submissions/${crypto.randomUUID()}/${crypto.randomUUID()}.png`,
    size: 1,
    type: "image/png",
  };

  assert.equal(
    parseComplaintSubmission({
      attachments: [attachment],
      submissionId,
      values: validValues(),
    }).ok,
    false,
  );
  assert.equal(
    parseComplaintCleanupRequest({
      paths: [attachment.path],
      submissionId,
    }).ok,
    false,
  );
});

test("complaint form uploads directly with a signed token before JSON submission", async () => {
  const [formSource, routeSource, uploadRouteSource] = await Promise.all([
    readFile(formPath, "utf8"),
    readFile(complaintRoutePath, "utf8"),
    readFile(uploadRoutePath, "utf8"),
  ]);

  assert.match(formSource, /uploadToSignedUrl/);
  assert.match(formSource, /createComplaintSubmissionPayload/);
  assert.match(formSource, /!finalizationStarted && uploadPaths\.length > 0/);
  assert.doesNotMatch(formSource, /new FormData\(/);
  assert.match(routeSource, /request\.json\(\)/);
  assert.match(routeSource, /getFileInfo/);
  assert.match(routeSource, /id: submission\.submissionId/);
  assert.match(routeSource, /\.remove\(uploadedPaths\)/);
  assert.match(uploadRouteSource, /createSignedFileUpload/);
  assert.match(uploadRouteSource, /parseComplaintCleanupRequest/);
});

test("complaint mapping remains unverified", async () => {
  const { toComplaintInquiryInput } = await importSubmissionModule();
  const input = toComplaintInquiryInput(
    validValues(),
    "2026-07-21T00:00:00.000Z",
  );

  assert.equal(input.status, "received");
  assert.equal(input.phone_verified, false);
  assert.equal(input.privacy_agreed_at, "2026-07-21T00:00:00.000Z");
});

test("complaint attachment paths discard unsafe scope and extension characters", () => {
  const path = createStoragePath(
    "inquiries/../inquiry-id",
    "../../증빙 파일.P N G",
  );

  assert.match(path, /^inquiries\/inquiry-id\/[0-9a-f-]{36}\.png$/);
  assert.doesNotMatch(path, /\.\.|\s|\\/);
});
