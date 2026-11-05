import 'dotenv/config';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { put } from '@vercel/blob';
import { randomUUID as uid } from 'crypto';

// Usage: tsx scripts/seed-web-application.ts <path-to-lesson-8.pdf>
const prisma = new PrismaClient();
const COURSE_ID = 'e8c75b96-e97b-41d6-821b-8cf0f1b6be51'; // Programming & AI (Languages Track)
const TEMPLATE_ASSIGNMENT_ID = 'cea2f71e-9c83-468e-98a4-12494cf548d6'; // HomeWork 6, used only for instructorId
const DESCRIPTION = 'Homework based on Lesson 3-1: The Overall Structure of Web Applications. Answer all questions.';

const mc = (question: string, correct: number, texts: string[]) => ({
  id: uid(), type: 'multiple_choice', question,
  options: texts.map((text, i) => ({ id: uid(), text, isCorrect: i === correct })),
});
const tf = (question: string, answer: boolean) => ({
  id: uid(), type: 'true_false', question,
  options: [{ id: uid(), text: 'True', isCorrect: answer }, { id: uid(), text: 'False', isCorrect: !answer }],
});

const TIERS = ['Frontend', 'Backend', 'Database'];
const tier = (question: string, correct: 'Frontend' | 'Backend' | 'Database') => mc(question, TIERS.indexOf(correct), TIERS);

const questions = [
  // 1. Key terms
  mc('What is the term for an application used through a web browser?', 2, ['Desktop application', 'Operating system', 'Web application', 'Compiler']),
  mc('What is the term for the screen component that users see directly?', 0, ['Frontend', 'Backend', 'Database', 'Server']),
  mc('What is the term for the part responsible for server-side processing that users do not see?', 1, ['Frontend', 'Backend', 'Database', 'Browser']),
  mc('What is the term for a system that organizes, stores, and manages data?', 3, ['Frontend', 'Backend', 'Browser', 'Database']),

  // 2. True or false
  tf('The frontend is the screen component that users see directly.', true),
  tf("The backend is the part that runs on the user's browser.", false),
  tf('A database is a system that organizes, stores, and manages data.', true),
  tf('A web application operates with the frontend alone.', false),

  // 3. Fill in the blanks
  mc('A web application is broadly composed of three tiers. The screen component that users see directly is called the (a) ____.', 0, ['frontend', 'backend', 'database', 'server']),
  mc('The part responsible for server-side processing that users do not see is called the (b) ____.', 2, ['frontend', 'database', 'backend', 'browser']),
  mc('A system that organizes, stores, and manages data is called the (c) ____.', 1, ['frontend', 'database', 'backend', 'browser']),

  // 4. Which tier?
  tier('When searching for a product on an online shopping site, which tier searches for data about products that match the search keywords?', 'Backend'),
  tier('E-commerce site: Product listing page', 'Frontend'),
  tier('E-commerce site: Stock checking processing', 'Backend'),
  tier('E-commerce site: Storage of customer information', 'Database'),
  tier('E-commerce site: Cart screen', 'Frontend'),
  tier('E-commerce site: Payment processing', 'Backend'),
  tier('E-commerce site: Storage of order history', 'Database'),
  tier('SNS: Timeline screen', 'Frontend'),
  tier('SNS: Processing that determines the audience for a post', 'Backend'),
  tier('SNS: Storage of post data', 'Database'),
  tier('SNS: Post screen', 'Frontend'),
  tier('SNS: Notification processing', 'Backend'),
  tier('SNS: Storage of follow relationships', 'Database'),

  // 5. Multiple choice
  mc('Choose the option that most appropriately describes the three-tier architecture of a web application.', 2, [
    'The frontend has the role of storing and managing data.',
    'The backend is the part that users interact with directly on the browser.',
    'In response to user actions, the frontend, backend, and database cooperate to perform processing.',
    'The database has the role of displaying screens to users.',
  ]),

  // 6. Think as an engineer (clinic appointment app)
  tier('A clinic web app lets patients book appointments. Which tier should handle the booking form, and why? (Patients see it and enter data there.)', 'Frontend'),
  tier('Clinic web app: which tier should handle checking which time slots are free, since it processes the request and decides which slots are free?', 'Backend'),
  tier('Clinic web app: which tier should handle storing past visits, since it stores and manages the records?', 'Database'),
  mc('The booking page opens normally, but no free slots appear on screen. Which tier is clearly working, and which has probably failed?', 1, [
    'The backend is clearly working; the frontend has probably failed.',
    'The frontend is clearly working; the backend (or the database it reads from) has probably failed.',
    'The database is clearly working; the frontend has probably failed.',
    'Nothing can be concluded about any tier.',
  ]),

  // 7. In a new context (weather app)
  tier('A weather app lets users type a city and see the forecast. Which tier takes the city name?', 'Frontend'),
  tier('Weather app: which tier looks up the forecast data?', 'Backend'),
  tier('Weather app: which tier stores past forecasts?', 'Database'),
  mc('Which of these jobs can the frontend NOT do on its own in the weather app?', 3, [
    'Showing the city input box',
    'Showing the forecast result on the screen',
    'Taking the city name typed by the user',
    'Looking up and storing forecast data',
  ]),

  // 8. Exam-style question (user posts a photo)
  mc('When a user posts a photo on a social media app, which sequence best describes how the three tiers cooperate?', 0, [
    'The frontend sends the post to the backend; the backend processes it and saves the data in the database; the frontend then displays the new post.',
    'The database sends the photo to the frontend; the frontend processes it and saves it in the backend.',
    'The backend displays the post on the screen; the frontend stores the photo in the database.',
    'The photo is shown on the screen without any processing or storage.',
  ]),
];

async function main() {
  const file = process.argv[2];
  if (!file || !fs.existsSync(file)) throw new Error('Pass the path to the Lesson 8 PDF as the first argument');

  const tpl = await prisma.courseAssignment.findUnique({ where: { id: TEMPLATE_ASSIGNMENT_ID } });
  if (!tpl) throw new Error('Template assignment not found');
  if (await prisma.chapter.findFirst({ where: { courseId: COURSE_ID, title: 'Web Application' } })) {
    console.log('"Web Application" section already exists, aborting');
    return;
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN is not configured');
  const blob = await put(`uploads/${uid()}.pdf`, fs.readFileSync(file), {
    access: 'public', token, contentType: 'application/pdf', addRandomSuffix: false,
  });

  const lastTop = await prisma.chapter.findFirst({ where: { courseId: COURSE_ID, parentId: null }, orderBy: { order: 'desc' } });
  const section = await prisma.chapter.create({
    data: { courseId: COURSE_ID, title: 'Web Application', titleAr: 'Web Application', order: (lastTop?.order ?? -1) + 1 },
  });
  const sub = await prisma.chapter.create({
    data: {
      courseId: COURSE_ID, parentId: section.id, order: 0,
      title: 'The Overall Structure of Web Applications', titleAr: 'The Overall Structure of Web Applications',
    },
  });
  await prisma.lesson.create({
    data: { chapterId: sub.id, title: 'Lesson 8', titleAr: 'Lesson 8', type: 'PDF', order: 0, pdfUrl: blob.url, allowDownload: true },
  });
  const lesson = await prisma.lesson.create({
    data: {
      chapterId: sub.id, title: 'HomeWork 8', titleAr: 'HomeWork 8', type: 'ASSIGNMENT', order: 1, allowDownload: false,
      content: JSON.stringify({ description: DESCRIPTION, dueDate: '', totalPoints: 100, gradingType: 'AUTO', questions }),
    },
  });
  await prisma.courseAssignment.create({
    data: {
      title: 'HomeWork 8', titleAr: 'HomeWork 8', description: DESCRIPTION, gradingType: 'AUTO',
      content: JSON.stringify({ questions }), courseId: COURSE_ID, instructorId: tpl.instructorId,
      lessonId: lesson.id, totalPoints: 100, status: 'active',
    },
  });
  console.log('Created section', section.id, 'subsection', sub.id, 'PDF', blob.url, 'HomeWork 8 with', questions.length, 'questions');
}
main().finally(() => prisma.$disconnect());
