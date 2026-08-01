/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

self.addEventListener('push', (event) => {
  const data = event.data?.json();
  if (data && data.notification) {
    const title = data.notification.title || 'EduNest';
    const options = {
      body: data.notification.body,
      icon: '/icon.svg',
      data: data.notification.data
    };

    event.waitUntil(self.registration.showNotification(title, options));
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
