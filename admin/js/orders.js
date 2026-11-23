import { app } from "./fb.js";
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



const db = getFirestore(app);
const auth = getAuth(app);
async function loadOrders(){

  const snap = await getDocs(collection(db,"orders"));

  let total = 0, today = 0, delivered = 0;
  const rows = [];
  const todayDate = new Date().toDateString();

  const pill = (st)=>{
    const c = st==="Delivered" ? "green" : (st==="Rejected" ? "red" : (st==="Pending" ? "orange" : "blue"));
    return `<span class="pill ${c}">${st || "-"}</span>`;
  };

  snap.forEach(d=>{
    const o = d.data();
    total++;
    if(o.status === "Delivered") delivered++;

    let t = 0;
    if(o.createdAt?.toDate){
      const dt = o.createdAt.toDate();
      t = dt.getTime();
      if(dt.toDateString() === todayDate) today++;
    }

    rows.push({ t, html: `
      <div class="item">
        <div class="item-top">
          <div>
            <div class="item-title">${o.customerName || "-"}</div>
            <div class="item-sub">${o.restaurantName || "-"}</div>
          </div>
          ${pill(o.status)}
        </div>
        <div class="kv total"><span>Total</span><b>₹${o.total || 0}</b></div>
      </div>` });
  });

  rows.sort((a,b)=>b.t-a.t);

  document.getElementById("totalOrders").innerText = total;
  document.getElementById("todayOrders").innerText = today;
  document.getElementById("deliveredOrders").innerText = delivered;

  document.getElementById("ordersList").innerHTML =
    rows.length ? rows.map(r=>r.html).join("") : '<div class="empty">No orders yet</div>';
}

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

