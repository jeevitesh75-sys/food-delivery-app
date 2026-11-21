const API_URL = "http://192.168.55.109:5000";

// =========================
// CART STORAGE
// =========================

let cart = JSON.parse(localStorage.getItem("cart")) || [];

// =========================
// ADD TO CART
// =========================

function addToCart(name, price, image) {

  let existingItem = cart.find(item => item.name === name);

  if (existingItem) {
    existingItem.qty += 1;
  } else {
    cart.push({
      name: name,
      price: price,
      image: image,
      qty: 1
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));

  alert("Item added to cart ✅");

  updateCartCount();
}

// =========================
// UPDATE CART COUNT
// =========================

function updateCartCount() {

  let count = cart.reduce(
    (total, item) => total + item.qty,
    0
  );

  let cartNav = document.querySelectorAll(".nav-item");

  cartNav.forEach(el => {
    if (el.innerText.includes("Cart")) {
      el.innerHTML = `🛒<br>Cart (${count})`;
    }
  });
}

// =========================
// LOAD CART PAGE
// =========================

function loadCart() {

  let container = document.querySelector(".cart-container");

  if (!container) return;

  container.innerHTML = "";

  let total = 0;

  cart.forEach((item, index) => {

    total += item.price * item.qty;

    container.innerHTML += `
      <div class="cart-card">
        <div class="food-left">
          <img class="food-image" src="${item.image}">
          <div>
            <div class="food-name">${item.name}</div>
            <div class="food-price">₹${item.price}</div>

            <div class="quantity-box">
              <button onclick="decreaseQty(${index})" class="qty-btn">-</button>
              <span>${item.qty}</span>
              <button onclick="increaseQty(${index})" class="qty-btn">+</button>
            </div>

          </div>
        </div>
      </div>
    `;
  });

  let summary = document.querySelector(".summary");

  if (summary) {
    summary.innerHTML = `
      <div class="summary-row">
        <span>Item Total</span>
        <span>₹${total}</span>
      </div>

      <div class="summary-row">
        <span>Delivery Fee</span>
        <span>₹20</span>
      </div>

      <div class="summary-row total">
        <span>Total</span>
        <span>₹${total + 20}</span>
      </div>
    `;
  }
}

// =========================
// INCREASE QTY
// =========================

function increaseQty(index) {
  cart[index].qty += 1;
  localStorage.setItem("cart", JSON.stringify(cart));
  loadCart();
  updateCartCount();
}

// =========================
// DECREASE QTY
// =========================

function decreaseQty(index) {

  cart[index].qty -= 1;

  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }

  localStorage.setItem("cart", JSON.stringify(cart));

  loadCart();
  updateCartCount();
}

// =========================
// LOAD RESTAURANTS
// =========================

async function loadRestaurants() {

  try {

    const res = await fetch(`${API_URL}/restaurants`);
    const data = await res.json();

    let container = document.querySelector(".restaurants");

    if (!container) return;

    container.innerHTML = `
      <div class="section-title">
        Popular Restaurants
      </div>
    `;

    data.forEach(r => {

      container.innerHTML += `
      <a href="restaurant.html?id=${r.id}">
        <div class="card">
          <img src="${r.image || 'images/banner.jpg'}">

          <div class="card-content">
            <div class="restaurant-name">${r.name}</div>
            <div class="details">⭐ ${r.rating} • ${r.time}</div>
          </div>
        </div>
      </a>
      `;
    });

  } catch (err) {
    console.log("Error loading restaurants", err);
  }
}

// =========================
// ✅ LOAD MENU FROM BACKEND (NEW)
// =========================

async function loadMenu() {

  let container = document.getElementById("menuContainer");

  if (!container) return;

  try {

    // GET ID FROM URL
    const params = new URLSearchParams(window.location.search);
    const restaurantId = params.get("id") || 1;

    const res = await fetch(`${API_URL}/restaurants/${restaurantId}/menu`);
    const menu = await res.json();

    container.innerHTML = "";

    if (menu.length === 0) {
      container.innerHTML = `
        <div class="food-card">
          <div class="food-info">
            <div class="food-name">No Food Available</div>
          </div>
        </div>
      `;
      return;
    }

    menu.forEach(food => {

      container.innerHTML += `
      <div class="food-card">

        <div class="food-info">
          <div class="food-name">${food.name}</div>
          <div class="food-price">₹${food.price}</div>
          <div class="food-desc">${food.desc || "Tasty food 🍴"}</div>

          <button class="add-btn"
          onclick="addToCart('${food.name}', ${food.price}, '${food.image}')">
          Add
          </button>
        </div>

        <img class="food-image" src="${food.image}">
      </div>
      `;
    });

  } catch (err) {
    console.log("Error loading menu", err);
  }
}

// =========================
// PAGE LOAD
// =========================

document.addEventListener("DOMContentLoaded", () => {

  updateCartCount();

  loadCart();

  loadRestaurants();

  loadMenu(); // ✅ NEW
});
// =========================
// PLACE ORDER (BACKEND)
// =========================

async function placeOrder() {

  if (cart.length === 0) {
    alert("Cart is empty ❌");
    return;
  }

  let total = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  try {

    const res = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        items: cart,
        total: total
      })
    });

    const data = await res.json();

    alert("Order placed successfully 🎉");

    // CLEAR CART
    cart = [];
    localStorage.removeItem("cart");

    // GO TO TRACKING PAGE
    window.location.href = "tracking.html";

  } catch (err) {
    console.log("Order error:", err);
    alert("Failed to place order ❌");
  }
}