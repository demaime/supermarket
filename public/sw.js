// Service Worker para PWA del Almacén
const CACHE_NAME = 'almacen-v1'
const STATIC_CACHE = 'almacen-static-v1'

// Assets estáticos para cachear
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/ventas',
  '/stock',
  '/turnos',
  '/registros',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
]

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets')
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.error('[SW] Failed to cache some assets:', err)
      })
    })
  )
  self.skipWaiting()
})

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Estrategia de fetch
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorar requests que no sean GET
  if (request.method !== 'GET') {
    return
  }

  // Estrategia para API calls: Network First, fallback a cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clonar la respuesta para guardarla en cache
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          })
          return response
        })
        .catch(() => {
          // Si falla la red, intentar desde cache
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || new Response(JSON.stringify({ error: 'Offline' }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            })
          })
        })
    )
    return
  }

  // Estrategia para assets estáticos: Cache First, fallback a network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(request).then((response) => {
        // No cachear si no es una respuesta válida
        if (!response || response.status !== 200 || response.type === 'error') {
          return response
        }

        // Clonar y guardar en cache
        const responseClone = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone)
        })

        return response
      }).catch(() => {
        // Fallback offline
        return new Response('Offline', { status: 503 })
      })
    })
  )
})

// Sincronización en background (cuando vuelve la conexión)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag)
  if (event.tag === 'sync-sales') {
    event.waitUntil(syncSales())
  }
})

async function syncSales() {
  console.log('[SW] Syncing sales...')
  // La sincronización real se maneja desde el store.ts
  // Aquí solo notificamos que hay conexión
  const clients = await self.clients.matchAll()
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_AVAILABLE' })
  })
}
