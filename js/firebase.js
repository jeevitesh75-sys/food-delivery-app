import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

export { db };