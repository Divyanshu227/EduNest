"use client";

import { useEffect, useState } from 'react';
import { BellRing, BellOff, Loader2 } from 'lucide-react';
import { getToken, onMessage } from 'firebase/messaging';
import { Button } from '@/components/ui/button';
import { getFirebaseMessaging, hasFirebaseMessagingConfig } from '@/lib/firebase-client';

function getNotificationBody(payload: { notification?: { body?: string } }) {
  return payload.notification?.body || 'Open EduNest to view the latest update.';
}

export function PushNotificationButton() {
  const [status, setStatus] = useState<'unsupported' | 'idle' | 'enabled' | 'denied' | 'loading'>('idle');

  useEffect(() => {
    if (!hasFirebaseMessagingConfig() || typeof window === 'undefined' || !('Notification' in window)) {
      setStatus('unsupported');
      return;
    }

    if (Notification.permission === 'granted') {
      setStatus('enabled');
    } else if (Notification.permission === 'denied') {
      setStatus('denied');
    }
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function setupForegroundListener() {
      const messaging = await getFirebaseMessaging();

      if (!messaging || Notification.permission !== 'granted') {
        return;
      }

      unsubscribe = onMessage(messaging, (payload) => {
        console.log('[FCM] Received foreground message:', payload);
        
        // Mobile browsers (especially Chrome for Android) DO NOT support the 'new Notification()' 
        // constructor from the foreground window. We MUST use the service worker to display it.
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(payload.notification?.title || 'EduNest', {
              body: getNotificationBody(payload),
              icon: '/icon.svg',
              data: { url: payload.fcmOptions?.link || payload.data?.link || '/' }
            });
          });
        } else {
          // Fallback for desktop browsers if needed
          const notification = new Notification(payload.notification?.title || 'EduNest', {
            body: getNotificationBody(payload),
            icon: '/icon.svg'
          });
          
          notification.onclick = () => {
            const link = payload.fcmOptions?.link || payload.data?.link || '/';
            window.open(link, '_blank');
          };
        }
      });
    }

    setupForegroundListener();

    return () => {
      unsubscribe?.();
    };
  }, []);

  const enableNotifications = async () => {
    try {
      setStatus('loading');

      if (!hasFirebaseMessagingConfig()) {
        setStatus('unsupported');
        return;
      }

      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'idle');
        return;
      }

      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      const messaging = await getFirebaseMessaging();

      if (!messaging) {
        setStatus('unsupported');
        return;
      }

      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration
      });

      if (!token) {
        setStatus('idle');
        return;
      }

      await fetch('/api/push-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      setStatus('enabled');
    } catch (error) {
      console.error('Failed to enable push notifications:', error);
      setStatus('idle');
    }
  };

  if (status === 'unsupported') {
    return null;
  }

  if (status === 'enabled') {
    return (
      <Button variant="outline" size="sm" className="rounded-2xl">
        <BellRing className="mr-2 h-4 w-4 text-primary" />
        Alerts On
      </Button>
    );
  }

  if (status === 'denied') {
    return (
      <Button variant="outline" size="sm" className="rounded-2xl" disabled>
        <BellOff className="mr-2 h-4 w-4" />
        Blocked in Browser
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" className="rounded-2xl" onClick={enableNotifications} disabled={status === 'loading'}>
      {status === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BellRing className="mr-2 h-4 w-4" />}
      Enable Alerts
    </Button>
  );
}
