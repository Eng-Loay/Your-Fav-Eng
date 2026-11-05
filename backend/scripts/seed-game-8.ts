import { PrismaClient } from '@prisma/client';
import { randomUUID as id } from 'crypto';

const prisma = new PrismaClient();
const CHAPTER_ID = '2215f97e-11cb-4193-870c-198ff0995427'; // The Overall Structure of Web Applications

const tf = (question: string, correct: boolean) => ({ type: 'tf', question, points: 5, correct });
const mc = (question: string, correct: number, texts: string[]) => ({
  type: 'mc', question, points: 10,
  options: texts.map((text, i) => ({ id: id(), text, isCorrect: i === correct })),
});
const ms = (question: string, correct: number[], texts: string[]) => ({
  type: 'ms', question, points: 15,
  options: texts.map((text, i) => ({ id: id(), text, isCorrect: correct.includes(i) })),
});
const di = (question: string, answers: string[], displayAnswer: string) => ({ type: 'di', question, points: 10, answers, displayAnswer });
const match = (question: string, choices: string[], items: Array<[string, number]>) => {
  const ch = choices.map((label) => ({ id: id(), label }));
  return { type: 'match', question, points: 15, choices: ch, items: items.map(([text, c]) => ({ id: id(), text, correctChoiceId: ch[c].id })) };
};

const TIERS = ['Frontend', 'Backend', 'Database'];
// One multiple-choice question per item, instead of one big matching question.
const eachTier = (prefix: string, items: Array<[string, number]>) =>
  items.map(([text, c]) => mc(`${prefix}${text}`, c, TIERS));
const FE = 0, BE = 1, DB = 2;

const questions = [
  // Worked example: true or false
  tf('The frontend is the screen component that users see directly.', true),
  tf("The backend is the part that runs on the user's browser.", false),
  tf('A database is a system that organizes, stores, and manages data.', true),
  tf('A web application operates with the frontend alone.', false),

  // Worked example (2): match descriptions to tiers
  ...eachTier('Which tier is this? ', [
    ['The part responsible for server-side processing that users do not see', BE],
    ['The screen component that users interact with directly', FE],
    ['A system that organizes, stores, and manages data', DB],
  ]),

  // Try 1: key terms (multiple choice)
  mc('What is the term for an application used through a web browser?', 2, ['Desktop application', 'Operating system', 'Web application', 'Compiler']),
  mc('What is the term for the screen component that users see directly?', 0, ['Frontend', 'Backend', 'Database', 'Server']),
  mc('What is the term for the part responsible for server-side processing that users do not see?', 1, ['Frontend', 'Backend', 'Database', 'Browser']),
  mc('What is the term for a system that organizes, stores, and manages data?', 3, ['Frontend', 'Backend', 'Browser', 'Database']),

  // Try 2: which tier
  mc('When searching for a product on an online shopping site, which tier searches through data for products that match the search keywords?', 1, TIERS),
  ...eachTier('E-commerce site: which tier does this belong to? ', [
    ['Product listing page', FE],
    ['Stock checking processing', BE],
    ['Storage of customer information', DB],
    ['Cart screen', FE],
    ['Payment processing', BE],
    ['Storage of order history', DB],
  ]),

  // Exercise 2: fill in the blanks (multiple choice per blank)
  mc('A web application is broadly composed of three tiers. The screen component that users see directly is called the (a) ____.', 0, ['frontend', 'backend', 'database', 'server']),
  mc('The part responsible for server-side processing that users do not see is called the (b) ____.', 2, ['frontend', 'database', 'backend', 'browser']),
  mc('A system that organizes, stores, and manages data is called the (c) ____.', 1, ['frontend', 'database', 'backend', 'browser']),

  // Exercise 3: SNS
  ...eachTier('SNS: which tier does this belong to? ', [
    ['Timeline screen', FE],
    ['Processing that determines the audience for a post', BE],
    ['Storage of post data', DB],
    ['Post screen', FE],
    ['Notification processing', BE],
    ['Storage of follow relationships', DB],
  ]),
  mc('Choose the one that most appropriately describes the three-tier architecture of a web application.', 2, [
    'The frontend has the role of storing and managing data.',
    'The backend is the part that users interact with directly on the browser.',
    'In response to user actions, the frontend, backend, and database cooperate to perform processing.',
    'The database has the role of displaying screens to users.',
  ]),

  // Flow of the three tiers
  mc('When you search for a product, the frontend sends the search keywords to the backend. What does the backend do next?', 0, [
    'It searches the database for products that match the criteria.',
    'It displays the results directly on the screen.',
    'It deletes the keywords from the browser.',
    'It sends the keywords back to the user unchanged.',
  ]),

  // Think as an engineer: clinic
  mc('A clinic web app: the booking page opens normally, but no free time slots appear. Which tier is clearly working?', 0, [
    'The frontend, because the page opens and displays.',
    'The backend, because it found the free slots.',
    'The database, because it displayed the page.',
    'None of the tiers.',
  ]),

  // In a new context: weather app
  ...eachTier('Weather app (users type a city and see the forecast): which tier does this job? ', [
    ['Taking the city name', FE],
    ['Looking up the forecast data', BE],
    ['Storing past forecasts', DB],
  ]),
  mc('In the weather app, which job can the frontend NOT do on its own?', 3, [
    'Showing the city input box',
    'Showing the forecast on the screen',
    'Taking the city name typed by the user',
    'Looking up and storing forecast data',
  ]),
];

async function main() {
  if (await prisma.lesson.findFirst({ where: { chapterId: CHAPTER_ID, type: 'GAME' } })) {
    console.log('Game already exists in this chapter, aborting');
    return;
  }
  const lesson = await prisma.lesson.create({
    data: { chapterId: CHAPTER_ID, title: 'Game 8', titleAr: 'Game 8', type: 'GAME', order: 2 },
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
  console.log('Game 8 created with', questions.length, 'questions, lesson', lesson.id);
}
main().finally(() => prisma.$disconnect());
