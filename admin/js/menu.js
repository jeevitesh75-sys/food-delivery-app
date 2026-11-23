import { app } from "./fb.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, query, where, getDocs,
  addDoc, updateDoc, deleteDoc, doc, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


const db = getFirestore(app);
const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
  if (!user) {
    location.href = "login.html";
    return;
  }
  loadRestaurants();
});

const listEl = document.getElementById("restaurantList");
let editingFoodId = null;
let currentRestaurantId = null;
let menuUnsubscribers = {};

// ── LOAD ALL RESTAURANTS ──
async function loadRestaurants() {
  const snap = await getDocs(collection(db, "restaurants"));
  if (snap.empty) {
    listEl.innerHTML = `<div class="empty-state">No restaurants found</div>`;
    return;
  }

  listEl.innerHTML = "";
  snap.forEach(docSnap => {
    const r = docSnap.data();
    const restId = docSnap.id;

    const row = document.createElement("div");
    row.className = "rest-row";
    row.innerHTML = `
      <div>
        <div class="rest-name">${r.name || "Unnamed Restaurant"}</div>
        <div class="rest-meta">${r.address || r.phone || restId}</div>
      </div>
      <div class="chevron" id="chev-${restId}">›</div>
    `;

    const panel = document.createElement("div");
    panel.className = "menu-panel";
    panel.id = "panel-" + restId;
    panel.innerHTML = `
      <div class="rest-img-row">
        <img id="restimg-preview-${restId}" class="rest-img-preview" src="${r.image || 'https://via.placeholder.com/60'}" onerror="this.src='https://via.placeholder.com/60'">
        <input id="restimg-${restId}" placeholder="Restaurant image URL" value="${r.image || ''}">
        <button onclick="window.updateRestaurantImage('${restId}')">Update Image</button>
      </div>

      <div class="add-food-row">
        <input id="fname-${restId}" placeholder="Food name">
        <input id="fprice-${restId}" placeholder="Price" type="number">
        <input id="fimg-${restId}" placeholder="Image URL">
        <button onclick="window.addFood('${restId}')">Add</button>
      </div>
      <div id="foodlist-${restId}">
        <div class="loading-state">Loading menu...</div>
      </div>
    `;

    row.onclick = () => togglePanel(restId);

    listEl.appendChild(row);
    listEl.appendChild(panel);
  });
}

function togglePanel(restId) {
  const panel = document.getElementById("panel-" + restId);
  const chev = document.getElementById("chev-" + restId);
  const isOpen = panel.classList.contains("show");

  // close all other panels
  document.querySelectorAll(".menu-panel.show").forEach(p => p.classList.remove("show"));
  document.querySelectorAll(".chevron.open").forEach(c => c.classList.remove("open"));

  if (!isOpen) {
    panel.classList.add("show");
    chev.classList.add("open");
    listenToMenu(restId);
  }
}

function listenToMenu(restId) {
  if (menuUnsubscribers[restId]) return; // already listening

  const q = query(collection(db, "menu"), where("restaurantId", "==", restId));
  menuUnsubscribers[restId] = onSnapshot(q, snap => {
    const foodListEl = document.getElementById("foodlist-" + restId);
    if (!foodListEl) return;

    if (snap.empty) {
      foodListEl.innerHTML = `<div class="empty-state">No food items yet</div>`;
      return;
    }

    let html = "";
    snap.forEach(docSnap => {
      const f = docSnap.data();
      const id = docSnap.id;
      html += `
        <div class="food-item">
          <div class="food-left">
            <img class="food-img" src="${f.image || 'https://via.placeholder.com/42'}" onerror="this.src='https://via.placeholder.com/42'">
            <div>
              <div class="food-name">${f.name}</div>
              <div class="food-price">₹${f.price}</div>
              <div class="food-status ${f.enabled ? 'status-on' : 'status-off'}">${f.enabled ? 'Enabled' : 'Disabled'}</div>
            </div>
          </div>
          <div class="food-actions">
            <button class="${f.enabled ? 'btn-toggle-on' : 'btn-toggle-off'}" onclick="window.toggleFood('${id}', ${f.enabled})">${f.enabled ? 'Disable' : 'Enable'}</button>
            <button class="btn-edit" onclick="window.openEdit('${id}', '${(f.name||'').replace(/'/g,"\\'")}', ${f.price}, '${(f.image||'').replace(/'/g,"\\'")}')">Edit</button>
            <button class="btn-delete" onclick="window.deleteFood('${id}')">Delete</button>
          </div>
        </div>
      `;
    });
    foodListEl.innerHTML = html;
  });
}

// ── UPDATE RESTAURANT IMAGE ──
window.updateRestaurantImage = async (restId) => {
  const newImg = document.getElementById(`restimg-${restId}`).value.trim();
  if (!newImg) { alert("Enter an image URL first"); return; }

  await updateDoc(doc(db, "restaurants", restId), { image: newImg });
  document.getElementById(`restimg-preview-${restId}`).src = newImg;
  alert("Restaurant image updated!");
};

// ── ADD FOOD ──
window.addFood = async (restId) => {
  const name = document.getElementById(`fname-${restId}`).value.trim();
  const price = document.getElementById(`fprice-${restId}`).value.trim();
  const image = document.getElementById(`fimg-${restId}`).value.trim();

  if (!name || !price) { alert("Enter food name and price"); return; }

  await addDoc(collection(db, "menu"), {
    name, price: Number(price), image, restaurantId: restId, enabled: true
  });

  document.getElementById(`fname-${restId}`).value = "";
  document.getElementById(`fprice-${restId}`).value = "";
  document.getElementById(`fimg-${restId}`).value = "";
};

// ── TOGGLE ENABLE/DISABLE ──
window.toggleFood = async (id, current) => {
  await updateDoc(doc(db, "menu", id), { enabled: !current });
};

// ── DELETE ──
window.deleteFood = async (id) => {
  if (!confirm("Delete this food item?")) return;
  await deleteDoc(doc(db, "menu", id));
};

// ── EDIT ──
window.openEdit = (id, name, price, image) => {
  editingFoodId = id;
  document.getElementById("editName").value = name;
  document.getElementById("editPrice").value = price;
  document.getElementById("editImage").value = image;
  document.getElementById("editModal").classList.add("show");
};

window.closeEdit = () => {
  document.getElementById("editModal").classList.remove("show");
  editingFoodId = null;
};

window.saveEdit = async () => {
  if (!editingFoodId) return;
  await updateDoc(doc(db, "menu", editingFoodId), {
    name: document.getElementById("editName").value.trim(),
    price: Number(document.getElementById("editPrice").value),
    image: document.getElementById("editImage").value.trim()
  });
  window.closeEdit();
};
