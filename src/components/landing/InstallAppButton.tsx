'use client';

import { useState, useEffect } from 'react';
import { Smartphone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function InstallAppButton({ variant = 'navbar' }: { variant?: 'navbar' | 'footer' }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState<{ title: string, desc: string } | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Check for iOS Safari
    const isIos = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };
    
    const isStandalone = () => {
      return ('standalone' in window.navigator) && (window.navigator as any).standalone;
    };

    if (isStandalone()) {
      setDialogMessage({
        title: "Already Installed",
        desc: "The app is already installed on your device! You can launch it from your home screen."
      });
      setDialogOpen(true);
      return;
    }

    if (isIos()) {
      setDialogMessage({
        title: "Install on iOS",
        desc: "To install EduNest on your iPhone or iPad:\n\n1. Tap the 'Share' icon at the bottom of Safari (the square with an arrow pointing up).\n2. Scroll down and tap 'Add to Home Screen'."
      });
      setDialogOpen(true);
      return;
    }

    if (!deferredPrompt) {
      const userAgent = window.navigator.userAgent.toLowerCase();
      
      let title = "Manual Installation Required";
      let desc = "The app is already installed or your browser does not support automatic installation. You can usually install it from your browser's menu (look for 'Install app' or 'Add to Home Screen').";

      if (/android/.test(userAgent)) {
        title = "Install on Android";
        desc = "To install EduNest on your Android device:\n\n1. Tap the browser menu (usually three dots in the top right).\n2. Select 'Install app' or 'Add to Home screen'.";
      } else if (/macintosh|mac os x/.test(userAgent)) {
        title = "Install on Mac";
        desc = "To install EduNest on your Mac (using Chrome, Edge, or Safari):\n\n• Safari: Click the Share button (square with arrow) and select 'Add to Dock'.\n• Chrome/Edge: Look for the install icon (monitor with a downward arrow) in the right side of your address bar, or go to the browser menu (three dots) and select 'Install EduNest'.";
      } else if (/windows/.test(userAgent)) {
        title = "Install on Windows";
        desc = "To install EduNest on Windows (using Chrome or Edge):\n\n1. Look for the install icon (monitor with a downward arrow or plus sign) in the right side of your address bar.\n2. Click it and select 'Install'.\n\nAlternatively, go to the browser menu (three dots) and select 'Install EduNest' or 'Apps' -> 'Install this site as an app'.";
      }

      setDialogMessage({ title, desc });
      setDialogOpen(true);
      return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const buttonElement = variant === 'navbar' ? (
    <button 
      onClick={handleInstallClick} 
      className="flex items-center gap-1.5 text-navy-700 hover:text-gold-500 transition-colors font-medium bg-navy-50 px-3 py-1.5 rounded-lg border border-navy-100 shadow-sm"
    >
      <Smartphone className="w-4 h-4" />
      Download App
    </button>
  ) : (
    <button onClick={handleInstallClick} className="text-navy-300 hover:text-gold-400 transition-colors text-sm flex items-center gap-2 text-left">
      <span className="w-1.5 h-1.5 rounded-full bg-gold-600"></span> Download App
    </button>
  );

  return (
    <>
      {buttonElement}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-navy-900">{dialogMessage?.title}</DialogTitle>
            <DialogDescription className="text-navy-600 pt-3 text-base whitespace-pre-line leading-relaxed">
              {dialogMessage?.desc}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
