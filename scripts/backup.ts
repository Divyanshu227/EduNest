import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting local JSON database backup...');
  
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `db-backup-${timestamp}.json`);

  try {
    // Note: This fetches everything. For extremely large databases, you would need pagination.
    const data = {
      users: await prisma.user.findMany(),
      subjects: await prisma.subject.findMany(),
      chapters: await prisma.chapter.findMany(),
      notes: await prisma.note.findMany(),
      homework: await prisma.homework.findMany(),
      homeworkSubmissions: await prisma.homeworkSubmission.findMany(),
      tests: await prisma.test.findMany(),
      questions: await prisma.question.findMany(),
      testAttempts: await prisma.testAttempt.findMany(),
      attendance: await prisma.attendance.findMany(),
      announcements: await prisma.announcement.findMany(),
      notifications: await prisma.notification.findMany(),
      liveClasses: await prisma.liveClass.findMany(),
      parentStudents: await prisma.parentStudent.findMany(),
      feedbacks: await prisma.feedback.findMany(),
    };

    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
    console.log(`\nSuccess! Database securely backed up to:`);
    console.log(backupPath);
  } catch (error) {
    console.error('Failed to create backup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Fatal error during backup:', error);
  process.exit(1);
});
