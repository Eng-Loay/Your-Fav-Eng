import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const prisma = new PrismaClient();

async function seedMembershipPdf(
  data: {
    memberName: string;
    membershipNo: string;
    packageTitle: string;
    level?: string;
    courseCount: number;
    duration: string;
    issuedAt: string;
    expiresAt?: string;
  },
  membershipNo: string,
): Promise<string> {
  try {
    const { saveMembershipPdf } = await import('../src/modules/membership/membership-pdf');
    return await saveMembershipPdf(data, membershipNo);
  } catch {
    const uploadDir = path.resolve(process.cwd(), 'uploads/memberships');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const burgundy = rgb(0.545, 0.102, 0.102);
    page.drawText('IAGRCP MEMBERSHIP CERTIFICATE', { x: 50, y: 760, size: 20, font: bold, color: burgundy });
    page.drawText(data.memberName, { x: 50, y: 700, size: 16, font: bold });
    page.drawText(`${data.packageTitle}${data.level ? ` — ${data.level}` : ''}`, { x: 50, y: 670, size: 12, font: regular });
    page.drawText(`Membership No: ${membershipNo}`, { x: 50, y: 640, size: 11, font: regular });
    page.drawText(`Courses: ${data.courseCount} · ${data.duration}`, { x: 50, y: 620, size: 11, font: regular });
    page.drawText(`Issued: ${data.issuedAt}`, { x: 50, y: 600, size: 10, font: regular });
    if (data.expiresAt) page.drawText(`Valid until: ${data.expiresAt}`, { x: 50, y: 585, size: 10, font: regular });
    const filename = `membership-${membershipNo.replace(/[^a-zA-Z0-9-]/g, '')}.pdf`;
    fs.writeFileSync(path.join(uploadDir, filename), await pdfDoc.save());
    return `/uploads/memberships/${filename}`;
  }
}

function formatSeedDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

async function seedIagrcpStudentDashboard(
  student: { id: string; name: string },
  instructor: { id: string },
  courseIdBySlug: Record<string, string>,
  certTemplateId: string,
) {
  await prisma.notification.deleteMany({ where: { userId: student.id } });
  await prisma.order.deleteMany({ where: { userId: student.id } });
  await prisma.wishlistItem.deleteMany({ where: { userId: student.id } });
  await prisma.lessonProgress.deleteMany({ where: { userId: student.id } });

  const completedSlugs = ['grc-fundamentals', 'risk-management-essentials'];
  for (const slug of completedSlugs) {
    const courseId = courseIdBySlug[slug];
    if (!courseId) continue;
    await prisma.enrollment.update({
      where: { userId_courseId: { userId: student.id, courseId } },
      data: { status: 'COMPLETED', progress: 100, completedAt: new Date() },
    });
    const certNo = `IAGRCP-CERT-${slug.replace(/-/g, '').slice(0, 10).toUpperCase()}`;
    await prisma.certificate.upsert({
      where: { userId_courseId: { userId: student.id, courseId } },
      create: {
        userId: student.id,
        courseId,
        certificateNo: certNo,
        grade: slug === 'grc-fundamentals' ? 88 : 91,
        templateId: certTemplateId,
      },
      update: { grade: slug === 'grc-fundamentals' ? 88 : 91 },
    });
  }

  const progressMap: Record<string, number> = {
    'compliance-frameworks': 65,
    'internal-audit-basics': 42,
    'corporate-governance': 28,
  };
  for (const [slug, progress] of Object.entries(progressMap)) {
    const courseId = courseIdBySlug[slug];
    if (!courseId) continue;
    await prisma.enrollment.update({
      where: { userId_courseId: { userId: student.id, courseId } },
      data: { status: 'ACTIVE', progress },
    });
  }

  const firstCourseId = courseIdBySlug['grc-fundamentals'];
  if (firstCourseId) {
    const lessons = await prisma.lesson.findMany({
      where: { chapter: { courseId: firstCourseId }, type: { not: 'LIVE_SESSION' } },
      orderBy: [{ chapter: { order: 'asc' } }, { order: 'asc' }],
      take: 9,
    });
    for (let i = 0; i < lessons.length; i++) {
      await prisma.lessonProgress.create({
        data: {
          userId: student.id,
          lessonId: lessons[i].id,
          completed: i < 7,
          watchTime: 900 + i * 120,
          completedAt: i < 7 ? new Date() : null,
        },
      });
    }
  }

  for (const slug of ['regulatory-compliance', 'advanced-grc-leadership']) {
    const courseId = courseIdBySlug[slug];
    if (!courseId) continue;
    await prisma.wishlistItem.create({ data: { userId: student.id, courseId } });
  }

  const fundamentalsId = courseIdBySlug['grc-fundamentals'];
  if (fundamentalsId) {
    await prisma.order.create({
      data: {
        userId: student.id,
        status: 'COMPLETED',
        subtotal: 299,
        total: 299,
        currency: 'GBP',
        paymentMethod: 'stripe',
        billingName: student.name,
        billingEmail: 'student@iagrcp.org',
        items: {
          create: [{ courseId: fundamentalsId, title: 'GRC Fundamentals', price: 299, quantity: 1 }],
        },
      },
    });
  }

  const storeProduct = await prisma.product.findFirst({ where: { sellerId: instructor.id } });
  if (storeProduct) {
    await prisma.order.create({
      data: {
        userId: student.id,
        status: 'COMPLETED',
        subtotal: storeProduct.price,
        total: storeProduct.price,
        currency: 'GBP',
        paymentMethod: 'stripe',
        billingName: student.name,
        items: {
          create: [{ productId: storeProduct.id, title: storeProduct.title, price: storeProduct.price, quantity: 1 }],
        },
      },
    });
  }

  const notifications = [
    { title: 'Welcome to IAGRCP', message: 'Your Professional membership is now active. Explore your courses!', type: 'success', link: '/dashboard/membership' },
    { title: 'New assignment posted', message: 'GRC Case Study Submission — due in 7 days.', type: 'info', link: '/dashboard/assignments' },
    { title: 'Certificate earned', message: 'Congratulations! You earned a certificate for GRC Fundamentals.', type: 'success', link: '/dashboard/certificates' },
    { title: 'Live session scheduled', message: 'Join the live GRC Q&A session this week.', type: 'info', link: '/dashboard/live-sessions' },
    { title: 'Course progress', message: 'You are 65% through Compliance Frameworks — keep going!', type: 'info', link: '/dashboard/courses' },
  ];
  for (const n of notifications) {
    await prisma.notification.create({ data: { userId: student.id, ...n, read: false } });
  }

  const assignmentDefs = [
    { slug: 'grc-fundamentals', title: 'Risk Assessment Report', titleAr: 'تقرير تقييم المخاطر', days: 7, submitted: true, grade: 88 },
    { slug: 'compliance-frameworks', title: 'Compliance Gap Analysis', titleAr: 'تحليل فجوات الامتثال', days: 12, submitted: true, grade: 92 },
    { slug: 'corporate-governance', title: 'Board Governance Brief', titleAr: 'موجز حوكمة مجلس الإدارة', days: 18, submitted: false },
  ];
  for (const def of assignmentDefs) {
    const courseId = courseIdBySlug[def.slug];
    if (!courseId) continue;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + def.days);
    let assignment = await prisma.courseAssignment.findFirst({
      where: { courseId, title: def.title },
    });
    if (!assignment) {
      assignment = await prisma.courseAssignment.create({
        data: {
          courseId,
          instructorId: instructor.id,
          title: def.title,
          titleAr: def.titleAr,
          description: 'Submit your analysis based on the course materials.',
          dueDate,
          totalPoints: 100,
          status: 'active',
        },
      });
    }
    if (def.submitted) {
      await prisma.courseAssignmentSubmission.upsert({
        where: { assignmentId_studentId: { assignmentId: assignment.id, studentId: student.id } },
        create: {
          assignmentId: assignment.id,
          studentId: student.id,
          content: 'Completed analysis with governance recommendations and risk mitigation plan.',
          grade: def.grade,
          feedback: 'Excellent work — clear structure and practical recommendations.',
          gradedAt: new Date(),
        },
        update: {
          grade: def.grade,
          feedback: 'Excellent work — clear structure and practical recommendations.',
          gradedAt: new Date(),
        },
      });
    }
  }

  for (const slug of ['grc-fundamentals', 'risk-management-essentials']) {
    const courseId = courseIdBySlug[slug];
    if (!courseId) continue;
    let exam = await prisma.comprehensiveExam.findFirst({ where: { courseId } });
    if (!exam) {
      exam = await prisma.comprehensiveExam.create({
        data: {
          courseId,
          title: `${slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')} Final Exam`,
          titleAr: 'الاختبار النهائي',
          duration: 45,
          passingScore: 60,
          maxAttempts: 2,
          status: 'active',
          hasCertificate: true,
          passingScoreForCertificate: 70,
          certificateTemplateId: certTemplateId,
          questions: {
            create: [
              {
                question: 'What does GRC stand for?',
                questionAr: 'ماذا تعني GRC؟',
                type: 'multiple_choice',
                options: JSON.stringify(['Governance, Risk, Compliance', 'General Risk Control', 'Government Regulation Code']),
                correctAnswer: 'Governance, Risk, Compliance',
                points: 50,
                order: 0,
              },
              {
                question: 'Risk management should be integrated with organisational strategy.',
                questionAr: 'يجب دمج إدارة المخاطر مع استراتيجية المنظمة',
                type: 'multiple_choice',
                options: JSON.stringify(['True', 'False']),
                correctAnswer: 'True',
                points: 50,
                order: 1,
              },
            ],
          },
        },
      });
    }
    await prisma.comprehensiveExamResult.upsert({
      where: { comprehensiveExamId_studentId: { comprehensiveExamId: exam.id, studentId: student.id } },
      create: {
        comprehensiveExamId: exam.id,
        studentId: student.id,
        score: slug === 'grc-fundamentals' ? 88 : 76,
        passed: true,
        attempts: 1,
        timeTaken: 2100,
      },
      update: { score: slug === 'grc-fundamentals' ? 88 : 76, passed: true },
    });
  }

  for (const [i, slug] of ['compliance-frameworks', 'corporate-governance'].entries()) {
    const courseId = courseIdBySlug[slug];
    if (!courseId) continue;
    const chapter = await prisma.chapter.findFirst({ where: { courseId }, orderBy: { order: 'asc' } });
    if (!chapter) continue;
    const exists = await prisma.lesson.findFirst({ where: { chapterId: chapter.id, type: 'LIVE_SESSION' } });
    if (exists) continue;
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + 2 + i * 3);
    scheduledAt.setHours(18, 0, 0, 0);
    await prisma.lesson.create({
      data: {
        chapterId: chapter.id,
        title: 'Live Q&A — GRC Experts',
        titleAr: 'جلسة مباشرة — خبراء الحوكمة',
        type: 'LIVE_SESSION',
        order: 99,
        duration: 60,
        scheduledAt,
        meetingUrl: 'https://meet.google.com/iagrcp-demo-live',
        meetingProvider: 'google_meet',
      },
    });
  }

  const existingConvo = await prisma.conversationMember.findFirst({
    where: { userId: student.id },
    include: { conversation: true },
  });
  if (!existingConvo) {
    await prisma.conversation.create({
      data: {
        isGroup: false,
        createdById: student.id,
        members: {
          create: [
            { userId: student.id, unreadCount: 0 },
            { userId: instructor.id, unreadCount: 0 },
          ],
        },
        messages: {
          create: [
            { senderId: student.id, receiverId: instructor.id, content: 'Hello, I have a question about the compliance frameworks course.' },
            { senderId: instructor.id, receiverId: student.id, content: 'Hi! Happy to help — what would you like to know?' },
            { senderId: student.id, receiverId: instructor.id, content: 'Could you clarify the COSO framework section in Chapter 2?' },
          ],
        },
      },
    });
  }

  const communityCount = await prisma.communityPost.count();
  if (communityCount === 0) {
    const post = await prisma.communityPost.create({
      data: {
        authorId: instructor.id,
        content: 'Welcome to the IAGRCP learning community! Share your GRC insights and connect with fellow professionals.',
        comments: {
          create: { authorId: student.id, content: 'Excited to be here — just started the Professional membership programme!' },
        },
      },
    });
    await prisma.communityLike.create({ data: { postId: post.id, userId: student.id } });
    await prisma.communityPost.create({
      data: {
        authorId: student.id,
        content: 'Just completed GRC Fundamentals — great introduction for anyone new to governance and compliance.',
      },
    });
  }

  await prisma.user.update({
    where: { id: student.id },
    data: {
      bio: 'Aspiring GRC professional | IAGRCP Professional Member',
      city: 'London',
      country: 'United Kingdom',
      phone: '+441185919965',
    },
  });

  const extraCourseId = courseIdBySlug['iso-31000-risk'];
  if (extraCourseId) {
    const existingPayment = await prisma.paymentRequest.findFirst({
      where: { userId: student.id, courseId: extraCourseId },
    });
    if (!existingPayment) {
      await prisma.paymentRequest.create({
        data: {
          userId: student.id,
          courseId: extraCourseId,
          amount: 549,
          status: 'APPROVED',
          notes: 'Approved membership upgrade course access',
          reviewedAt: new Date(),
        },
      });
    }
  }

  console.log('  → Dashboard dummy data for student@iagrcp.org');
}

async function main() {
  console.log('Seeding database...');

  // Create platform settings
  const settings = [
    { key: 'platform_name', value: 'Eng. Loay Essam', group: 'general' },
    { key: 'site_url', value: 'https://your-fav-eng-lms.vercel.app', group: 'general' },
    { key: 'default_language', value: 'en', group: 'general' },
    { key: 'currency', value: 'GBP', group: 'general' },
    { key: 'timezone', value: 'Africa/Cairo', group: 'general' },
    { key: 'support_email', value: 'essamloay2@gmail.com', group: 'general' },
    { key: 'commission_config', value: JSON.stringify({ type: 'percentage', percentage: 30, amountPerStudent: 0, tiers: [] }), group: 'payment' },
    { key: 'tax_rate', value: '0.00', group: 'payment' },
    { key: 'video_storage_rate_per_gb', value: '0.10', group: 'payment' },
    { key: 'stripe_enabled', value: 'true', group: 'payment' },
    { key: 'paypal_enabled', value: 'false', group: 'payment' },
    { key: 'tap_enabled', value: 'true', group: 'payment' },
    { key: 'admin_approval_enabled', value: 'true', group: 'payment' },
    { key: 'coupon_enabled', value: 'true', group: 'payment' },
    { key: 'primary_color', value: '#1345D6', group: 'appearance' },
    { key: 'secondary_color', value: '#ffffff', group: 'appearance' },
    { key: 'font', value: 'Inter', group: 'appearance' },
    { key: 'instructors_enabled', value: 'true', group: 'features' },
    { key: 'store_enabled', value: 'true', group: 'features' },
    { key: 'video_watermark_enabled', value: 'false', group: 'features' },
  ];

  for (const setting of settings) {
    await prisma.platformSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  // Branding settings for IAGRCP
  const brandingSettings = [
    { key: 'platformName', value: 'Eng. Loay Essam', group: 'branding' },
    { key: 'logo', value: '/le-logo.png', group: 'branding' },
    { key: 'headerColor', value: '#FFFFFF', group: 'branding' },
    { key: 'footerColor', value: '#1345D6', group: 'branding' },
    { key: 'contactPhone', value: '01273587216', group: 'branding' },
    { key: 'contactEmail', value: 'essamloay2@gmail.com', group: 'branding' },
    { key: 'contactAddress', value: 'الإسكندرية، العجمي', group: 'branding' },
    { key: 'socialTwitter', value: '', group: 'branding' },
    { key: 'socialLinkedin', value: 'https://www.linkedin.com/in/loay-essam/', group: 'branding' },
    { key: 'socialYoutube', value: '', group: 'branding' },
    { key: 'socialFacebook', value: 'https://www.facebook.com/lolo.3300/', group: 'branding' },
    { key: 'socialInstagram', value: '', group: 'branding' },
  ];
  for (const s of brandingSettings) {
    await prisma.platformSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }

  // Seed homepage services and bundles content cards
  const servicesAndBundles = [
    {
      type: 'SERVICE',
      title: 'Graphic Design',
      titleAr: 'التصميم الجرافيكي',
      content: 'Social media creatives, campaign visuals, branding assets, and design systems tailored for your audience.',
      contentAr: 'تصميمات السوشيال ميديا، مواد الحملات، أصول الهوية، وأنظمة تصميم مخصصة لجمهورك.',
      slug: 'service-graphic-design',
      image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=1600&q=80',
      position: 1,
      status: 'active',
      author: JSON.stringify({ price: 1500, ctaUrl: '/contact' }),
    },
    {
      type: 'SERVICE',
      title: 'Editing',
      titleAr: 'المونتاج',
      content: 'Professional video editing for reels, short-form ads, and educational content with platform-ready formatting.',
      contentAr: 'مونتاج احترافي للريلز والإعلانات القصيرة والمحتوى التعليمي مع تجهيز مناسب لكل منصة.',
      slug: 'service-editing',
      image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1600&q=80',
      position: 2,
      status: 'active',
      author: JSON.stringify({ price: 1800, ctaUrl: '/contact' }),
    },
    {
      type: 'SERVICE',
      title: 'Photography',
      titleAr: 'التصوير',
      content: 'Commercial and product photography with lighting direction, styling, and post-processing for brand consistency.',
      contentAr: 'تصوير تجاري وتصوير منتجات مع توجيه الإضاءة والتنسيق والمعالجة اللاحقة لضمان اتساق الهوية.',
      slug: 'service-photography',
      image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1600&q=80',
      position: 3,
      status: 'active',
      author: JSON.stringify({ price: 1200, ctaUrl: '/contact' }),
    },
    {
      type: 'SERVICE',
      title: 'Media Buying (Paid Ads)',
      titleAr: 'إعلانات ممولة وحملات أداء',
      content: 'Plan, launch, and optimize Meta and Google campaigns focused on measurable growth and qualified leads.',
      contentAr: 'تخطيط وإطلاق وتحسين حملات Meta وGoogle لتحقيق نمو قابل للقياس وجذب عملاء مؤهلين.',
      slug: 'service-media-buying-paid-ads',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=80',
      position: 4,
      status: 'active',
      author: JSON.stringify({ price: 1700, ctaUrl: '/contact' }),
    },
    {
      type: 'SERVICE',
      title: 'Digital platform',
      titleAr: 'المنصة الرقمية',
      content: 'Build and maintain your digital platform with structured pages, user journeys, and conversion-focused experience.',
      contentAr: 'إنشاء وإدارة منصتك الرقمية عبر صفحات منظمة وتجربة مستخدم موجهة للتحويل والنمو.',
      slug: 'service-digital-platform',
      image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=80',
      position: 5,
      status: 'active',
      author: JSON.stringify({ price: 2500, ctaUrl: '/contact' }),
    },
    {
      type: 'BUNDLE',
      title: 'Corporate Website Bundle',
      titleAr: 'باقة الموقع المؤسسي',
      content: 'Full responsive website setup with optimized structure, speed, and conversion-focused pages.',
      contentAr: 'إعداد موقع متكامل متجاوب مع بنية محسنة وسرعة عالية وصفحات تركز على التحويل.',
      slug: 'bundle-corporate-website',
      image: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=1600&q=80',
      position: 101,
      status: 'active',
      author: JSON.stringify({ price: 1900, ctaUrl: '/contact' }),
    },
    {
      type: 'BUNDLE',
      title: 'All-in-One Growth Pack',
      titleAr: 'باقة النمو الشاملة',
      content: 'Integrated package combining content, ads, and community workflows for sustained digital growth.',
      contentAr: 'باقة متكاملة تجمع المحتوى والإعلانات وإدارة المجتمع لتحقيق نمو رقمي مستمر.',
      slug: 'bundle-all-in-one-growth-pack',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&q=80',
      position: 102,
      status: 'active',
      author: JSON.stringify({ price: 2200, ctaUrl: '/contact' }),
    },
  ];

  for (const item of servicesAndBundles) {
    const existingBySlug = await prisma.content.findUnique({
      where: { slug: item.slug },
      select: { id: true },
    });

    if (existingBySlug) {
      await prisma.content.update({
        where: { id: existingBySlug.id },
        data: {
          type: item.type,
          title: item.title,
          titleAr: item.titleAr,
          content: item.content,
          contentAr: item.contentAr,
          image: item.image,
          status: item.status,
          position: item.position,
          author: item.author,
          slug: item.slug,
        },
      });
      continue;
    }

    const existingByTitle = await prisma.content.findFirst({
      where: { type: item.type, title: item.title },
      select: { id: true },
    });

    if (existingByTitle) {
      await prisma.content.update({
        where: { id: existingByTitle.id },
        data: {
          titleAr: item.titleAr,
          content: item.content,
          contentAr: item.contentAr,
          image: item.image,
          status: item.status,
          position: item.position,
          author: item.author,
          slug: item.slug,
        },
      });
      continue;
    }

    await prisma.content.create({ data: item });
  }

  // Create pricing tiers
  const tiers = [
    { minStudents: 1, maxStudents: 5, pricePerStudent: 5.0 },
    { minStudents: 6, maxStudents: 10, pricePerStudent: 4.0 },
    { minStudents: 11, maxStudents: 30, pricePerStudent: 3.0 },
    { minStudents: 31, maxStudents: 50, pricePerStudent: 2.5 },
    { minStudents: 51, maxStudents: 100, pricePerStudent: 2.0 },
    { minStudents: 101, maxStudents: 999, pricePerStudent: 1.5 },
  ];

  for (const tier of tiers) {
    const existing = await prisma.pricingTier.findFirst({
      where: { minStudents: tier.minStudents, maxStudents: tier.maxStudents },
    });
    if (!existing) {
      await prisma.pricingTier.create({ data: tier });
    }
  }

  // Create admin users
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@aydentvision.com' },
    update: {},
    create: {
      email: 'admin@aydentvision.com',
      password: adminPassword,
      name: 'Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@admin.com' },
    update: {},
    create: {
      email: 'admin@admin.com',
      password: adminPassword,
      name: 'Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  // Owner admin account
  const iagrcpAdminPassword = await bcrypt.hash('Loay#1234l', 12);
  const iagrcpUserPassword = await bcrypt.hash('Test@2026', 12);

  await prisma.user.upsert({
    where: { email: 'loay@eng.com' },
    update: { name: 'Eng. Loay Essam', role: 'ADMIN', status: 'ACTIVE', password: iagrcpAdminPassword, emailVerified: true },
    create: {
      email: 'loay@eng.com',
      password: iagrcpAdminPassword,
      name: 'Eng. Loay Essam',
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  // Delete other teachers (keep only the seeded GRC instructor and Ammar Yasser)
  const keptTeacherEmails = ['instructor@iagrcp.org', 'ammar@aydentvision.com'];
  const keptTeachers = await prisma.user.findMany({
    where: { email: { in: keptTeacherEmails } },
    select: { id: true },
  });
  const keptTeacherIds = keptTeachers.map((u) => u.id);
  await prisma.teacherStudentSnapshot.deleteMany({});
  await prisma.classStudent.deleteMany({});
  await prisma.class.deleteMany({});
  await prisma.teacherProfile.deleteMany({ where: { userId: { notIn: keptTeacherIds } } });
  await prisma.user.deleteMany({
    where: { role: 'TEACHER', email: { notIn: keptTeacherEmails } },
  });

  const iagrcpInstructor = await prisma.user.upsert({
    where: { email: 'instructor@iagrcp.org' },
    update: { name: 'GRC Instructor', role: 'TEACHER', status: 'ACTIVE', password: iagrcpUserPassword },
    create: {
      email: 'instructor@iagrcp.org',
      password: iagrcpUserPassword,
      name: 'GRC Instructor',
      role: 'TEACHER',
      status: 'ACTIVE',
      emailVerified: true,
      bio: 'Senior GRC professional and course lead at IAGRCP.',
      teacherProfile: {
        create: {
          specialty: 'Governance, Risk & Compliance',
          revenueShare: 70,
          verified: true,
        },
      },
    },
  });

  const iagrcpStudent = await prisma.user.upsert({
    where: { email: 'student@iagrcp.org' },
    update: { name: 'Test Student', role: 'STUDENT', status: 'ACTIVE', password: iagrcpUserPassword },
    create: {
      email: 'student@iagrcp.org',
      password: iagrcpUserPassword,
      name: 'Test Student',
      role: 'STUDENT',
      status: 'ACTIVE',
      emailVerified: true,
      studentProfile: { create: {} },
    },
  });

  // Create single instructor: Ammar Yasser
  const instructorPassword = await bcrypt.hash('instructor123', 12);
  const instructor = await prisma.user.upsert({
    where: { email: 'ammar@aydentvision.com' },
    update: { name: 'Ammar Yasser' },
    create: {
      email: 'ammar@aydentvision.com',
      password: instructorPassword,
      name: 'Ammar Yasser',
      role: 'TEACHER',
      status: 'ACTIVE',
      emailVerified: true,
      bio: 'Dental graphics expert & content creator. Founder of AY DentVision.',
      teacherProfile: {
        create: {
          specialty: 'Dental Graphics & Content Creation',
          revenueShare: 70,
          verified: true,
        },
      },
    },
  });

  // Keep the GRC + Ammar instructors created above. Do not wipe all TEACHER rows.

  // Create sample students
  const studentPassword = await bcrypt.hash('student123', 12);
  const students = [];
  const studentData = [
    { email: 'student1@aydentvision.com', name: 'Mohamed Ali' },
    { email: 'student2@aydentvision.com', name: 'Nour Hassan' },
    { email: 'student3@aydentvision.com', name: 'Omar Khaled' },
  ];

  for (const s of studentData) {
    const student = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        password: studentPassword,
        name: s.name,
        role: 'STUDENT',
        status: 'ACTIVE',
        emailVerified: true,
        studentProfile: {
          create: { grade: 'Dental Student', school: 'Faculty of Dentistry' },
        },
      },
    });
    students.push(student);
  }

  // Create sample parent
  const parentPassword = await bcrypt.hash('parent123', 12);
  const parent = await prisma.user.upsert({
    where: { email: 'parent@aydentvision.com' },
    update: {},
    create: {
      email: 'parent@aydentvision.com',
      password: parentPassword,
      name: 'Ahmed Parent',
      role: 'PARENT',
      status: 'ACTIVE',
      emailVerified: true,
      parentProfile: {
        create: { relationship: 'Father' },
      },
    },
  });

  await prisma.parentChild.upsert({
    where: { parentId_childId: { parentId: parent.id, childId: students[0].id } },
    update: {},
    create: { parentId: parent.id, childId: students[0].id },
  });

  // Delete existing courses and all related data
  await prisma.membership.deleteMany({});
  await prisma.certificate.deleteMany({});
  await prisma.comprehensiveExamResult.deleteMany({});
  await prisma.comprehensiveExamQuestion.deleteMany({});
  await prisma.comprehensiveExam.deleteMany({});
  await prisma.examResult.deleteMany({});
  await prisma.quiz.deleteMany({});
  await prisma.exam.deleteMany({});
  await prisma.courseAssignmentSubmission.deleteMany({});
  await prisma.courseAssignment.deleteMany({});
  await prisma.lessonProgress.deleteMany({});
  await prisma.lessonNote.deleteMany({});
  await prisma.lessonAttachment.deleteMany({});
  await prisma.enrollment.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.wishlistItem.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.couponCourse.deleteMany({});
  await prisma.bundleCourse.deleteMany({});
  await prisma.paymentRequest.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.chapter.deleteMany({});
  await prisma.course.deleteMany({});

  // IAGRCP GRC categories
  await prisma.category.deleteMany({ where: { service: 'platform' } });
  const grcCategories = [
    { name: 'Governance', nameEn: 'Governance', slug: 'governance', position: 0 },
    { name: 'Risk Management', nameEn: 'Risk Management', slug: 'risk-management', position: 1 },
    { name: 'Compliance', nameEn: 'Compliance', slug: 'compliance', position: 2 },
    { name: 'Internal Audit', nameEn: 'Internal Audit', slug: 'internal-audit', position: 3 },
    { name: 'GRC Leadership', nameEn: 'GRC Leadership', slug: 'grc-leadership', position: 4 },
  ];
  for (const cat of grcCategories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, nameEn: cat.nameEn, position: cat.position },
      create: { ...cat, service: 'platform', status: 'active' },
    });
  }

  const courseThumb = '/brand/diploma/cover.png';

  const coursesData = [
    {
      title: 'GRC Fundamentals',
      titleAr: 'أساسيات الحوكمة والمخاطر والامتثال',
      slug: 'grc-fundamentals',
      description: 'Introduction to governance, risk, and compliance frameworks for professionals entering the GRC field.',
      price: 299,
      category: 'governance',
      level: 'beginner',
      status: 'PUBLISHED' as const,
      featured: true,
      duration: 480,
      language: 'en',
      thumbnail: courseThumb,
    },
    {
      title: 'Risk Management Essentials',
      titleAr: 'أساسيات إدارة المخاطر',
      slug: 'risk-management-essentials',
      description: 'Identify, assess, and mitigate organisational risks using practical GRC methodologies.',
      price: 349,
      category: 'risk-management',
      level: 'beginner',
      status: 'PUBLISHED' as const,
      featured: true,
      duration: 540,
      language: 'en',
      thumbnail: '/brand/diploma/png/8.png',
    },
    {
      title: 'Compliance Frameworks',
      titleAr: 'أطر الامتثال التنظيمي',
      slug: 'compliance-frameworks',
      description: 'Understand ISO, COSO, and regulatory compliance requirements for modern organisations.',
      price: 399,
      category: 'compliance',
      level: 'intermediate',
      status: 'PUBLISHED' as const,
      featured: true,
      duration: 600,
      language: 'en',
      thumbnail: '/brand/certificates/membership-template.png',
    },
    {
      title: 'Internal Audit Basics',
      titleAr: 'أساسيات التدقيق الداخلي',
      slug: 'internal-audit-basics',
      description: 'Plan and execute internal audits aligned with IIA standards and GRC best practices.',
      price: 449,
      category: 'internal-audit',
      level: 'intermediate',
      status: 'PUBLISHED' as const,
      featured: false,
      duration: 660,
      language: 'en',
      thumbnail: '/brand/certificates/certificate-template.png',
    },
    {
      title: 'Corporate Governance',
      titleAr: 'حوكمة الشركات',
      slug: 'corporate-governance',
      description: 'Board structures, accountability, and governance models for public and private sector entities.',
      price: 499,
      category: 'governance',
      level: 'intermediate',
      status: 'PUBLISHED' as const,
      featured: true,
      duration: 720,
      language: 'en',
      thumbnail: '/brand/diploma/png/8-before-certificates.png',
    },
    {
      title: 'ISO 31000 Risk Management',
      titleAr: 'إدارة المخاطر ISO 31000',
      slug: 'iso-31000-risk',
      description: 'Apply ISO 31000 principles to enterprise risk management programmes.',
      price: 549,
      category: 'risk-management',
      level: 'advanced',
      status: 'PUBLISHED' as const,
      featured: false,
      duration: 780,
      language: 'en',
      thumbnail: '/brand/certificates/new/1.png',
    },
    {
      title: 'Regulatory Compliance',
      titleAr: 'الامتثال التنظيمي',
      slug: 'regulatory-compliance',
      description: 'Navigate financial, data protection, and sector-specific regulatory requirements.',
      price: 599,
      category: 'compliance',
      level: 'advanced',
      status: 'PUBLISHED' as const,
      featured: false,
      duration: 840,
      language: 'en',
      thumbnail: '/brand/diploma/png/9.png',
    },
    {
      title: 'Advanced GRC Leadership',
      titleAr: 'قيادة الحوكمة والمخاطر والامتثال',
      slug: 'advanced-grc-leadership',
      description: 'Strategic GRC leadership, culture, and board reporting for senior professionals.',
      price: 699,
      category: 'grc-leadership',
      level: 'advanced',
      status: 'PUBLISHED' as const,
      featured: true,
      duration: 900,
      language: 'en',
      thumbnail: '/brand/diploma/png/12.png',
    },
  ];

  const courseIdBySlug: Record<string, string> = {};

  for (const courseData of coursesData) {
    const course = await prisma.course.upsert({
      where: { slug: courseData.slug },
      update: {
        title: courseData.title,
        titleAr: courseData.titleAr,
        description: courseData.description.slice(0, 500),
        price: courseData.price,
        category: courseData.category,
        level: courseData.level,
        status: courseData.status,
        featured: courseData.featured,
        duration: courseData.duration,
        thumbnail: courseData.thumbnail,
        instructorId: iagrcpInstructor.id,
      },
      create: {
        ...courseData,
        description: courseData.description.slice(0, 500),
        instructorId: iagrcpInstructor.id,
      },
    });
    courseIdBySlug[courseData.slug] = course.id;

    const existingChapters = await prisma.chapter.count({ where: { courseId: course.id } });
    if (existingChapters > 0) continue;

    const chapterTitles = [
      ['Chapter 1 - Introduction', 'الفصل الأول - مقدمة'],
      ['Chapter 2 - Core Concepts', 'الفصل الثاني - المفاهيم الأساسية'],
      ['Chapter 3 - Practical Application', 'الفصل الثالث - التطبيق العملي'],
    ];
    const lessonTitles = [
      ['Lesson 1 - Overview', 'الدرس الأول - نظرة عامة'],
      ['Lesson 2 - Key Frameworks', 'الدرس الثاني - الأطر الرئيسية'],
      ['Lesson 3 - Case Study', 'الدرس الثالث - دراسة حالة'],
      ['Chapter Quiz', 'اختبار الفصل'],
    ];
    for (let i = 1; i <= 3; i++) {
      const chapter = await prisma.chapter.create({
        data: {
          title: chapterTitles[i - 1][0],
          titleAr: chapterTitles[i - 1][1],
          order: i,
          courseId: course.id,
          isFree: i === 1,
        },
      });

      for (let j = 1; j <= 4; j++) {
        const lesson = await prisma.lesson.create({
          data: {
            title: lessonTitles[j - 1][0],
            titleAr: lessonTitles[j - 1][1],
            type: j === 4 ? 'QUIZ' : 'VIDEO',
            order: j,
            duration: 20,
            chapterId: chapter.id,
            isFree: i === 1 && j === 1,
            isPreview: i === 1 && j === 1,
          },
        });
        if (j === 4) {
          await prisma.quiz.createMany({
            data: [
              {
                lessonId: lesson.id,
                question: 'What is the primary goal of GRC?',
                questionAr: 'ما الهدف الرئيسي من الحوكمة والمخاطر والامتثال؟',
                type: 'multiple_choice',
                options: JSON.stringify(['Alignment of objectives', 'Marketing only', 'Cost cutting only']),
                correctAnswer: 'a',
                points: 1,
                order: 0,
              },
            ],
          });
        }
      }
    }
  }

  const grcProducts = [
    {
      title: 'GRC Toolkit — Templates Pack',
      titleAr: 'حزمة قوالب الحوكمة والمخاطر',
      description: 'Ready-to-use risk registers, compliance checklists, and board report templates.',
      price: 79,
      type: 'DIGITAL' as const,
      category: 'GRC Resources',
      thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1400&q=80',
      status: 'active',
      stock: null,
    },
    {
      title: 'IAGRCP Study Guide (Print)',
      titleAr: 'دليل الدراسة IAGRCP',
      description: 'Printed companion guide for Associate and Professional membership programmes.',
      price: 49,
      type: 'PHYSICAL' as const,
      category: 'Books',
      thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1400&q=80',
      status: 'active',
      stock: 200,
    },
  ];

  for (const productData of grcProducts) {
    const existing = await prisma.product.findFirst({
      where: { sellerId: iagrcpInstructor.id, title: productData.title },
      select: { id: true },
    });
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: { ...productData, description: productData.description.slice(0, 180) },
      });
    } else {
      await prisma.product.create({
        data: {
          sellerId: iagrcpInstructor.id,
          ...productData,
          description: productData.description.slice(0, 180),
        },
      });
    }
  }

  // Create roles and permissions
  const roles = ['Super Admin', 'Admin', 'Support', 'Teacher'];
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, isSystem: true },
    });
  }

  const modules = ['users', 'courses', 'billing', 'reports', 'settings', 'content'];
  const actions = ['create', 'read', 'update', 'delete'];
  for (const mod of modules) {
    for (const action of actions) {
      const permName = `${mod}.${action}`;
      await prisma.permission.upsert({
        where: { name: permName },
        update: {},
        create: { name: permName, module: mod, action },
      });
    }
  }

  const adminPages = [
    'admin_dashboard', 'admin_users', 'admin_instructors', 'admin_courses', 'admin_categories',
    'admin_student_requests', 'admin_coupons', 'admin_store', 'admin_store_orders',
    'admin_exams', 'admin_question_bank', 'admin_content_bank', 'admin_comprehensive_exams',
    'admin_reviews', 'admin_certificates', 'admin_enrollments', 'admin_messages', 'admin_communities',
    'admin_notifications', 'admin_content', 'admin_files', 'admin_lessons',
    'admin_roles', 'admin_reports', 'admin_settings', 'admin_parents', 'admin_students',
  ];
  for (const page of adminPages) {
    await prisma.permission.upsert({
      where: { name: page },
      update: {},
      create: { name: page, module: 'admin', action: 'access' },
    });
  }

  // Create coupon
  await prisma.coupon.upsert({
    where: { code: 'DENTAL20' },
    update: {},
    create: {
      code: 'DENTAL20',
      discount: 20,
      discountType: 'percentage',
      maxUses: 100,
      isActive: true,
    },
  });

  // Create certificate template
  let certTemplate = await prisma.certificateTemplate.findFirst({ where: { isDefault: true } });
  if (certTemplate) {
    certTemplate = await prisma.certificateTemplate.update({
      where: { id: certTemplate.id },
      data: {
        name: 'IAGRCP Course Certificate',
        nameAr: 'شهادة دورة IAGRCP',
        layout: JSON.stringify({ style: 'modern', borderColor: '#8B1A1A' }),
      },
    });
  } else {
    certTemplate = await prisma.certificateTemplate.create({
      data: {
        name: 'IAGRCP Course Certificate',
        nameAr: 'شهادة دورة IAGRCP',
        isDefault: true,
        layout: JSON.stringify({ style: 'modern', borderColor: '#8B1A1A' }),
      },
    });
  }

  // IAGRCP membership packages (bundles with linked courses)
  const associateCourseIds = [
    courseIdBySlug['grc-fundamentals'],
    courseIdBySlug['risk-management-essentials'],
    courseIdBySlug['compliance-frameworks'],
  ].filter(Boolean);

  const professionalCourseIds = [
    ...associateCourseIds,
    courseIdBySlug['internal-audit-basics'],
    courseIdBySlug['corporate-governance'],
    courseIdBySlug['iso-31000-risk'],
  ].filter(Boolean);

  const fellowCourseIds = Object.values(courseIdBySlug);

  const programmingAiCourseIds = [
    ...associateCourseIds,
    courseIdBySlug['internal-audit-basics'],
  ].filter(Boolean);

  const membershipPackageDefs = [
    {
      title: 'Programming & AI Course',
      titleAr: 'دورة البرمجة والذكاء الاصطناعي',
      description: 'A Programming & AI course for 2nd-year secondary (baccalaureate) students, taught by Eng. Loay Essam.',
      descriptionAr: 'دورة في البرمجة والذكاء الاصطناعي لطلاب الصف الثاني الثانوي (بكالوريا)، مع المهندس لؤي عصام.',
      price: 800,
      currency: 'EGP',
      courseCount: programmingAiCourseIds.length,
      courseIds: JSON.stringify(programmingAiCourseIds),
      level: 'Full Course',
      duration: 'Monthly',
      position: 1,
      image: '/brand/loay/poster-programming-ai.png',
    },
    {
      title: 'Professional Membership',
      titleAr: 'عضوية محترف',
      description: 'Expanded course library with 6 accredited programmes and professional membership credentials.',
      descriptionAr: 'مكتبة موسعة من 6 برامج معتمدة وشهادة عضوية مهنية.',
      price: 999,
      currency: 'GBP',
      courseCount: professionalCourseIds.length,
      courseIds: JSON.stringify(professionalCourseIds),
      level: 'Professional',
      duration: 'Annual',
      position: 2,
      status: 'inactive',
      image: '/brand/loay/poster-programming-ai.png',
    },
    {
      title: 'Fellow Membership',
      titleAr: 'عضوية زميل',
      description: 'Premium tier with full course access, leadership resources, and distinguished member status.',
      descriptionAr: 'المستوى المميز مع وصول كامل للدورات وموارد القيادة ومكانة عضوية متميزة.',
      price: 1499,
      currency: 'GBP',
      courseCount: fellowCourseIds.length,
      courseIds: JSON.stringify(fellowCourseIds),
      level: 'Fellow',
      duration: 'Annual',
      position: 3,
      status: 'inactive',
      image: '/brand/loay/poster-programming-ai.png',
    },
  ];

  const packageByLevel: Record<string, { id: string; title: string; level: string; courseCount: number; courseIds: string[] }> = {};

  for (const pkg of membershipPackageDefs) {
    const existing = await prisma.membershipPackage.findFirst({ where: { title: pkg.title } });
    const saved = existing
      ? await prisma.membershipPackage.update({ where: { id: existing.id }, data: pkg })
      : await prisma.membershipPackage.create({ data: pkg });
    packageByLevel[pkg.level] = {
      id: saved.id,
      title: saved.title,
      level: saved.level || pkg.level,
      courseCount: pkg.courseCount,
      courseIds: JSON.parse(pkg.courseIds),
    };
  }

  async function issueSeedMembership(
    user: { id: string; name: string },
    pkg: { id: string; title: string; level: string; courseCount: number; courseIds: string[] },
    membershipNo: string,
  ) {
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const pdfUrl = await seedMembershipPdf(
      {
        memberName: user.name,
        membershipNo,
        packageTitle: pkg.title,
        level: pkg.level,
        courseCount: pkg.courseCount,
        duration: 'Annual',
        issuedAt: formatSeedDate(issuedAt),
        expiresAt: formatSeedDate(expiresAt),
      },
      membershipNo,
    );

    const membership = await prisma.membership.create({
      data: {
        membershipNo,
        userId: user.id,
        packageId: pkg.id,
        pdfUrl,
        status: 'ACTIVE',
        expiresAt,
        coursesUsed: 0,
      },
    });

    for (const courseId of pkg.courseIds) {
      await prisma.enrollment.upsert({
        where: { userId_courseId: { userId: user.id, courseId } },
        update: { status: 'ACTIVE', source: 'membership', progress: 15 + Math.random() * 40 },
        create: {
          userId: user.id,
          courseId,
          status: 'ACTIVE',
          source: 'membership',
          progress: 15 + Math.random() * 40,
        },
      });
    }

    return membership;
  }

  // student@iagrcp.org → Professional bundle (6 courses + PDF)
  await issueSeedMembership(
    iagrcpStudent,
    packageByLevel.Professional,
    `IAGRCP-${new Date().getFullYear()}-100001`,
  );

  await seedIagrcpStudentDashboard(iagrcpStudent, iagrcpInstructor, courseIdBySlug, certTemplate.id);

  // student1@aydentvision.com → Associate bundle (3 courses + PDF) — different tier for comparison
  if (students[0]) {
    await issueSeedMembership(
      students[0],
      packageByLevel['Full Course'],
      `IAGRCP-${new Date().getFullYear()}-100002`,
    );
  }

  console.log('Membership packages and test memberships seeded.');

  console.log('Seed completed successfully!');
  console.log('\nTest accounts:');
  console.log('Admin: admin@aydentvision.com / admin123');
  console.log('--- IAGRCP test accounts ---');
  console.log('Admin:      admin@iagrcp.org / Iagrcp@2026');
  console.log('Student:    student@iagrcp.org / Test@2026  (full dashboard dummy data)');
  console.log('Teacher:    instructor@iagrcp.org / Test@2026');
  console.log('Legacy admin: admin@admin.com / admin123');
  console.log('Teacher: ammar@aydentvision.com / instructor123 (Ammar Yasser)');
  console.log('Student:    student1@aydentvision.com / student123  (Associate membership, 3 courses)');
  console.log('Parent: parent@aydentvision.com / parent123');
  console.log('\nDashboard data for student@iagrcp.org:');
  console.log('  6 enrolled courses (2 completed, 4 in progress)');
  console.log('  2 certificates | 3 assignments | 2 exam results');
  console.log('  2 live sessions | 5 notifications | 2 orders | wishlist');
  console.log('  Messages with instructor | community posts | membership wallet');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
