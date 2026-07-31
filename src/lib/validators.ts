import { z } from 'zod';

export const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const subjectSchema = z.object({
  name: z.string().min(2),
  color: z.string().min(3),
  icon: z.string().min(1),
  sortOrder: z.coerce.number().int().min(0).default(0)
});

export const chapterSchema = z.object({
  subjectId: z.string().min(1),
  name: z.string().min(2),
  summary: z.string().optional(),
  order: z.coerce.number().int().min(0).default(0)
});

export const announcementSchema = z.object({
  title: z.string().min(3),
  message: z.string().min(5),
  audience: z.string().default('all'),
  pinned: z.coerce.boolean().default(false),
  attachments: z.array(z.object({
    url: z.string().url(),
    name: z.string(),
    type: z.string()
  })).optional().default([])
});

export const homeworkSchema = z.object({
  title: z.string().min(3),
  instructions: z.string().min(5),
  subjectId: z.string().min(1),
  chapterId: z.string().optional(),
  dueDate: z.string().datetime(),
  attachments: z.array(z.any()).optional().default([]),
  assignedStudentIds: z.array(z.string()).min(1, 'Select at least one student')
});

export const testSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  subjectId: z.string().min(1),
  chapterId: z.string().optional(),
  durationMin: z.coerce.number().int().min(5).default(30),
  isPublished: z.coerce.boolean().default(false)
});

export const attendanceSchema = z.object({
  studentId: z.string().min(1),
  subjectId: z.string().min(1),
  date: z.string().datetime(),
  status: z.enum(['PRESENT', 'ABSENT']),
  note: z.string().optional()
});

export const noteMetadataSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  subjectId: z.string().min(1),
  chapterId: z.string().min(1),
  youtubeUrl: z.string().url().optional().or(z.literal('')),
  noteType: z.enum(['IMAGE', 'PDF', 'MIXED']),
  images: z.array(z.any()).optional().default([]),
  pdfs: z.array(z.any()).optional().default([]),
  pageCount: z.coerce.number().int().optional().default(0)
});

export const homeworkSubmissionSchema = z.object({
  homeworkId: z.string().min(1),
  textAnswer: z.string().optional(),
  attachments: z.array(z.any()).optional().default([])
});