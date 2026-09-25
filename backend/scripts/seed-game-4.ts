import { PrismaClient } from '@prisma/client';
import { randomUUID as id } from 'crypto';

const prisma = new PrismaClient();
const CHAPTER_ID = '534d72f7-da88-43e5-b5a9-1a5c26637a8f';

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

const PRINCIPLES = ['Fairness', 'Transparency', 'Privacy protection', 'Accountability'];

const questions = [
  tf('Algorithmic bias is bias in AI judgments caused by bias in the training data.', true),
  tf("Even if an AI's decision-making process is opaque, there is no problem as long as the result is correct.", false),
  tf("Explainable AI (XAI) is a technology that makes it possible for humans to understand the AI's reasoning.", true),
  tf('When an AI makes an incorrect judgment, who is responsible has already been clearly determined.', false),
  match('Match each description (a–d) with the most appropriate AI ethics basic principle.', PRINCIPLES, [
    ['Not unjustly discriminating against any particular person or group', 0],
    ["Showing the AI's decision-making process and inner workings clearly", 1],
    ['Handling personal information appropriately and protecting privacy', 2],
    ["Being answerable for the AI's decisions", 3],
  ]),
  di('What is the term for the phenomenon in which bias arises in AI judgments due to bias in the training data?', ['algorithmic bias', 'bias', 'ai bias'], 'Algorithmic bias'),
  di('What is the term for the technology that makes it possible for humans to understand why an AI made a particular judgment? (Give its three-letter abbreviation.)', ['xai', 'explainable ai'], 'XAI (Explainable AI)'),
  di('Among the basic principles of AI ethics, which principle requires not unjustly discriminating against any particular person or group?', ['fairness'], 'Fairness'),
  di('Among the basic principles of AI ethics, which principle requires handling personal information appropriately?', ['privacy protection', 'privacy'], 'Privacy protection'),
  mc('Choose the one that is NOT an appropriate cause of algorithmic bias.', 2, [
    'Training data is biased.',
    'Past discriminatory tendencies are reflected in the data.',
    'The processing speed of the computer is slow.',
    'There is insufficient data on certain attributes.',
  ]),
  ms('Choose all that are privacy issues associated with AI.', [0, 1], [
    'Individuals are identified and tracked through face-recognition technology.',
    'Online behavior data is collected and analyzed in large quantities.',
    'AI creates creative works.',
    'AI computation speed improves.',
  ]),
  {
    type: 'fill',
    question: 'Fill in the blanks (a)–(c).',
    points: 15,
    passage:
      'There is the issue of {{blank:a}}, in which bias arises in AI judgments due to bias in the training data. For the "black-box" problem, a technology called {{blank:b}} is being researched. When an AI makes an incorrect judgment, {{blank:c}} is questioned, but no clear standard has yet been established.',
    blanks: [
      { key: 'a', label: '(a)', answers: ['algorithmic bias'] },
      { key: 'b', label: '(b)', answers: ['explainable AI', 'XAI'] },
      { key: 'c', label: '(c)', answers: ['responsibility'] },
    ],
  },
  match('For each situation, indicate which AI ethics basic principle is most closely related.', PRINCIPLES, [
    ['Ensuring that a hiring AI evaluates fairly regardless of gender.', 0],
    ["Disclosing the AI's decision-making process to users in an easy-to-understand way.", 1],
    ['Not using collected personal data for purposes other than as originally intended.', 2],
    ["Being answerable when an AI's diagnostic result turns out to be wrong.", 3],
  ]),
  mc('Choose the one that most appropriately describes ethical issues with AI.', 2, [
    'There are no ethical issues with AI.',
    "Algorithmic bias is caused by the AI's processing speed.",
    'Bias in training data can cause discriminatory bias in AI judgments.',
    "Even if an AI's decision-making process is opaque, there is no problem for users.",
  ]),
];

async function main() {
  if (await prisma.lesson.findFirst({ where: { chapterId: CHAPTER_ID, type: 'GAME' } })) {
    console.log('Game already exists in this chapter, aborting');
    return;
  }
  const lesson = await prisma.lesson.create({
    data: { chapterId: CHAPTER_ID, title: 'Game 4', titleAr: 'Game 4', type: 'GAME', order: 1 },
  });
  const game = await prisma.lessonGame.create({ data: { lessonId: lesson.id, defaultTimerSeconds: 25 } });
  for (let i = 0; i < questions.length; i++) {
    const { type, question, points, ...rest } = questions[i] as { type: string; question: string; points: number };
    await prisma.gameQuestion.create({
      data: { gameId: game.id, type, question, points, order: i, options: JSON.stringify(rest) },
    });
  }
  console.log('Game 4 created with', questions.length, 'questions, lesson', lesson.id);
}
main().finally(() => prisma.$disconnect());
