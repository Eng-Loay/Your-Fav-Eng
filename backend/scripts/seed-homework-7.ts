import { PrismaClient } from '@prisma/client';
import { randomUUID as uid } from 'crypto';

const prisma = new PrismaClient();
const CHAPTER_ID = '8ae11a00-51e5-4c95-8da1-9fa3ff5d5f8a'; // Incident Response and Risk Management
const TEMPLATE_ASSIGNMENT_ID = 'cea2f71e-9c83-468e-98a4-12494cf548d6'; // HomeWork 6, used only for instructorId
const DESCRIPTION = 'Homework based on Lesson 2-3: Incident Response and Risk Management. Answer all questions.';

const mc = (question: string, correct: number, texts: string[]) => ({
  id: uid(), type: 'multiple_choice', question,
  options: texts.map((text, i) => ({ id: uid(), text, isCorrect: i === correct })),
});
const tf = (question: string, answer: boolean) => ({
  id: uid(), type: 'true_false', question,
  options: [{ id: uid(), text: 'True', isCorrect: answer }, { id: uid(), text: 'False', isCorrect: !answer }],
});

const questions = [
  // Essay 1 split into two auto-gradable questions
  mc('What is the purpose of the "Containment" stage in the incident response model?', 1, [
    'To delete the malware and remove the root cause of the incident',
    'To limit the scope of impact so that damage does not spread further, e.g. by disconnecting an infected computer from the network',
    'To restore the affected systems to normal operation',
    'To prepare procedures and tools before any incident occurs',
  ]),
  mc('What is the purpose of the "Eradication" stage in the incident response model?', 2, [
    'To isolate the infected computer from the network',
    'To detect that an incident has occurred',
    'To remove the cause of the incident, e.g. by deleting malware',
    'To improve procedures after the incident is over',
  ]),
  mc('Why does Containment come before Eradication?', 0, [
    'To stop the damage from growing first; eradication then removes the root cause so the incident cannot continue or return',
    'Because eradication is only possible after the system has been fully recovered',
    'Because containment permanently removes the malware from every system',
    'There is no reason; the order of the stages does not matter',
  ]),
  // Multiple choice 3
  mc('What term refers to the process of isolating the affected part or appropriately limiting its impact to prevent the problem from spreading?', 2, [
    'Preparation', 'Detection', 'Containment', 'Recovery',
  ]),
  // Essay 2 + Multiple choice 4
  mc('How is the level of risk calculated in the simplified matrix?', 1, [
    'Impact + Likelihood', 'Impact × Likelihood', 'Impact − Likelihood', 'Impact ÷ Likelihood',
  ]),
  mc('Which two main factors make up the size of a risk in the simplified model presented in the lesson?', 3, [
    'Cost and Time', 'Detection and Recovery', 'Preparation and Eradication', 'Impact and Likelihood',
  ]),
  // Essay 5 (risk matrix)
  mc('Using the Risk Assessment Matrix, what risk level results from MEDIUM impact and LOW likelihood?', 1, [
    'Very Low', 'Low', 'Medium', 'High',
  ]),
  mc('Using the Risk Assessment Matrix, what risk level results from LOW impact and HIGH likelihood?', 2, [
    'Low', 'High', 'Medium', 'Critical',
  ]),
  tf('Risks with both high impact and high likelihood are rated Critical and are the highest priority to address first.', true),
  tf('Because it is difficult to fix every risk at the same time, setting priorities lets the organization take measures systematically.', true),
  // Multiple choice 7
  mc('According to the Risk Assessment Matrix, which category is considered the highest priority and should be addressed first?', 2, [
    'Low impact and low likelihood',
    'Medium impact and medium likelihood',
    'High impact and high likelihood',
    'Low impact and high likelihood',
  ]),
  // Multiple choice 8
  mc('What is meant by the term "Impact" in the context of risk assessment?', 1, [
    'The likelihood of the event occurring',
    'The amount of harm if the risk occurs',
    'The speed of response to the security incident',
    'The number of times the incident has occurred',
  ]),
  tf('"Likelihood" describes how high the probability is that the risk will actually materialize.', true),
  // Essay 6 (overlap between stages)
  mc('Which is an example of overlap or repetition between incident response stages in real-world practice?', 3, [
    'The team skips Detection because Containment has already started',
    'Lessons learned are discarded once the incident is closed',
    'Recovery is always completed before Containment begins',
    'Signs of malware reappear during Recovery, so the team goes back to Eradication (and Containment) before recovering again',
  ]),
  mc('How can Detection overlap with Containment?', 0, [
    'While isolating one infected computer, the team may find more affected systems and has to detect and contain again',
    'Detection only starts after the incident has been fully recovered',
    'Containment makes Detection unnecessary for the rest of the incident',
    'Detection and Containment are the same stage under two names',
  ]),
  mc('How do "Lessons Learned" feed back into the incident response model?', 2, [
    'They replace the Detection stage in the next incident',
    'They are only used to assign blame for the incident',
    'Improving procedures after one incident prepares the organization for the next (back to Preparation)',
    'They are unrelated to any other stage',
  ]),
  tf('The stages are still carried out in order; the overlap is going back to an earlier stage when new information appears.', true),
  tf('Once a stage of incident response is completed, the team can never return to it.', false),
];

async function main() {
  const tpl = await prisma.courseAssignment.findUnique({ where: { id: TEMPLATE_ASSIGNMENT_ID } });
  const chapter = await prisma.chapter.findUnique({ where: { id: CHAPTER_ID } });
  if (!tpl || !chapter) throw new Error('Template assignment or chapter not found');
  if (await prisma.lesson.findFirst({ where: { chapterId: CHAPTER_ID, type: 'ASSIGNMENT' } })) {
    console.log('Assignment already exists in this chapter, aborting');
    return;
  }
  const lessonContent = JSON.stringify({
    description: DESCRIPTION,
    dueDate: '',
    totalPoints: 100,
    gradingType: 'AUTO',
    questions,
  });
  const lesson = await prisma.lesson.create({
    data: { chapterId: CHAPTER_ID, title: 'HomeWork 7', titleAr: 'HomeWork 7', type: 'ASSIGNMENT', order: 1, content: lessonContent, allowDownload: false },
  });
  await prisma.courseAssignment.create({
    data: {
      title: 'HomeWork 7',
      titleAr: 'HomeWork 7',
      description: DESCRIPTION,
      gradingType: 'AUTO',
      content: JSON.stringify({ questions }),
      courseId: chapter.courseId,
      instructorId: tpl.instructorId,
      lessonId: lesson.id,
      totalPoints: 100,
      status: 'active',
    },
  });
  console.log('HomeWork 7 created with', questions.length, 'questions, lesson', lesson.id);
}
main().finally(() => prisma.$disconnect());
