/* =====================================================================
   publisher.js — Publishes a post to one or many platforms at once.

   ADAPTER PATTERN (mirrors collector.js)
   --------------------------------------
   Each platform exposes an async `publish(payload)` adapter that
   resolves with a result object. Today they simulate network latency
   and return a fake permalink. To go live, replace an adapter body
   with the real call, e.g.:

     facebook:  POST /{page-id}/feed
     instagram: POST /{ig-user-id}/media  +  /media_publish
     x:         POST /2/tweets

   `publishToAll` runs every selected platform concurrently and reports
   progress per-platform via an optional callback, so the UI can show a
   live status list.
   ===================================================================== */

import { platformById } from "./platforms.js";

const wait = (ms) => new Promise((res) => setTimeout(res, ms));

function fakePermalink(platformId) {
  const slug = Math.random().toString(36).slice(2, 9);
  return `https://${platformId}.example/p/${slug}`;
}

/* Per-platform publish adapters (mocked). */
const adapters = {
  async facebook(p) { await wait(700); return { ok: true, url: fakePermalink("facebook") }; },
  async instagram(p) { await wait(900); return { ok: true, url: fakePermalink("instagram") }; },
  async x(p) { await wait(550); return { ok: true, url: fakePermalink("x") }; },
  async linkedin(p) { await wait(800); return { ok: true, url: fakePermalink("linkedin") }; },
  async tiktok(p) { await wait(1000); return { ok: true, url: fakePermalink("tiktok") }; },
  async threads(p) { await wait(600); return { ok: true, url: fakePermalink("threads") }; },
};

/**
 * Validate a caption against a platform's character limit.
 */
export function validateForPlatform(platformId, caption) {
  const p = platformById(platformId);
  if (!p) return { ok: false, reason: "Unknown platform" };
  if (caption.length > p.charLimit) {
    return { ok: false, reason: `Over ${p.name} limit by ${caption.length - p.charLimit} chars` };
  }
  return { ok: true };
}

/**
 * Publish a payload to many platforms concurrently.
 * @param {{caption:string, hashtags:string[]}} payload
 * @param {string[]} platformIds
 * @param {(id:string, status:'start'|'done'|'error', data?:any)=>void} onProgress
 * @returns {Promise<{platform:string, ok:boolean, url?:string, reason?:string}[]>}
 */
export async function publishToAll(payload, platformIds, onProgress = () => {}) {
  const fullText = composeText(payload);

  const tasks = platformIds.map(async (id) => {
    onProgress(id, "start");

    const valid = validateForPlatform(id, fullText);
    if (!valid.ok) {
      onProgress(id, "error", valid);
      return { platform: id, ok: false, reason: valid.reason };
    }

    try {
      const adapter = adapters[id];
      const res = adapter ? await adapter(payload) : { ok: false };
      onProgress(id, res.ok ? "done" : "error", res);
      return { platform: id, ...res };
    } catch (err) {
      onProgress(id, "error", { reason: err.message });
      return { platform: id, ok: false, reason: err.message };
    }
  });

  return Promise.all(tasks);
}

/* Combine caption + hashtags into the final outbound text. */
export function composeText({ caption, hashtags = [] }) {
  const tags = hashtags.length ? "\n\n" + hashtags.map((h) => `#${h}`).join(" ") : "";
  return `${caption}${tags}`;
}
