"use client";

import { useEffect, useState } from 'react';
import { BellRing, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PushNotificationButton() {
  const [status, setStatus] = useState<'unsupported' | 'idle' | 'enabled' | 'denied' | 'loading'>('idle');

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported');
      return;
    }

    navigator.serviceWorker.ready.then((registration) => {
      registration.pushManager.getSubscription().then((subscription) => {
        if (subscription) {
          setStatus('enabled');
        } else if (Notification.permission === 'denied') {
          setStatus('denied');
        } else {
          setStatus('idle');
        }
      });
    });
  }, []);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const enableNotifications = async () => {
    try {
      setStatus('loading');

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'idle');
        return;
      }

      // Explicitly register to prevent hanging if ready never resolves
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        console.error('Missing VAPID key');
        setStatus('unsupported');
        return;
      }

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey)
        });
      }

      await fetch('/api/push-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription })
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
      <Button variant="outline" size="sm" className="rounded-2xl" onClick={enableNotifications} disabled={status === 'loading'}>
        {status === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BellRing className="mr-2 h-4 w-4 text-primary" />}
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
