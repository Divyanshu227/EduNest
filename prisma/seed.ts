import bcrypt from 'bcryptjs';
import { PrismaClient, AttendanceStatus, HomeworkStatus, NoteType, QuestionType, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

const teacherOne = {
  name: 'Mathematics Teacher',
  email: 'maths@edunest.dev',
  password: 'Maths@1234',
  role: UserRole.ADMIN
};

const teacherTwo = {
  name: 'Language Teacher',
  email: 'language@edunest.dev',
  password: 'Languages@1234',
  role: UserRole.ADMIN
};

const student = {
  name: 'Demo Student',
  email: 'student@edunest.dev',
  password: 'Student@1234',
  role: UserRole.STUDENT
};

async function upsertUser(account: typeof teacherOne | typeof teacherTwo | typeof student) {
  const passwordHash = await bcrypt.hash(account.password, 12);
  const existing = await prisma.user.findUnique({ where: { email: account.email } });
  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        name: account.name,
        passwordHash,
        role: account.role
      }
    });
  }
  return prisma.user.create({
    data: {
      name: account.name,
      email: account.email,
      passwordHash,
      role: account.role
    }
  });
}

async function main() {
  const mathsTeacher = await upsertUser(teacherOne);
  const languageTeacher = await upsertUser(teacherTwo);
  const demoStudent = await upsertUser(student);

  const subjects = [
    { name: 'Mathematics', slug: 'mathematics', color: '#22c55e', icon: 'Calculator', sortOrder: 1, teacherId: mathsTeacher.id },
    { name: 'English', slug: 'english', color: '#0ea5e9', icon: 'BookOpen', sortOrder: 2, teacherId: languageTeacher.id },
    { name: 'Hindi', slug: 'hindi', color: '#f59e0b', icon: 'Languages', sortOrder: 3, teacherId: languageTeacher.id },
    { name: 'EVS', slug: 'evs', color: '#14b8a6', icon: 'Leaf', sortOrder: 4, teacherId: languageTeacher.id }
  ];

  for (const subject of subjects) {
    const existing = await prisma.subject.findUnique({ where: { slug: subject.slug } });
    if (existing) {
      await prisma.subject.update({ where: { id: existing.id }, data: subject });
    } else {
      await prisma.subject.create({ data: subject });
    }
  }

  const math = await prisma.subject.findUnique({ where: { slug: 'mathematics' } });
  const english = await prisma.subject.findUnique({ where: { slug: 'english' } });
  const hindi = await prisma.subject.findUnique({ where: { slug: 'hindi' } });
  const evs = await prisma.subject.findUnique({ where: { slug: 'evs' } });

  if (!math || !english || !hindi || !evs) {
    throw new Error('Failed to seed subjects');
  }

  const chapterSeeds = [
    { subjectId: math.id, name: 'Chapter 1', slug: 'chapter-1', order: 1 },
    { subjectId: math.id, name: 'Chapter 2', slug: 'chapter-2', order: 2 },
    { subjectId: math.id, name: 'Chapter 3', slug: 'chapter-3', order: 3 },
    { subjectId: english.id, name: 'Grammar', slug: 'grammar', order: 1 },
    { subjectId: english.id, name: 'Reading', slug: 'reading', order: 2 },
    { subjectId: english.id, name: 'Chapter 1', slug: 'chapter-1', order: 3 },
    { subjectId: hindi.id, name: 'Chapter 1', slug: 'chapter-1', order: 1 },
    { subjectId: hindi.id, name: 'व्याकरण', slug: 'vyakaran', order: 2 },
    { subjectId: evs.id, name: 'Chapter 1', slug: 'chapter-1', order: 1 },
    { subjectId: evs.id, name: 'Chapter 2', slug: 'chapter-2', order: 2 }
  ];

  for (const chapter of chapterSeeds) {
    const existing = await prisma.chapter.findFirst({
      where: { subjectId: chapter.subjectId, slug: chapter.slug }
    });
    if (existing) {
      await prisma.chapter.update({ where: { id: existing.id }, data: chapter });
    } else {
      await prisma.chapter.create({ data: chapter });
    }
  }

  // Clear any existing test/questions to avoid duplicates during seed runs
  await prisma.question.deleteMany({});
  await prisma.test.deleteMany({});
  await prisma.homeworkSubmission.deleteMany({});
  await prisma.homework.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.note.deleteMany({});
  await prisma.notification.deleteMany({});

  const test = await prisma.test.create({
    data: {
      title: 'Weekly Maths Quiz',
      description: 'Quick revision for chapter 1 and chapter 2.',
      subjectId: math.id,
      authorId: mathsTeacher.id,
      durationMin: 20,
      isPublished: true
    }
  });

  await prisma.question.create({
    data: {
      testId: test.id,
      type: QuestionType.MCQ,
      prompt: '2 + 3 = ?',
      options: ['4', '5', '6', '7'],
      correctAnswer: '5',
      order: 1,
      marks: 1
    }
  });

  await prisma.question.create({
    data: {
      testId: test.id,
      type: QuestionType.SHORT_ANSWER,
      prompt: 'Write the name of the shape with 3 sides.',
      correctAnswer: 'Triangle',
      order: 2,
      marks: 2
    }
  });

  const homework = await prisma.homework.create({
    data: {
      title: 'Practice fractions',
      instructions: 'Solve the attached worksheet and upload your answer sheet.',
      subjectId: math.id,
      authorId: mathsTeacher.id,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
      attachments: []
    }
  });

  await prisma.announcement.create({
    data: {
      title: 'Welcome to EduNest',
      message: 'Tomorrow class starts at 6 PM. Please complete the homework before then.',
      audience: 'all',
      authorId: languageTeacher.id,
      pinned: true
    }
  });

  await prisma.attendance.create({
    data: {
      studentId: demoStudent.id,
      subjectId: math.id,
      date: new Date(),
      status: AttendanceStatus.PRESENT,
      markedById: mathsTeacher.id
    }
  });

  await prisma.note.create({
    data: {
      title: 'Fractions intro',
      description: 'Core handwritten notes for the student to review.',
      subjectId: math.id,
      chapterId: (await prisma.chapter.findFirst({ where: { subjectId: math.id, slug: 'chapter-1' } }))!.id,
      type: NoteType.MIXED,
      images: [],
      pdfs: [],
      pageCount: 0,
      lastUpdated: new Date()
    }
  });

  await prisma.notification.create({
    data: {
      userId: demoStudent.id,
      title: 'Homework uploaded',
      body: `${homework.title} is now available.`,
      type: 'HOMEWORK',
      link: '/student/homework'
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Seed completed');
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });