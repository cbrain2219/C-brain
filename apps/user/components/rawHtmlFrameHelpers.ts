export const MIN_FRAME_HEIGHT = 0;
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
  frameReset.textContent =
    "html { overflow-y: hidden !important; } body { margin: 0; }";

  document.head.prepend(frameReset);
  document.head.prepend(policy);

  const resizeScript = `<script nonce=${JSON.stringify(token)}>(() => {
    const getElementBottom = (element) => {
      const style = getComputedStyle(element);
      if (style.display === "none" || style.position === "fixed") return 0;
      const marginBottom = Number.parseFloat(style.marginBottom);
      return (
        element.getBoundingClientRect().bottom +
        window.scrollY +
        (Number.isFinite(marginBottom) ? marginBottom : 0)
      );
    };

    const sendHeight = () => {
      const body = document.body;
      if (!body) return;
      let height = Math.max(
        body.offsetHeight,
        body.scrollHeight,
        getElementBottom(body),
      );
      for (const element of body.querySelectorAll("*")) {
        height = Math.max(height, getElementBottom(element));
      }

      window.parent.postMessage(
        { type: ${JSON.stringify(RESIZE_MESSAGE_TYPE)}, token: ${JSON.stringify(token)}, height },
        "*",
      );
    };

    let resizeFrame = 0;
    const scheduleHeight = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(sendHeight);
    };

    window.addEventListener("load", scheduleHeight);
    document.fonts?.ready.then(scheduleHeight);
    scheduleHeight();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(scheduleHeight);
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
