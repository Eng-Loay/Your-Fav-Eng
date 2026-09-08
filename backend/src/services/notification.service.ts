/**
 * Notification service - creates in-app notifications and optionally sends emails
 * for all platform events (enrollment, order, certificate, message, etc.)
 */
import prisma from '../config/database';
import { sendEmail } from './email.service';

export type NotificationEvent =
  | 'enrollment'
  | 'order_completed'
  | 'certificate_issued'
  | 'new_message'
  | 'assignment_graded'
  | 'exam_result'
  | 'course_published'
  | 'review_approved'
  | 'payout_processed'
  | 'instructor_approved'
  | 'teacher_approved'
  | 'child_grade_update'
  | 'child_enrollment'
  | 'payment_request_approved'
  | 'payment_request_rejected';

interface NotifyOptions {
  userId: string;
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  type?: string;
  link?: string;
  sendEmail?: boolean;
  locale?: string;
}

export async function createNotification(opts: NotifyOptions): Promise<void> {
  const { userId, title, titleAr, message, messageAr, type = 'info', link } = opts;
  const locale = opts.locale || 'ar';
  const finalTitle = locale === 'ar' && titleAr ? titleAr : title;
  const finalMessage = locale === 'ar' && messageAr ? messageAr : message;

  await prisma.notification.create({
    data: {
      userId,
      title: finalTitle,
      message: finalMessage,
      type,
      channel: 'IN_APP',
      link: link || undefined,
    },
  });

  if (opts.sendEmail) {
    const settings = await prisma.notificationSetting.findUnique({
      where: { userId },
    });
    if (settings?.email !== false) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      if (user?.email) {
        await sendEmail({
          to: user.email,
          subject: finalTitle,
          text: finalMessage,
          html: `<p>${finalMessage.replace(/\n/g, '</p><p>')}</p>${link ? `<p><a href="${link}">عرض</a></p>` : ''}`,
        });
      }
    }
  }
}

export async function notifyEnrollment(userId: string, courseTitle: string, courseTitleAr?: string, locale = 'ar'): Promise<void> {
  await createNotification({
    userId,
    title: `Enrolled in ${courseTitle}`,
    titleAr: `تم التسجيل في ${courseTitleAr || courseTitle}`,
    message: `You have been enrolled in "${courseTitle}". Start learning now!`,
    messageAr: `تم تسجيلك في "${courseTitleAr || courseTitle}". ابدأ التعلم الآن!`,
    type: 'success',
    link: '/dashboard/courses',
    sendEmail: true,
    locale,
  });
}

export async function notifyOrderCompleted(userId: string, total: number, currency: string, locale = 'ar'): Promise<void> {
  await createNotification({
    userId,
    title: 'Order completed',
    titleAr: 'تم إتمام الطلب',
    message: `Your order has been completed. Total: ${currency} ${total}`,
    messageAr: `تم إتمام طلبك. الإجمالي: ${total} ${currency}`,
    type: 'success',
    link: '/dashboard/purchases',
    sendEmail: true,
    locale,
  });
}

export async function notifyCertificateIssued(userId: string, courseTitle: string, certNo: string, locale = 'ar'): Promise<void> {
  await createNotification({
    userId,
    title: 'Certificate issued',
    titleAr: 'تم إصدار الشهادة',
    message: `You earned a certificate for "${courseTitle}". Certificate #${certNo}`,
    messageAr: `حصلت على شهادة في "${courseTitle}". رقم الشهادة: ${certNo}`,
    type: 'success',
    link: '/dashboard/certificates',
    sendEmail: true,
    locale,
  });
}

export async function notifyNewMessage(userId: string, senderName: string, preview: string, locale = 'ar'): Promise<void> {
  await createNotification({
    userId,
    title: `New message from ${senderName}`,
    titleAr: `رسالة جديدة من ${senderName}`,
    message: preview,
    messageAr: preview,
    type: 'info',
    link: '/dashboard/messages',
    sendEmail: true,
    locale,
  });
}

export async function notifyAssignmentGraded(userId: string, assignmentTitle: string, grade: number, locale = 'ar'): Promise<void> {
  await createNotification({
    userId,
    title: 'Assignment graded',
    titleAr: 'تم تقييم الواجب',
    message: `Your assignment "${assignmentTitle}" has been graded: ${grade}`,
    messageAr: `تم تقييم واجبك "${assignmentTitle}": ${grade}`,
    type: 'info',
    link: '/dashboard/assignments',
    sendEmail: true,
    locale,
  });
}

export async function notifyExamResult(userId: string, examTitle: string, passed: boolean, score: number, locale = 'ar'): Promise<void> {
  await createNotification({
    userId,
    title: passed ? 'Exam passed' : 'Exam result',
    titleAr: passed ? 'نجحت في الامتحان' : 'نتيجة الامتحان',
    message: `"${examTitle}": ${passed ? 'Passed' : 'Did not pass'} (${score}%)`,
    messageAr: `"${examTitle}": ${passed ? 'نجحت' : 'لم تنجح'} (${score}%)`,
    type: passed ? 'success' : 'info',
    link: '/dashboard/exam-results',
    sendEmail: true,
    locale,
  });
}

export async function notifyTeacherApproved(userId: string, locale = 'ar'): Promise<void> {
  await createNotification({
    userId,
    title: 'Teacher account approved',
    titleAr: 'تم الموافقة على حساب المدرس',
    message: 'Your teacher account has been approved.',
    messageAr: 'تمت الموافقة على حسابك كمدرس.',
    type: 'success',
    link: '/teacher-dashboard',
    sendEmail: true,
    locale,
  });
}

export async function notifyPayoutProcessed(userId: string, amount: number, currency: string, locale = 'ar'): Promise<void> {
  await createNotification({
    userId,
    title: 'Payout processed',
    titleAr: 'تم معالجة الدفع',
    message: `Your payout of ${currency} ${amount} has been processed.`,
    messageAr: `تم معالجة دفعتك بقيمة ${amount} ${currency}.`,
    type: 'success',
    link: '/instructor-dashboard',
    sendEmail: true,
    locale,
  });
}

export async function notifyParentChildGrade(parentId: string, childName: string, courseTitle: string, grade: number, locale = 'ar'): Promise<void> {
  await createNotification({
    userId: parentId,
    title: `${childName} received a grade`,
    titleAr: `حصل ${childName} على درجة`,
    message: `${childName} received ${grade} in ${courseTitle}`,
    messageAr: `حصل ${childName} على ${grade} في ${courseTitle}`,
    type: 'info',
    link: '/parent-dashboard/grades',
    sendEmail: true,
    locale,
  });
}

export async function notifyParentChildEnrollment(parentId: string, childName: string, courseTitle: string, locale = 'ar'): Promise<void> {
  await createNotification({
    userId: parentId,
    title: `${childName} enrolled in a course`,
    titleAr: `تسجيل ${childName} في دورة`,
    message: `${childName} has been enrolled in "${courseTitle}"`,
    messageAr: `تم تسجيل ${childName} في "${courseTitle}"`,
    type: 'info',
    link: '/parent-dashboard/children',
    sendEmail: true,
    locale,
  });
}

export async function notifyPaymentRequestApproved(userId: string, amount: number, locale = 'ar'): Promise<void> {
  await createNotification({
    userId,
    title: 'Payment request approved',
    titleAr: 'تمت الموافقة على طلب الدفع',
    message: `Your payment request of ${amount} has been approved.`,
    messageAr: `تمت الموافقة على طلب الدفع بقيمة ${amount}.`,
    type: 'success',
    link: '/dashboard',
    sendEmail: true,
    locale,
  });
}

export async function notifyPaymentRequestRejected(userId: string, reason?: string, locale = 'ar'): Promise<void> {
  await createNotification({
    userId,
    title: 'Payment request rejected',
    titleAr: 'تم رفض طلب الدفع',
    message: reason || 'Your payment request has been rejected.',
    messageAr: reason || 'تم رفض طلب الدفع.',
    type: 'error',
    link: '/dashboard',
    sendEmail: true,
    locale,
  });
}
