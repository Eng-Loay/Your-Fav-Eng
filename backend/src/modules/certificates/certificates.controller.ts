import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import { AuthRequest } from '../../middleware/auth';
import { ApiResponse } from '../../utils/apiResponse';
import { env } from '../../config/env';
import { certificatesService } from './certificates.service';
import { generateCertificatePdf, type OverlayField } from './certificate-generator';

async function generateOrGetCertificatePdf(certificate: {
  certificateNo: string;
  grade?: number | null;
  issuedAt: Date;
  templateId?: string | null;
  template?: { imageUrl?: string | null; overlayFields?: string | null } | null;
  user?: { name: string } | string;
  course?: { title?: string; titleAr?: string | null; instructor?: { name: string } | string };
}): Promise<Buffer | null> {
  const uploadDir = path.resolve(env.uploadDir);
  const templatePath = certificate.templateId
    ? path.join(uploadDir, 'certificates', `${certificate.templateId}.pdf`)
    : null;

  if (templatePath && fs.existsSync(templatePath)) {
    return fs.readFileSync(templatePath);
  }

  const template = certificate.template;
  if (template?.imageUrl) {
    let overlayFields: OverlayField[] = [];
    if (template.overlayFields) {
      try {
        overlayFields = JSON.parse(template.overlayFields) as OverlayField[];
      } catch {
        overlayFields = [];
      }
    }

    const userName = typeof certificate.user === 'string' ? certificate.user : certificate.user?.name ?? '';
    const courseVal = certificate.course;
    const courseTitle = typeof courseVal === 'object' ? (courseVal?.title ?? '') : '';
    const courseTitleAr = typeof courseVal === 'object' ? (courseVal?.titleAr ?? undefined) : undefined;
    const instructorVal = typeof courseVal === 'object' ? courseVal?.instructor : null;
    const instructorName = typeof instructorVal === 'string' ? instructorVal : (instructorVal as { name?: string })?.name ?? '';
    const issuedAt = certificate.issuedAt instanceof Date ? certificate.issuedAt : new Date(certificate.issuedAt);

    const pdfBytes = await generateCertificatePdf(
      template.imageUrl,
      overlayFields,
      {
        userName,
        courseTitle: courseTitleAr || courseTitle,
        courseTitleAr,
        instructorName,
        date: issuedAt.toLocaleDateString('ar-EG'),
        grade: certificate.grade ?? undefined,
        certificateNo: certificate.certificateNo,
      }
    );

    return Buffer.from(pdfBytes);
  }

  return null;
}

export const certificatesController = {
  async listMy(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const certificates = await certificatesService.listMy(req.user.id);
      return ApiResponse.success(res, certificates);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list certificates', 500);
    }
  },

  async verify(req: AuthRequest, res: Response) {
    try {
      const certNo = Array.isArray(req.params.certNo) ? req.params.certNo[0] : req.params.certNo;
      if (!certNo) return ApiResponse.badRequest(res, 'Certificate number required');
      const certificate = await certificatesService.verify(certNo);
      if (!certificate) return ApiResponse.notFound(res, 'Certificate not found or invalid');
      return ApiResponse.success(res, certificate);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to verify certificate', 500);
    }
  },

  async downloadByCertNo(req: AuthRequest, res: Response) {
    try {
      const certNo = Array.isArray(req.params.certNo) ? req.params.certNo[0] : req.params.certNo;
      if (!certNo) return ApiResponse.badRequest(res, 'Certificate number required');

      const certificate = await certificatesService.getForDownloadByCertNo(certNo);
      if (!certificate) return ApiResponse.notFound(res, 'Certificate not found');

      let pdfBuffer: Buffer | null = null;
      try {
        pdfBuffer = await generateOrGetCertificatePdf(certificate);
      } catch (genErr) {
        console.error('[downloadByCertNo] PDF generation failed:', genErr);
        const genMsg = genErr instanceof Error ? genErr.message : 'PDF generation failed';
        return ApiResponse.success(res, {
          certificateNo: certificate.certificateNo,
          user: certificate.user,
          course: certificate.course,
          issuedAt: certificate.issuedAt,
          grade: certificate.grade,
          error: genMsg,
        }, 'Certificate found but PDF generation failed. Returning certificate data instead.');
      }

      if (!pdfBuffer) {
        return ApiResponse.success(res, {
          certificateNo: certificate.certificateNo,
          user: certificate.user,
          course: certificate.course,
          issuedAt: certificate.issuedAt,
          grade: certificate.grade,
        }, 'Certificate template has no image. Returning certificate data.');
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="certificate-${certificate.certificateNo}.pdf"`);
      return res.send(pdfBuffer);
    } catch (err) {
      console.error('[downloadByCertNo]', err);
      return ApiResponse.error(res, 'Failed to download certificate', 500);
    }
  },

  async download(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const certificate = await certificatesService.getForDownload(id, req.user.id);
      if (!certificate) return ApiResponse.notFound(res, 'Certificate not found');

      const pdfBuffer = await generateOrGetCertificatePdf(certificate);
      if (!pdfBuffer) {
        return ApiResponse.success(res, {
          certificateNo: certificate.certificateNo,
          user: certificate.user,
          course: certificate.course,
          issuedAt: certificate.issuedAt,
          grade: certificate.grade,
        });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="certificate-${certificate.certificateNo}.pdf"`);
      return res.send(pdfBuffer);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to download certificate', 500);
    }
  },

  async generateOrGetCertificatePdf(certificate: {
    certificateNo: string;
    grade?: number | null;
    issuedAt: Date;
    templateId?: string | null;
    template?: { imageUrl?: string | null; overlayFields?: string | null } | null;
    user?: { name: string } | string;
    course?: { title?: string; titleAr?: string | null; instructor?: { name: string } | string };
  }): Promise<Buffer | null> {
    const uploadDir = path.resolve(env.uploadDir);
    const templatePath = certificate.templateId
      ? path.join(uploadDir, 'certificates', `${certificate.templateId}.pdf`)
      : null;

    if (templatePath && fs.existsSync(templatePath)) {
      return fs.readFileSync(templatePath);
    }

    const template = certificate.template;
    if (template?.imageUrl) {
      let overlayFields: OverlayField[] = [];
      if (template.overlayFields) {
        try {
          overlayFields = JSON.parse(template.overlayFields) as OverlayField[];
        } catch {
          overlayFields = [];
        }
      }

      const userName = typeof certificate.user === 'string' ? certificate.user : certificate.user?.name ?? '';
      const courseVal = certificate.course;
      const courseTitle = typeof courseVal === 'object' ? (courseVal?.title ?? '') : '';
      const courseTitleAr = typeof courseVal === 'object' ? (courseVal?.titleAr ?? undefined) : undefined;
      const instructorVal = typeof courseVal === 'object' ? courseVal?.instructor : null;
      const instructorName = typeof instructorVal === 'string' ? instructorVal : (instructorVal as { name?: string })?.name ?? '';

      const pdfBytes = await generateCertificatePdf(
        template.imageUrl,
        overlayFields,
        {
          userName,
          courseTitle: courseTitleAr || courseTitle,
          courseTitleAr,
          instructorName,
          date: certificate.issuedAt ? new Date(certificate.issuedAt).toLocaleDateString('ar-EG') : '',
          grade: certificate.grade ?? undefined,
          certificateNo: certificate.certificateNo,
        }
      );

      return Buffer.from(pdfBytes);
    }

    return null;
  },
};
