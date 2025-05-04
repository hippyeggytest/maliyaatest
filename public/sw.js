importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

workbox.setConfig({
   debug: false
});

workbox.core.setCacheNameDetails({
  prefix: 'school-finance-saas',
  suffix: 'v1',
  precache: 'precache',
  runtime: 'runtime',
});

workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

workbox.routing.registerRoute(
  /\.(?:png|gif|jpg|jpeg|svg)$/,
  new workbox.strategies.CacheFirst({
    cacheName: 'images',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

workbox.routing.registerRoute(
  /\.(?:js|css)$/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'static-resources',
  })
);

workbox.routing.registerRoute(
  /^https:\/\/fonts\.googleapis\.com/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
  })
);

workbox.routing.registerRoute(
  /^https:\/\/fonts\.gstatic\.com/,
  new workbox.strategies.CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 365,
        maxEntries: 30,
      }),
    ],
  })
);

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

const supabaseSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin('supabaseSync', {
  maxRetentionTime: 24 * 60, // Retry for up to 24 Hours
  onSync: async ({ queue }) => {
    let entry;
    while (entry = await queue.shiftRequest()) {
      try {
        const response = await fetch(entry.request);
        if (!response.ok) throw new Error('Network response was not ok');
        console.log('Replay successful for request', entry.request.url);
      } catch (error) {
        console.error('Replay failed for request', entry.request.url, error);
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  }
});

workbox.routing.registerRoute(
  /^https:\/\/[^\/]+\/rest\/v1\//,
  new workbox.strategies.NetworkOnly({
    plugins: [supabaseSyncPlugin]
  }),
  'POST'
);

workbox.routing.registerRoute(
  /^https:\/\/[^\/]+\/rest\/v1\//,
  new workbox.strategies.NetworkFirst({
    cacheName: 'supabase-data',
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.ExpirationPlugin({
        maxAgeSeconds: 60 * 5, // 5 minutes
      }),
    ],
  }),
  'GET'
);

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
 