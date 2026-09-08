import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const samplePosts = [
  {
    content: "Just completed an advanced implantology course at Medex! The hands-on training with B&B implants was exceptional. Highly recommend for any dentist looking to upgrade their skills. 🦷✨",
    image: null,
  },
  {
    content: "Our clinic just received the new Powerbone implant system from Medex. The quality is outstanding - great primary stability and the surface treatment is top-notch. Anyone else using Powerbone in their practice?",
    image: null,
  },
  {
    content: "Sharing my case study: Full arch rehabilitation using MACROSS implants. 6 months post-op and the results are remarkable. The patient is extremely satisfied with both function and aesthetics. Thank you Medex for the excellent products! 💪",
    image: null,
  },
  {
    content: "Tips for new dentists: Always invest in quality instruments and implant systems. The difference between premium and budget products shows in long-term patient outcomes. Medex has been my trusted supplier for 3 years now.",
    image: null,
  },
  {
    content: "Excited to announce that our dental clinic is now a certified Medex partner! We'll be offering B&B Dental and Powerbone implant solutions. Looking forward to serving our patients with the best Italian and Turkish implant technology. 🎉",
    image: null,
  },
  {
    content: "Just attended the Medex workshop on bone grafting with Dora biomaterials. The membrane quality is impressive - easy to handle and great resorption rate. Who else has experience with Dora products?",
    image: null,
  },
  {
    content: "Case of the week: Socket preservation using Dora bone graft material after extraction of upper molar. Planning for implant placement in 4 months. The healing is progressing beautifully! 🔬",
    image: null,
  },
  {
    content: "PSA for all dental professionals: Medex is running a special promotion on surgical kits this month. Perfect time to upgrade your instrumentation. The universal surgical kit is a must-have!",
    image: null,
  },
  {
    content: "3 years of using B&B 3P implants exclusively in my practice. Over 200 cases with a 98.5% success rate. The prosthetic versatility and the connection stability are unmatched. Happy to share my experience with anyone interested!",
    image: null,
  },
  {
    content: "Question for the community: What's your preferred implant diameter for single tooth replacement in the aesthetic zone? I've been using the B&B EV line 3.5mm with great results. Would love to hear your preferences!",
    image: null,
  },
  {
    content: "Completed my 5th Medex certification course today! The training program is incredibly well-structured. From basic implantology to advanced GBR techniques - every course has been valuable for my practice growth. 📚",
    image: null,
  },
  {
    content: "New in our inventory: MCTBIO Mplant system from Medex. First impressions are very positive - the tapered design provides excellent primary stability even in soft bone. Will share more after a few cases.",
    image: null,
  },
  {
    content: "Important reminder: Always use torque-calibrated drivers for implant placement. Over-torquing can lead to bone necrosis. Medex surgical kits come with proper torque indicators - safety first! ⚕️",
    image: null,
  },
  {
    content: "Great news! Medex is expanding their product range with new Vitrolife biomaterials from Sweden. Premium quality collagen membranes and bone substitute materials. Can't wait to try them in my next GBR case! 🇸🇪",
    image: null,
  },
  {
    content: "Weekend study group with fellow dentists discussing complex implant cases. The Medex community has been invaluable for professional growth and knowledge sharing. Who wants to join our next session?",
    image: null,
  },
];

async function main() {
  console.log('Seeding community posts...');

  let adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true },
  });

  if (!adminUser) {
    console.log('No admin user found. Creating a system user...');
    adminUser = await prisma.user.create({
      data: {
        name: 'Medex Admin',
        email: 'admin@medex-med.com',
        password: '$2b$10$dummyhash',
        role: 'ADMIN',
      },
      select: { id: true },
    });
  }

  const allUsers = await prisma.user.findMany({
    select: { id: true },
    take: 10,
  });

  const userIds = allUsers.length > 0 ? allUsers.map((u) => u.id) : [adminUser.id];

  await prisma.communityComment.deleteMany({});
  await prisma.communityLike.deleteMany({});
  await prisma.communityPost.deleteMany({});

  for (let i = 0; i < samplePosts.length; i++) {
    const post = samplePosts[i];
    const authorId = userIds[i % userIds.length];

    const createdPost = await prisma.communityPost.create({
      data: {
        authorId,
        content: post.content,
        image: post.image,
        createdAt: new Date(Date.now() - (samplePosts.length - i) * 3600000 * (1 + Math.random() * 5)),
      },
    });

    const numLikes = Math.floor(Math.random() * Math.min(userIds.length, 5)) + 1;
    const likeUsers = [...userIds].sort(() => Math.random() - 0.5).slice(0, numLikes);
    for (const uid of likeUsers) {
      await prisma.communityLike.create({
        data: { postId: createdPost.id, userId: uid },
      }).catch(() => {});
    }

    const sampleComments = [
      "Great insights! Thanks for sharing.",
      "This is very helpful for my practice.",
      "Excellent case! What was the healing protocol?",
      "I've had similar experiences. Great results!",
      "Thanks for the recommendation!",
      "Very informative post!",
      "Looking forward to trying this approach.",
    ];

    const numComments = Math.floor(Math.random() * 3);
    for (let c = 0; c < numComments; c++) {
      const commentAuthor = userIds[Math.floor(Math.random() * userIds.length)];
      await prisma.communityComment.create({
        data: {
          postId: createdPost.id,
          authorId: commentAuthor,
          content: sampleComments[Math.floor(Math.random() * sampleComments.length)],
          createdAt: new Date(createdPost.createdAt.getTime() + (c + 1) * 1800000),
        },
      });
    }
  }

  console.log(`Seeded ${samplePosts.length} community posts with likes and comments.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
