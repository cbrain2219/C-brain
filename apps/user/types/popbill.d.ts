declare module "popbill" {
  export type PopbillConfiguration = {
    IPRestrictOnOff: boolean;
    IsTest: boolean;
    LinkID: string;
    SecretKey: string;
    UseLocalTimeYN: boolean;
    UseStaticIP: boolean;
  };

  export type PopbillError = {
    code: number | string;
    message: string;
  };

  export type PopbillKakaoButton = {
    n: string;
    t: string;
    tg?: string;
    u1?: string;
    u2?: string;
  };

  export type PopbillKakaoService = {
    sendATS_one(
      corpNum: string,
      templateCode: string,
      sender: string,
      content: string,
      altSubject: string,
      altContent: string,
      altSendType: string,
      sendDateTime: string,
      receiver: string,
      receiverName: string,
      requestNumber: string,
      buttons: PopbillKakaoButton[] | null,
      emphasizeTitle: string,
      userId: string,
      success: (receiptNumber: string) => void,
      error: (error: PopbillError) => void,
    ): void;
  };

  export function config(value: PopbillConfiguration): void;
  export function KakaoService(): PopbillKakaoService;
}
