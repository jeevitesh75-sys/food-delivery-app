import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const app = initializeApp({
  apiKey:"AIzaSyD_AhACSdb6ddlmNWU3UNKxUSBj-0pSIA8",
  authDomain:"food-delivery-app-97300.firebaseapp.com",
  projectId:"food-delivery-app-97300"
});

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

  data.forEach(r => {

    html += `
    <tr>
      <td><img src="${r.image || ''}" width="50" height="50"></td>
      <td>${r.name || "-"}</td>
      <td>${r.owner || "-"}</td>
      <td>${r.phone || "-"}</td>
      <td>${r.isOpen ? "🟢 Open" : "🔴 Closed"}</td>
      <td>₹${r.todayEarn || 0}</td>
      <td>₹${r.totalEarn || 0}</td>
      <td>
        <button onclick="toggleRestaurant('${r.id}',${r.isOpen})">
          ${r.isOpen ? "Close" : "Open"}
        </button>

        <button onclick="deleteRestaurant('${r.id}')">
          Delete
        </button>
      </td>
    </tr>
    `;
  });

  table.innerHTML = html;
}

window.toggleRestaurant = async(id,current)=>{

  await updateDoc(
    doc(db,"restaurants",id),
    {
      isOpen: !current
    }
  );
};

window.deleteRestaurant = async(id)=>{

  if(!confirm("Delete restaurant?")){
    return;
  }

  await deleteDoc(
    doc(db,"restaurants",id)
  );
};

document.getElementById("searchRestaurant")
.addEventListener("keyup",(e)=>{

  const text = e.target.value.toLowerCase();

  const filtered = restaurantsData.filter(r =>
    (r.name || "").toLowerCase().includes(text)
  );

  render(filtered);
});

document.getElementById("resetTodayBtn")
.onclick = async()=>{

  if(!confirm("Reset today earnings?")){
    return;
  }

  const docs = await getDocs(
    collection(db,"restaurants")
  );

  for(const d of docs.docs){

    await updateDoc(
      doc(db,"restaurants",d.id),
      {
        todayEarn:0
      }
    );
  }

  alert("Today's earnings reset successfully");
};

onAuthStateChanged(auth,(user)=>{

  if(!user){
    location.href = "login.html";
    return;
  }

  onSnapshot(
    collection(db,"restaurants"),
    (snapshot)=>{

      restaurantsData = [];

      let total = 0;
      let open = 0;
      let closed = 0;
      let todayEarn = 0;
      let lifetimeEarn = 0;

      snapshot.forEach((d)=>{

        const r = {
          id:d.id,
          ...d.data()
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
      todayEarnings.innerText = "₹" + todayEarn;
      lifetimeEarnings.innerText = "₹" + lifetimeEarn;

      render(restaurantsData);

    },
    (error)=>{
      alert(error.message);
    }
  );
});