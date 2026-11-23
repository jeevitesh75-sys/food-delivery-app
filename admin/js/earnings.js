import { app } from "./fb.js";
alert("NEW EARNINGS.JS LOADED");
import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
getFirestore,
collection,
getDocs,
doc,
updateDoc,
getDoc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
getAuth,
onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


const db = getFirestore(app);
const auth = getAuth(app);
async function loadEarnings(){

const snap =
await getDocs(collection(db,"orders"));
const settingsSnap =
await getDoc(
  doc(db,"settings","appConfig")
);

const resetTime =
settingsSnap.data()?.todayProfitReset || 0;

let todayEarn = 0;
let totalEarn = 0;
let platformEarn = 0;
let delivered = 0;

let html = "";

const today =
new Date().toDateString();

snap.forEach(docSnap=>{

const o = docSnap.data();

if(o.status !== "Delivered"){
return;
}

delivered++;

const restaurantAmount =
Number(o.subtotal || 0);

const customerAmount =
Number(o.customerSubtotal || 0);

const platform =
Number(o.platformFee || 0);

const markup =
customerAmount - restaurantAmount;

const adminProfit =
markup + platform;

totalEarn += adminProfit;
platformEarn += platform;

if(o.deliveredAt){

const d =
new Date(o.deliveredAt)
.toDateString();

if(
  d === today &&
  o.deliveredAt > resetTime
){
  todayEarn += adminProfit;
}
}

html += `
<div class="item">
  <div class="item-top">
    <div>
      <div class="item-title">${o.customerName || "-"}</div>
      <div class="item-sub">${o.restaurantName || "-"}</div>
    </div>
    <span class="pill green">Delivered</span>
  </div>
  <div class="kv"><span>Restaurant amount</span><b>₹${restaurantAmount}</b></div>
  <div class="kv"><span>Markup profit</span><b>₹${markup}</b></div>
  <div class="kv"><span>Platform fee</span><b>₹${platform}</b></div>
  <div class="kv total"><span>Your profit</span><b>₹${adminProfit}</b></div>
</div>
`;
});

document.getElementById("todayEarn")
.innerText = "₹" + todayEarn;

document.getElementById("totalEarn")
.innerText = "₹" + totalEarn;

document.getElementById("platformEarn")
.innerText = "₹" + platformEarn;

document.getElementById("deliveredOrders")
.innerText = delivered;

document.getElementById("earningsList")
.innerHTML = html || '<div class="empty">No delivered orders yet</div>';
}

document.getElementById("resetBtn")
.onclick = async()=>{

await updateDoc(
  doc(db,"settings","appConfig"),
  {
    todayProfitReset: Date.now()
  }
);

alert("Today's earnings reset ✅");

loadEarnings();
};
onAuthStateChanged(auth,(user)=>{

  if(!user){
    location.href = "login.html";
    return;
  }

  loadEarnings();

});