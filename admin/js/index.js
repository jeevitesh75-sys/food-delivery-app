alert("index.js loaded");
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
async function loadData(){

try{

  const orders = await getDocs(collection(db,"orders"));
  document.getElementById("totalOrders").innerText = orders.size;

  const users = await getDocs(collection(db,"users"));
  document.getElementById("totalCustomers").innerText = users.size;

  const restaurants = await getDocs(collection(db,"restaurants"));
  document.getElementById("totalRestaurants").innerText = restaurants.size;

  const delivery = await getDocs(collection(db,"deliveryPartners"));
  document.getElementById("totalDelivery").innerText = delivery.size;

}catch(err){

  alert(err.message);

}

}

onAuthStateChanged(auth,(user)=>{

  if(!user){
    location.href = "login.html";
    return;
  }

  loadData().catch(err=>{
  alert(err.message);
});

});
