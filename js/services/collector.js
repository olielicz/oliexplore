/* =====================================================================
   collector.js — Pulls posts from connected platforms.

   ADAPTER PATTERN
   ----------------
   Each platform that supports collection registers an async `fetch`
   adapter. Today these adapters return mock data drawn from a local
   pool (so the app works offline). To go live, swap the body of an
   adapter for a real API call — for example:

     facebook:  GET /{page-id}/posts          (Facebook Graph API)
     instagram: GET /{ig-user-id}/media        (Instagram Graph API)

   The rest of the app neither knows nor cares whether the data is real
   or mocked, which keeps integration risk isolated to this file.
   ===================================================================== */

import { COLLECT_POOL } from "../data/seed.js";
import { collectablePlatforms } from "./platforms.js";

const uid = (prefix) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const wait = (ms) => new Promise((res) => setTimeout(res, ms));

/* Normalize a raw platform payload into the app's internal post shape. */
function normalize(raw) {
  return {
    id: uid(raw.platform),
    platform: raw.platform,
    author: raw.author,
    caption: raw.caption,
    hashtags: raw.hashtags || [],
    mediaEmoji: raw.mediaEmoji || "🖼️",
    mediaTone: raw.mediaTone || "#232427",
    likes: Math.floor(200 + Math.random() * 4000),
    comments: Math.floor(5 + Math.random() * 300),
    shares: Math.floor(2 + Math.random() * 150),
    collectedAt: Date.now(),
    recycled: false,
    published: false,
    publishedTo: [],
  };
}

/* Per-platform collection adapters (mocked). */
const adapters = {
  async facebook() {
    await wait(400);
    return COLLECT_POOL.filter((p) => p.platform === "facebook");
  },
  async instagram() {
    await wait(450);
    return COLLECT_POOL.filter((p) => p.platform === "instagram");
  },
};

/**
 * Collect fresh posts from every connected, collectable platform.
 * @param {string[]} connectedIds - platform ids currently connected
 * @returns {Promise<object[]>} normalized posts (a random subset, to feel live)
 */
export async function collectPosts(connectedIds) {
  const targets = collectablePlatforms().filter((p) =>
    connectedIds.includes(p.id)
  );

  const batches = await Promise.all(
    targets.map((p) => (adapters[p.id] ? adapters[p.id]() : Promise.resolve([])))
  );

  const flat = batches.flat();
  // Return a random 2–3 of the available pool so each "collect" feels fresh.
  const shuffled = flat.sort(() => Math.random() - 0.5);
  const count = Math.min(shuffled.length, 2 + Math.floor(Math.random() * 2));
  return shuffled.slice(0, count).map(normalize);
}
