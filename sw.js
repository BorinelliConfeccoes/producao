const CACHE = 'borinelli-prod-v34';
const ARQUIVOS = [
  './index.html',
  './manifest.json',
  './icone-192.png',
  './icone-512.png',
  './logo.png',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS).catch(()=>{})).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // version.json: sempre rede, nunca cache (evita falso 'nova versão')
  if (url.pathname.endsWith('version.json')) {
    e.respondWith(fetch(req).catch(() => new Response('{"versao":"0"}', {headers:{'Content-Type':'application/json'}})));
    return;
  }
  // navegação: rede primeiro (pega atualização na hora), cache como reserva
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; })
                .catch(() => caches.match(req).then(m => m || caches.match('./index.html')))
    );
    return;
  }
  // resto: cache primeiro (funciona offline), atualizando em segundo plano
  e.respondWith(
    caches.match(req).then(r => r || fetch(req).then(resp => {
      const cp = resp.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return resp;
    }).catch(() => caches.match('./index.html')))
  );
});
