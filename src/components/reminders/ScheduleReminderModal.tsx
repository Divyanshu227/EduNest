"use client";

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Calendar, 
  Clock, 
  Send, 
  CheckCircle2, 
  Trash2, 
  X, 
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

export interface ScheduleReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'CLASS' | 'HOMEWORK';
  targetId: string;
  title: string;
  eventDate: Date | string;
  students?: { id: string; name: string; email?: string }[];
  defaultStudentId?: string;
  onScheduledSuccess?: () => void;
}

interface ScheduledReminderItem {
  id: string;
  type: string;
  scheduledFor: string;
  status: string;
  body?: string;
  createdAt: string;
  studentId?: string;
}

export function ScheduleReminderModal({
  isOpen,
  onClose,
  type,
  targetId,
  title,
  eventDate,
  students = [],
  defaultStudentId,
  onScheduledSuccess
}: ScheduleReminderModalProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(defaultStudentId || '');
  const [scheduleOption, setScheduleOption] = useState<string>('15min');
  const [customDateTime, setCustomDateTime] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingReminders, setExistingReminders] = useState<ScheduledReminderItem[]>([]);
  const [loadingReminders, setLoadingReminders] = useState(false);

  const eventTime = new Date(eventDate);

  // Helper to compute target scheduled time from selected preset
  const computeScheduledTime = (option: string): Date => {
    const targetMs = eventTime.getTime();
    switch (option) {
      case '15min':
        return new Date(targetMs - 15 * 60000);
      case '30min':
        return new Date(targetMs - 30 * 60000);
      case '1hr':
        return new Date(targetMs - 60 * 60000);
      case '2hr':
        return new Date(targetMs - 120 * 60000);
      case '1day':
        return new Date(targetMs - 24 * 60 * 60000);
      case 'now':
        return new Date();
      case 'custom':
        return customDateTime ? new Date(customDateTime) : new Date();
      default:
        return new Date(targetMs - 15 * 60000);
    }
  };

  const fetchExistingReminders = async () => {
    if (!targetId) return;
    setLoadingReminders(true);
    try {
      const res = await fetch(`/api/reminders/schedule?targetId=${targetId}&type=${type}`);
      if (res.ok) {
        const data = await res.json();
        setExistingReminders(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load scheduled reminders', err);
    } finally {
      setLoadingReminders(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchExistingReminders();
      // Set default custom date to 30 min before
      const defaultCustom = new Date(eventTime.getTime() - 30 * 60000);
      setCustomDateTime(defaultCustom.toISOString().slice(0, 16));
    }
  }, [isOpen, targetId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const isImmediate = scheduleOption === 'now';
      const scheduledTime = computeScheduledTime(scheduleOption);

      const payload = {
        type,
        targetId,
        studentId: selectedStudentId || undefined,
        scheduledFor: scheduledTime.toISOString(),
        customMessage: customMessage.trim() || undefined,
        isImmediate
      };

      const res = await fetch('/api/reminders/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to schedule reminder');

      alert(data.message || (isImmediate ? 'Reminder sent successfully!' : 'Reminder scheduled successfully!'));
      fetchExistingReminders();
      onScheduledSuccess?.();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error scheduling reminder');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelReminder = async (reminderId: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled reminder?')) return;
    try {
      const res = await fetch('/api/reminders/schedule', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminderId })
      });
      if (res.ok) {
        setExistingReminders(prev => prev.filter(r => r.id !== reminderId));
        alert('Scheduled reminder cancelled.');
      }
    } catch (err) {
      alert('Failed to cancel reminder');
    }
  };

  const presets = type === 'CLASS' ? [
    { id: '15min', label: '15 Mins Before Class', desc: 'Alerts right before session starts' },
    { id: '30min', label: '30 Mins Before Class', desc: 'Allows time for prep' },
    { id: '1hr', label: '1 Hour Before Class', desc: 'Early heads-up' },
    { id: 'now', label: '⚡ Send Immediately', desc: 'Push alert to students & parents now' },
    { id: 'custom', label: '📅 Custom Date & Time', desc: 'Pick any future time' }
  ] : [
    { id: '1day', label: '1 Day Before Due Date', desc: 'Standard deadline alert' },
    { id: '2hr', label: '2 Hours Before Deadline', desc: 'Urgent submission alert' },
    { id: '30min', label: '30 Mins Before Deadline', desc: 'Final call reminder' },
    { id: 'now', label: '⚡ Send Immediately', desc: 'Push alert to pending students now' },
    { id: 'custom', label: '📅 Custom Date & Time', desc: 'Pick any future time' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg rounded-3xl border border-border/60 bg-background/95 p-6 shadow-2xl backdrop-blur max-h-[90vh] overflow-y-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border/40 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">
                Schedule Reminder
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {title} ({new Date(eventDate).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Target Student Selection for Homework */}
          {type === 'HOMEWORK' && students.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Recipient Target</Label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Pending / Missing Students</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    👤 {s.name} ({s.email || 'Student'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Preset Options */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">When should this reminder be sent?</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setScheduleOption(preset.id)}
                  className={`flex flex-col text-left p-3 rounded-2xl border transition-all ${
                    scheduleOption === preset.id
                      ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary'
                      : 'border-border/60 bg-card hover:bg-muted/50 text-muted-foreground'
                  }`}
                >
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    {preset.id === 'now' ? '⚡' : '🕒'} {preset.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">{preset.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Time Picker */}
          {scheduleOption === 'custom' && (
            <div className="space-y-1.5 p-3 rounded-2xl bg-muted/30 border border-border/50 animate-in fade-in-50">
              <Label htmlFor="customDateTime" className="text-xs font-semibold">
                Select Custom Date & Time
              </Label>
              <Input
                id="customDateTime"
                type="datetime-local"
                value={customDateTime}
                onChange={(e) => setCustomDateTime(e.target.value)}
                required
                className="rounded-xl bg-background"
              />
            </div>
          )}

          {/* Optional Custom Message */}
          <div className="space-y-1.5">
            <Label htmlFor="customMessage" className="text-xs font-semibold">
              Custom Message / Note (Optional)
            </Label>
            <Textarea
              id="customMessage"
              placeholder="Leave blank for automatic reminder text..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={2}
              className="rounded-xl text-xs"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl text-xs shadow-glow flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Scheduling...
                </>
              ) : scheduleOption === 'now' ? (
                <>
                  <Send className="h-3.5 w-3.5" /> Send Reminder Now
                </>
              ) : (
                <>
                  <Clock className="h-3.5 w-3.5" /> Schedule Reminder
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Existing Scheduled Reminders List */}
        {existingReminders.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-border/40">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Upcoming Scheduled Reminders ({existingReminders.length})
            </p>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {existingReminders.map((rem) => (
                <div
                  key={rem.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-border/40 bg-muted/20 text-xs"
                >
                  <div>
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3 text-primary" />
                      {new Date(rem.scheduledFor).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {rem.body && (
                      <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                        "{rem.body}"
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[9px] ${
                        rem.status === 'SENT'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : rem.status === 'CANCELLED'
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      }`}
                    >
                      {rem.status}
                    </Badge>
                    {rem.status === 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => handleCancelReminder(rem.id)}
                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Cancel reminder"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
