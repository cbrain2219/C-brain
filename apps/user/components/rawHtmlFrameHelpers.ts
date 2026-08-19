export const MIN_FRAME_HEIGHT = 320;
export const MAX_FRAME_HEIGHT = 100_000;
export const RESIZE_MESSAGE_TYPE = "cbrain:raw-html-resize";

type DomParserConstructor = new () => DOMParser;

export function createFramedHtml(
  html: string,
  token: string,
  DomParser: DomParserConstructor = DOMParser,
) {
  const document = new DomParser().parseFromString(html, "text/html");

  document.querySelectorAll("script").forEach((script) => script.remove());

  const policy = document.createElement("meta");
  policy.httpEquiv = "Content-Security-Policy";
  policy.content = [
    "default-src http: https: data: blob:",
    "script-src 'nonce-" + token + "'",
    "style-src 'unsafe-inline' http: https:",
    "img-src http: https: data: blob:",
    "font-src http: https: data:",
    "media-src http: https: data: blob:",
    "connect-src 'none'",
    "frame-src 'none'",
    "object-src 'none'",
    "form-action 'none'",
  ].join("; ");

  const frameReset = document.createElement("style");
  frameReset.setAttribute("data-cbrain-frame-reset", "");
  frameReset.textContent = "body { margin: 0; }";

  document.head.prepend(frameReset);
  document.head.prepend(policy);

  const resizeScript = `<script nonce=${JSON.stringify(token)}>(() => {
    const sendHeight = () => {
      const body = document.body;
      const root = document.documentElement;
      const height = Math.max(
        body?.offsetHeight ?? 0,
        body?.scrollHeight ?? 0,
        root.offsetHeight,
        root.scrollHeight,
      );

      window.parent.postMessage(
        { type: ${JSON.stringify(RESIZE_MESSAGE_TYPE)}, token: ${JSON.stringify(token)}, height },
        "*",
      );
    };

    window.addEventListener("load", sendHeight);
    document.fonts?.ready.then(sendHeight);
    requestAnimationFrame(sendHeight);

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(sendHeight);
      observer.observe(document.documentElement);
      if (document.body) observer.observe(document.body);
    }
  })();</script>`;

  return `<!DOCTYPE html>\n${document.documentElement.outerHTML.replace(
    /<\/body>/iu,
    `${resizeScript}</body>`,
  )}`;
}

export function clampFrameHeight(height: number) {
  return Math.min(MAX_FRAME_HEIGHT, Math.max(MIN_FRAME_HEIGHT, Math.ceil(height)));
}

type FrameResizeMessage = {
  height?: unknown;
  token?: unknown;
  type?: unknown;
};

export function getTrustedFrameResizeHeight({
  data,
  expectedSource,
  expectedToken,
  source,
}: {
  readonly data: unknown;
  readonly expectedSource: MessageEventSource | null;
  readonly expectedToken: string | null;
  readonly source: MessageEventSource | null;
}) {
  const message = data as FrameResizeMessage;
  if (
    source !== expectedSource ||
    !data ||
    typeof data !== "object" ||
    message.type !== RESIZE_MESSAGE_TYPE ||
    message.token !== expectedToken ||
    typeof message.height !== "number" ||
    !Number.isFinite(message.height)
  ) {
    return null;
  }

  return clampFrameHeight(message.height);
}
