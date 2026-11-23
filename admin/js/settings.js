import { app } from "./fb.js";


import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
getFirestore,
doc,
getDoc,
setDoc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
getAuth,
onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


const db = getFirestore(app);
const auth = getAuth(app);
const settingsRef =
doc(db,"settings","appConfig");

async function loadSettings(){

  const snap =
  await getDoc(settingsRef);

  if(!snap.exists()){

    await setDoc(settingsRef,{
  foodMarkup:20,
  platformFee:3,

  fee0to3:30,
  fee3to7:50,
  fee7to10:70,
  fee10plus:100,

  todayProfitReset:0
});

    return loadSettings();
  }

  const data = snap.data();

  document.getElementById("foodMarkup").value =
  data.foodMarkup || 20;

  document.getElementById("platformFee").value =
  data.platformFee || 3;

  document.getElementById("fee0to3").value =
  data.fee0to3 || 30;

  document.getElementById("fee3to7").value =
  data.fee3to7 || 50;

  document.getElementById("fee7to10").value =
  data.fee7to10 || 70;

  document.getElementById("fee10plus").value =
  data.fee10plus || 100;
}

window.saveSettings = async()=>{

  await setDoc(settingsRef,{

    foodMarkup:Number(
      document.getElementById("foodMarkup").value
    ),

    platformFee:Number(
      document.getElementById("platformFee").value
    ),

    fee0to3:Number(
      document.getElementById("fee0to3").value
    ),

    fee3to7:Number(
      document.getElementById("fee3to7").value
    ),

    fee7to10:Number(
      document.getElementById("fee7to10").value
    ),

    fee10plus:Number(
      document.getElementById("fee10plus").value
    )

  });

  alert("Settings Saved ✅");
};

onAuthStateChanged(auth,(user)=>{

  if(!user){
    location.href = "login.html";
    return;
  }

  loadSettings();

});

