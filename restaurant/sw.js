const CACHE_NAME = "elurufoods-v1";

const FILES = [

"/",
"/login.html",
"/Dashboard.html",
"/Profile.html",
"/details.html",
"/manifest.json"

];

// INSTALL

self.addEventListener(
"install",

(event)=>{

event.waitUntil(

caches.open(
CACHE_NAME
)

.then(cache=>
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
key !== CACHE_NAME
){

return caches.delete(key);

}

})

)

)

);

self.clients.claim();

}

);

// FETCH

self.addEventListener(

"fetch",

(event)=>{

event.respondWith(

fetch(
event.request
)

.catch(

()=>caches.match(
event.request
)

)

);

}

);