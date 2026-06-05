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
async function loadOrders(){

const snap =
await getDocs(collection(db,"orders"));

let total = 0;
let today = 0;
let delivered = 0;

let html = "";

const todayDate =
new Date().toDateString();

snap.forEach(doc=>{

const o = doc.data();

total++;

if(o.status === "Delivered"){
delivered++;
}

if(o.createdAt?.toDate){

const orderDate =
o.createdAt.toDate().toDateString();

if(orderDate === todayDate){
today++;
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

<b>Total:</b>
₹${o.total || 0}

<br><br>

<b>Status:</b>
${o.status || "-"}

</div>

`;

});

document.getElementById("totalOrders").innerText = total;
document.getElementById("todayOrders").innerText = today;
document.getElementById("deliveredOrders").innerText = delivered;


document.getElementById("ordersList").innerHTML = html;

} // <-- close loadOrders()

window.resetTodayOrders = ()=>{

localStorage.setItem(
"todayOrdersResetDate",
new Date().toDateString()
);

alert("Today's orders counter reset ✅");
};

onAuthStateChanged(auth, (user)=>{

  if(!user){
    location.href = "login.html";
    return;
  }

  loadOrders();

});

