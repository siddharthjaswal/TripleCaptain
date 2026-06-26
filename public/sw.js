/* Triple Captain service worker — push notifications only.
 *
 * Deliberately NO fetch/caching strategy: the app server-renders fresh FPL data
 * and deploys often, so caching would risk serving stale pages. We just take
 * control quickly and handle Web Push + notification clicks.
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "Triple Captain", body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "Triple Captain";
  const options = {
    body: payload.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: payload.tag || "tc-alert",
    data: { url: payload.url || "/" },
    requireInteraction: payload.severity === "urgent",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Focus an existing tab if one is open, else open a new one.
        for (const client of clients) {
          if ("focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      }),
  );
});
