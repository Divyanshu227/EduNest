import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function Badge({ 
  className, 
  children, 
  variant = 'default',
  style
}: { 
  className?: string; 
  children: ReactNode; 
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  style?: React.CSSProperties;
}) {
  const variantStyles = {
    default: 'bg-primary text-primary-foreground border-transparent',
    secondary: 'bg-muted text-muted-foreground border-transparent',
    destructive: 'bg-destructive/15 text-destructive border-destructive/20',
    outline: 'text-foreground border-border/60'
  };

  return (
    <span 
      style={style}
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all',
        variantStyles[variant] || variantStyles.default,
        className
      )}
    >
      {children}
    </span>
  );
}