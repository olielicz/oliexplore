/* =====================================================================
   app.js — Bootstrap & event wiring for OliExplore.

   Responsibilities:
     • subscribe to the store and re-render on every change
     • route between views (library / recycled / published / connections)
     • wire global controls: search, sort, nav, collect, publish-all
     • delegate card actions (edit / publish) to the right modules
   ===================================================================== */

import { store } from "./store.js";
import { collectPosts } from "./services/collector.js";
import { publishablePlatforms } from "./services/platforms.js";
import {
  renderStats,
  renderChips,
  renderGrid,
  renderConnectionsView,
  captureGridScaffold,
  restoreGridScaffold,
  visiblePosts,
} from "./ui/render.js";
import { initEditor, openEditor } from "./ui/editor.js";
import { initPublish, openPublish } from "./ui/publish.js";
import { toast } from "./ui/toast.js";

/* ---------------- Render orchestration ---------------- */

function render() {
  const { ui } = store.state;
  const statsEl = document.getElementById("stats");
  const toolbarEl = document.querySelector(".toolbar");
  const isConnections = ui.view === "connections";

  // Stats + filter toolbar are only relevant for content views.
  if (statsEl) statsEl.style.display = isConnections ? "none" : "";
  if (toolbarEl) toolbarEl.style.display = isConnections ? "none" : "";

  if (isConnections) {
    renderConnectionsView();
    return;
  }

  // Make sure the grid scaffold is present (it may have been replaced
  // by the connections view), then render the data-driven sections.
  restoreGridScaffold();
  renderStats();
  renderChips();
  renderGrid();
}

/* ---------------- Navigation ---------------- */

function setView(view) {
  document.querySelectorAll(".nav__item").forEach((b) =>
    b.classList.toggle("is-active", b.dataset.view === view)
  );
  // Reset platform filter when switching views so counts stay intuitive.
  store.setUI({ view, platformFilter: "all" });
  closeSidebarOnMobile();
}

/* ---------------- Collect ---------------- */

let collecting = false;
async function handleCollect() {
  if (collecting) return;
  const connected = store.connectedPlatformIds();
  if (!connected.length) {
    toast("Connect an account first (Connections tab).", "error");
    return;
  }

  collecting = true;
  const btn = document.getElementById("collectBtn");
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span>⏳</span> Collecting…`;

  try {
    const fresh = await collectPosts(connected);
    const added = store.addPosts(fresh);
    toast(
      added ? `Collected ${added} new post${added === 1 ? "" : "s"} ⤓` : "No new posts right now.",
      added ? "success" : "info"
    );
  } catch (err) {
    toast("Collection failed. Try again.", "error");
    console.error(err);
  } finally {
    collecting = false;
    btn.disabled = false;
    btn.innerHTML = original;
  }
}

/* ---------------- Publish-all entry points ---------------- */

function handlePublishAll() {
  // Pick the most relevant post to publish: prefer the top recycled one,
  // else the top of the current view.
  const list = visiblePosts();
  const recycled = list.find((p) => p.recycled);
  const target = recycled || list[0];

  if (!target) {
    toast("Nothing to publish yet. Collect or recycle a post first.", "info");
    return;
  }
  if (!recycled) {
    toast("Tip: recycle a post first to make it catchy ✨", "info");
  }
  openPublish(target.id);
}

/* ---------------- Event wiring ---------------- */

function wireGlobalControls() {
  // Search
  const search = document.getElementById("searchInput");
  const clear = document.getElementById("searchClear");
  search.value = store.state.ui.query;
  clear.hidden = !search.value;

  search.addEventListener("input", () => {
    clear.hidden = !search.value;
    store.setUI({ query: search.value });
  });
  clear.addEventListener("click", () => {
    search.value = "";
    clear.hidden = true;
    store.setUI({ query: "" });
    search.focus();
  });

  // Sort
  const sort = document.getElementById("sortSelect");
  sort.value = store.state.ui.sort;
  sort.addEventListener("change", () => store.setUI({ sort: sort.value }));

  // Nav
  document.querySelectorAll(".nav__item").forEach((btn) =>
    btn.addEventListener("click", () => setView(btn.dataset.view))
  );

  // Collect + Publish-all
  document.getElementById("collectBtn").addEventListener("click", handleCollect);
  document.getElementById("publishAllBtn").addEventListener("click", handlePublishAll);

  // Mobile sidebar
  document.getElementById("menuToggle").addEventListener("click", () =>
    document.getElementById("sidebar").classList.toggle("is-open")
  );
}

/* Delegated clicks inside the main content area (cards, chips, connections). */
function wireDelegation() {
  document.querySelector(".main").addEventListener("click", (e) => {
    // Filter chips
    const chip = e.target.closest("[data-platform]");
    if (chip) {
      store.setUI({ platformFilter: chip.dataset.platform });
      return;
    }

    // Connection connect/disconnect
    const conn = e.target.closest("[data-connect]");
    if (conn) {
      store.toggleConnection(conn.dataset.connect);
      const id = conn.dataset.connect;
      toast(
        store.state.connections[id].connected ? "Account connected ✓" : "Account disconnected",
        "info"
      );
      render();
      return;
    }

    // Card actions
    const card = e.target.closest(".card");
    if (!card) return;
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (action === "edit") openEditor(card.dataset.id);
    if (action === "publish") openPublish(card.dataset.id);
  });
}

function closeSidebarOnMobile() {
  document.getElementById("sidebar").classList.remove("is-open");
}

/* ---------------- Init ---------------- */

function init() {
  captureGridScaffold();

  initEditor({ onPublish: (id) => openPublish(id) });
  initPublish();

  wireGlobalControls();
  wireDelegation();

  // Re-render whenever state changes.
  store.subscribe(render);

  render();

  // Friendly welcome.
  setTimeout(
    () =>
      toast(
        `Welcome to OliExplore — ${publishablePlatforms().length} platforms ready to publish.`,
        "info",
        4000
      ),
    500
  );
}

document.addEventListener("DOMContentLoaded", init);
