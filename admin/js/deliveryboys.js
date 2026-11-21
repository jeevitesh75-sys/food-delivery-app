alert("deliveryboys.js loaded");
import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc
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



async function loadDeliveryBoys(){

  const snap =
  await getDocs(
    collection(db,"deliveryPartners")
  );

  let totalBoys = 0;
  let onlineBoys = 0;
  let todayEarn = 0;
let totalEarn = 0;
let todayCollection = 0;

  let html = "";

  snap.forEach(docSnap=>{

  totalBoys++;

  const d = docSnap.data();

  if(d.online){
    onlineBoys++;
  }

  todayEarn += d.todayEarn || 0;
  totalEarn += d.totalEarn || 0;
  todayCollection += Number(d.todayCollection || 0);

  html += `
  <tr>
    <td>${d.name || "-"}</td>
    <td>${d.phone || "-"}</td>
    <td>${d.online ? "🟢" : "🔴"}</td>
    <td>₹${d.todayEarn || 0}</td>
    <td>₹${d.totalEarn || 0}</td>
    <td>₹${d.todayCollection || 0}</td>
  </tr>
  `;
});

  document.getElementById("totalBoys").innerText =
  totalBoys;

  document.getElementById("onlineBoys").innerText =
  onlineBoys;

  document.getElementById("todayEarn").innerText =
  todayEarn;

  document.getElementById("totalEarn").innerText =
  totalEarn;
  document.getElementById("todayCollection").innerText =
todayCollection;
  document.getElementById("deliveryTable").innerHTML =
  html;
}

document.getElementById("resetBtn")
.addEventListener("click", async()=>{

  const snap =
  await getDocs(
    collection(db,"deliveryPartners")
  );

  for(const d of snap.docs){

    await updateDoc(
  doc(db,"deliveryPartners",d.id),
  {
    todayEarn:0,
    todayCollection:0
  }
);
  }

  alert("Today's Earnings Reset ✅");

  loadDeliveryBoys();
});

onAuthStateChanged(auth,(user)=>{

  if(!user){
    location.href = "login.html";
    return;
  }

  loadDeliveryBoys();

});
