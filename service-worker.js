const CACHE_NAME = "biologia-v2";

const archivos = [
    "./",
    "./index.html",
    "./css/estilos.css",
    "./js/app.js",
    "./data/apo1.json",
    "./data/apo2.json",
    "./data/apo3.json",
    "./data/apo4.json",
    "./data/apo5.json",
    "./data/apo6.json",
    "./data/apo7.json",
    "./data/apo8.json",
    "./data/apo9.json",
    "./data/apo10.json",
    "./data/apo11.json",
    "./data/apo12.json"
];

self.addEventListener("install", event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(archivos))
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.map(key => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    event.respondWith(
        fetch(event.request)
            .then(response => {
                const copia = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, copia));
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
