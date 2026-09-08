/**
 * Adds default quiz questions to QUIZ lessons that don't have any.
 * Run: npx tsx scripts/seed-quiz-questions.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_QUESTIONS = [
  {
    question: 'What did you learn in this chapter?',
    questionAr: 'ماذا تعلمت في هذا الفصل؟',
    type: 'multiple_choice',
    options: JSON.stringify([
      { id: 'a', text: 'Option A', textAr: 'الخيار أ', textEn: 'Option A', isCorrect: false },
      { id: 'b', text: 'Option B', textAr: 'الخيار ب', textEn: 'Option B', isCorrect: true },
      { id: 'c', text: 'Option C', textAr: 'الخيار ج', textEn: 'Option C', isCorrect: false },
    ]),
    correctAnswer: 'b',
    points: 1,
    order: 0,
  },
  {
    question: 'Is this course helpful?',
    questionAr: 'هل هذه الدورة مفيدة؟',
    type: 'multiple_choice',
    options: JSON.stringify([
      { id: 'yes', text: 'Yes', textAr: 'نعم', textEn: 'Yes', isCorrect: true },
      { id: 'no', text: 'No', textAr: 'لا', textEn: 'No', isCorrect: false },
    ]),
    correctAnswer: 'yes',
    points: 1,
    order: 1,
  },
];

async function main() {
  const quizLessons = await prisma.lesson.findMany({
    where: { type: 'QUIZ' },
    include: {
      _count: { select: { quizzes: true } },
    },
  });

  const emptyLessons = quizLessons.filter((l) => l._count.quizzes === 0);
  if (emptyLessons.length === 0) {
    console.log('All QUIZ lessons already have questions.');
    return;
  }

  for (const lesson of emptyLessons) {
    await prisma.quiz.createMany({
      data: DEFAULT_QUESTIONS.map((q) => ({
        lessonId: lesson.id,
        ...q,
      })),
    });
    console.log(`Added ${DEFAULT_QUESTIONS.length} questions to lesson: ${lesson.titleAr || lesson.title}`);
  }

  console.log(`Done. Updated ${emptyLessons.length} lesson(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
