// One shared Firebase app for every admin page.
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export const app = getApps()[0] || initializeApp({
  apiKey: "AIzaSyD_AhACSdb6ddlmNWU3UNKxUSBj-0pSIA8",
  authDomain: "food-delivery-app-97300.firebaseapp.com",
  projectId: "food-delivery-app-97300",
  storageBucket: "food-delivery-app-97300.firebasestorage.app",
  messagingSenderId: "12744604798",
  appId: "1:12744604798:web:4417d6d7f97b9b7218ec2f"
});
export const auth = getAuth(app);

window.logout = async function () {
  try { await signOut(auth); } catch (e) {}
  location.href = "login.html";
};
