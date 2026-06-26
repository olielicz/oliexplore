/* =====================================================================
   platforms.js — Registry of supported social platforms.

   Each platform declares its display metadata, character limit, and a
   `kind` flag indicating whether OliExplore can COLLECT from it,
   PUBLISH to it, or both. This registry is the single source of truth
   used by the collector, publisher, UI chips, and connection cards.

   The `auth` block describes the (simulated) OAuth login experience:
   the field label shown on the login screen and the list of permission
   scopes the user authorizes. To wire up a real integration later,
   point connect.js at the platform's real OAuth endpoint — no UI
   changes required.
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
    defaultConnected: false,
    sampleHandle: "@oliexplore",
    auth: {
      loginLabel: "Email or phone",
      loginPlaceholder: "you@example.com",
      scopes: [
        "Read posts from your Pages",
        "Publish posts on your behalf",
        "View post engagement insights",
      ],
    },
  },
  {
    id: "instagram",
    name: "Instagram",
    short: "ig",
    glyph: "◎",
    charLimit: 2200,
    canCollect: true,
    canPublish: true,
    defaultConnected: false,
    sampleHandle: "@oli.explore",
    auth: {
      loginLabel: "Username or email",
      loginPlaceholder: "yourusername",
      scopes: [
        "Read your media and captions",
        "Publish photos and reels",
        "View basic profile information",
      ],
    },
  },
  {
    id: "x",
    name: "X (Twitter)",
    short: "x",
    glyph: "X",
    charLimit: 280,
    canCollect: false,
    canPublish: true,
    defaultConnected: false,
    sampleHandle: "@oliexplore",
    auth: {
      loginLabel: "Username, email or phone",
      loginPlaceholder: "@yourhandle",
      scopes: [
        "Post and repost on your behalf",
        "Read your profile information",
      ],
    },
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    short: "in",
    glyph: "in",
    charLimit: 3000,
    canCollect: false,
    canPublish: true,
    defaultConnected: false,
    sampleHandle: "OliExplore Inc.",
    auth: {
      loginLabel: "Email",
      loginPlaceholder: "you@company.com",
      scopes: [
        "Share posts on your behalf",
        "Read your basic profile",
      ],
    },
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
    auth: {
      loginLabel: "Email or username",
      loginPlaceholder: "yourusername",
      scopes: [
        "Publish videos on your behalf",
        "Read your profile information",
      ],
    },
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
    auth: {
      loginLabel: "Username or email",
      loginPlaceholder: "yourusername",
      scopes: [
        "Publish threads on your behalf",
        "Read your profile information",
      ],
    },
  },
];

export const platformById = (id) => PLATFORMS.find((p) => p.id === id);

export const collectablePlatforms = () => PLATFORMS.filter((p) => p.canCollect);
export const publishablePlatforms = () => PLATFORMS.filter((p) => p.canPublish);

/* Platforms that use an "@handle" style identity (everyone except LinkedIn). */
export const usesAtHandle = (id) => id !== "linkedin";
