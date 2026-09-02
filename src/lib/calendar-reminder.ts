/**
 * Utility functions to generate Google Calendar links and .ics iCalendar files with alarms
 */

interface CalendarEventParams {
  title: string;
  description?: string;
  startTime: Date | string;
  endTime?: Date | string;
  durationMin?: number;
  location?: string;
}

export function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function createGoogleCalendarUrl({
  title,
  description = '',
  startTime,
  endTime,
  durationMin = 60,
  location = ''
}: CalendarEventParams): string {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date(start.getTime() + durationMin * 60000);

  const startStr = formatIcsDate(start);
  const endStr = formatIcsDate(end);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startStr}/${endStr}`,
    details: description,
    location: location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function generateIcsContent({
  title,
  description = '',
  startTime,
  endTime,
  durationMin = 60,
  location = '',
}: CalendarEventParams & { reminderMinutes?: number }): string {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date(start.getTime() + durationMin * 60000);
  const now = new Date();

  const startStr = formatIcsDate(start);
  const endStr = formatIcsDate(end);
  const stampStr = formatIcsDate(now);
  const uid = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}@edunest.app`;

  // Standard iCalendar VCALENDAR with VALARM for 15-minute prior notification
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EduNest//Live Class & Homework Reminders//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stampStr}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${title.replace(/[\r\n]+/g, ' ')}`,
    `DESCRIPTION:${description.replace(/[\r\n]+/g, '\\n')}`,
    location ? `LOCATION:${location}` : '',
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'DESCRIPTION:Reminder: Class / Homework due soon on EduNest',
    'ACTION:DISPLAY',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'DESCRIPTION:1 hour reminder: EduNest Event',
    'ACTION:DISPLAY',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');
}

export function downloadIcsFile(params: CalendarEventParams, filename = 'edunest-event.ics') {
  const ics = generateIcsContent(params);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
