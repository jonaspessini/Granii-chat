const CACHE_NAME = 'gastos-mensal-v4';

// Apenas assets verdadeiramente estáticos — CSS, fontes, imagens
const ASSETS_TO_CACHE = [
  './manifest.json',
  './css/index.css',
  './css/index2.css',
  './css/index3.css',
  './css/index4.css',
  './css/remixicon/remixicon.css',
  './css/remixicon/remixicon.ttf',
  './css/remixicon/remixicon.woff',
  './css/remixicon/remixicon.woff2',
  './img/logo.png'
];

// Nunca cachear requisições que contenham esses termos
const NEVER_CACHE = [
  'supabase.co',       // todas as chamadas de API do Supabase
  'supabase-config',   // módulo de autenticação
  'supabase-sync',     // módulo de sync
  'supabase-integration',
  'auth-guard',
  'storage-manager',
  'login.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    // Apaga TODOS os caches antigos ao ativar nova versão
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // Nunca cachear URLs da lista NEVER_CACHE — sempre vai para a rede
  const shouldNeverCache = NEVER_CACHE.some(term => url.includes(term));
  if (shouldNeverCache) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Para arquivos HTML — network-first (sempre tenta rede, fallback para cache)
  if (url.endsWith('.html') || url.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Para assets estáticos (CSS, fontes, imagens) — cache-first
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      });
    })
  );
});