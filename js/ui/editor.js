/* =====================================================================
   editor.js — The "Edit & Recycle" drawer.

   Lets the user:
     • edit the caption + hashtags inline
     • one-click recycle into a chosen tone (catchy/quirky/…)
     • re-roll the recycle for a fresh variant
     • see a live preview + per-platform character budget
     • save changes back to the store
     • jump straight to publishing
   ===================================================================== */

import { store } from "../store.js";
import { recycle, suggestHashtags, TONES } from "../engine/recycle.js";
import { platformById } from "../services/platforms.js";
import { composeText } from "../services/publisher.js";
import { esc } from "./util.js";
import { toast } from "./toast.js";

const drawer = () => document.getElementById("editorDrawer");

let current = null;        // working copy of the post
let activeTone = "catchy";
let onPublishRequest = null;

export function initEditor({ onPublish }) {
  onPublishRequest = onPublish;
  drawer().addEventListener("click", (e) => {
    if (e.target.closest("[data-close-editor]")) closeEditor();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer().getAttribute("aria-hidden") === "false") closeEditor();
  });
}

export function openEditor(postId) {
  const post = store.getPost(postId);
  if (!post) return;
  current = { ...post, hashtags: [...(post.hashtags || [])] };
  activeTone = post.lastTone || "catchy";
  renderBody();
  drawer().setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

export function closeEditor() {
  drawer().setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  current = null;
}

function renderBody() {
  const plat = platformById(current.platform);
  const body = document.getElementById("editorBody");

  body.innerHTML = `
    <div class="field">
      <span class="field__label">Source · ${esc(plat?.name || current.platform)} · @${esc(current.author)}</span>
    </div>

    <div class="field">
      <label class="field__label" for="capInput">Caption</label>
      <textarea id="capInput" class="textarea">${esc(current.caption)}</textarea>
      <div class="counter" id="capCounter"></div>
    </div>

    <div class="field">
      <span class="field__label">Recycle into a vibe</span>
      <div class="tone-row" id="toneRow">
        ${TONES.map(
          (t) => `<button class="tone ${t.id === activeTone ? "is-active" : ""}" data-tone="${t.id}">${esc(t.label)}</button>`
        ).join("")}
      </div>
      <div class="recycle-actions">
        <button class="btn btn--primary btn--sm" id="recycleBtn">↻ Recycle this post</button>
        <button class="btn btn--soft btn--sm" id="rerollBtn">🎲 Re-roll variant</button>
      </div>
    </div>

    <div class="field">
      <span class="field__label">Live preview</span>
      <div class="preview" id="preview"></div>
    </div>

    <div class="field">
      <label class="field__label" for="tagsInput">Hashtags (comma or space separated)</label>
      <input id="tagsInput" class="input" value="${esc((current.hashtags || []).join(" "))}" />
      <div class="recycle-actions">
        <button class="btn btn--soft btn--sm" id="suggestTagsBtn">✨ Suggest hashtags</button>
      </div>
    </div>
  `;

  // Footer
  const foot = document.createElement("div");
  foot.className = "drawer__foot";
  foot.innerHTML = `
    <button class="btn btn--soft" id="saveBtn">Save changes</button>
    <button class="btn btn--primary" id="savePublishBtn">Save &amp; Publish →</button>
  `;
  body.appendChild(foot);

  wireBody();
  updatePreview();
  updateCounter();
}

function wireBody() {
  const cap = document.getElementById("capInput");
  const tags = document.getElementById("tagsInput");

  cap.addEventListener("input", () => {
    current.caption = cap.value;
    updatePreview();
    updateCounter();
  });
  tags.addEventListener("input", () => {
    current.hashtags = parseTags(tags.value);
    updatePreview();
    updateCounter();
  });

  document.getElementById("toneRow").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-tone]");
    if (!btn) return;
    activeTone = btn.dataset.tone;
    document.querySelectorAll("#toneRow .tone").forEach((t) =>
      t.classList.toggle("is-active", t.dataset.tone === activeTone)
    );
  });

  document.getElementById("recycleBtn").addEventListener("click", () => applyRecycle());
  document.getElementById("rerollBtn").addEventListener("click", () => applyRecycle(true));
  document.getElementById("suggestTagsBtn").addEventListener("click", suggest);
  document.getElementById("saveBtn").addEventListener("click", () => save(false));
  document.getElementById("savePublishBtn").addEventListener("click", () => save(true));
}

function parseTags(str) {
  return [...new Set(
    str.split(/[\s,]+/).map((t) => t.replace(/^#/, "").trim()).filter(Boolean)
  )];
}

function applyRecycle(reroll = false) {
  const result = recycle(current.caption, current.hashtags, activeTone);
  current.caption = result.caption;
  current.hashtags = result.hashtags;
  current.lastTone = activeTone;

  document.getElementById("capInput").value = current.caption;
  document.getElementById("tagsInput").value = current.hashtags.join(" ");
  updatePreview();
  updateCounter();
  toast(reroll ? "Spun up a fresh variant 🎲" : `Recycled into “${activeTone}” tone ↻`, "success");
}

function suggest() {
  current.hashtags = suggestHashtags(current.caption, current.hashtags, 6);
  document.getElementById("tagsInput").value = current.hashtags.join(" ");
  updatePreview();
  toast("Added suggested hashtags ✨", "info");
}

function updatePreview() {
  document.getElementById("preview").textContent = composeText({
    caption: current.caption,
    hashtags: current.hashtags,
  });
}

function updateCounter() {
  const text = composeText({ caption: current.caption, hashtags: current.hashtags });
  const len = text.length;
  // Show budget against the source platform's limit.
  const plat = platformById(current.platform);
  const limit = plat?.charLimit || 2200;
  const counter = document.getElementById("capCounter");
  const over = len > limit;
  counter.textContent = `${len.toLocaleString()} / ${limit.toLocaleString()} chars · ${plat?.name || ""}`;
  counter.classList.toggle("is-over", over);
}

function save(thenPublish) {
  store.updatePost(current.id, {
    caption: current.caption,
    hashtags: current.hashtags,
    recycled: true,
    lastTone: activeTone,
  });
  toast("Saved to library ✓", "success");
  const id = current.id;
  closeEditor();
  if (thenPublish && onPublishRequest) onPublishRequest(id);
}
