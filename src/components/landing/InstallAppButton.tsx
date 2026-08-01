'use client';

import { useState, useEffect } from 'react';
import { Smartphone } from 'lucide-react';

export function InstallAppButton({ variant = 'navbar' }: { variant?: 'navbar' | 'footer' }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

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
    if (!deferredPrompt) {
      alert('The app is already installed or your browser does not support this feature yet.');
      return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (variant === 'navbar') {
    return (
      <button 
        onClick={handleInstallClick} 
        className="flex items-center gap-1.5 text-navy-700 hover:text-gold-500 transition-colors font-medium bg-navy-50 px-3 py-1.5 rounded-lg border border-navy-100 shadow-sm"
      >
        <Smartphone className="w-4 h-4" />
        Download App
      </button>
    );
  }

  return (
    <button onClick={handleInstallClick} className="text-navy-300 hover:text-gold-400 transition-colors text-sm flex items-center gap-2 text-left">
      <span className="w-1.5 h-1.5 rounded-full bg-gold-600"></span> Download App
    </button>
  );
}
