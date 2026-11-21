// ── DELIVERY sw.js — Webpushr ──
importScripts("https://cdn.webpushr.com/sw.min.js");

const CACHE_NAME = "delivery-v1";

const FILES = [
"/delivery/",
"/delivery/login.html",
"/delivery/home.html",
"/delivery/details.html",
"/delivery/Profile.html",
"/delivery/manifest.json",
"/icons/delivery-192.png",
"/icons/delivery-512.png"
];

// INSTALL
self.addEventListener(
"install",
(event)=>{

event.waitUntil(

caches
.open(CACHE_NAME)

.then(
cache=>
cache.addAll(FILES)
)

);

self.skipWaiting();

}
);

// ACTIVATE
self.addEventListener(
"activate",
(event)=>{

event.waitUntil(

caches.keys()

.then(keys=>

Promise.all(

keys.map(key=>{

if(
key!==CACHE_NAME
){
return caches.delete(key);
}

})

)

)

);

clients.claim();

}
);

// FETCH
self.addEventListener(
"fetch",
(event)=>{

event.respondWith(

caches
.match(event.request)

.then(
res=>

res ||
fetch(event.request)

)

);

}
);