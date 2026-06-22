importScripts("https://js.pusher.com/beams/service-worker.js");

const CACHE_NAME = "eluru-foods-v1";

self.addEventListener("install", (event) => {
  console.log("Service Worker Installed");
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker Activated");
});

self.addEventListener("fetch", (event) => {
});