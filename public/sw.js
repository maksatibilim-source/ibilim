// ============================================================================
//  Service Worker — PWA үшін.
//  Стратегия: ЖЕЛІ-БІРІНШІ (network-first). Онлайн болғанда әрдайым жаңа нұсқа
//  жүктеледі (ескі кэш қалып қоймайды), тек интернет жоқта кэштен көрсетіледі.
//  API сұраулары ешқашан кэштелмейді.
// ============================================================================

const CACHE = "ibilim-shell-v2";

self.addEventListener("install", () => {
  self.skipWaiting(); // жаңа SW бірден белсенді болады
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Ескі кэштерді тазалау
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // тек өз доменіміз
  if (url.pathname.startsWith("/api/")) return; // API — әрдайым желіден

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Сәтті жауапты кэшке көшіреміз (офлайн үшін)
        const copy = response.clone();
        caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
        return response;
      })
      .catch(async () => {
        // Интернет жоқ — кэштен береміз
        const cached = await caches.match(request);
        if (cached) return cached;
        // Навигация болса — басты бетті береміз
        if (request.mode === "navigate") {
          const home = await caches.match("/");
          if (home) return home;
        }
        return new Response("Офлайн", { status: 503, statusText: "Offline" });
      })
  );
});
