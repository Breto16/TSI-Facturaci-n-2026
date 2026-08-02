self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Sin estrategia de cache por ahora, solo se requiere el listener
  // para que el navegador reconozca el sitio como instalable
});