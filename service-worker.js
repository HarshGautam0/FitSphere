// =======================================
// FITSPHERE SERVICE WORKER
// =======================================
const CACHE_NAME = "fitsphere-v1.0.0";
const FILES_TO_CACHE = [
  "./",
  // HTML
  "index.html",
  "workout.html",
  "running.html",
  "history.html",
  "profile.html",
  "achievements.html",
  // CSS
  "styles.css",
  "themes.css",
  "responsive.css",
  "workout.css",
  "running.css",
  "history.css",
  "profile.css",
  "achievements.css",
  "toast.css",
  // JavaScript
  "app.js",
  "achievementData.js",
  "achievements.js",
  "back.js",
  "history.js",
  "navigation.js",
  "profile.js",
  "quotes.js",
  "records.js",
  "running.js",
  "streak.js",
  "theme.js",
  "toast.js",
  "voice.js",
  // Manifest
  "manifest.json",
  // Icons / Images
  "favicon.ico",
  "assets/male.png",
  "assets/female.png",
  "assets/other.png",
  "assets/pushup.png",
  "assets/pullup.png",
  "assets/plank.png",
  "assets/squat.png",
  "assets/crunch.png",
  "assets/jumping-jack.png",
];
// =======================================
// INSTALL
// =======================================
self.addEventListener("install", (event) => {
  console.log("✅ Service Worker Installed");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    }),
  );
  self.skipWaiting();
});
// =======================================
// ACTIVATE
// =======================================
self.addEventListener("activate", (event) => {
  console.log("✅ Service Worker Activated");
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("Deleting old cache:", key);
            return caches.delete(key);
          }
        }),
      );
    }),
  );
  self.clients.claim();
});
// =======================================
// FETCH
// =======================================
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((networkResponse) => {
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== "basic"
          ) {
            return networkResponse;
          }
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return networkResponse;
        })
        .catch(() => {
          // If HTML page fails offline
          if (event.request.destination === "document") {
            return caches.match("index.html");
          }
        });
    }),
  );
});
