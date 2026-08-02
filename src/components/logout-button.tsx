"use client";

import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export function LogoutButton() {
  const handleLogout = async () => {
    try {
      // Check if service workers and push manager are supported
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            // Remove token from backend
            await fetch('/api/push-tokens', {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ token: JSON.stringify(subscription) }),
            });
            // Unsubscribe locally
            await subscription.unsubscribe();
          }
        }
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications during logout:', error);
    } finally {
      // Always sign out, even if unsubscription fails
      signOut({ callbackUrl: '/' });
    }
  };

  return (
    <Button variant="ghost" onClick={handleLogout}>
      <LogOut className="mr-2 h-4 w-4" />
      Logout
    </Button>
  );
}