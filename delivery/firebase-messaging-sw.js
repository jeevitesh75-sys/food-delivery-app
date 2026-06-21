importScripts(
"https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"
);

importScripts(
"https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js"
);

firebase.initializeApp({

apiKey:
"AIzaSyD_AhACSdb6ddlmNWU3UNKxUSBj-0pSIA8",

authDomain:
"food-delivery-app-97300.firebaseapp.com",

projectId:
"food-delivery-app-97300",

storageBucket:
"food-delivery-app-97300.appspot.com",

messagingSenderId:
"12744604798",

appId:
"1:12744604798:web:4417d6d7f97b9b7218ec2f"

});

const messaging =
firebase.messaging();

messaging.onBackgroundMessage(
(payload)=>{

self.registration.showNotification(
payload.notification?.title || "New Order",
{
body:
payload.notification?.body || "",
icon:
"/delivery/icons/icon-192.png"
}
);

});