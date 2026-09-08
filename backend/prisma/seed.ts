import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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

  // Branding settings
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
  await prisma.user.upsert({
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
  const ownerAdminPassword = await bcrypt.hash('Loay#1234l', 12);
  await prisma.user.upsert({
    where: { email: 'loay@eng.com' },
    update: { name: 'Eng. Loay Essam', role: 'ADMIN', status: 'ACTIVE', password: ownerAdminPassword, emailVerified: true },
    create: {
      email: 'loay@eng.com',
      password: ownerAdminPassword,
      name: 'Eng. Loay Essam',
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  // Create single instructor: Ammar Yasser
  const instructorPassword = await bcrypt.hash('instructor123', 12);
  await prisma.user.upsert({
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

  // Do not delete other teacher rows here — a seed run must never remove
  // real accounts created outside this script.

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

  // NOTE: This seed script intentionally does NOT touch courses, chapters, lessons,
  // categories, membership packages, or certificate templates. Those hold real
  // production content and must never be wiped/recreated by a seed run.

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

  // Create a default certificate template (only if none exists yet)
  const hasCertTemplate = await prisma.certificateTemplate.findFirst({ where: { isDefault: true } });
  if (!hasCertTemplate) {
    await prisma.certificateTemplate.create({
      data: {
        name: 'Course Certificate',
        nameAr: 'شهادة إتمام الدورة',
        isDefault: true,
        layout: JSON.stringify({ style: 'modern', borderColor: '#1345D6' }),
      },
    });
  }

  console.log('Seed completed successfully!');
  console.log('\nTest accounts:');
  console.log('Admin: admin@aydentvision.com / admin123');
  console.log('Legacy admin: admin@admin.com / admin123');
  console.log('Owner admin: loay@eng.com / Loay#1234l');
  console.log('Teacher: ammar@aydentvision.com / instructor123 (Ammar Yasser)');
  console.log('Student:    student1@aydentvision.com / student123');
  console.log('Student:    student2@aydentvision.com / student123');
  console.log('Student:    student3@aydentvision.com / student123');
  console.log('Parent: parent@aydentvision.com / parent123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
