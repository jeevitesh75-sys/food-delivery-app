import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
getFirestore,
collection,
getDocs
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const app = initializeApp({
apiKey:"AIzaSyD_AhACSdb6ddlmNWU3UNKxUSBj-0pSIA8",
authDomain:"food-delivery-app-97300.firebaseapp.com",
projectId:"food-delivery-app-97300"
});

const db = getFirestore(app);

async function loadData(){

const orders =
await getDocs(collection(db,"orders"));

document.getElementById("totalOrders").innerText =
orders.size;

const users =
await getDocs(collection(db,"users"));

document.getElementById("totalCustomers").innerText =
users.size;

const restaurants =
await getDocs(collection(db,"restaurants"));

document.getElementById("totalRestaurants").innerText =
restaurants.size;

const delivery =
await getDocs(collection(db,"deliveryPartners"));

document.getElementById("totalDelivery").innerText =
delivery.size;

}

loadData();