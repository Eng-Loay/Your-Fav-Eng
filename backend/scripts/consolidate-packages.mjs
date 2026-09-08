import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const hidden = await prisma.membershipPackage.updateMany({
    where: { title: { in: ['Professional Membership', 'Fellow Membership'] } },
    data: { status: 'inactive' },
  });
  console.log('hid', hidden.count, 'package(s)');

  const allCourseIds = JSON.stringify([
    "e9a881f8-bf08-4719-8243-955ca420d3b8",
    "1012f841-4dff-4dc6-8d16-3c066ef8a388",
    "9fec78d8-9e7d-4b4a-8bec-6673fc9de353",
    "25127335-db22-4d6f-8924-34876e552b5d",
    "33390c80-476f-40dc-83d3-75c69a0bb6b7",
    "436e80e1-2a4a-4d36-975f-614d08377c25",
    "391a3c6d-8715-4941-8134-db67e8a7aee1",
    "06e87734-9fdf-41e8-99b0-006d3929ce56"
  ]);

  const updated = await prisma.membershipPackage.update({
    where: { title: 'Associate Membership' },
    data: {
      title: 'Programming & AI Course',
      titleAr: 'دورة البرمجة والذكاء الاصطناعي',
      description: 'A Programming & AI course for 2nd-year secondary (baccalaureate) students, taught by Eng. Loay Essam.',
      descriptionAr: 'دورة في البرمجة والذكاء الاصطناعي لطلاب الصف الثاني الثانوي (بكالوريا)، مع المهندس لؤي عصام.',
      level: 'Full Course',
      courseCount: 8,
      courseIds: allCourseIds,
      image: '/brand/loay/poster-programming-ai.png',
      position: 1,
    },
  });
  console.log('updated package:', updated.id, updated.title);
}
main().finally(() => prisma.$disconnect());
