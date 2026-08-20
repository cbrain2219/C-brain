import "server-only";

import type {
  PopbillError,
  PopbillKakaoButton,
  PopbillKakaoService,
} from "popbill";

const POPBILL_REQUEST_TIMEOUT_MS = 15_000;

type Environment = Record<string, string | undefined>;
type PopbillModule = typeof import("popbill");
type PopbillModuleImport = PopbillModule & { default?: PopbillModule };

export type { PopbillKakaoService };

export type PopbillConfig = {
  corpNum: string;
  isTest: boolean;
  linkId: string;
  secretKey: string;
};

export type SendPopbillAlimtalkInput = {
  buttons?: PopbillKakaoButton[];
  config: PopbillConfig;
  content: string;
  emphasizeTitle?: string;
  receiver: string;
  receiverName: string;
  requestNumber: string;
  templateCode: string;
};

export type SendPopbillAlimtalkOptions = {
  service?: Pick<PopbillKakaoService, "sendATS_one">;
  timeoutMs?: number;
};

let kakaoServicePromise: Promise<PopbillKakaoService> | undefined;

function requireEnvironmentValue(environment: Environment, name: string) {
  const value = environment[name]?.trim();

  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function resolvePopbillModule(imported: PopbillModuleImport) {
  return imported.default ?? imported;
}

async function getKakaoService(config: PopbillConfig) {
  kakaoServicePromise ??= (async () => {
    const popbill = resolvePopbillModule(await import("popbill"));

    popbill.config({
      IPRestrictOnOff: true,
      IsTest: config.isTest,
      LinkID: config.linkId,
      SecretKey: config.secretKey,
      UseLocalTimeYN: true,
      UseStaticIP: false,
    });

    return popbill.KakaoService();
  })();

  return kakaoServicePromise;
}

function toPopbillError(error: PopbillError | unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    (typeof error.code === "number" || typeof error.code === "string") &&
    typeof error.message === "string"
  ) {
    return new Error(`Popbill ${error.code}: ${error.message}`);
  }

  return error instanceof Error
    ? error
    : new Error("Popbill returned an unexpected error.");
}

export function getPopbillConfig(
  environment: Environment = process.env,
): PopbillConfig {
  const corpNum = requireEnvironmentValue(environment, "POPBILL_CORP_NUM");
  const isTest = requireEnvironmentValue(environment, "POPBILL_IS_TEST");

  if (!/^\d{10}$/.test(corpNum)) {
    throw new Error("POPBILL_CORP_NUM must be exactly 10 digits.");
  }

  if (isTest !== "true" && isTest !== "false") {
    throw new Error("POPBILL_IS_TEST must be true or false.");
  }

  return {
    corpNum,
    isTest: isTest === "true",
    linkId: requireEnvironmentValue(environment, "POPBILL_LINK_ID"),
    secretKey: requireEnvironmentValue(environment, "POPBILL_SECRET_KEY"),
  };
}

export async function sendPopbillAlimtalk(
  input: SendPopbillAlimtalkInput,
  options: SendPopbillAlimtalkOptions = {},
) {
  if (!/^\d{12}$/.test(input.templateCode)) {
    throw new Error(
      "Popbill AlimTalk template code must be exactly 12 digits.",
    );
  }

  if (!/^[A-Za-z0-9_-]{1,36}$/.test(input.requestNumber)) {
    throw new Error("Popbill request number has an invalid format.");
  }

  const service = options.service ?? (await getKakaoService(input.config));
  const timeoutMs = options.timeoutMs ?? POPBILL_REQUEST_TIMEOUT_MS;

  return new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Popbill AlimTalk request timed out."));
    }, timeoutMs);
    const succeed = (receiptNumber: string) => {
      clearTimeout(timeout);
      resolve(receiptNumber);
    };
    const fail = (error: unknown) => {
      clearTimeout(timeout);
      reject(toPopbillError(error));
    };

    try {
      service.sendATS_one(
        input.config.corpNum,
        input.templateCode,
        "",
        input.content,
        "",
        "",
        "",
        "",
        input.receiver,
        input.receiverName,
        input.requestNumber,
        input.buttons ?? null,
        input.emphasizeTitle ?? "",
        "",
        succeed,
        fail,
      );
    } catch (error) {
      fail(error);
    }
  });
}
