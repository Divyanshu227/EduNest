/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope;

// Immediately take control of all open pages on first install.
// Without this, serviceWorker.ready never resolves on first visit
// because the SW is active but not yet controlling any clients.
sw.addEventListener('activate', (event) => {
  event.waitUntil(sw.clients.claim());
});

sw.addEventListener('push', (event) => {
  const data = event.data?.json();
  if (data && data.notification) {
    const title = data.notification.title || 'EduNest';
    const options = {
      body: data.notification.body,
      icon: '/icon.svg',
      data: data.notification.data
    };

    event.waitUntil(sw.registration.showNotification(title, options));
  }
});

sw.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    sw.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (sw.clients.openWindow) {
        return sw.clients.openWindow(url);
      }
    })
  );
});
