"use client";

import React, { useState } from 'react';
import { Bell, Calendar, Download, ExternalLink, Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  createGoogleCalendarUrl, 
  downloadIcsFile 
} from '@/lib/calendar-reminder';

interface CalendarReminderProps {
  title: string;
  description?: string;
  startTime: Date | string;
  endTime?: Date | string;
  durationMin?: number;
  location?: string;
  buttonText?: string;
  size?: 'sm' | 'default' | 'icon';
  variant?: 'outline' | 'secondary' | 'ghost' | 'default';
  className?: string;
}

export function CalendarReminderDropdown({
  title,
  description = '',
  startTime,
  endTime,
  durationMin = 60,
  location = '',
  buttonText = 'Set Reminder',
  size = 'sm',
  variant = 'outline',
  className = ''
}: CalendarReminderProps) {
  const [copied, setCopied] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const googleUrl = createGoogleCalendarUrl({
    title,
    description,
    startTime,
    endTime,
    durationMin,
    location
  });

  const handleDownloadIcs = () => {
    const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-reminder.ics`;
    downloadIcsFile({
      title,
      description,
      startTime,
      endTime,
      durationMin,
      location
    }, filename);
  };

  return (
    <div className="relative inline-block text-left">
      <Button
        type="button"
        size={size}
        variant={variant}
        onClick={() => setShowOptions(!showOptions)}
        className={`rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${className}`}
      >
        <Bell className="h-3.5 w-3.5 text-primary" />
        <span>{buttonText}</span>
      </Button>

      {showOptions && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowOptions(false)} 
          />
          <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border/60 bg-card/95 backdrop-blur p-2 shadow-2xl z-50 space-y-1 animate-in fade-in-50 zoom-in-95">
            <div className="px-2 py-1.5 border-b border-border/40 mb-1">
              <p className="text-[11px] font-bold text-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-primary" /> Set Calendar Reminder
              </p>
              <p className="text-[10px] text-muted-foreground">Sets 15-min and 1-hour alarms</p>
            </div>

            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShowOptions(false)}
              className="flex items-center justify-between w-full px-2.5 py-1.5 text-xs rounded-xl hover:bg-muted font-medium text-foreground transition-colors"
            >
              <span className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-blue-500" />
                Google Calendar
              </span>
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </a>

            <button
              type="button"
              onClick={() => {
                handleDownloadIcs();
                setShowOptions(false);
              }}
              className="flex items-center justify-between w-full px-2.5 py-1.5 text-xs rounded-xl hover:bg-muted font-medium text-foreground transition-colors text-left"
            >
              <span className="flex items-center gap-2">
                <Download className="h-3.5 w-3.5 text-emerald-500" />
                Apple / Outlook / Phone (.ics)
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
