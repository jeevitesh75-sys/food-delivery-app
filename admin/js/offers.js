import { auth } from "./fb.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const API = "/api/sendOffer";
const $ = (id) => document.getElementById(id);
const titleEl = $("offerTitle"), bodyEl = $("offerBody"), sendBtn = $("sendBtn"), notice = $("offerNotice");

function show(msg, ok) {
  notice.textContent = msg;
  notice.className = "notice show " + (ok ? "ok" : "err");
  notice.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

function refreshPreview() {
  $("pvTitle").textContent = titleEl.value.trim() || "Your offer title";
  $("pvBody").textContent = bodyEl.value.trim() || "Your message appears here.";
  $("titleCount").textContent = titleEl.value.length + "/50";
  $("bodyCount").textContent = bodyEl.value.length + "/150";
}
titleEl.addEventListener("input", refreshPreview);
bodyEl.addEventListener("input", refreshPreview);
document.querySelectorAll(".chip").forEach((c) => c.addEventListener("click", () => {
  titleEl.value = c.dataset.t; bodyEl.value = c.dataset.b; refreshPreview();
}));

async function call(method, payload) {
  const user = auth.currentUser;
  if (!user) throw new Error("Please log in again");
  const token = await user.getIdToken();
  const res = await fetch(API, {
    method,
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: method === "POST" ? JSON.stringify(payload) : undefined
  });
  let data = {};
  try { data = await res.json(); } catch (e) {}
  if (!res.ok) throw new Error(data.error || ("Request failed (" + res.status + ")"));
  return data;
}

async function loadHistory() {
  const box = $("history");
  try {
    const data = await call("GET");
    const list = data.offers || [];
    if (!list.length) { box.innerHTML = '<div class="empty">No offers sent yet</div>'; return; }
    box.innerHTML = list.map((o) => {
      const when = o.sentAt ? new Date(o.sentAt).toLocaleString() : "";
      return `<div class="history-item"><b>${esc(o.title)}</b><p>${esc(o.body)}</p><small>${esc(when)} · delivered to ${esc(o.delivered)} of ${esc(o.devices)} devices</small></div>`;
    }).join("");
  } catch (e) {
    box.innerHTML = '<div class="empty">Could not load history</div>';
  }
}

sendBtn.addEventListener("click", async () => {
  const title = titleEl.value.trim(), body = bodyEl.value.trim();
  if (!title || !body) { show("Please enter both a title and a message.", false); return; }
  if (!confirm("Send this notification to ALL customers now?\n\n" + title + "\n" + body)) return;

  sendBtn.disabled = true; sendBtn.textContent = "Sending...";
  notice.className = "notice";
  try {
    const r = await call("POST", { title, body });
    if (!r.devices) show("No customer phones are registered for notifications yet. Customers get registered when they log in to the Eluru Foods app.", false);
    else show("Sent ✅ Delivered to " + r.delivered + " of " + r.devices + " customer phones.", true);
    titleEl.value = ""; bodyEl.value = ""; refreshPreview();
    loadHistory();
  } catch (e) {
    show("Could not send: " + e.message, false);
  }
  sendBtn.disabled = false; sendBtn.textContent = "Send to all customers";
});

refreshPreview();
onAuthStateChanged(auth, (user) => {
  if (!user) { location.href = "login.html"; return; }
  loadHistory();
});
