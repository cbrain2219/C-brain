import assert from "node:assert/strict";
import test from "node:test";

import {
  getYouTubeEmbedUrl,
  getYouTubeVideoId,
  getYouTubeWatchUrl,
} from "../src/reviewVideo.ts";

const videoId = "dQw4w9WgXcQ";

test("YouTube video URLs normalize supported watch, share, shorts, live, and embed forms", () => {
  const urls = [
    `https://www.youtube.com/watch?v=${videoId}&feature=share`,
    `https://m.youtube.com/watch?v=${videoId}`,
    `https://youtu.be/${videoId}?t=42`,
    `https://www.youtube.com/shorts/${videoId}`,
    `https://www.youtube.com/live/${videoId}?si=tracking`,
    `https://www.youtube.com/embed/${videoId}`,
    `https://www.youtube-nocookie.com/embed/${videoId}`,
  ];

  for (const url of urls) {
    assert.equal(getYouTubeVideoId(url), videoId, url);
  }
});

test("YouTube video parsing rejects deceptive hosts, unsupported pages, and invalid ids", () => {
  const invalidUrls = [
    "",
    videoId,
    `https://youtube.example/watch?v=${videoId}`,
    `https://www.youtube.com.example/watch?v=${videoId}`,
    `https://www.youtube.com/channel/${videoId}`,
    "https://www.youtube.com/watch?v=too-short",
    `javascript:https://www.youtube.com/watch?v=${videoId}`,
  ];

  for (const url of invalidUrls) {
    assert.equal(getYouTubeVideoId(url), null, url);
  }
});

test("YouTube URL builders emit canonical HTTPS watch and privacy-enhanced embed URLs", () => {
  assert.equal(
    getYouTubeWatchUrl(videoId),
    `https://www.youtube.com/watch?v=${videoId}`,
  );
  assert.equal(
    getYouTubeEmbedUrl(videoId),
    `https://www.youtube-nocookie.com/embed/${videoId}`,
  );
  assert.equal(getYouTubeWatchUrl("too-short"), null);
  assert.equal(getYouTubeEmbedUrl("too-short"), null);
});
