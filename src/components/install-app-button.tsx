"use client";

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

type BeforeInstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <Button
      variant="secondary"
      onClick={async () => {
        if (!deferredPrompt) return;
        await deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        setVisible(false);
      }}
    >
      <Download className="mr-2 h-4 w-4" />
      Install App
    </Button>
  );
}