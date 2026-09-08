import prisma from '../../config/database';
import { generateCertificateNo } from '../../utils/helpers';

export const certificatesService = {
  async listMy(userId: string) {
    return prisma.certificate.findMany({
      where: { userId },
      orderBy: { issuedAt: 'desc' },
      include: {
        course: {
          select: { id: true, title: true, slug: true, thumbnail: true },
        },
      },
    });
  },

  async verify(certNo: string) {
    const certificate = await prisma.certificate.findUnique({
      where: { certificateNo: certNo },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        course: {
          select: { id: true, title: true, titleAr: true, slug: true, instructor: { select: { name: true } } },
        },
        template: {
          select: { id: true, imageUrl: true, overlayFields: true },
        },
      },
    });

    if (!certificate) return null;

    let template = certificate.template;
    if (!template?.imageUrl) {
      const defaultTemplate = await prisma.certificateTemplate.findFirst({
        where: { isDefault: true },
        select: { id: true, imageUrl: true, overlayFields: true },
      });
      if (defaultTemplate?.imageUrl) template = defaultTemplate;
    }

    return {
      ...certificate,
      template: template ?? null,
      verified: true,
      verifiedAt: certificate.verifiedAt ?? new Date(),
    };
  },

  async getForDownload(id: string, userId: string) {
    const cert = await prisma.certificate.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        course: {
          select: { id: true, title: true, titleAr: true, instructor: { select: { name: true } } },
        },
        template: true,
      },
    });

    if (!cert || cert.userId !== userId) return null;
    if (!cert.template?.imageUrl) {
      const defaultTemplate = await prisma.certificateTemplate.findFirst({ where: { isDefault: true } });
      if (defaultTemplate?.imageUrl) {
        return { ...cert, template: defaultTemplate, templateId: defaultTemplate.id };
      }
    }
    return cert;
  },

  async getForDownloadByCertNo(certNo: string) {
    const cert = await prisma.certificate.findUnique({
      where: { certificateNo: certNo },
      include: {
        user: { select: { id: true, name: true } },
        course: {
          select: { id: true, title: true, titleAr: true, instructor: { select: { name: true } } },
        },
        template: true,
      },
    });
    if (cert && !cert.template?.imageUrl) {
      const defaultTemplate = await prisma.certificateTemplate.findFirst({ where: { isDefault: true } });
      if (defaultTemplate?.imageUrl) {
        return { ...cert, template: defaultTemplate, templateId: defaultTemplate.id };
      }
    }
    return cert;
  },

  async issue(userId: string, courseId: string, grade?: number, templateId?: string | null, options?: { skipEnrollmentCheck?: boolean }) {
    const existing = await prisma.certificate.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) return existing;

    if (!options?.skipEnrollmentCheck) {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          userId,
          courseId,
          OR: [{ status: 'COMPLETED' }, { completedAt: { not: null } }, { progress: { gte: 100 } }],
        },
      });
      if (!enrollment) return null;
    }

    let certNo = generateCertificateNo();
    let exists = await prisma.certificate.findUnique({ where: { certificateNo: certNo } });
    while (exists) {
      certNo = generateCertificateNo();
      exists = await prisma.certificate.findUnique({ where: { certificateNo: certNo } });
    }

    const created = await prisma.certificate.create({
      data: {
        certificateNo: certNo,
        userId,
        courseId,
        grade: grade ?? null,
        templateId: templateId ?? null,
        verifiedAt: new Date(),
      },
      include: {
        course: { select: { id: true, title: true, titleAr: true } },
      },
    });
    import('../../services/notification.service').then(({ notifyCertificateIssued }) =>
      notifyCertificateIssued(userId, created.course.titleAr || created.course.title, created.certificateNo, 'ar').catch(() => {})
    ).catch(() => {});
    return created;
  },
};
