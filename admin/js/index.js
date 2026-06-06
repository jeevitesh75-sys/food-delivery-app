import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const app = initializeApp({
  apiKey:"AIzaSyD_AhACSdb6ddlmNWU3UNKxUSBj-0pSIA8",
  authDomain:"food-delivery-app-97300.firebaseapp.com",
  projectId:"food-delivery-app-97300"
});

const db = getFirestore(app);
const auth = getAuth(app);
console.log("index.js loaded");
onAuthStateChanged(auth, async(user)=>{

  console.log("User:", user);

  if(!user){
    location.href = "login.html";
    return;
  }

  try{
    loadData();
  }
  catch(err){
    console.error(err);
  }

});
async function loadData(){

  try{

    const orders =
    await getDocs(collection(db,"orders"));
    console.log("orders", orders.size);

    const users =
    await getDocs(collection(db,"users"));
    console.log("users", users.size);

    const restaurants =
    await getDocs(collection(db,"restaurants"));
    console.log("restaurants", restaurants.size);

    const delivery =
    await getDocs(collection(db,"deliveryPartners"));
    console.log("delivery", delivery.size);

    document.getElementById("totalOrders").innerText =
    orders.size;

    document.getElementById("totalCustomers").innerText =
    users.size;

    document.getElementById("totalRestaurants").innerText =
    restaurants.size;

    document.getElementById("totalDelivery").innerText =
    delivery.size;

  }catch(err){
    console.error("Firestore Error:", err);
  }

}