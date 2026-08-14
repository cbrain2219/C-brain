const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

const YOUTUBE_HOSTS = new Set([
  "m.youtube.com",
  "music.youtube.com",
  "www.youtube.com",
  "youtube.com",
]);

const YOUTUBE_NOCOOKIE_HOSTS = new Set([
  "www.youtube-nocookie.com",
  "youtube-nocookie.com",
]);

function normalizeVideoId(value: string | null | undefined) {
  const videoId = value?.trim() ?? "";

  return YOUTUBE_VIDEO_ID_PATTERN.test(videoId) ? videoId : null;
}

export function getYouTubeVideoId(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) return null;

  let url: URL;

  try {
    url = new URL(trimmedValue);
  } catch {
    return null;
  }

  if (
    (url.protocol !== "https:" && url.protocol !== "http:") ||
    url.username ||
    url.password
  ) {
    return null;
  }

  const hostname = url.hostname.toLowerCase();
  const pathSegments = url.pathname.split("/").filter(Boolean);

  if (hostname === "youtu.be") {
    return normalizeVideoId(pathSegments[0]);
  }

  if (YOUTUBE_HOSTS.has(hostname)) {
    if (url.pathname === "/watch" || url.pathname === "/watch/") {
      return normalizeVideoId(url.searchParams.get("v"));
    }

    if (["embed", "live", "shorts"].includes(pathSegments[0] ?? "")) {
      return normalizeVideoId(pathSegments[1]);
    }

    return null;
  }

  if (YOUTUBE_NOCOOKIE_HOSTS.has(hostname) && pathSegments[0] === "embed") {
    return normalizeVideoId(pathSegments[1]);
  }

  return null;
}

export function getYouTubeWatchUrl(videoId: string) {
  const normalizedVideoId = normalizeVideoId(videoId);

  return normalizedVideoId
    ? `https://www.youtube.com/watch?v=${normalizedVideoId}`
    : null;
}

export function getYouTubeEmbedUrl(videoId: string) {
  const normalizedVideoId = normalizeVideoId(videoId);

  return normalizedVideoId
    ? `https://www.youtube-nocookie.com/embed/${normalizedVideoId}`
    : null;
}

export function getYouTubeThumbnailUrl(videoId: string) {
  const normalizedVideoId = normalizeVideoId(videoId);

  return normalizedVideoId
    ? `https://i.ytimg.com/vi/${normalizedVideoId}/hqdefault.jpg`
    : null;
}
