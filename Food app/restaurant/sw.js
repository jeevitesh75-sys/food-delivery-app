const CACHE_NAME = "restaurant-v2";

const FILES = [
"/restaurant/",
"/restaurant/login.html",
"/restaurant/Dashboard.html",
"/restaurant/Profile.html",
"/restaurant/details.html",
"/restaurant/manifest.json",
"/restaurant/icons/restaurant-192.png",
"/restaurant/icons/restaurant-512.png"
];

// INSTALL
self.addEventListener("install",(event)=>{
event.waitUntil(
caches.open(CACHE_NAME)
.then(cache=>cache.addAll(FILES))
);
self.skipWaiting();
});

// ACTIVATE
self.addEventListener("activate",(event)=>{
event.waitUntil(
caches.keys().then(keys=>
Promise.all(
keys.map(key=>{
if(key!==CACHE_NAME){
return caches.delete(key);
}
})
)
)
);
clients.claim();
});

// FETCH
self.addEventListener("fetch",(event)=>{
event.respondWith(
caches.match(event.request)
.then(res=>res || fetch(event.request))
);
});