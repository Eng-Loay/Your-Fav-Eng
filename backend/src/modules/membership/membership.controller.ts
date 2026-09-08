import { Request, Response } from 'express';
import { membershipService } from './membership.service';

function param(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

export const membershipController = {
  async listPackages(req: Request, res: Response) {
    try {
      const activeOnly = req.path.includes('/admin/') ? false : req.query.active !== 'false';
      const data = await membershipService.listPackages(activeOnly);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async createPackage(req: Request, res: Response) {
    try {
      const data = await membershipService.createPackage(req.body);
      res.status(201).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async updatePackage(req: Request, res: Response) {
    try {
      const data = await membershipService.updatePackage(param(req.params.id), req.body);
      if (!data) return res.status(404).json({ success: false, message: 'Package not found' });
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async deletePackage(req: Request, res: Response) {
    try {
      const ok = await membershipService.deletePackage(param(req.params.id));
      if (!ok) return res.status(404).json({ success: false, message: 'Package not found' });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async listMyMemberships(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const data = await membershipService.listUserMemberships(userId);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getMyMembership(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const data = await membershipService.getMyMembership(userId, param(req.params.id));
      if (!data) return res.status(404).json({ success: false, message: 'Membership not found' });
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async listAllMemberships(req: Request, res: Response) {
    try {
      const data = await membershipService.listAllMemberships();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async issueMembership(req: Request, res: Response) {
    try {
      const data = await membershipService.issueMembership(req.body);
      res.status(201).json({ success: true, data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async getPackageCourses(req: Request, res: Response) {
    try {
      const data = await membershipService.getPackageCourses(param(req.params.id));
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async verifyMembership(req: Request, res: Response) {
    try {
      const data = await membershipService.verifyMembership(param(req.params.membershipNo));
      if (!data) return res.status(404).json({ success: false, message: 'Membership not found or expired' });
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async listMembershipTemplates(req: Request, res: Response) {
    try {
      const data = await membershipService.listMembershipTemplates();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async createMembershipTemplate(req: Request, res: Response) {
    try {
      const body = { ...req.body };
      if (body.overlayFields && typeof body.overlayFields === 'object') {
        body.overlayFields = JSON.stringify(body.overlayFields);
      }
      const data = await membershipService.createMembershipTemplate(body);
      res.status(201).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async updateMembershipTemplate(req: Request, res: Response) {
    try {
      const body = { ...req.body };
      if (body.overlayFields && typeof body.overlayFields === 'object') {
        body.overlayFields = JSON.stringify(body.overlayFields);
      }
      const data = await membershipService.updateMembershipTemplate(param(req.params.id), body);
      if (!data) return res.status(404).json({ success: false, message: 'Template not found' });
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async deleteMembershipTemplate(req: Request, res: Response) {
    try {
      const ok = await membershipService.deleteMembershipTemplate(param(req.params.id));
      if (!ok) return res.status(404).json({ success: false, message: 'Template not found' });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async downloadMyMembership(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const result = await membershipService.getMembershipPdfBuffer(param(req.params.id), userId);
      if (!result) return res.status(404).json({ success: false, message: 'Membership not found' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="membership-${result.membershipNo}.pdf"`
      );
      return res.send(result.buffer);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to download membership PDF' });
    }
  },

  async downloadMembershipByNo(req: Request, res: Response) {
    try {
      const result = await membershipService.getMembershipPdfBufferByNo(param(req.params.membershipNo));
      if (!result) return res.status(404).json({ success: false, message: 'Membership not found or expired' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="membership-${result.membershipNo}.pdf"`
      );
      return res.send(result.buffer);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to download membership PDF' });
    }
  },

  async downloadAdminMembership(req: Request, res: Response) {
    try {
      const result = await membershipService.getMembershipPdfBuffer(param(req.params.id));
      if (!result) return res.status(404).json({ success: false, message: 'Membership not found' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="membership-${result.membershipNo}.pdf"`
      );
      return res.send(result.buffer);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to download membership PDF' });
    }
  },
};
