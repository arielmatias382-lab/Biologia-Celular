const CACHE_NAME = "biologia-v1";

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

    event.waitUntil(

        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(archivos))

    );

});

self.addEventListener("fetch", event => {

    event.respondWith(

        caches.match(event.request)
            .then(response => response || fetch(event.request))

    );

});