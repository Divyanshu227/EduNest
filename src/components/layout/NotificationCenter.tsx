"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, Trash2, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  link: string | null;
  readAt: string | null;
  createdAt: string | Date;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.readAt).length;

  const markAsRead = async (id: string, link: string | null) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id })
      });

      if (res.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n)
        );
        setIsOpen(false);
        if (link) {
          router.push(link);
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // Empty body marks all as read
      });

      if (res.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, readAt: new Date().toISOString() }))
        );
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-10 w-10 rounded-2xl hover:bg-muted/80"
      >
        <Bell className="h-5 w-5 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-black text-primary-foreground shadow-glow animate-pulse">
            {unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 z-50 w-80 sm:w-96 rounded-3xl border border-border/60 bg-background/95 p-4 shadow-2xl backdrop-blur"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border/40 mb-2">
              <h4 className="font-bold text-sm">Notifications</h4>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-7 text-[10px] font-bold text-primary rounded-xl">
                  Mark all as read
                </Button>
              )}
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-1">
              {notifications.map((notif) => {
                const isRead = !!notif.readAt;
                
                return (
                  <button
                    key={notif.id}
                    onClick={() => markAsRead(notif.id, notif.link)}
                    className={`w-full text-left rounded-2xl p-3 transition-all flex gap-3 ${
                      isRead ? 'hover:bg-muted/30 opacity-70' : 'bg-primary/5 hover:bg-primary/10 font-medium'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs font-semibold ${isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {notif.title}
                        </p>
                        <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                          {new Date(notif.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                        {notif.body}
                      </p>
                    </div>
                  </button>
                );
              })}

              {!notifications.length && (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-xs">You have no notifications.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
