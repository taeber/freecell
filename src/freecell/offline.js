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

self.addEventListener("install", event => {
  console.debug("[offline]", "install", cacheName, files)

  event.waitUntil(
    caches.open(cacheName)
      .then(cache => {
        console.debug("[offline]", "cache open")
        return cache.addAll(files)
      })
  )
})

// Force the waiting service worker to become the active service worker
self.addEventListener("fetch", event => {
  event.respondWith(
    // Try network first, fall back to cache
    fetch(event.request)
      .then((response) => {
        // If network request succeeded, update cache and return response
        if (response.status === 200) {
          let responseClone = response.clone()
          caches.open(cacheName)
            .then((cache) => {
              cache.put(event.request, responseClone)
            })
        }
        return response
      })
      .catch(() => {
        // Network failed, try cache
        console.debug("[offline]", "network failed, trying cache", event.request.url)
        return caches.match(event.request, { cacheName, ignoreSearch: true })
          .then((response) => {
            if (response !== undefined) {
              console.debug("[offline]", "cache hit", event.request.url)
              return response
            } else {
              console.debug("[offline]", "cache miss", event.request.url)
              throw new Error("No cached response available")
            }
          })
      })
  )
})
