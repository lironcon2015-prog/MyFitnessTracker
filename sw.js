/* Service Worker.
   מעטפת האפליקציה (HTML/CSS/JS/פונטים/אייקונים) — cache-first עם מספר גרסה.
   תוכן (content/*.json) — stale-while-revalidate: מוצג מיד מהמטמון ומתעדכן ברקע,
   כך שהוספת תרחיש לא מחייבת להעלות את מספר הגרסה כאן. */

const SHELL = 'kesher8-shell-v3';
const CONTENT = 'kesher8-content-v1';

const ASSETS = [
  './', './index.html', './css/app.css',
  './js/app.js', './js/pitch.js', './js/store.js',
  './js/booklet.js', './js/library.js',
  './fonts.css', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png',
  './icons/icon-maskable-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png',
  './fonts/suez-one-hebrew-400-normal.woff2', './fonts/suez-one-latin-400-normal.woff2',
  './fonts/assistant-hebrew-400-normal.woff2', './fonts/assistant-latin-400-normal.woff2',
  './fonts/assistant-hebrew-600-normal.woff2', './fonts/assistant-latin-600-normal.woff2',
  './fonts/assistant-hebrew-700-normal.woff2', './fonts/assistant-latin-700-normal.woff2',
  './fonts/heebo-hebrew-700-normal.woff2', './fonts/heebo-latin-700-normal.woff2',
  './fonts/heebo-hebrew-900-normal.woff2', './fonts/heebo-latin-900-normal.woff2'
];

/* התוכן נטען בהתקנה כדי שהאפליקציה תעבוד אופליין כבר אחרי הביקור הראשון */
const CONTENT_ASSETS = [
  './content/booklets.json', './content/formations.json', './content/kesher-8.json'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    await caches.open(SHELL).then(c => c.addAll(ASSETS));
    await caches.open(CONTENT).then(c => c.addAll(CONTENT_ASSETS)).catch(() => {});
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== SHELL && k !== CONTENT).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (url.pathname.includes('/content/')) {
    e.respondWith(staleWhileRevalidate(req));
    return;
  }
  e.respondWith(cacheFirst(req));
});

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CONTENT);
  const hit = await cache.match(req);
  const fresh = fetch(req).then(res => {
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  }).catch(() => null);
  return hit || (await fresh) || new Response('{}', { headers: { 'Content-Type': 'application/json' } });
}

async function cacheFirst(req) {
  const hit = await caches.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res && res.ok) {
      const copy = res.clone();
      caches.open(SHELL).then(c => c.put(req, copy)).catch(() => {});
    }
    return res;
  } catch (e) {
    if (req.mode === 'navigate') {
      const shell = await caches.match('./index.html');
      if (shell) return shell;
    }
    throw e;
  }
}
