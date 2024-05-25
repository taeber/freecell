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

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request, { cacheName, ignoreSearch: true })
      .then((response) => {
        // caches.match() always resolves
        // but in case of success response will have value
        if (response !== undefined) {
          console.debug("[offline]", "cache hit", event.request.url)
          return response;
        } else {
          console.debug("[offline]", "cache miss", event.request.url)
          return fetch(event.request)
            .then((response) => {
              // response may be used only once
              // we need to save clone to put one copy in cache
              // and serve second one
              let responseClone = response.clone();

              caches.open(cacheName)
                .then((cache) => {
                  cache.put(event.request, responseClone);
                });
              return response;
            })
        }
      }),
  )
})
