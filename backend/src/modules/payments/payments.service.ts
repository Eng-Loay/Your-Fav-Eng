import Stripe from 'stripe';
import prisma from '../../config/database';
import { env } from '../../config/env';
import { parsePagination } from '../../utils/helpers';

const stripe = env.stripeSecretKey ? new Stripe(env.stripeSecretKey) : null;

async function getPlatformCommissionRate(): Promise<number> {
  const { getCommissionConfig } = await import('../../services/commission.service');
  const config = await getCommissionConfig();
  return config.type === 'percentage' ? config.percentage / 100 : 0.3;
}

export interface CartItemInput {
  courseId?: string;
  chapterId?: string;
  productId?: string;
  quantity?: number;
}

export interface CreateCheckoutInput {
  items: Array<{
    courseId?: string;
    chapterId?: string;
    bundleId?: string;
    productId?: string;
    quantity?: number;
  }>;
  successUrl: string;
  cancelUrl: string;
  couponCode?: string;
  currency?: string;
}

export const paymentsService = {
  async getCart(userId: string) {
    const items = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            price: true,
            currency: true,
            discountPrice: true,
          },
        },
      },
    });

    const chapterIds = items.filter((i) => i.chapterId).map((i) => i.chapterId!);
    const chapters = chapterIds.length
      ? await prisma.chapter.findMany({
          where: { id: { in: chapterIds } },
          include: { course: true },
        })
      : [];
    const chapterMap = new Map(chapters.map((c) => [c.id, c]));

    const productIds = items.filter((i) => i.productId).map((i) => i.productId!);
    const products = productIds.length
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, title: true, titleAr: true, price: true, currency: true, thumbnail: true, type: true },
        })
      : [];
    const productMap = new Map(products.map((p) => [p.id, p]));

    const finalItems = items.map((item) => {
      let price = 0;
      let title = '';
      let currency = 'USD';
      let product = null;

      if (item.courseId && item.course) {
        price = (item.course.discountPrice ?? item.course.price) * (item.quantity || 1);
        title = item.course.title;
        currency = item.course.currency;
      } else if (item.chapterId) {
        const ch = chapterMap.get(item.chapterId);
        if (ch) {
          price = (ch.price ?? ch.course.price) * (item.quantity || 1);
          title = `${ch.course.title} - ${ch.title}`;
          currency = ch.course.currency;
        }
      } else if (item.productId) {
        const prod = productMap.get(item.productId);
        if (prod) {
          price = prod.price * (item.quantity || 1);
          title = prod.title;
          currency = prod.currency;
          product = prod;
        }
      }

      return {
        ...item,
        calculatedPrice: price,
        title: title || 'Unknown',
        currency,
        product,
      };
    });

    const total = finalItems.reduce((sum, i) => sum + i.calculatedPrice, 0);

    return { items: finalItems, subtotal: total, total };
  },

  async addToCart(userId: string, input: CartItemInput) {
    const { courseId: inputCourseId, chapterId, productId, quantity = 1 } = input;

    if (!inputCourseId && !chapterId && !productId) {
      throw new Error('Must provide courseId, chapterId, or productId');
    }

    let courseId = inputCourseId ?? null;

    if (chapterId && !courseId) {
      const chapter = await prisma.chapter.findUnique({
        where: { id: chapterId },
        select: { courseId: true },
      });
      if (!chapter) throw new Error('Chapter not found');
      courseId = chapter.courseId;
    }

    let existing = null;
    if (courseId) {
      existing = await prisma.cartItem.findUnique({
        where: { userId_courseId: { userId, courseId } },
      });
    } else if (productId) {
      existing = await prisma.cartItem.findFirst({
        where: { userId, productId },
      });
    }

    if (existing) {
      return prisma.cartItem.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + quantity,
          ...(chapterId && { chapterId }),
        },
      });
    }

    return prisma.cartItem.create({
      data: {
        userId,
        courseId,
        chapterId: chapterId ?? null,
        productId: productId ?? null,
        quantity,
      },
    });
  },

  async removeFromCart(userId: string, cartItemId: string) {
    const item = await prisma.cartItem.findFirst({
      where: { id: cartItemId, userId },
    });
    if (!item) return null;
    await prisma.cartItem.delete({ where: { id: cartItemId } });
    return true;
  },

  async applyCoupon(userId: string, code: string) {
    const coupon = await prisma.coupon.findFirst({
      where: { code: { equals: code.trim().toUpperCase() }, isActive: true },
      include: { courseIds: { select: { courseId: true } } },
    });

    if (!coupon) return { valid: false, message: 'Invalid coupon' };
    if (coupon.expiresAt && coupon.expiresAt < new Date()) return { valid: false, message: 'Coupon expired' };
    if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) return { valid: false, message: 'Coupon limit reached' };

    const cartData = await this.getCart(userId);
    const allowedCourseIds = coupon.courseIds.length > 0
      ? new Set(coupon.courseIds.map((c) => c.courseId))
      : null;

    let applicableTotal = 0;
    for (const item of cartData.items) {
      if (item.courseId && (allowedCourseIds === null || allowedCourseIds.has(item.courseId))) {
        applicableTotal += item.calculatedPrice ?? 0;
      } else if (item.productId) {
        applicableTotal += item.calculatedPrice ?? 0;
      }
    }
    const total = applicableTotal || cartData.total;
    if (coupon.minPurchase != null && total < coupon.minPurchase) {
      return { valid: false, message: `Minimum purchase of ${coupon.minPurchase} required` };
    }

    let discount = 0;
    if (coupon.discountType === 'percentage' || coupon.discountType === 'percent') {
      discount = (total * coupon.discount) / 100;
    } else {
      discount = coupon.discount;
    }

    return {
      valid: true,
      coupon: { code: coupon.code, discount, discountType: coupon.discountType },
      discountedTotal: Math.max(0, total - discount),
    };
  },

  async createPaymentRequest(userId: string, items: Array<{ courseId?: string; productId?: string }>) {
    const createdCourseIds: string[] = [];
    const createdProductIds: string[] = [];
    for (const item of items) {
      if (item.courseId) {
        const course = await prisma.course.findFirst({
          where: {
            status: 'PUBLISHED',
            OR: [{ id: item.courseId }, { slug: item.courseId }],
          },
        });
        if (!course || (course.price ?? 0) <= 0) continue;
        const existing = await prisma.paymentRequest.findFirst({
          where: { userId, courseId: course.id, status: 'PENDING' },
        });
        if (existing) continue;
        const amount = course.discountPrice ?? course.price;
        await prisma.paymentRequest.create({
          data: { userId, courseId: course.id, amount, status: 'PENDING' },
        });
        createdCourseIds.push(course.id);
      } else if (item.productId) {
        const product = await prisma.product.findFirst({
          where: { id: item.productId, status: 'active' },
        });
        if (!product || (product.price ?? 0) <= 0) continue;
        const existing = await prisma.paymentRequest.findFirst({
          where: { userId, productId: product.id, status: 'PENDING' },
        });
        if (existing) continue;
        const amount = product.price;
        await prisma.paymentRequest.create({
          data: { userId, productId: product.id, amount, status: 'PENDING' },
        });
        createdProductIds.push(product.id);
      }
    }
    if (createdCourseIds.length > 0) {
      await prisma.cartItem.deleteMany({
        where: { userId, courseId: { in: createdCourseIds } },
      });
    }
    if (createdProductIds.length > 0) {
      await prisma.cartItem.deleteMany({
        where: { userId, productId: { in: createdProductIds } },
      });
    }
    return { created: [...createdCourseIds, ...createdProductIds] };
  },

  async checkoutWithCoupon(
    userId: string,
    code: string,
    bodyItems?: Array<{ courseId?: string; productId?: string; quantity?: number }>
  ) {
    const result = await this.applyCoupon(userId, code);
    if (!result.valid) throw new Error(result.message);
    if (result.discountedTotal! > 0.01) throw new Error('Coupon does not cover full amount');

    let cart = await prisma.cartItem.findMany({
      where: { userId },
      include: { course: true, product: true },
    });
    if (cart.length === 0 && bodyItems && bodyItems.length > 0) {
      const virtualCart: typeof cart = [];
      for (const bi of bodyItems) {
        if (bi.courseId) {
          const course = await prisma.course.findUnique({
            where: { id: bi.courseId },
            select: { id: true, title: true, price: true, discountPrice: true },
          });
          if (course) {
            virtualCart.push({
              id: '',
              userId,
              courseId: course.id,
              chapterId: null,
              productId: null,
              quantity: bi.quantity ?? 1,
              createdAt: new Date(),
              course,
              product: null,
            } as any);
          }
        } else if (bi.productId) {
          const product = await prisma.product.findUnique({
            where: { id: bi.productId },
            select: { id: true, title: true, price: true },
          });
          if (product) {
            virtualCart.push({
              id: '',
              userId,
              courseId: null,
              chapterId: null,
              productId: product.id,
              quantity: bi.quantity ?? 1,
              createdAt: new Date(),
              course: null,
              product: { ...product, titleAr: product.title } as any,
            } as any);
          }
        }
      }
      cart = virtualCart;
    }
    const courseItems = cart.filter((i) => i.courseId && i.course);
    const productItems = cart.filter((i) => i.productId && i.product);
    if (courseItems.length === 0 && productItems.length === 0) {
      throw new Error('Cart is empty. Add courses or products first.');
    }

    const coupon = await prisma.coupon.findFirst({
      where: { code: code.trim().toUpperCase(), isActive: true },
    });
    if (!coupon) throw new Error('Invalid coupon');

    const total = cart.reduce((sum, i) => {
      if (i.courseId && i.course) return sum + ((i.course.discountPrice ?? i.course.price) * (i.quantity || 1));
      if (i.productId && i.product) return sum + (i.product.price * (i.quantity || 1));
      return sum;
    }, 0);
    let discount = 0;
    if (coupon.discountType === 'percentage' || coupon.discountType === 'percent') {
      discount = (total * coupon.discount) / 100;
    } else {
      discount = coupon.discount;
    }
    const orderTotal = Math.max(0, total - discount);

    const enrolledCourseIds: string[] = [];
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId,
          status: 'COMPLETED',
          subtotal: total,
          discount,
          tax: 0,
          total: orderTotal,
          currency: 'USD',
          paymentMethod: 'coupon',
          couponCode: coupon.code,
        },
      });
      for (const item of courseItems) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            courseId: item.courseId,
            title: item.course!.title,
            price: item.course!.discountPrice ?? item.course!.price,
            quantity: item.quantity || 1,
          },
        });
        const existing = await tx.enrollment.findUnique({
          where: { userId_courseId: { userId, courseId: item.courseId! } },
        });
        await tx.enrollment.upsert({
          where: { userId_courseId: { userId, courseId: item.courseId! } },
          create: { userId, courseId: item.courseId!, source: 'purchase' },
          update: { status: 'ACTIVE' },
        });
        if (!existing) {
          enrolledCourseIds.push(item.courseId!);
        }
      }
      for (const courseId of enrolledCourseIds) {
        await tx.course.update({
          where: { id: courseId },
          data: { totalStudents: { increment: 1 } },
        });
      }
      for (const item of productItems) {
        const prod = item.product!;
        const lineTotal = prod.price * (item.quantity || 1);
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: prod.id,
            title: prod.title,
            price: prod.price,
            quantity: item.quantity || 1,
          },
        });
        await tx.productOrder.create({
          data: {
            productId: prod.id,
            userId,
            quantity: item.quantity || 1,
            total: lineTotal,
            status: 'completed',
          },
        });
      }
      await tx.coupon.updateMany({
        where: { code: coupon.code },
        data: { usedCount: { increment: 1 } },
      });
      await tx.cartItem.deleteMany({ where: { userId } });
    });

    import('../../services/notification.service').then(({ notifyOrderCompleted, notifyEnrollment }) => {
      notifyOrderCompleted(userId, orderTotal, 'USD', 'ar').catch(() => {});
      for (const item of courseItems) {
        if (item.courseId && enrolledCourseIds.includes(item.courseId) && item.course) {
          notifyEnrollment(userId, item.course.title, item.course?.titleAr ?? undefined, 'ar').catch(() => {});
        }
      }
    }).catch(() => {});

    return { success: true, enrolled: courseItems.map((i) => i.courseId) };
  },

  async createCheckoutSession(userId: string, input: CreateCheckoutInput) {
    if (!stripe) throw new Error('Stripe is not configured');

    const { items, successUrl, cancelUrl, couponCode, currency = 'usd' } = input;

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const metadata: Record<string, string> = { userId };

    for (const item of items) {
      let price = 0;
      let title = '';
      let courseId: string | null = null;
      let chapterId: string | null = null;
      let bundleId: string | null = null;

      if (item.courseId) {
        const course = await prisma.course.findUnique({
          where: { id: item.courseId, status: 'PUBLISHED' },
        });
        if (!course) throw new Error(`Course ${item.courseId} not found`);
        price = course.discountPrice ?? course.price;
        title = course.title;
        courseId = course.id;
      } else if (item.chapterId) {
        const chapter = await prisma.chapter.findUnique({
          where: { id: item.chapterId },
          include: { course: true },
        });
        if (!chapter) throw new Error(`Chapter ${item.chapterId} not found`);
        price = chapter.price ?? chapter.course.price;
        title = `${chapter.course.title} - ${chapter.title}`;
        courseId = chapter.courseId;
        chapterId = chapter.id;
      } else if (item.bundleId) {
        const bundle = await prisma.bundle.findUnique({
          where: { id: item.bundleId },
          include: { courses: true },
        });
        if (!bundle) throw new Error(`Bundle ${item.bundleId} not found`);
        price = bundle.price;
        title = bundle.title;
        bundleId = bundle.id;
      } else if (item.productId) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId, status: 'active' },
        });
        if (!product) throw new Error(`Product ${item.productId} not found`);
        price = product.price;
        title = product.title;
      }

      if (price > 0) {
        lineItems.push({
          price_data: {
            currency: currency.toLowerCase(),
            product_data: { name: title },
            unit_amount: Math.round(price * 100),
          },
          quantity: item.quantity ?? 1,
        });
      }
    }

    if (lineItems.length === 0) throw new Error('No valid items to checkout');

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      metadata: {
        userId,
        items: JSON.stringify(items),
        couponCode: couponCode ?? '',
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return {
      sessionId: session.id,
      url: session.url,
    };
  },

  async handleWebhook(rawBody: Buffer, signature: string) {
    if (!stripe || !env.stripeWebhookSecret) throw new Error('Stripe webhook not configured');

    const event = stripe.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      await this.fulfillOrder(session);
    }

    return { received: true };
  },

  async fulfillOrder(session: Stripe.Checkout.Session) {
    const userId = session.client_reference_id || session.metadata?.userId;
    if (!userId) throw new Error('No user in session');

    const items = session.metadata?.items
      ? (JSON.parse(session.metadata.items) as Array<{ courseId?: string; chapterId?: string; bundleId?: string; productId?: string; quantity?: number }>)
      : [];
    const couponCode = session.metadata?.couponCode || undefined;

    const amountTotal = (session.amount_total ?? 0) / 100;
    const commissionRate = await getPlatformCommissionRate();

    const order = await prisma.order.create({
      data: {
        userId,
        status: 'COMPLETED',
        subtotal: amountTotal,
        discount: 0,
        tax: 0,
        total: amountTotal,
        currency: session.currency?.toUpperCase() ?? 'USD',
        paymentMethod: 'stripe',
        stripeSessionId: session.id,
        couponCode: couponCode || null,
      },
    });

    const orderItems: Array<{ courseId?: string; chapterId?: string; bundleId?: string; productId?: string; title: string; price: number; quantity: number }> = [];

    for (const item of items) {
      if (item.courseId) {
        const course = await prisma.course.findUnique({ where: { id: item.courseId } });
        if (course) {
          orderItems.push({
            courseId: course.id,
            title: course.title,
            price: course.discountPrice ?? course.price,
            quantity: item.quantity ?? 1,
          });
        }
      } else if (item.chapterId) {
        const chapter = await prisma.chapter.findUnique({
          where: { id: item.chapterId },
          include: { course: true },
        });
        if (chapter) {
          orderItems.push({
            courseId: chapter.courseId,
            chapterId: chapter.id,
            title: `${chapter.course.title} - ${chapter.title}`,
            price: chapter.price ?? chapter.course.price,
            quantity: item.quantity ?? 1,
          });
        }
      } else if (item.bundleId) {
        const bundle = await prisma.bundle.findUnique({
          where: { id: item.bundleId },
          include: { courses: true },
        });
        if (bundle) {
          orderItems.push({
            bundleId: bundle.id,
            title: bundle.title,
            price: bundle.price,
            quantity: item.quantity ?? 1,
          });
        }
      } else if (item.productId) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });
        if (product) {
          orderItems.push({
            productId: product.id,
            title: product.title,
            price: product.price,
            quantity: item.quantity ?? 1,
          });
        }
      }
    }

    for (const oi of orderItems) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          courseId: oi.courseId ?? null,
          chapterId: oi.chapterId ?? null,
          bundleId: oi.bundleId ?? null,
          productId: oi.productId ?? null,
          title: oi.title,
          price: oi.price,
          quantity: oi.quantity ?? 1,
        },
      });
    }

    for (const oi of orderItems.filter((o) => o.productId)) {
      const product = await prisma.product.findUnique({
        where: { id: oi.productId! },
        select: { type: true, fileUrl: true },
      });
      if (product) {
        await prisma.productOrder.create({
          data: {
            productId: oi.productId!,
            userId,
            quantity: oi.quantity ?? 1,
            total: oi.price * (oi.quantity ?? 1),
            status: 'completed',
          },
        });
      }
    }

    const courseIds = [...new Set(orderItems.filter((o) => o.courseId).map((o) => o.courseId!))];
    const bundleCourseIds = await prisma.bundleCourse.findMany({
      where: { bundleId: { in: orderItems.filter((o) => o.bundleId).map((o) => o.bundleId!) } },
      select: { courseId: true },
    });
    const allCourseIds = [...courseIds, ...bundleCourseIds.map((b) => b.courseId)];

    const newEnrollments: Array<{ courseId: string; title: string; titleAr?: string }> = [];
    for (const courseId of allCourseIds) {
      const existing = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
      });
      if (!existing || existing.status !== 'ACTIVE') {
        const course = await prisma.course.findUnique({ where: { id: courseId }, select: { title: true, titleAr: true } });
        await prisma.enrollment.upsert({
          where: { userId_courseId: { userId, courseId } },
          create: { userId, courseId, source: 'purchase' },
          update: { status: 'ACTIVE', source: 'purchase' },
        });
        if (!existing && course) {
          newEnrollments.push({ courseId, title: course.title, titleAr: course.titleAr ?? undefined });
          await prisma.course.update({
            where: { id: courseId },
            data: { totalStudents: { increment: 1 } },
          });
        }
      }
    }

    import('../../services/notification.service').then(({ notifyOrderCompleted, notifyEnrollment }) => {
      notifyOrderCompleted(userId, amountTotal, session.currency?.toUpperCase() ?? 'USD', 'ar').catch(() => {});
      for (const e of newEnrollments) {
        notifyEnrollment(userId, e.title, e.titleAr, 'ar').catch(() => {});
      }
    }).catch(() => {});

    await prisma.cartItem.deleteMany({ where: { userId } });

    if (couponCode) {
      await prisma.coupon.updateMany({
        where: { code: couponCode },
        data: { usedCount: { increment: 1 } },
      });
    }

    return order;
  },

  async getMyOrders(userId: string, query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);

    const [orders, paymentRequests] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              course: { select: { id: true, title: true, slug: true } },
              product: { select: { id: true, title: true, titleAr: true, type: true, fileUrl: true } },
            },
          },
        },
      }),
      prisma.paymentRequest.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          course: { select: { id: true, title: true, slug: true } },
          product: { select: { id: true, title: true, titleAr: true, type: true, fileUrl: true } },
        },
      }),
    ]);

    const orderRows = orders.map((o) => ({
      ...o,
      source: 'order' as const,
    }));
    const prRows = paymentRequests.map((p) => ({
      id: p.id,
      userId: p.userId,
      status: p.status,
      total: Number(p.amount),
      currency: 'USD',
      createdAt: p.createdAt,
      items: [
        {
          id: p.id,
          title: p.course?.title ?? p.product?.title ?? p.product?.titleAr ?? 'Item',
          price: Number(p.amount),
          quantity: 1,
          course: p.course ? { id: p.course.id, title: p.course.title, slug: p.course.slug } : null,
          product: p.product ?? null,
        },
      ],
      source: 'payment_request' as const,
    }));

    const combined = [...orderRows, ...prRows].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const total = combined.length;
    const paginated = combined.slice(skip, skip + limit);

    return { data: paginated, total, page, limit };
  },

  async getOrderById(orderId: string, userId: string, userRole: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            course: { select: { id: true, title: true, slug: true } },
            bundle: { select: { id: true, title: true } },
            product: { select: { id: true, title: true, titleAr: true, type: true, fileUrl: true } },
          },
        },
      },
    });

    if (order) {
      if (order.userId !== userId && userRole !== 'ADMIN') return null;
      return order;
    }

    const pr = await prisma.paymentRequest.findUnique({
      where: { id: orderId },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        product: { select: { id: true, title: true, titleAr: true, type: true, fileUrl: true } },
      },
    });
    if (!pr || pr.userId !== userId) return null;

    return {
      id: pr.id,
      status: pr.status,
      total: Number(pr.amount),
      currency: 'USD',
      createdAt: pr.createdAt,
      items: [
        {
          id: pr.id,
          title: pr.course?.title ?? pr.product?.title ?? pr.product?.titleAr ?? 'Item',
          price: Number(pr.amount),
          quantity: 1,
          course: pr.course,
          product: pr.product,
        },
      ],
    };
  },

  async getOrderBySessionId(sessionId: string, userId: string) {
    const order = await prisma.order.findFirst({
      where: { stripeSessionId: sessionId, userId },
      include: {
        items: {
          include: {
            course: { select: { id: true, title: true, slug: true } },
            bundle: { select: { id: true, title: true } },
            product: { select: { id: true, title: true, titleAr: true, type: true, fileUrl: true } },
          },
        },
      },
    });
    return order;
  },
};
