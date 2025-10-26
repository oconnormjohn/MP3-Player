const CACHE = 'nativity-player-v10';
const FILES = [
  './',
  './index.html',
  './style.css',
  './script.js?v=10',
  './manifest.json',
  './mp3/Away in a MangerMOC.mp3',
  './mp3/Little Donkey.mp3',
  './mp3/Love Shine a Light.mp3',
  './mp3/Silent Night.mp3',
  './mp3/There\'s A Razzle And A Dazzle.mp3',
  './mp3/We Three Kings.mp3',
  './mp3/We\'d Like To Tell You A Story.mp3',
  './mp3/While Shepherds Watched.mp3'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
});
