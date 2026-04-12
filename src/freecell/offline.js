const cacheName = "freecell-20240525n"
const files = [
  "./",
  "./android-chrome-192x192.png",
  "./android-chrome-512x512.png",
  "./apple-touch-icon.png",
  "./favicon-16x16.png",
  "./favicon-32x32.png",
  "./favicon.ico",
  "./freecell.js",
  "./index.html",
  "./normalize.css",
  "./preview.png",
  "./style.css",
  "./webui.js",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(cacheName).then((cache) => cache.addAll(files))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim())
})

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin || event.request.method !== "GET") {
    return // pass through unintercepted
  }

  event.respondWith(staleWhileRevalidate(event.request))
})

function staleWhileRevalidate(request) {
  const network = fetch(request)
    .then((response) => {
      if (response.ok) {
        caches.open(cacheName).then((cache) =>
          cache.put(request, response.clone())
        )
      }
      return response
    })

  const lookup = new Promise((resolve) => setTimeout(resolve, 10))
    .then(() => caches.match(request, { ignoreSearch: true }))
    .then((cached) => cached || network)

  return Promise.any([network, lookup])
}
