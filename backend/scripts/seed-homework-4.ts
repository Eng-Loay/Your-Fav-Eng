import { PrismaClient } from '@prisma/client';
import { randomUUID as uid } from 'crypto';

const prisma = new PrismaClient();
const CHAPTER_ID = '534d72f7-da88-43e5-b5a9-1a5c26637a8f';
const TEMPLATE_ASSIGNMENT_ID = '250a0c7d-30e9-4137-b915-bdff8592c55b';

const mc = (question: string, correct: number, texts: string[]) => ({
  id: uid(), type: 'multiple_choice', question,
  options: texts.map((text, i) => ({ id: uid(), text, isCorrect: i === correct })),
});
const tf = (question: string, answer: boolean) => ({
  id: uid(), type: 'true_false', question,
  options: [{ id: uid(), text: 'True', isCorrect: answer }, { id: uid(), text: 'False', isCorrect: !answer }],
});

const DEF = {
  bias: 'Bias in AI judgments caused by improper or biased training data and proxies.',
  xai: 'Technology that allows humans to understand how an AI arrived at a judgment.',
  fair: 'Ensuring AI does not unjustly discriminate against any particular person or group.',
  priv: 'Handling personal data appropriately and protecting user information from misuse.',
  acc: 'Being answerable and responsible for the decisions and actions of an AI system.',
};
const defs = (correct: keyof typeof DEF, others: Array<keyof typeof DEF>) => {
  const keys = [correct, ...others];
  return { texts: keys.map((k) => DEF[k]), correct: 0 };
};
let rot = 0;
const term = (name: string, correct: keyof typeof DEF, others: Array<keyof typeof DEF>) => {
  const d = defs(correct, others);
  const shift = rot++ % d.texts.length;
  const texts = [...d.texts.slice(shift), ...d.texts.slice(0, shift)];
  return mc(`Which definition matches the term "${name}"?`, texts.indexOf(DEF[correct]), texts);
};

const questions = [
  term('Algorithmic Bias', 'bias', ['xai', 'fair', 'acc']),
  term('Explainable AI (XAI)', 'xai', ['acc', 'priv', 'bias']),
  term('Fairness', 'fair', ['priv', 'bias', 'xai']),
  term('Privacy Protection', 'priv', ['acc', 'xai', 'fair']),
  term('Accountability', 'acc', ['fair', 'priv', 'bias']),
  tf("If an AI system's decision-making process is opaque (a 'black box'), there is no issue as long as the result is correct.", false),
  tf('Algorithmic bias can occur when past human discriminatory tendencies are present in the training dataset.', true),
  tf('When an AI system causes harm or makes an incorrect judgment, legal and ethical responsibility is already universally determined.', false),
  tf('Using face-recognition technology in public spaces can raise privacy concerns despite potential safety benefits.', true),
  mc('Which of the following is NOT an appropriate cause of algorithmic bias in AI systems?', 2, [
    'Insufficient or unrepresentative training data on certain attributes.',
    'Past human discriminatory tendencies reflected in the data.',
    'The processing speed and hardware execution time of the computer.',
    'Inappropriate choice of proxy variables that stand in for protected attributes.',
  ]),
  mc('What term refers to an AI system whose decision-making process is completely opaque and hidden from human review?', 1, [
    'Open-Source Engine', 'Black-Box Problem', 'Proxy Variable Network', 'Algorithmic Transparency',
  ]),
  mc('A school installs automated face-recognition cameras at the gate to track attendance. Which ethical issue is MOST directly raised by collecting and tracking this biometric data?', 1, [
    'Processing Speed Bottleneck', 'Privacy and Data Security Concerns', 'High Hardware Maintenance Cost', 'Lack of Model Scalability',
  ]),
  mc('If a company uses a hiring AI that unfairly rates female candidates lower due to historical male-dominated hiring data, which principle of AI ethics is violated?', 1, [
    'Computational Efficiency', 'Fairness', 'Model Design Flexibility', 'System Interoperability',
  ]),
  mc("Disclosing an AI system's decision-making process and inner workings to users in an easy-to-understand manner corresponds to which AI principle?", 1, [
    'Accountability', 'Transparency', 'Privacy Protection', 'Data Compression',
  ]),
];

async function main() {
  const tpl = await prisma.courseAssignment.findUnique({ where: { id: TEMPLATE_ASSIGNMENT_ID } });
  const chapter = await prisma.chapter.findUnique({ where: { id: CHAPTER_ID } });
  if (!tpl || !chapter) throw new Error('Template assignment or chapter not found');
  if (await prisma.lesson.findFirst({ where: { chapterId: CHAPTER_ID, type: 'ASSIGNMENT' } })) {
    console.log('Assignment already exists in this chapter, aborting');
    return;
  }
  const lesson = await prisma.lesson.create({
    data: { chapterId: CHAPTER_ID, title: 'HomeWork 4', titleAr: 'HomeWork 4', type: 'ASSIGNMENT', order: 2 },
  });
  await prisma.courseAssignment.create({
    data: {
      title: 'HomeWork 4',
      titleAr: 'HomeWork 4',
      description: 'Homework based on Lesson 1-4: Ethical Issues with AI. Answer all questions.',
      gradingType: 'AUTO',
      content: JSON.stringify({ questions }),
      courseId: chapter.courseId,
      instructorId: tpl.instructorId,
      lessonId: lesson.id,
      totalPoints: 100,
      status: 'active',
    },
  });
  console.log('HomeWork 4 created with', questions.length, 'questions, lesson', lesson.id);
}
main().finally(() => prisma.$disconnect());
