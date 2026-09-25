import { PrismaClient } from '@prisma/client';
import { randomUUID as uid } from 'crypto';

const prisma = new PrismaClient();
let n = 0;
const mc = (question: string, correct: string, wrong: string[]) => {
  const texts = [...wrong];
  texts.splice(n++ % (wrong.length + 1), 0, correct);
  return { id: uid(), type: 'multiple_choice', question, options: texts.map((text) => ({ id: uid(), text, isCorrect: text === correct })) };
};
const tf = (question: string, answer: boolean) => ({
  id: uid(), type: 'true_false', question,
  options: [{ id: uid(), text: 'True', isCorrect: answer }, { id: uid(), text: 'False', isCorrect: !answer }],
});
const ms = (question: string, correct: string[], wrong: string[]) => ({
  id: uid(), type: 'multi_select', question,
  options: [...correct, ...wrong].map((text) => ({ id: uid(), text, isCorrect: correct.includes(text) })),
});

const ML = 'Machine learning', DL = 'Deep learning', GAI = 'Generative AI', AI = 'AI';
const hw2 = [
  tf('Machine learning is one of the technologies that makes AI work.', true),
  tf('Deep learning is a completely different technology from machine learning.', false),
  tf('Generative AI is a technology that uses deep learning to generate new data.', true),
  tf('AI and machine learning have the same meaning.', false),
  mc('Which term describes a technology that learns patterns from data to make predictions and judgments?', ML, [DL, GAI, 'Neural network']),
  mc('Which term describes a technology that uses neural networks to learn complex patterns?', DL, [ML, GAI, 'Spam filter']),
  mc('Which term describes AI technology that generates new data such as text and images?', GAI, [ML, DL, 'Speech recognition']),
  mc('What is the general term, expressed by a two-letter abbreviation, for technologies that reproduce or perform intelligent human behavior on a computer?', AI, ['ML', 'DL', 'PC']),
  mc('Which is the correct relationship between AI, machine learning, deep learning, and generative AI?', 'AI > Machine Learning > Deep Learning > Generative AI', [
    'AI > Deep Learning > Machine Learning > Generative AI',
    'Machine Learning > AI > Generative AI > Deep Learning',
    'Generative AI > Deep Learning > Machine Learning > AI',
  ]),
  mc('Which one is NOT an appropriate example of generative AI?', 'Spam filter', ['ChatGPT', 'Image generation AI', 'Audio generation AI']),
  mc('The general term for technologies that reproduce or perform intelligent human behavior on a computer is ( a ). What is ( a )?', AI, [ML, DL, GAI]),
  mc('One of the learning technologies that makes AI work by learning patterns from data is ( b ). What is ( b )?', ML, [AI, DL, GAI]),
  mc('Within machine learning, an advanced technology that uses neural networks is ( c ). What is ( c )?', DL, [AI, ML, GAI]),
  mc('The technology that uses deep learning to generate new data is ( d ). What is ( d )?', GAI, [AI, ML, DL]),
  mc('Automatically sorting spam emails is most closely related to:', ML, [DL, GAI]),
  mc('Recognizing pedestrians on the road in autonomous driving is most closely related to:', DL, [ML, GAI]),
  mc('Automatically generating new images from text is most closely related to:', GAI, [ML, DL]),
  mc("Recommending products based on a user's purchase history is most closely related to:", ML, [DL, GAI]),
  mc('Which statement most appropriately describes the relationship between AI, machine learning, deep learning, and generative AI?',
    'Machine learning is a type of AI, and deep learning is a type of machine learning.', [
      'AI is a type of machine learning, and generative AI is a type of AI.',
      'Deep learning and machine learning are completely different technologies.',
      'Generative AI is a technology that generates data without using machine learning.',
    ]),
];

const RS = 'Recommendation system', VA = 'Voice assistant', MT = 'Machine translation', FR = 'Face recognition';
const HC = 'Healthcare', AG = 'Agriculture', MF = 'Manufacturing', LG = 'Logistics';
const hw3 = [
  mc('What is the term for the system that predicts preferences from past behavior data and displays recommendations?', RS, [VA, MT, FR]),
  mc('What is the term for the AI technology that recognizes a voice, understands commands, and executes them?', VA, [RS, MT, FR]),
  mc('In which industry are image-diagnosis AIs used?', HC, [AG, MF, LG]),
  mc('In manufacturing, what is the term for the system that predicts product failures in advance?', 'Predictive maintenance', ['Route optimization', RS, FR]),
  mc('Which one does NOT belong to "what requires caution when using AI"?', 'Finding and classifying patterns', ['Ethical judgments', 'Judgments involving personal information or privacy', 'Final decision-making']),
  mc('Optimizing delivery routes is most closely related to which industry?', LG, [HC, AG, MF]),
  mc('Detecting diseases from X-ray images is most closely related to which industry?', HC, [AG, MF, LG]),
  mc('Detecting pests and diseases in crops is most closely related to which industry?', AG, [HC, MF, LG]),
  mc('Automating product quality inspection is most closely related to which industry?', MF, [HC, AG, LG]),
  mc("YouTube recommends videos that match the user's preferences. Which AI technology is used?", RS, [VA, MT, FR]),
  mc('Speaking to a smartphone to check the weather uses which AI technology?', VA, [RS, MT, FR]),
  mc("Translating a foreign-language website into one's native language uses which AI technology?", MT, [RS, VA, FR]),
  mc("A smartphone camera automatically detects a person's face. Which AI technology is used?", FR, [RS, VA, MT]),
  tf('AI is good at probabilistic reasoning and prediction based on data.', true),
  tf('AI is good at recognizing images, audio, and text.', true),
  tf('Ethical judgments can be left entirely to AI.', false),
  tf('AI judgments can become inaccurate when training data is biased.', true),
  ms('Select all options that AI excels at.',
    ['Finding features in images and text and classifying them', 'Probabilistic reasoning and prediction based on data', 'Recognition and generation of images, audio, and text'],
    ['Ethical judgments', 'Judgments involving personal information', 'Decision-making that bears responsibility for results']),
  mc('Which is NOT an appropriate description of services that use AI?', 'Machine translation is a system in which humans manually translate foreign languages.', [
    'A recommendation system predicts preferences from past behavior data and displays recommendations.',
    'A voice assistant recognizes a voice, understands commands, and executes them.',
    'Face recognition automatically detects and identifies human faces in photographs.',
  ]),
  ms('Select all that require caution when using AI.',
    ['Ethical judgments', 'Judgments involving personal information or privacy'],
    ['High-speed processing of large amounts of data', 'Recognition of images and audio']),
  mc("Recommendations of videos that match one's preferences on a video site come from a ( a ) system. What is ( a )?", 'Recommendation', ['Translation', 'Face recognition', 'Voice']),
];

async function main() {
  const jobs: Array<[string, string, unknown[], string]> = [
    ['1b509f30-5347-49e8-9279-4f35cb256922', 'HomeWork 2', hw2, 'Homework based on Lesson 1-2: How AI Works. Answer all questions.'],
    ['250a0c7d-30e9-4137-b915-bdff8592c55b', 'HonmWork 3', hw3, 'Homework based on Lesson 1-3: AI in Daily Life and Industry. Answer all questions.'],
  ];
  for (const [id, title, questions, description] of jobs) {
    const a = await prisma.courseAssignment.findUnique({ where: { id }, include: { submissions: true } });
    if (!a || a.title !== title || a.content || a.submissions.length > 0) {
      console.log('Skipping (unexpected state):', id);
      continue;
    }
    await prisma.courseAssignment.update({ where: { id }, data: { gradingType: 'AUTO', description, content: JSON.stringify({ questions }) } });
    console.log(title, 'updated with', questions.length, 'questions');
  }
}
main().finally(() => prisma.$disconnect());
