const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  // Fix the GAME lesson's content cache from its real GameQuestion rows
  const game = await p.lessonGame.findUnique({
    where: { lessonId: '2cb74b3f-6596-4154-af8e-9c839cf53b17' },
    include: { questions: { orderBy: { order: 'asc' } } },
  });
  const gameQuestions = game.questions.map((q) => ({
    id: q.id,
    type: q.type,
    question: q.question,
    points: q.points,
    ...JSON.parse(q.options),
  }));
  const gameContent = JSON.stringify({ questions: gameQuestions, settings: { defaultTimerSeconds: game.defaultTimerSeconds } });
  await p.lesson.update({ where: { id: '2cb74b3f-6596-4154-af8e-9c839cf53b17' }, data: { content: gameContent } });
  console.log('fixed game lesson content, length:', gameContent.length);

  // Fix the ASSIGNMENT lesson's content cache from its real CourseAssignment row
  const assignment = await p.courseAssignment.findUnique({ where: { lessonId: '04adb396-6613-4120-abfe-abdf3c91eecc' } });
  const assignmentQuestions = JSON.parse(assignment.content).questions;
  const assignmentContent = JSON.stringify({
    description: assignment.description,
    dueDate: assignment.dueDate ? assignment.dueDate.toISOString().slice(0, 10) : '',
    totalPoints: assignment.totalPoints,
    gradingType: assignment.gradingType,
    questions: assignmentQuestions,
  });
  await p.lesson.update({ where: { id: '04adb396-6613-4120-abfe-abdf3c91eecc' }, data: { content: assignmentContent } });
  console.log('fixed assignment lesson content, length:', assignmentContent.length);

  await p.$disconnect();
})();
