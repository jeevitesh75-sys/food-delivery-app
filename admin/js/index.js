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

const firebaseConfig = {
  apiKey: "AIzaSyD_AhACSdb6ddlmNWU3UNKxUSBj-0pSIA8",
  authDomain: "food-delivery-app-97300.firebaseapp.com",
  projectId: "food-delivery-app-97300",
  storageBucket: "food-delivery-app-97300.firebasestorage.app",
  messagingSenderId: "12744604798",
  appId: "1:12744604798:web:4417d6d7f97b9b7218ec2f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function loadData(){

  try{

    const ordersSnap =
    await getDocs(collection(db,"orders"));

    document.getElementById("totalOrders").innerText =
    ordersSnap.size;

    const usersSnap =
    await getDocs(collection(db,"users"));

    document.getElementById("totalCustomers").innerText =
    usersSnap.size;

    const restaurantsSnap =
    await getDocs(collection(db,"restaurants"));

    document.getElementById("totalRestaurants").innerText =
    restaurantsSnap.size;

    const deliverySnap =
    await getDocs(collection(db,"deliveryPartners"));

    document.getElementById("totalDelivery").innerText =
    deliverySnap.size;

  }catch(err){

    alert("Dashboard Error: " + err.message);
    console.log(err);

  }

}

onAuthStateChanged(auth, async(user)=>{

  if(!user){
    location.href = "login.html";
    return;
  }

  await loadData();

});