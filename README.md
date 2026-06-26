# OliExplore — Social Media Studio

OliExplore collects your existing posts from Facebook and Instagram, **recycles** them into
catchier, quirkier versions, and lets you **publish to every connected platform with one click**.

It's built as a **zero-dependency, no-build single-page app** (vanilla JS + CSS). Just open it in
a browser — nothing to install.

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
| **Connections** | Connect/disconnect Facebook, Instagram, X, LinkedIn, TikTok, and Threads. |
| **Collect** | Pulls fresh posts from connected, collectable accounts. |
| **Persistence** | Everything is saved to `localStorage`, so your library survives refreshes. |
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
├── styles/
│   ├── main.css            # Theme tokens + layout
│   └── components.css      # Cards, drawer, modal, toggles, toasts
└── js/
    ├── app.js              # Bootstrap + event wiring + routing
    ├── store.js            # Observable state + localStorage persistence
    ├── data/seed.js        # Initial library + collection pool
    ├── engine/recycle.js   # Catchy/quirky transformation engine
    ├── services/
    │   ├── platforms.js    # Platform registry (source of truth)
    │   ├── collector.js    # Collect adapters (FB/IG) — mocked
    │   └── publisher.js    # Publish adapters (all platforms) — mocked
    └── ui/
        ├── render.js       # Stats, chips, grid, connections
        ├── editor.js       # Edit & Recycle drawer
        ├── publish.js      # Publish-to-all modal
        ├── toast.js        # Notifications
        └── util.js         # esc / number / time helpers
```

---

## Architecture notes (for the next developer)

The app is intentionally structured so real social APIs can be dropped in **without touching the UI**:

- **`services/collector.js`** exposes per-platform `fetch` adapters. They currently return mock
  data from a local pool. To go live, replace an adapter body with a real call
  (e.g. Facebook Graph `GET /{page-id}/posts`, Instagram Graph `GET /{ig-user-id}/media`).
- **`services/publisher.js`** mirrors that with per-platform `publish` adapters
  (e.g. `POST /{page-id}/feed`, the Instagram two-step `/media` + `/media_publish`, `POST /2/tweets`).
- **`services/platforms.js`** is the single registry the whole app reads from. Add a platform there
  and it automatically appears in chips, connection cards, and the publish picker.

Because the data shape is normalized in one place, the recycle engine, store, and UI are completely
decoupled from whichever backend produces the posts.

> **Note:** Live publishing/collection requires each platform's developer app, OAuth credentials,
> and (for Meta) app review with the relevant permissions. The mocked adapters simulate latency and
> success responses so the full workflow is demoable offline today.
