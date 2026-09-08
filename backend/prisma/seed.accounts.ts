import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

type SeedAccount = {
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
  email: string;
  name: string;
  password: string;
};

const accounts: SeedAccount[] = [
  { role: 'ADMIN', email: 'loay@eng.com', name: 'Eng. Loay Essam', password: 'Loay#1234l' },
  { role: 'ADMIN', email: 'admin@animka.com', name: 'Admin', password: 'Admin123!' },
  { role: 'ADMIN', email: 'admin@admin.com', name: 'Admin', password: 'Admin123!' },
  { role: 'TEACHER', email: 'instructor@iagrcp.org', name: 'IAGRCP Instructor', password: 'Test@2026' },
  { role: 'TEACHER', email: 'ammar@aydentvision.com', name: 'Ammar Yasser', password: 'instructor123' },
  { role: 'TEACHER', email: 'teacher@animka.com', name: 'Teacher', password: 'teacher123' },
  { role: 'STUDENT', email: 'student1@animka.com', name: 'Student 1', password: 'student123' },
  { role: 'STUDENT', email: 'student2@animka.com', name: 'Student 2', password: 'student123' },
  { role: 'STUDENT', email: 'student3@animka.com', name: 'Student 3', password: 'student123' },
  { role: 'PARENT', email: 'parent@animka.com', name: 'Parent', password: 'parent123' },
];

async function ensureRoleProfile(userId: string, role: SeedAccount['role']) {
  if (role === 'TEACHER') {
    await prisma.teacherProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  } else if (role === 'STUDENT') {
    await prisma.studentProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  } else if (role === 'PARENT') {
    await prisma.parentProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }
}

async function main() {
  console.log('Seeding requested accounts (non-destructive)...');

  for (const acc of accounts) {
    const hashed = await bcrypt.hash(acc.password, 12);
    const user = await prisma.user.upsert({
      where: { email: acc.email },
      update: {
        name: acc.name,
        role: acc.role,
        status: 'ACTIVE',
        emailVerified: true,
        password: hashed,
      },
      create: {
        email: acc.email,
        password: hashed,
        name: acc.name,
        role: acc.role,
        status: 'ACTIVE',
        emailVerified: true,
      },
    });

    await ensureRoleProfile(user.id, acc.role);
  }

  console.log('Accounts seed completed.');
}

main()
  .catch((e) => {
    console.error('Accounts seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

