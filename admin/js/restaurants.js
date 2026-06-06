import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

let restaurantsData = [];

const table = document.getElementById("restaurantTable");
const totalRestaurants = document.getElementById("totalRestaurants");
const openRestaurants = document.getElementById("openRestaurants");
const closedRestaurants = document.getElementById("closedRestaurants");
const todayEarnings = document.getElementById("todayEarnings");
const lifetimeEarnings = document.getElementById("lifetimeEarnings");

function render(data){

  let html = "";

  data.forEach(r=>{

    html += `
    <tr>
      <td>
        <img
          src="${r.image || ''}"
          width="50"
          height="50">
      </td>

      <td>${r.name || "-"}</td>
      <td>${r.owner || "-"}</td>
      <td>${r.phone || "-"}</td>

      <td>
        ${r.isOpen ? "🟢 Open" : "🔴 Closed"}
      </td>

      <td>₹${r.todayEarn || 0}</td>
      <td>₹${r.totalEarn || 0}</td>

      <td>

        <button
          onclick="toggleRestaurant('${r.id}',${r.isOpen})">
          ${r.isOpen ? "Close" : "Open"}
        </button>

        <button
          onclick="deleteRestaurant('${r.id}')">
          Delete
        </button>

      </td>

    </tr>
    `;

  });

  table.innerHTML = html;

}

async function loadRestaurants(){

  try{

    const snap =
    await getDocs(
      collection(db,"restaurants")
    );

    restaurantsData = [];

    let total = 0;
    let open = 0;
    let closed = 0;
    let todayEarn = 0;
    let lifetimeEarn = 0;

    snap.forEach(docSnap=>{

      const r = {
        id: docSnap.id,
        ...docSnap.data()
      };

      restaurantsData.push(r);

      total++;

      if(r.isOpen){
        open++;
      }else{
        closed++;
      }

      todayEarn += Number(r.todayEarn || 0);
      lifetimeEarn += Number(r.totalEarn || 0);

    });

    totalRestaurants.innerText = total;
    openRestaurants.innerText = open;
    closedRestaurants.innerText = closed;

    todayEarnings.innerText =
    "₹" + todayEarn;

    lifetimeEarnings.innerText =
    "₹" + lifetimeEarn;

    render(restaurantsData);

  }catch(err){

    alert("Restaurant Error: " + err.message);
    console.log(err);

  }

}

window.toggleRestaurant = async(id,current)=>{

  await updateDoc(
    doc(db,"restaurants",id),
    {
      isOpen: !current
    }
  );

  loadRestaurants();

};

window.deleteRestaurant = async(id)=>{

  if(!confirm("Delete restaurant?")){
    return;
  }

  await deleteDoc(
    doc(db,"restaurants",id)
  );

  loadRestaurants();

};

document
.getElementById("searchRestaurant")
.addEventListener("keyup",(e)=>{

  const text =
  e.target.value.toLowerCase();

  const filtered =
  restaurantsData.filter(r=>
    (r.name || "")
    .toLowerCase()
    .includes(text)
  );

  render(filtered);

});

document
.getElementById("resetTodayBtn")
.onclick = async()=>{

  if(!confirm("Reset today earnings?")){
    return;
  }

  const snap =
  await getDocs(
    collection(db,"restaurants")
  );

  for(const d of snap.docs){

    await updateDoc(
      doc(db,"restaurants",d.id),
      {
        todayEarn:0
      }
    );

  }

  alert("Today's earnings reset successfully");

  loadRestaurants();

};

onAuthStateChanged(auth,(user)=>{

  if(!user){
    location.href = "login.html";
    return;
  }

  loadRestaurants();

});