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

/**
 * Poll until registration.active is set.
 * next-pwa's sw.js precaches all static assets on first install which can
 * take 30-60 seconds on first visit. We cannot use a short timeout.
 */
function waitForActive(
  registration: ServiceWorkerRegistration
): Promise<ServiceWorkerRegistration> {
  return new Promise((resolve) => {
    // Already active — return immediately
    if (registration.active) {
      resolve(registration);
      return;
    }

    // Poll every 300ms. The SW will activate once precaching finishes.
    const poll = setInterval(() => {
      if (registration.active) {
        clearInterval(poll);
        resolve(registration);
      }
    }, 300);

    // Also hook state change events as a fast path
    const watch = (sw: ServiceWorker | null) => {
      if (!sw) return;
      sw.addEventListener('statechange', () => {
        if (sw.state === 'activated') {
          clearInterval(poll);
          resolve(registration);
        }
      });
    };

    watch(registration.installing);
    watch(registration.waiting);
    registration.addEventListener('updatefound', () => watch(registration.installing));
  });
}

export function PushNotificationButton() {
  const [status, setStatus] = useState<'unsupported' | 'idle' | 'enabled' | 'denied' | 'loading'>('idle');

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window) ||
      !('Notification' in window)
    ) {
      setStatus('unsupported');
      return;
    }

    if (Notification.permission === 'denied') {
      setStatus('denied');
      return;
    }

    // Check if already subscribed in ANY registered SW
    navigator.serviceWorker.getRegistrations().then(async (regs) => {
      let isSubbed = false;
      for (const reg of regs) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) { isSubbed = true; break; }
      }
      
      if (isSubbed) {
        setStatus('enabled');
      } else {
        setStatus('idle');
        // Auto-prompt if permission is default or granted
        const hasPrompted = sessionStorage.getItem('hasPromptedPush');
        if (!hasPrompted && (Notification.permission === 'default' || Notification.permission === 'granted')) {
          sessionStorage.setItem('hasPromptedPush', 'true');
          // Wrap in timeout to give the browser a chance to render first
          setTimeout(() => {
            enableNotifications();
          }, 2000);
        }
      }
    });
  }, []);

  const enableNotifications = async () => {
    try {
      setStatus('loading');

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'idle');
        return;
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        console.error('[Push] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set');
        alert('Push notifications are not configured. Please contact support.');
        setStatus('idle');
        return;
      }

      // ── Step 1: Clean up any stale service workers from old Firebase setup ──
      // Old Firebase SWs can block the new one from activating
      const existing = await navigator.serviceWorker.getRegistrations();
      for (const reg of existing) {
        const isFirebaseSW = reg.scope.includes('firebase') ||
          (reg.active?.scriptURL ?? '').includes('firebase');
        if (isFirebaseSW) {
          console.log('[Push] Unregistering old Firebase SW:', reg.scope);
          await reg.unregister();
        }
      }

      // ── Step 2: Register sw.js (next-pwa generates this) ──
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('[Push] SW registered, state:', registration.active?.state ?? 'not active yet');

      // ── Step 3: Wait for active (with timeout — does NOT use serviceWorker.ready) ──
      const activeReg = await waitForActive(registration);
      console.log('[Push] SW is now active');

      // ── Step 4: Subscribe ──
      let subscription = await activeReg.pushManager.getSubscription();
      if (!subscription) {
        subscription = await activeReg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey)
        });
      }
      console.log('[Push] Subscribed:', subscription.endpoint);

      // ── Step 5: Save to DB ──
      const res = await fetch('/api/push-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription })
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);

      setStatus('enabled');
    } catch (error) {
      console.error('[Push] Failed:', error);
      setStatus('idle');
    }
  };

  const disableNotifications = async () => {
    try {
      setStatus('loading');
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          // Remove token from backend
          await fetch('/api/push-tokens', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: JSON.stringify(sub) }),
          });
          // Unsubscribe locally
          await sub.unsubscribe();
        }
      }
      setStatus('idle');
    } catch (error) {
      console.error('[Push] Failed to disable:', error);
      setStatus('enabled');
    }
  };

  if (status === 'unsupported') return null;

  if (status === 'enabled') {
    return (
      <Button variant="outline" size="sm" className="rounded-2xl border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={disableNotifications}>
        <BellOff className="mr-2 h-4 w-4" />
        Disable Alerts
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
      {status === 'loading' ? 'Setting up...' : 'Enable Alerts'}
    </Button>
  );
}
