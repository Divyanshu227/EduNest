importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAqgf1Wwleu4qvpP_6hqVQReA5TYLaGfiI",
  authDomain: "edunest-ece93.firebaseapp.com",
  projectId: "edunest-ece93",
  storageBucket: "edunest-ece93.firebasestorage.app",
  messagingSenderId: "294635444294",
  appId: "1:294635444294:web:383666cf5d4850a66f9247"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'EduNest';
  const notificationOptions = {
    body: payload.notification?.body || 'Open EduNest to view the latest update.',
    icon: '/icon.svg',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
