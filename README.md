# OliExplore — Social Media Studio

OliExplore collects your existing posts from Facebook, Instagram, X, TikTok, and Threads,
**recycles** them into catchier, quirkier versions, and lets you **publish to every connected
platform with one click**.

It's built as a **zero-dependency, no-build single-page app** (vanilla JS + CSS). Just open it in
a browser — nothing to install. It works fully offline in **demo mode** out of the box, and can be
switched to **live mode** per platform once you connect your own developer app credentials — see
[`LIVE_SETUP.md`](LIVE_SETUP.md).

**🔗 Live demo:** https://olielicz.github.io/oliexplore/ (auto-deployed from `main` via GitHub Pages)

---

## Features

| Area | What it does |
|------|--------------|
| **Content Library** | All collected posts shown as cards with platform badge, engagement stats, and status. |
| **Keyword Search** | Type any keyword, hashtag, author, or platform name — the grid filters live. |
| **Recycle Engine** | Turns a plain caption into a catchy/quirky variant: adds a hook, punches up the copy, injects relevant emoji, suggests fresh hashtags, and adds a playful sign-off. Five tones: Catchy, Quirky, Punchy, Friendly, Professional. Re-roll for endless variants. |
| **Inline Editor** | Edit caption + hashtags with a live preview and a per-platform character budget. |
| **Publish to All** | One button publishes the post to every connected platform at once, with a live per-platform progress list. Toggle platforms off to skip them. |
| **Connections** | Connect/disconnect Facebook, Instagram, X, LinkedIn, TikTok, and Threads — in demo mode instantly, or in **live mode** via each platform's real OAuth consent screen. |
| **Collect** | Pulls fresh posts from connected, collectable accounts (Facebook, Instagram, X, TikTok, Threads) — for real once live, mocked otherwise. |
| **Live API Setup** | A Settings panel (gear icon) to paste your proxy URL and each platform's Client ID, turning demo accounts into real ones. See [`LIVE_SETUP.md`](LIVE_SETUP.md). |
| **Recycled post preview** | Before you publish, a styled mockup shows exactly what the recycled post will look like — author, caption, hashtags, and engagement layout — plus the raw text that will be sent. |
| **Persistence** | Everything is saved to `localStorage`, so your library survives refreshes. Live credentials are stored separately from your content, so clearing one never wipes the other. |
| **Views** | Library · Recycled · Published · Connections. |
| **Responsive** | Works on desktop and mobile (collapsible sidebar). |

**Theme:** monochrome — black, gray, and white.

---

## Run it

No build step. Any static server works:

```bash
cd oliexplore
python3 -m http.server 8000
# then open http://localhost:8000
```

> ES modules require `http://` (not `file://`), so use a local server.

---

## Project structure

```
oliexplore/
├── index.html              # App shell
├── oauth-callback.html     # OAuth redirect target (real login popups land here)
├── LIVE_SETUP.md           # Step-by-step: register real developer apps per platform
├── server/                 # Deployable proxy (Cloudflare Worker) for real OAuth + API calls
│   ├── worker.js
│   ├── wrangler.toml
│   └── README.md
├── styles/
│   ├── main.css            # Theme tokens + layout
│   └── components.css      # Cards, drawer, modal, toggles, toasts, settings panel
└── js/
    ├── app.js              # Bootstrap + event wiring + routing
    ├── store.js            # Observable state + localStorage persistence
    ├── data/seed.js        # Initial library + collection pool
    ├── engine/recycle.js   # Catchy/quirky transformation engine
    ├── services/
    │   ├── platforms.js    # Platform registry (source of truth) + OAuth config per platform
    │   ├── collector.js    # Collect adapters — live via liveApi.js, mock fallback otherwise
    │   ├── publisher.js    # Publish adapters — live via liveApi.js, mock fallback otherwise
    │   ├── config.js       # Stores proxy URL / Client IDs / access tokens (localStorage)
    │   ├── oauth.js        # Real OAuth 2.0 + PKCE popup flow
    │   └── liveApi.js      # Fetch wrapper that calls your proxy with the stored access token
    └── ui/
        ├── render.js       # Stats, chips, grid, connections
        ├── editor.js       # Edit & Recycle drawer
        ├── publish.js      # Publish-to-all modal
        ├── connect.js      # Login modal — branches to live OAuth or demo login per platform
        ├── settings.js     # Live API Setup panel
        ├── toast.js        # Notifications
        └── util.js         # esc / number / time helpers
```

---

## Performance notes

- **Debounced persistence.** State writes to `localStorage` are debounced (250ms) and batched
  instead of firing on every single mutation, so rapid changes (typing, multi-platform publish
  progress) don't serialize the whole app state repeatedly.
- **Batched re-renders.** Store subscribers are notified once per microtask instead of once per
  mutation, so several state changes in the same tick collapse into a single grid re-render.
- **Debounced search.** The search box updates the store (and re-renders the grid) 150ms after you
  stop typing, instead of on every keystroke — typing itself stays instant since it's a native input.
- **O(1) platform lookups.** `platformById()` now uses a `Map` built once at load instead of an
  `Array.find()` scan, since it's called for every card/chip on every render.

## Going live with real accounts

OliExplore ships in demo mode (everything mocked, works offline, zero setup) but is fully wired for
real Facebook, Instagram, X, TikTok, and Threads accounts:

1. Deploy the included proxy (`/server`, a Cloudflare Worker, free tier) — this is the one piece
   that must run server-side, since OAuth token exchange requires a client secret that can never
   ship in browser code.
2. Register a developer app on whichever platform(s) you want to use and grab its Client ID.
3. Paste your proxy URL + Client IDs into OliExplore's **Live API Setup** panel (gear icon).
4. Reconnect that platform from the Connections tab — you'll get the platform's real OAuth consent
   screen instead of the demo login.

Full instructions, including exactly where to find each credential and each platform's current
limitations (e.g. X requires a paid API tier, TikTok restricts unaudited apps to private posts), are
in **[`LIVE_SETUP.md`](LIVE_SETUP.md)**.

## Architecture notes (for the next developer)

The app is intentionally structured so real social APIs plug in **without touching the UI**:

- **`services/platforms.js`** is the single registry the whole app reads from — display metadata
  *and* each platform's OAuth parameters (authorize URL, scopes, PKCE requirement). Add a platform
  here and it automatically appears in chips, connection cards, the publish picker, and (if an
  `oauth` block is present) the Live API Setup panel.
- **`services/config.js`** persists your proxy URL, Client IDs, and access tokens in `localStorage`,
  deliberately separate from `store.js` (your content library) so wiping one never wipes the other.
- **`services/oauth.js`** runs the browser-safe half of OAuth 2.0 (Authorization Code + PKCE): builds
  the authorize URL, opens it in a popup, and captures the returned code via `oauth-callback.html`.
- **`services/liveApi.js`** is a thin fetch wrapper that calls `your-proxy/api/{platform}/{action}`
  with the stored access token — used by both `collector.js` and `publisher.js`.
- **`services/collector.js` / `services/publisher.js`** check `hasLiveToken(platformId)` per
  platform: if connected live, they call through `liveApi.js`; otherwise they fall back to the
  original mock adapters. The rest of the app (recycle engine, store, UI) never knows or cares which
  path was used, since both return the same normalized post shape.
- **`server/worker.js`** is the reference proxy: it holds client secrets as Worker environment
  variables, performs the actual OAuth token exchange, and forwards collect/publish calls to each
  platform's real API (Facebook Graph, Instagram Graph, X API v2, TikTok Content Posting API,
  Threads API).

> **Note:** live publishing/collection still requires each platform's developer app, OAuth
> credentials, and (for Meta/TikTok) approval for full permissions — see `LIVE_SETUP.md` for exactly
> what that involves per platform. Nothing here can register those developer apps for you; that step
> requires your own account on each platform.
