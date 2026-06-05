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

async function loadCustomers(){

const snap =
await getDocs(collection(db,"users"));

document.getElementById("totalCustomers")
.innerText = snap.size;

let todayCount = 0;

let today =
new Date().toDateString();

let table = "";
let growth = {};

snap.forEach(doc=>{

const user = doc.data();

table += `
<tr>
<td>${user.name || "-"}</td>
<td>${user.phone || "-"}</td>
<td>${user.email || "-"}</td>
<td>${user.address || "-"}</td>
</tr>
`;

if(user.createdAt){

let date;

if(user.createdAt.toDate){
date =
user.createdAt.toDate()
.toDateString();
}
else{
date =
new Date(user.createdAt)
.toDateString();
}

if(date === today){
todayCount++;
}

growth[date] =
(growth[date] || 0) + 1;

}

});

document.getElementById("todayCustomers")
.innerText = todayCount;

document.getElementById("customerTable")
.innerHTML = table;

let growthHtml = "";

Object.keys(growth)
.sort()
.forEach(date=>{

growthHtml += `
<p>
${date} :
<b>${growth[date]}</b> users
</p>
`;

});

if(growthHtml === ""){
growthHtml =
"No customer growth data found";
}

document.getElementById("growthData")
.innerHTML = growthHtml;

}

loadCustomers();