/* =====================================================================
   store.js — Central application state + persistence
   A tiny observable store. Subscribers re-render on change.
   ===================================================================== */

import { SEED_POSTS } from "./data/seed.js";
import { PLATFORMS } from "./services/platforms.js";

const STORAGE_KEY = "oliexplore.state.v1";

const defaultState = () => ({
  posts: structuredClone(SEED_POSTS),
  connections: PLATFORMS.reduce((acc, p) => {
    acc[p.id] = { connected: p.defaultConnected, handle: p.sampleHandle };
    return acc;
  }, {}),
  ui: {
    view: "library",      // library | recycled | published | connections
    query: "",
    platformFilter: "all",
    sort: "recent",
  },
});

class Store {
  constructor() {
    this._subs = new Set();
    this.state = this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      // Merge with defaults so new fields are always present.
      const base = defaultState();
      return {
        posts: Array.isArray(parsed.posts) ? parsed.posts : base.posts,
        connections: { ...base.connections, ...(parsed.connections || {}) },
        ui: { ...base.ui, ...(parsed.ui || {}) },
      };
    } catch (err) {
      console.warn("OliExplore: failed to load state, using defaults.", err);
      return defaultState();
    }
  }

  _persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (err) {
      console.warn("OliExplore: failed to persist state.", err);
    }
  }

  subscribe(fn) {
    this._subs.add(fn);
    return () => this._subs.delete(fn);
  }

  _emit() {
    this._persist();
    this._subs.forEach((fn) => fn(this.state));
  }

  /* ---------- UI mutations ---------- */
  setUI(patch) {
    this.state.ui = { ...this.state.ui, ...patch };
    this._emit();
  }

  /* ---------- Post queries ---------- */
  getPost(id) {
    return this.state.posts.find((p) => p.id === id);
  }

  /* ---------- Post mutations ---------- */
  addPosts(posts) {
    // Prepend newly collected posts, skip duplicates by id.
    const existing = new Set(this.state.posts.map((p) => p.id));
    const fresh = posts.filter((p) => !existing.has(p.id));
    this.state.posts = [...fresh, ...this.state.posts];
    this._emit();
    return fresh.length;
  }

  updatePost(id, patch) {
    this.state.posts = this.state.posts.map((p) =>
      p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p
    );
    this._emit();
  }

  deletePost(id) {
    this.state.posts = this.state.posts.filter((p) => p.id !== id);
    this._emit();
  }

  /* ---------- Connections ---------- */
  toggleConnection(platformId) {
    const c = this.state.connections[platformId];
    if (!c) return;
    c.connected = !c.connected;
    this._emit();
  }

  connectedPlatformIds() {
    return Object.entries(this.state.connections)
      .filter(([, c]) => c.connected)
      .map(([id]) => id);
  }
}

export const store = new Store();
