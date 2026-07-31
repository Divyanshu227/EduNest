import { Loader2 } from 'lucide-react';

export function LoadingScreen({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <div
      className={`flex w-full flex-col items-center justify-center gap-4 ${
        fullScreen ? 'min-h-screen bg-background' : 'min-h-[60vh]'
      }`}
    >
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 shadow-glow">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="absolute inset-0 animate-ping rounded-2xl bg-primary/20 duration-1000" />
      </div>
      <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase animate-pulse">
        Loading...
      </p>
    </div>
  );
}
