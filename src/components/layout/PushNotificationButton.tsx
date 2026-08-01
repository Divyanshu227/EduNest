"use client";

import { useEffect, useState } from 'react';
import { BellRing, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationButton() {
  const [status, setStatus] = useState<'unsupported' | 'idle' | 'enabled' | 'denied' | 'loading'>('idle');

  useEffect(() => {
    // SSR guard + feature detect
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window) ||
      !('Notification' in window)
    ) {
      setStatus('unsupported');
      return;
    }

    // Check current permission state first — avoids any SW lookup if already denied
    if (Notification.permission === 'denied') {
      setStatus('denied');
      return;
    }

    // Check if browser already has an active subscription for this origin
    // Use a race with a timeout so we never hang if sw.js is not yet installed
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
    const subscriptionCheck = navigator.serviceWorker.getRegistrations().then(async (regs) => {
      for (const reg of regs) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) return sub;
      }
      return null;
    });

    Promise.race([subscriptionCheck, timeout]).then((sub) => {
      setStatus(sub ? 'enabled' : 'idle');
    });
  }, []);

  const enableNotifications = async () => {
    try {
      setStatus('loading');

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'idle');
        return;
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        console.error('[Push] Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY');
        setStatus('idle');
        return;
      }

      // Register (or get existing) sw.js — next-pwa generates this file
      let registration = await navigator.serviceWorker.getRegistration('/');
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        // Wait for the new SW to be active before subscribing
        await new Promise<void>((resolve) => {
          if (registration!.active) { resolve(); return; }
          const sw = registration!.installing ?? registration!.waiting;
          sw?.addEventListener('statechange', function handler(e) {
            if ((e.target as ServiceWorker).state === 'activated') {
              sw.removeEventListener('statechange', handler);
              resolve();
            }
          });
        });
      }

      // Re-use existing subscription or create a new one
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey)
        });
      }

      // Save subscription to DB
      const res = await fetch('/api/push-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      setStatus('enabled');
    } catch (error) {
      console.error('[Push] Failed to enable notifications:', error);
      setStatus('idle');
    }
  };

  if (status === 'unsupported') return null;

  if (status === 'enabled') {
    return (
      <Button variant="outline" size="sm" className="rounded-2xl" onClick={enableNotifications} title="Click to re-sync alerts">
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
    <Button
      variant="outline"
      size="sm"
      className="rounded-2xl"
      onClick={enableNotifications}
      disabled={status === 'loading'}
    >
      {status === 'loading'
        ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        : <BellRing className="mr-2 h-4 w-4" />
      }
      {status === 'loading' ? 'Enabling...' : 'Enable Alerts'}
    </Button>
  );
}
