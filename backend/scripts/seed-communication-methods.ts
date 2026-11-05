import 'dotenv/config';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { put } from '@vercel/blob';
import { randomUUID as uid } from 'crypto';

// Usage: tsx scripts/seed-communication-methods.ts <path-to-lesson-9.pdf>
const prisma = new PrismaClient();
const COURSE_ID = 'e8c75b96-e97b-41d6-821b-8cf0f1b6be51'; // Programming & AI (Languages Track)
const SECTION_ID = 'd3195289-61f1-46fa-9612-86ba4592766a'; // Web Application (Unit 3)
const TEMPLATE_ASSIGNMENT_ID = 'cea2f71e-9c83-468e-98a4-12494cf548d6'; // HomeWork 6, used only for instructorId
const SUBSECTION_TITLE = 'Web Application Communication Methods';
const DESCRIPTION = 'Homework based on Lesson 3-2: Web Application Communication Methods. Answer all questions.';

const mc = (question: string, correct: number, texts: string[]) => ({
  id: uid(), type: 'multiple_choice', question,
  options: texts.map((text, i) => ({ id: uid(), text, isCorrect: i === correct })),
});
const tf = (question: string, answer: boolean) => ({
  id: uid(), type: 'true_false', question,
  options: [{ id: uid(), text: 'True', isCorrect: answer }, { id: uid(), text: 'False', isCorrect: !answer }],
});

const METHODS = ['GET', 'POST'];
const method = (question: string, correct: 'GET' | 'POST') => mc(question, METHODS.indexOf(correct), METHODS);
const PROTOCOLS = ['HTTP', 'API', 'HTTPS'];
const protocol = (question: string, correct: number) => mc(question, correct, PROTOCOLS);

const questions = [
  // 1. Key terms
  mc('What is the term for the side that requests data or processing from the server (e.g., a web browser)?', 0, ['Client', 'Server', 'Database', 'Protocol']),
  mc('What is the term for the side that receives requests from clients, processes them, and returns responses?', 2, ['Client', 'Browser', 'Server', 'API']),
  mc('What is the term for the communication protocol that adds encryption to HTTP?', 1, ['API', 'HTTPS', 'GET', 'JSON']),
  mc('What is the term for the HTTP method for retrieving data from the server?', 3, ['POST', 'HTTPS', 'API', 'GET']),
  mc('What is the term for the system for exchanging data between different pieces of software?', 0, ['API', 'HTTP', 'HTTPS', 'Status code']),

  // 2. True or false
  tf('The client is the side that requests data or processing from the server, and the server is the side that returns the response.', true),
  tf('HTTPS is a communication protocol that adds encryption to HTTP.', true),
  tf('The GET method is for sending data to the server.', false),
  tf('Status code 404 indicates that the page is not found.', true),

  // 3. Matching (one question per description)
  protocol('Which term matches this description? A communication protocol for exchanging data between web browsers and servers.', 0),
  protocol('Which term matches this description? A system for exchanging data between different pieces of software.', 1),
  protocol('Which term matches this description? A communication protocol that adds encryption to HTTP.', 2),

  // 4. Fill in the blanks
  mc('A web application operates by communication between a (a) ____, which requests data or processing from the server, and a server.', 1, ['server', 'client', 'database', 'router']),
  mc('A web application operates by communication between a client and a (b) ____, which receives the request, processes it, and returns a response.', 0, ['server', 'client', 'browser', 'API']),
  mc('This communication uses a protocol called (c) ____.', 2, ['HTTPS', 'API', 'HTTP', 'JSON']),
  mc('The protocol that adds SSL/TLS encryption to HTTP is called (d) ____.', 3, ['API', 'GET', 'POST', 'HTTPS']),

  // 5. GET or POST?
  method('Which HTTP method is used for displaying a webpage?', 'GET'),
  method('Which HTTP method is used for entering an ID and password into a login form and submitting them?', 'POST'),
  method('Which HTTP method is used for displaying search results?', 'GET'),
  method('Which HTTP method is used for submitting the contents of a contact form?', 'POST'),

  // 6. Multiple choice
  mc('Choose the combination of status code and meaning that is NOT appropriate.', 2, [
    '200 — The request was processed successfully',
    '404 — Page not found',
    '500 — The request was processed successfully',
    '500 — A problem occurred on the server side',
  ]),
  mc('Choose the one that most appropriately describes an API.', 1, [
    'A technology for adjusting the appearance of web pages',
    'A system for exchanging data between different pieces of software',
    'A technology for encrypting data and sending it safely',
    'An HTTP method for retrieving data from the server',
  ]),

  // 7. Think and explain
  mc('Why should a login page use HTTPS rather than plain HTTP?', 0, [
    'A login page sends an ID and password; HTTPS encrypts the communication, so the risk of the password being read by a third party is reduced.',
    'HTTPS makes the login page load faster than HTTP.',
    'HTTPS changes the appearance of the login page.',
    'HTTP cannot send an ID and password at all.',
  ]),
  mc('If a browser receives status code 404, what should it tell the user, and whose side had the problem?', 2, [
    '"Server error"; the server side had a problem.',
    '"Request processed successfully"; nobody had a problem.',
    '"Page not found"; the requested URL does not exist, and it is not a server-side error (that would be 500).',
    '"Access denied"; the user must log in again.',
  ]),

  // 8. In a new context (weather API)
  method('A weather service offers an API that returns today’s forecast when a client sends a request. Which HTTP method should the client use to retrieve the forecast?', 'GET'),
  mc('Why should the weather service use HTTPS?', 1, [
    'Because HTTPS makes the forecast more accurate.',
    'Because HTTPS encrypts the communication, so third parties cannot easily read it.',
    'Because HTTPS removes the need for a server.',
    'Because HTTPS is the only way to send a GET request.',
  ]),
  mc('What is one advantage of receiving the forecast data as JSON?', 3, [
    'It encrypts the data automatically.',
    'It makes the data smaller than any other format.',
    'It replaces the need for an API.',
    'It is easy for humans to read and for computers to process.',
  ]),

  // 9. Exam-style question
  mc('Which sequence best describes what happens when a browser requests a web page?', 0, [
    'The browser (client) sends a request with the GET method; the server processes it and returns a response with a status code such as 200; the browser then displays the page.',
    'The server sends a request to the browser; the browser returns a status code; the server displays the page.',
    'The browser sends a response; the server sends a request with the POST method; the page is never displayed.',
    'The browser displays the page first and then sends the request to the server.',
  ]),
  mc('In the response to a web page request, which status code means the request succeeded, and which means the page was not found?', 2, [
    '404 means success and 200 means not found.',
    '500 means success and 404 means not found.',
    '200 means success and 404 means not found.',
    '200 means success and 500 means not found.',
  ]),
];

async function main() {
  const file = process.argv[2];
  if (!file || !fs.existsSync(file)) throw new Error('Pass the path to the Lesson 9 PDF as the first argument');

  const tpl = await prisma.courseAssignment.findUnique({ where: { id: TEMPLATE_ASSIGNMENT_ID } });
  const section = await prisma.chapter.findUnique({ where: { id: SECTION_ID } });
  if (!tpl || !section) throw new Error('Template assignment or "Web Application" section not found');
  if (await prisma.chapter.findFirst({ where: { parentId: SECTION_ID, title: SUBSECTION_TITLE } })) {
    console.log(`"${SUBSECTION_TITLE}" already exists, aborting`);
    return;
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN is not configured');
  const blob = await put(`uploads/${uid()}.pdf`, fs.readFileSync(file), {
    access: 'public', token, contentType: 'application/pdf', addRandomSuffix: false,
  });

  const lastSub = await prisma.chapter.findFirst({ where: { parentId: SECTION_ID }, orderBy: { order: 'desc' } });
  const sub = await prisma.chapter.create({
    data: { courseId: COURSE_ID, parentId: SECTION_ID, order: (lastSub?.order ?? -1) + 1, title: SUBSECTION_TITLE, titleAr: SUBSECTION_TITLE },
  });
  await prisma.lesson.create({
    data: { chapterId: sub.id, title: 'Lesson 9', titleAr: 'Lesson 9', type: 'PDF', order: 0, pdfUrl: blob.url, allowDownload: true },
  });
  // The content editor reads/writes Lesson.content; keep it in sync so the preview works and "Save All" can't wipe the homework.
  const lesson = await prisma.lesson.create({
    data: {
      chapterId: sub.id, title: 'HomeWork 9', titleAr: 'HomeWork 9', type: 'ASSIGNMENT', order: 1, allowDownload: false,
      content: JSON.stringify({ description: DESCRIPTION, dueDate: '', totalPoints: 100, gradingType: 'AUTO', questions }),
    },
  });
  await prisma.courseAssignment.create({
    data: {
      title: 'HomeWork 9', titleAr: 'HomeWork 9', description: DESCRIPTION, gradingType: 'AUTO',
      content: JSON.stringify({ questions }), courseId: COURSE_ID, instructorId: tpl.instructorId,
      lessonId: lesson.id, totalPoints: 100, status: 'active',
    },
  });
  console.log('Created subsection', sub.id, 'PDF', blob.url, 'HomeWork 9 with', questions.length, 'questions');
}
main().finally(() => prisma.$disconnect());
