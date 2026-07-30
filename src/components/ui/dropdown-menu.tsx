"use client";

import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';

function DropdownMenu({ children }: { children: React.ReactNode }) {
  return <DropdownMenuPrimitive.Root>{children}</DropdownMenuPrimitive.Root>;
}

function DropdownMenuTrigger({ children }: { children: React.ReactNode }) {
  return <DropdownMenuPrimitive.Trigger asChild>{children}</DropdownMenuPrimitive.Trigger>;
}

function DropdownMenuContent({ className, sideOffset = 8, ...props }: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>) {
  return <DropdownMenuPrimitive.Portal><DropdownMenuPrimitive.Content sideOffset={sideOffset} className={cn('z-50 min-w-48 overflow-hidden rounded-2xl border border-border bg-card p-1 text-card-foreground shadow-lg', className)} {...props} /></DropdownMenuPrimitive.Portal>;
}

function DropdownMenuItem({ className, ...props }: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>) {
  return <DropdownMenuPrimitive.Item className={cn('relative flex cursor-default select-none items-center rounded-xl px-3 py-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground', className)} {...props} />;
}

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem };