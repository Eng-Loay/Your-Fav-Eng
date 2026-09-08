import prisma from '../../config/database';
import fs from 'fs';
import path from 'path';
import { env } from '../../config/env';
import { generateMembershipPdf, saveMembershipPdf } from './membership-pdf';

function generateMembershipNo(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `LE-${year}-${rand}`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function parseCourseIds(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0);
  } catch {
    return [];
  }
}

function serializeCourseIds(courseIds?: string[]): string | undefined {
  if (!courseIds) return undefined;
  const unique = [...new Set(courseIds.filter(Boolean))];
  return JSON.stringify(unique);
}

function formatPackage<T extends { courseIds?: string | null; courseCount?: number }>(pkg: T) {
  const courseIds = parseCourseIds(pkg.courseIds);
  return {
    ...pkg,
    courseIds,
    courseCount: courseIds.length > 0 ? courseIds.length : pkg.courseCount ?? 0,
  };
}

async function enrollUserInPackageCourses(userId: string, courseIds: string[]) {
  for (const courseId of courseIds) {
    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } });
    if (!course) continue;
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId, source: 'membership', status: 'ACTIVE' },
      update: { status: 'ACTIVE', source: 'membership' },
    });
  }
}

export const membershipService = {
  async listPackages(activeOnly = false) {
    const where = activeOnly ? { status: 'active' } : {};
    const rows = await prisma.membershipPackage.findMany({
      where,
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
    });
    return rows.map(formatPackage);
  },

  async getPackage(id: string) {
    const pkg = await prisma.membershipPackage.findUnique({ where: { id } });
    return pkg ? formatPackage(pkg) : null;
  },

  async createPackage(input: {
    title: string;
    titleAr?: string;
    description?: string;
    descriptionAr?: string;
    price?: number;
    currency?: string;
    courseCount?: number;
    courseIds?: string[];
    level?: string;
    duration?: string;
    image?: string;
    status?: string;
    position?: number;
  }) {
    const courseIds = input.courseIds ?? [];
    const courseCount = courseIds.length > 0 ? courseIds.length : (input.courseCount ?? 1);
    const created = await prisma.membershipPackage.create({
      data: {
        title: input.title,
        titleAr: input.titleAr,
        description: input.description,
        descriptionAr: input.descriptionAr,
        price: input.price ?? 0,
        currency: input.currency ?? 'GBP',
        courseCount,
        courseIds: serializeCourseIds(courseIds),
        level: input.level,
        duration: input.duration ?? 'Annual',
        image: input.image,
        status: input.status ?? 'active',
        position: input.position ?? 0,
      },
    });
    return formatPackage(created);
  },

  async updatePackage(id: string, input: Record<string, unknown>) {
    const existing = await prisma.membershipPackage.findUnique({ where: { id } });
    if (!existing) return null;

    const courseIds = input.courseIds !== undefined ? (input.courseIds as string[]) : parseCourseIds(existing.courseIds);
    const courseCount =
      input.courseIds !== undefined
        ? courseIds.length
        : input.courseCount !== undefined
          ? (input.courseCount as number)
          : existing.courseCount;

    const updated = await prisma.membershipPackage.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title as string }),
        ...(input.titleAr !== undefined && { titleAr: input.titleAr as string }),
        ...(input.description !== undefined && { description: input.description as string }),
        ...(input.descriptionAr !== undefined && { descriptionAr: input.descriptionAr as string }),
        ...(input.price !== undefined && { price: input.price as number }),
        ...(input.currency !== undefined && { currency: input.currency as string }),
        ...(input.courseIds !== undefined && { courseIds: serializeCourseIds(courseIds), courseCount }),
        ...(input.courseIds === undefined && input.courseCount !== undefined && { courseCount: input.courseCount as number }),
        ...(input.level !== undefined && { level: input.level as string }),
        ...(input.duration !== undefined && { duration: input.duration as string }),
        ...(input.image !== undefined && { image: input.image as string }),
        ...(input.status !== undefined && { status: input.status as string }),
        ...(input.position !== undefined && { position: input.position as number }),
      },
    });
    return formatPackage(updated);
  },

  async deletePackage(id: string) {
    const existing = await prisma.membershipPackage.findUnique({ where: { id } });
    if (!existing) return null;
    await prisma.membershipPackage.delete({ where: { id } });
    return true;
  },

  async listUserMemberships(userId: string) {
    const rows = await prisma.membership.findMany({
      where: { userId },
      include: { package: true },
      orderBy: { issuedAt: 'desc' },
    });
    return rows.map((m) => ({
      ...m,
      package: m.package ? formatPackage(m.package) : m.package,
    }));
  },

  async listAllMemberships() {
    const rows = await prisma.membership.findMany({
      include: {
        package: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { issuedAt: 'desc' },
    });
    return rows.map((m) => ({
      ...m,
      package: m.package ? formatPackage(m.package) : m.package,
    }));
  },

  async issueMembership(input: { userId: string; packageId: string; expiresAt?: Date }) {
    const [user, pkgRow, defaultTemplate] = await Promise.all([
      prisma.user.findUnique({ where: { id: input.userId } }),
      prisma.membershipPackage.findUnique({ where: { id: input.packageId } }),
      prisma.membershipTemplate.findFirst({ where: { isDefault: true } }),
    ]);
    if (!user) throw new Error('User not found');
    if (!pkgRow) throw new Error('Package not found');

    const pkg = formatPackage(pkgRow);
    const courseIds = pkg.courseIds ?? [];

    const membershipNo = generateMembershipNo();
    const issuedAt = new Date();
    const expiresAt = input.expiresAt ?? new Date(issuedAt.getFullYear() + 1, issuedAt.getMonth(), issuedAt.getDate());

    const pdfUrl = await saveMembershipPdf(
      {
        memberName: user.name,
        membershipNo,
        packageTitle: pkg.title,
        level: pkg.level ?? undefined,
        courseCount: pkg.courseCount,
        duration: pkg.duration,
        issuedAt: formatDate(issuedAt),
        expiresAt: formatDate(expiresAt),
      },
      membershipNo,
      defaultTemplate
    );

    const membership = await prisma.membership.create({
      data: {
        membershipNo,
        userId: input.userId,
        packageId: input.packageId,
        templateId: defaultTemplate?.id ?? null,
        pdfUrl,
        expiresAt,
        coursesUsed: 0,
        verifiedAt: issuedAt,
      },
      include: { package: true, template: true },
    });

    if (courseIds.length > 0) {
      await enrollUserInPackageCourses(input.userId, courseIds);
    }

    return {
      ...membership,
      package: membership.package ? formatPackage(membership.package) : membership.package,
    };
  },

  async getMyMembership(userId: string, membershipId: string) {
    const membership = await prisma.membership.findFirst({
      where: { id: membershipId, userId },
      include: { package: true, template: true },
    });
    if (!membership) return null;
    return {
      ...membership,
      package: membership.package ? formatPackage(membership.package) : membership.package,
    };
  },

  async verifyMembership(membershipNo: string) {
    const membership = await prisma.membership.findUnique({
      where: { membershipNo },
      include: {
        package: true,
        template: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
    if (!membership || membership.status !== 'ACTIVE') return null;

    const now = new Date();
    const isExpired = membership.expiresAt ? membership.expiresAt < now : false;
    if (isExpired) return null;

    if (!membership.verifiedAt) {
      await prisma.membership.update({
        where: { id: membership.id },
        data: { verifiedAt: now },
      });
    }

    return {
      ...membership,
      verified: true,
      package: membership.package ? formatPackage(membership.package) : membership.package,
    };
  },

  async listMembershipTemplates() {
    return prisma.membershipTemplate.findMany({ orderBy: { createdAt: 'desc' } });
  },

  async createMembershipTemplate(data: {
    name: string;
    nameAr?: string;
    imageUrl?: string;
    overlayFields?: string;
    isDefault?: boolean;
  }) {
    if (data.isDefault) {
      await prisma.membershipTemplate.updateMany({ data: { isDefault: false } });
    }
    return prisma.membershipTemplate.create({
      data: {
        name: data.name,
        nameAr: data.nameAr ?? null,
        imageUrl: data.imageUrl ?? null,
        thumbnail: data.imageUrl ?? null,
        overlayFields: data.overlayFields ?? null,
        isDefault: data.isDefault ?? false,
      },
    });
  },

  async updateMembershipTemplate(
    id: string,
    data: {
      name?: string;
      nameAr?: string;
      imageUrl?: string;
      overlayFields?: string;
      isDefault?: boolean;
    }
  ) {
    const existing = await prisma.membershipTemplate.findUnique({ where: { id } });
    if (!existing) return null;
    if (data.isDefault) {
      await prisma.membershipTemplate.updateMany({ data: { isDefault: false } });
    }
    return prisma.membershipTemplate.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.nameAr !== undefined && { nameAr: data.nameAr }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl, thumbnail: data.imageUrl }),
        ...(data.overlayFields !== undefined && { overlayFields: data.overlayFields }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
      },
    });
  },

  async deleteMembershipTemplate(id: string) {
    const existing = await prisma.membershipTemplate.findUnique({ where: { id } });
    if (!existing) return null;
    await prisma.membershipTemplate.delete({ where: { id } });
    return true;
  },

  async getMembershipPdf(userId: string, membershipId: string) {
    const membership = await prisma.membership.findFirst({
      where: { id: membershipId, userId },
      include: { package: true },
    });
    if (!membership) return null;
    return {
      ...membership,
      package: membership.package ? formatPackage(membership.package) : membership.package,
    };
  },

  async getMembershipPdfBuffer(membershipId: string, userId?: string) {
    const membership = await prisma.membership.findFirst({
      where: userId ? { id: membershipId, userId } : { id: membershipId },
      include: {
        package: true,
        template: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
    if (!membership) return null;

    let template = membership.template;
    if (!template) {
      template = await prisma.membershipTemplate.findFirst({ where: { isDefault: true } });
    }

    const pkg = membership.package ? formatPackage(membership.package) : null;
    const issuedAt = membership.issuedAt ?? new Date();
    const expiresAt = membership.expiresAt ?? undefined;
    const buffer = await generateMembershipPdf(
      {
        memberName: membership.user?.name || 'Member',
        membershipNo: membership.membershipNo,
        packageTitle: pkg?.title || 'Membership',
        level: pkg?.level ?? undefined,
        courseCount: pkg?.courseCount ?? 0,
        duration: pkg?.duration || 'Annual',
        issuedAt: formatDate(issuedAt),
        expiresAt: expiresAt ? formatDate(expiresAt) : undefined,
      },
      template
    );

    return { buffer, membershipNo: membership.membershipNo };
  },

  async getMembershipPdfBufferByNo(membershipNo: string) {
    const membership = await prisma.membership.findUnique({
      where: { membershipNo },
      include: {
        package: true,
        template: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
    if (!membership || membership.status !== 'ACTIVE') return null;
    if (membership.expiresAt && membership.expiresAt < new Date()) return null;
    return this.getMembershipPdfBuffer(membership.id);
  },

  async getPackageCourses(packageId: string) {
    const pkg = await prisma.membershipPackage.findUnique({ where: { id: packageId } });
    if (!pkg) return [];
    const ids = parseCourseIds(pkg.courseIds);
    if (ids.length === 0) return [];
    return prisma.course.findMany({
      where: { id: { in: ids } },
      select: { id: true, title: true, titleAr: true, thumbnail: true, level: true },
    });
  },
};
