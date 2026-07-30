"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, GraduationCap, LayoutDashboard, MoonStar, Settings2, Users2, Sparkles, Video, Menu, X } from 'lucide-react';
import type { UserRole } from '@prisma/client';
import type { ReactNode } from 'react';
import { NAVIGATION } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { LogoutButton } from '@/components/logout-button';
import { NotificationCenter } from '@/components/layout/NotificationCenter';
import { PushNotificationButton } from '@/components/layout/PushNotificationButton';

const roleIcons: Record<string, ReactNode> = {
  Dashboard: <LayoutDashboard className="h-4 w-4" />,
  Classes: <Video className="h-4 w-4" />,
  Users: <Users2 className="h-4 w-4" />,
  Subjects: <BookOpen className="h-4 w-4" />,
  Chapters: <Sparkles className="h-4 w-4" />,
  Notes: <GraduationCap className="h-4 w-4" />,
  Homework: <Users2 className="h-4 w-4" />,
  Tests: <Settings2 className="h-4 w-4" />,
  Attendance: <MoonStar className="h-4 w-4" />
};

export function DashboardShell({
  role,
  name,
  avatarUrl,
  children
}: {
  role: UserRole;
  name: string;
  avatarUrl?: string | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const navItems = role === 'ADMIN' ? NAVIGATION.admin : NAVIGATION.student;
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <>
      <div className="mb-6 flex flex-col items-center border-b border-border/40 pb-4">
        <img src="/logo.png" alt="EduNest" className="h-20 w-auto object-contain" />
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">{role === 'ADMIN' ? 'Teacher Console' : 'Student Space'}</p>
      </div>

      <div className="mb-6 flex items-center gap-3 px-2">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="h-10 w-10 rounded-2xl border border-primary/20 object-cover shadow-glow"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
            <span className="text-sm font-bold">{name[0] ?? 'E'}</span>
          </div>
        )}
        <div className="flex-1 overflow-hidden">
          <p className="text-sm font-semibold truncate">{name}</p>
          <p className="text-xs text-muted-foreground truncate">{role === 'ADMIN' ? 'Teacher' : 'Student'}</p>
        </div>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all hover:bg-accent hover:text-accent-foreground',
                active && 'bg-primary text-primary-foreground shadow-glow'
              )}
            >
              {roleIcons[item.label] ?? <LayoutDashboard className="h-4 w-4" />}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[280px] overflow-y-auto border-r border-border/60 bg-card/80 px-5 py-6 backdrop-blur md:block xl:px-6">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        </div>
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[min(86vw,20rem)] overflow-y-auto border-r border-border/60 bg-card px-5 py-6 backdrop-blur transition-transform duration-300 ease-in-out md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-4 top-5 flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Main content area */}
      <div className="flex min-h-screen flex-col md:pl-[280px]">
        <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur">
          <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              {/* Hamburger button for mobile */}
              <button
                onClick={() => setMobileOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted md:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Logged in as</p>
                <h1 className="truncate text-lg font-semibold sm:text-xl">{name}</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end sm:gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className="h-10 w-10 rounded-2xl border border-border/60 object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-sm font-bold text-primary">
                  {name[0] ?? 'U'}
                </div>
              )}
              <PushNotificationButton />
              <NotificationCenter />
              <ThemeToggle />
              <LogoutButton />
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
