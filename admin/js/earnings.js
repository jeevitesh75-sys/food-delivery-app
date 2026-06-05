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

const app = initializeApp({
apiKey:"AIzaSyD_AhACSdb6ddlmNWU3UNKxUSBj-0pSIA8",
authDomain:"food-delivery-app-97300.firebaseapp.com",
projectId:"food-delivery-app-97300"
});

const db = getFirestore(app);

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
<div class="card">

<b>Customer:</b>
${o.customerName || "-"}

<br><br>

<b>Restaurant:</b>
${o.restaurantName || "-"}

<br><br>

<b>Restaurant Amount:</b>
₹${restaurantAmount}

<br><br>

<b>Markup Profit:</b>
₹${markup}

<br><br>

<b>Platform Fee:</b>
₹${platform}

<br><br>

<b>Your Profit:</b>
₹${adminProfit}
<br><br>

<b>Platform Fee:</b>
₹${platform}

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
.innerHTML = html;
}

document.getElementById("resetBtn")
.onclick = async()=>{

alert("RESET CLICKED");

await updateDoc(
  doc(db,"settings","appConfig"),
  {
    todayProfitReset: Date.now()
  }
);

alert("FIRESTORE UPDATED");

loadEarnings();
};
loadEarnings();