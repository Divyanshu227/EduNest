"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, GraduationCap, LayoutDashboard, MoonStar, Settings2, Users2, Sparkles } from 'lucide-react';
import type { UserRole } from '@prisma/client';
import type { ReactNode } from 'react';
import { NAVIGATION } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { LogoutButton } from '@/components/logout-button';
import { NotificationCenter } from '@/components/layout/NotificationCenter';

const roleIcons: Record<string, ReactNode> = {
  Dashboard: <LayoutDashboard className="h-4 w-4" />,
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
  children
}: {
  role: UserRole;
  name: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const navItems = role === 'ADMIN' ? NAVIGATION.admin : NAVIGATION.student;

  return (
    <div className="min-h-screen bg-background text-foreground md:grid md:grid-cols-[280px_1fr]">
      <aside className="border-r border-border/60 bg-card/80 px-5 py-6 backdrop-blur xl:px-6">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
            <span className="text-lg font-bold">E</span>
          </div>
          <div>
            <p className="text-lg font-semibold leading-none">EduNest</p>
            <p className="text-xs text-muted-foreground">{role === 'ADMIN' ? 'Teacher Console' : 'Student Space'}</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
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
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-sm text-muted-foreground">Logged in as</p>
              <h1 className="text-xl font-semibold">{name}</h1>
            </div>
            <div className="flex items-center gap-3">
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