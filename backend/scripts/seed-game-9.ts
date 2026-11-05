import { PrismaClient } from '@prisma/client';
import { randomUUID as id } from 'crypto';

const prisma = new PrismaClient();
const CHAPTER_ID = 'ccb7ac38-669b-4dc6-b43e-048fd4026999'; // Web Application Communication Methods

const tf = (question: string, correct: boolean) => ({ type: 'tf', question, points: 5, correct });
const mc = (question: string, correct: number, texts: string[]) => ({
  type: 'mc', question, points: 10,
  options: texts.map((text, i) => ({ id: id(), text, isCorrect: i === correct })),
});

const METHODS = ['GET', 'POST'];
const method = (question: string, correct: 'GET' | 'POST') => mc(question, METHODS.indexOf(correct), METHODS);
const PROTOCOLS = ['HTTP', 'API', 'HTTPS'];
const protocol = (question: string, correct: number) => mc(question, correct, PROTOCOLS);

const questions = [
  // Worked example: true or false
  tf('The client is the side that requests data or processing from the server, and the server is the side that returns the response.', true),
  tf('HTTPS is a communication protocol that adds encryption to HTTP.', true),
  tf('The GET method is for sending data to the server.', false),
  tf('Status code 404 indicates that the page is not found.', true),

  // Worked example (2): matching, one question per description
  protocol('Which term matches this description? A communication protocol for exchanging data between web browsers and servers.', 0),
  protocol('Which term matches this description? A system for exchanging data between different pieces of software.', 1),
  protocol('Which term matches this description? A communication protocol that adds encryption to HTTP.', 2),

  // Try 1: key terms
  mc('What is the term for the side that requests data or processing from the server (e.g., a web browser)?', 0, ['Client', 'Server', 'Database', 'Protocol']),
  mc('What is the term for the side that receives requests from clients, processes them, and returns responses?', 2, ['Client', 'Browser', 'Server', 'API']),
  mc('What is the term for the communication protocol that adds encryption to HTTP?', 1, ['API', 'HTTPS', 'GET', 'JSON']),
  mc('What is the term for the HTTP method for retrieving data from the server?', 3, ['POST', 'HTTPS', 'API', 'GET']),
  mc('What is the term for the system for exchanging data between different pieces of software?', 0, ['API', 'HTTP', 'HTTPS', 'Status code']),

  // Try 2
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

  // Pause & think
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

  // Think as an engineer: school web app
  method('A school web app lets students log in, view their timetable, and download a PDF. Which HTTP method fits loading a student’s grade history?', 'GET'),
  method('In the school web app, which HTTP method fits submitting the login form?', 'POST'),
  method('In the school web app, which HTTP method fits requesting today’s schedule from another school system?', 'GET'),
  mc('Requesting today’s schedule from another school system is done through which of these?', 1, [
    'A CSS file',
    'An API',
    'A status code',
    'A database table',
  ]),
  mc('Should the school web app’s login use HTTP or HTTPS, and why?', 3, [
    'HTTP, because it is encrypted.',
    'HTTP, because it is faster for passwords.',
    'HTTPS, because it changes the page appearance.',
    'HTTPS, because it encrypts the communication so passwords are not intercepted.',
  ]),

  // In a new context: weather API
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

  // Exercise 2: fill in the blanks (a)-(d)
  mc('A web application operates by communication between a (a) ____, which requests data or processing from the server, and a server.', 1, ['server', 'client', 'database', 'router']),
  mc('A web application operates by communication between a client and a (b) ____, which receives the request, processes it, and returns a response.', 0, ['server', 'client', 'browser', 'API']),
  mc('This communication uses a protocol called (c) ____.', 2, ['HTTPS', 'API', 'HTTP', 'JSON']),
  mc('The protocol that adds SSL/TLS encryption to HTTP is called (d) ____.', 3, ['API', 'GET', 'POST', 'HTTPS']),

  // Exercise 3 (1): GET or POST
  method('Which HTTP method is used for displaying a web page?', 'GET'),
  method('Which HTTP method is used for entering an ID and password into a login form and submitting them?', 'POST'),
  method('Which HTTP method is used for displaying search results?', 'GET'),
  method('Which HTTP method is used for submitting the contents of a contact form?', 'POST'),

  // Exercise 3 (2)
  mc('Choose the one that most appropriately describes HTTPS.', 2, [
    'A method for retrieving data from the server',
    'A system for exchanging data between different pieces of software',
    'A communication protocol that adds SSL/TLS encryption to HTTP',
    'A status code indicating that a problem has occurred on the server side',
  ]),

  // Exam-style question
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
  if (await prisma.lesson.findFirst({ where: { chapterId: CHAPTER_ID, type: 'GAME' } })) {
    console.log('Game already exists in this chapter, aborting');
    return;
  }
  const lesson = await prisma.lesson.create({
    data: { chapterId: CHAPTER_ID, title: 'Game 9', titleAr: 'Game 9', type: 'GAME', order: 2 },
  });
  const game = await prisma.lessonGame.create({ data: { lessonId: lesson.id, defaultTimerSeconds: 25 } });
  const mirrored: Array<Record<string, unknown>> = [];
  for (let i = 0; i < questions.length; i++) {
    const { type, question, points, ...rest } = questions[i] as { type: string; question: string; points: number };
    const row = await prisma.gameQuestion.create({
      data: { gameId: game.id, type, question, points, order: i, options: JSON.stringify(rest) },
    });
    mirrored.push({ id: row.id, type, question, points, ...rest });
  }
  // The content editor reads questions from Lesson.content; without this the preview is empty and "Save All" would wipe the game.
  await prisma.lesson.update({
    where: { id: lesson.id },
    data: { content: JSON.stringify({ settings: { defaultTimerSeconds: 25 }, questions: mirrored }) },
  });
  console.log('Game 9 created with', questions.length, 'questions, lesson', lesson.id);
}
main().finally(() => prisma.$disconnect());
