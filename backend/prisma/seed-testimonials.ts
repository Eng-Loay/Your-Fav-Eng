import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding testimonials/reviews...');

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true } });
  if (!admin) {
    console.log('No admin user found.');
    return;
  }

  const courses = await prisma.course.findMany({ take: 5, select: { id: true } });
  if (courses.length === 0) {
    console.log('No courses found. Creating a placeholder course for reviews...');
    const course = await prisma.course.create({
      data: {
        title: 'Dental Implantology Fundamentals',
        slug: 'dental-implantology-fundamentals',
        description: 'Comprehensive course on dental implant basics',
        instructorId: admin.id,
        price: 0,
        status: 'PUBLISHED',
      },
      select: { id: true },
    });
    courses.push(course);
  }

  const allUsers = await prisma.user.findMany({ take: 20, select: { id: true, name: true } });
  const userNames = [
    { nameAr: 'د. أحمد محمد', nameEn: 'Dr. Ahmed Mohamed' },
    { nameAr: 'د. سارة حسن', nameEn: 'Dr. Sara Hassan' },
    { nameAr: 'د. محمد علي', nameEn: 'Dr. Mohamed Ali' },
    { nameAr: 'د. فاطمة إبراهيم', nameEn: 'Dr. Fatma Ibrahim' },
    { nameAr: 'د. عمر خالد', nameEn: 'Dr. Omar Khaled' },
    { nameAr: 'د. نور الدين', nameEn: 'Dr. Nour Eldin' },
    { nameAr: 'د. هبة عبد الرحمن', nameEn: 'Dr. Heba Abdel Rahman' },
    { nameAr: 'د. كريم حسين', nameEn: 'Dr. Kareem Hussein' },
  ];

  const testimonials = [
    {
      rating: 5,
      commentEn: "Medex has been our go-to supplier for dental implants for over 3 years. The B&B implant system quality is exceptional, and their customer service is unmatched. Highly recommend for any dental practice!",
      commentAr: "ميدكس كانت المورد الأساسي لنا لزراعة الأسنان لأكثر من 3 سنوات. جودة نظام زراعة B&B استثنائية وخدمة العملاء لا مثيل لها. أنصح بشدة لأي عيادة أسنان!",
    },
    {
      rating: 5,
      commentEn: "The implantology course at Medex was a game-changer for my practice. Hands-on training with real cases and expert instructors. I've significantly improved my surgical skills.",
      commentAr: "دورة زراعة الأسنان في ميدكس غيرت مسار عيادتي. تدريب عملي مع حالات حقيقية ومدربين خبراء. لقد تحسنت مهاراتي الجراحية بشكل كبير.",
    },
    {
      rating: 5,
      commentEn: "Outstanding product range and competitive prices. The Powerbone implants and Dora biomaterials have given excellent results in my cases. Medex truly understands dental professionals' needs.",
      commentAr: "مجموعة منتجات متميزة وأسعار تنافسية. زراعات Powerbone ومواد Dora الحيوية أعطت نتائج ممتازة في حالاتي. ميدكس تفهم حقاً احتياجات أطباء الأسنان.",
    },
    {
      rating: 4,
      commentEn: "I've attended multiple workshops organized by Medex, and each one has been incredibly valuable. The combination of theoretical knowledge and practical skills is exactly what we need as dental practitioners.",
      commentAr: "حضرت عدة ورش عمل نظمتها ميدكس، وكل واحدة كانت قيمة للغاية. الجمع بين المعرفة النظرية والمهارات العملية هو بالضبط ما نحتاجه كأطباء أسنان.",
    },
    {
      rating: 5,
      commentEn: "Fast delivery, premium quality products, and excellent after-sales support. Medex is the best dental supplier I've worked with in my 15 years of practice. The Macros implant system is fantastic!",
      commentAr: "توصيل سريع ومنتجات عالية الجودة ودعم ممتاز بعد البيع. ميدكس أفضل مورد طب أسنان تعاملت معه خلال 15 سنة من الممارسة. نظام زراعة Macros رائع!",
    },
    {
      rating: 5,
      commentEn: "The Medex community has been invaluable for connecting with fellow dental professionals. Sharing cases, discussing techniques, and learning from each other has elevated my practice to a new level.",
      commentAr: "مجتمع ميدكس كان لا يقدر بثمن للتواصل مع زملاء طب الأسنان. مشاركة الحالات ومناقشة التقنيات والتعلم من بعضنا البعض رفع عيادتي لمستوى جديد.",
    },
    {
      rating: 4,
      commentEn: "Great selection of surgical instruments and biomaterials. The quality is consistent across all product lines. Medex provides everything I need for my implant surgeries in one place.",
      commentAr: "مجموعة رائعة من الأدوات الجراحية والمواد الحيوية. الجودة ثابتة عبر جميع خطوط المنتجات. ميدكس توفر كل ما أحتاجه لعمليات الزراعة في مكان واحد.",
    },
    {
      rating: 5,
      commentEn: "Medex's training programs are world-class. I completed their advanced GBR course and immediately applied the techniques in my practice. The results speak for themselves!",
      commentAr: "برامج تدريب ميدكس على مستوى عالمي. أكملت دورة GBR المتقدمة وطبقت التقنيات فوراً في عيادتي. النتائج تتحدث عن نفسها!",
    },
  ];

  await prisma.review.deleteMany({ where: { showOnHomepage: true } });

  for (let i = 0; i < testimonials.length; i++) {
    const t = testimonials[i];
    const names = userNames[i % userNames.length];
    const userId = allUsers[i % allUsers.length]?.id || admin.id;
    const courseId = courses[i % courses.length].id;

    const existing = await prisma.review.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) {
      await prisma.review.update({
        where: { id: existing.id },
        data: {
          rating: t.rating,
          comment: `${t.commentEn}\n---\n${t.commentAr}`,
          status: 'APPROVED',
          showOnHomepage: true,
        },
      });
    } else {
      await prisma.review.create({
        data: {
          userId,
          courseId,
          rating: t.rating,
          comment: `${t.commentEn}\n---\n${t.commentAr}`,
          status: 'APPROVED',
          showOnHomepage: true,
        },
      });
    }

    console.log(`Created review by ${names.nameEn}`);
  }

  console.log(`Seeded ${testimonials.length} testimonials.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
