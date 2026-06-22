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
// UPDATE CART COUNT (HOME / RESTAURANT)
// =========================
function updateCartCount() {
  let count = cart.reduce((total, item) => total + item.qty, 0);

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
}

// =========================
// INIT ON PAGE LOAD
// =========================
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  loadCart();
});
async function loadRestaurants() {
  try {
    const res = await
    fetch('http://192.168.55.105:5000/restaurants')

    const data = await res.json();

    console.log(data);

    let container = document.querySelector(".restaurants");
    if (!container) return;

    container.innerHTML = "<h2>Popular Restaurants</h2>";

    data.forEach(r => {
      container.innerHTML += `
        <div class="card">
          <div class="card-content">
            <div class="restaurant-name">${r.name}</div>
            <div class="details">⭐ ${r.rating} • ${r.time}</div>
          </div>
        </div>
      `;
    });

  } catch (err) {
    console.log("Error loading restaurants", err);
  }
}

document.addEventListener("DOMContentLoaded", loadRestaurants);
