import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { membershipController } from './membership.controller';
import {
  createPackageSchema,
  updatePackageSchema,
  issueMembershipSchema,
  membershipTemplateSchema,
  updateMembershipTemplateSchema,
} from './membership.validation';

const router = Router();

// Public
router.get('/packages', membershipController.listPackages);
router.get('/packages/:id/courses', membershipController.getPackageCourses);
router.get('/verify/:membershipNo/download', membershipController.downloadMembershipByNo);
router.get('/verify/:membershipNo', membershipController.verifyMembership);

// Student
router.get('/my', authenticate, membershipController.listMyMemberships);
router.get('/my/:id/download', authenticate, membershipController.downloadMyMembership);
router.get('/my/:id', authenticate, membershipController.getMyMembership);

// Admin
const adminAuth = [authenticate, authorize('ADMIN')];
router.get('/admin/packages', ...adminAuth, membershipController.listPackages);
router.post('/admin/packages', ...adminAuth, validate(createPackageSchema), membershipController.createPackage);
router.put('/admin/packages/:id', ...adminAuth, validate(updatePackageSchema), membershipController.updatePackage);
router.delete('/admin/packages/:id', ...adminAuth, membershipController.deletePackage);
router.get('/admin/memberships', ...adminAuth, membershipController.listAllMemberships);
router.get('/admin/memberships/:id/download', ...adminAuth, membershipController.downloadAdminMembership);
router.post('/admin/issue', ...adminAuth, validate(issueMembershipSchema), membershipController.issueMembership);
router.get('/admin/templates', ...adminAuth, membershipController.listMembershipTemplates);
router.post('/admin/templates', ...adminAuth, validate(membershipTemplateSchema), membershipController.createMembershipTemplate);
router.put('/admin/templates/:id', ...adminAuth, validate(updateMembershipTemplateSchema), membershipController.updateMembershipTemplate);
router.delete('/admin/templates/:id', ...adminAuth, membershipController.deleteMembershipTemplate);

export default router;
