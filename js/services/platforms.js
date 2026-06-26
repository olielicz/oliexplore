/* =====================================================================
   platforms.js — Registry of supported social platforms.

   Each platform declares its display metadata, character limit, and a
   `kind` flag indicating whether OliExplore can COLLECT from it,
   PUBLISH to it, or both. This registry is the single source of truth
   used by the collector, publisher, UI chips, and connection cards.

   To add a real integration later, implement the matching adapter in
   collector.js / publisher.js — no UI changes required.
   ===================================================================== */

export const PLATFORMS = [
  {
    id: "facebook",
    name: "Facebook",
    short: "fb",
    glyph: "f",
    charLimit: 63206,
    canCollect: true,
    canPublish: true,
    defaultConnected: true,
    sampleHandle: "@oliexplore",
  },
  {
    id: "instagram",
    name: "Instagram",
    short: "ig",
    glyph: "◎",
    charLimit: 2200,
    canCollect: true,
    canPublish: true,
    defaultConnected: true,
    sampleHandle: "@oli.explore",
  },
  {
    id: "x",
    name: "X (Twitter)",
    short: "x",
    glyph: "X",
    charLimit: 280,
    canCollect: false,
    canPublish: true,
    defaultConnected: true,
    sampleHandle: "@oliexplore",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    short: "in",
    glyph: "in",
    charLimit: 3000,
    canCollect: false,
    canPublish: true,
    defaultConnected: true,
    sampleHandle: "OliExplore Inc.",
  },
  {
    id: "tiktok",
    name: "TikTok",
    short: "tt",
    glyph: "♪",
    charLimit: 2200,
    canCollect: false,
    canPublish: true,
    defaultConnected: false,
    sampleHandle: "@oliexplore",
  },
  {
    id: "threads",
    name: "Threads",
    short: "th",
    glyph: "@",
    charLimit: 500,
    canCollect: false,
    canPublish: true,
    defaultConnected: false,
    sampleHandle: "@oli.explore",
  },
];

export const platformById = (id) => PLATFORMS.find((p) => p.id === id);

export const collectablePlatforms = () => PLATFORMS.filter((p) => p.canCollect);
export const publishablePlatforms = () => PLATFORMS.filter((p) => p.canPublish);
