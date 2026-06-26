/* =====================================================================
   connect.js — "Log in & connect account" flow.

   Opens a modal that mimics a platform's OAuth consent screen:
     1. LOGIN   — enter your account identifier (+ password field) and
                  review the permissions OliExplore is requesting.
     2. CONNECTING — simulated OAuth handshake/redirect.
     3. SUCCESS — account is linked and saved to the store.

   IMPORTANT: This is a front-end simulation so the workflow is fully
   demoable offline. No credentials are transmitted or stored — the
   password field is read and immediately discarded. To make this real,
   replace startHandshake() with a redirect to the platform's OAuth
   authorize URL and complete the token exchange on a backend.
   ===================================================================== */

import { store } from "../store.js";
import { platformById, usesAtHandle } from "../services/platforms.js";
import { esc } from "./util.js";
import { toast } from "./toast.js";

const modal = () => document.getElementById("connectModal");

let currentId = null;

export function initConnect() {
  modal().addEventListener("click", (e) => {
    if (e.target.closest("[data-close-connect]")) closeConnect();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal().getAttribute("aria-hidden") === "false") closeConnect();
  });
}

export function openConnect(platformId) {
  const p = platformById(platformId);
  if (!p) return;
  currentId = platformId;
  document.getElementById("connectTitle").textContent = `Connect ${p.name}`;
  renderLogin(p);
  modal().setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

export function closeConnect() {
  modal().setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  currentId = null;
}

/* ---------- Step 1: login + consent ---------- */

function renderLogin(p) {
  const body = document.getElementById("connectBody");
  body.innerHTML = `
    <div class="auth">
      <div class="auth-brand">
        <div class="auth-brand__icon">${esc(p.glyph)}</div>
        <div>
          <div class="auth-brand__title">Continue to ${esc(p.name)}</div>
          <div class="auth-brand__sub">OliExplore wants to access your ${esc(p.name)} account</div>
        </div>
      </div>

      <form id="authForm" novalidate>
        <div class="field">
          <label class="field__label" for="authUser">${esc(p.auth.loginLabel)}</label>
          <input id="authUser" class="input" type="text"
                 placeholder="${esc(p.auth.loginPlaceholder)}" autocomplete="off" required />
        </div>
        <div class="field">
          <label class="field__label" for="authPass">Password</label>
          <input id="authPass" class="input" type="password" placeholder="••••••••" autocomplete="off" />
        </div>

        <ul class="scopes">
          <li class="scopes__head">OliExplore will be able to:</li>
          ${p.auth.scopes.map((s) => `<li><span class="check">✓</span> ${esc(s)}</li>`).join("")}
        </ul>

        <p class="auth-note">
          Demo authorization — your credentials are not sent anywhere or stored.
          This simulates the real OAuth consent screen.
        </p>

        <div class="modal__foot" style="margin:18px -22px -22px;">
          <button type="button" class="btn btn--soft btn--block" data-close-connect>Cancel</button>
          <button type="submit" class="btn btn--primary btn--block" id="authSubmit">Authorize &amp; Connect</button>
        </div>
      </form>
    </div>
  `;

  const form = document.getElementById("authForm");
  const userInput = document.getElementById("authUser");
  userInput.focus();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const raw = userInput.value.trim();
    if (!raw) {
      userInput.focus();
      toast("Enter your account to continue.", "error");
      return;
    }
    // Read and immediately discard the password — never stored.
    document.getElementById("authPass").value = "";
    startHandshake(p, raw);
  });
}

/* ---------- Step 2: simulated OAuth handshake ---------- */

function startHandshake(p, raw) {
  const body = document.getElementById("connectBody");
  body.innerHTML = `
    <div class="auth-center">
      <div class="spinner"></div>
      <div class="auth-brand__title">Connecting to ${esc(p.name)}…</div>
      <p class="auth-brand__sub">Authorizing OliExplore and exchanging access tokens.</p>
    </div>
  `;

  setTimeout(() => {
    const handle = formatHandle(p.id, raw);
    store.connectAccount(p.id, { handle, displayName: handle });
    renderSuccess(p, handle);
    toast(`${p.name} connected ✓`, "success");
  }, 1200);
}

/* ---------- Step 3: success ---------- */

function renderSuccess(p, handle) {
  const body = document.getElementById("connectBody");
  body.innerHTML = `
    <div class="auth-center">
      <div class="auth-check">✓</div>
      <div class="auth-brand__title">${esc(p.name)} connected</div>
      <p class="auth-brand__sub">Signed in as ${esc(handle)}. You can now collect and publish.</p>
      <div class="modal__foot" style="margin:20px -22px -22px;">
        <button class="btn btn--primary btn--block" data-close-connect>Done</button>
      </div>
    </div>
  `;
}

/* Normalize the typed identifier into a display handle. */
function formatHandle(platformId, raw) {
  let h = raw.replace(/^@+/, "").trim();
  // For email-style inputs, keep just the local part for a cleaner handle.
  if (h.includes("@") && h.includes(".")) h = h.split("@")[0];
  return usesAtHandle(platformId) ? `@${h}` : raw;
}
