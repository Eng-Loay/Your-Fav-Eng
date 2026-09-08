import prisma from '../../config/database';
import { parsePagination } from '../../utils/helpers';
import { Prisma } from '@prisma/client';

export const marketplaceService = {
  async listProducts(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);
    const type = query.type as string | undefined;
    const category = query.category as string | undefined;
    const search = query.search as string | undefined;

    const where: Prisma.ProductWhereInput = { status: 'active' };

    if (type) where.type = type as 'DIGITAL' | 'PHYSICAL';
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { titleAr: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          seller: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return { data: products, total, page, limit };
  },

  async getProduct(id: string) {
    return prisma.product.findUnique({
      where: { id, status: 'active' },
      include: {
        seller: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });
  },

  async createProduct(
    sellerId: string,
    data: {
      title: string;
      titleAr?: string;
      description?: string;
      price: number;
      type?: 'DIGITAL' | 'PHYSICAL';
      category?: string;
      thumbnail?: string;
      fileUrl?: string;
      stock?: number;
    }
  ) {
    return prisma.product.create({
      data: {
        sellerId,
        title: data.title,
        titleAr: data.titleAr,
        description: data.description,
        price: data.price,
        type: data.type ?? 'DIGITAL',
        category: data.category,
        thumbnail: data.thumbnail,
        fileUrl: data.fileUrl,
        stock: data.stock,
      },
      include: {
        seller: { select: { id: true, name: true } },
      },
    });
  },

  async updateProduct(
    id: string,
    sellerId: string,
    userRole: string,
    data: Partial<{
      title: string;
      titleAr: string;
      description: string;
      price: number;
      type: 'DIGITAL' | 'PHYSICAL';
      category: string;
      thumbnail: string;
      fileUrl: string;
      stock: number;
      status: string;
    }>
  ) {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { sellerId: true },
    });
    if (!product) return null;
    if (product.sellerId !== sellerId && userRole !== 'ADMIN') return null;

    return prisma.product.update({
      where: { id },
      data,
      include: {
        seller: { select: { id: true, name: true } },
      },
    });
  },

  async deleteProduct(id: string, sellerId: string, userRole: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { sellerId: true },
    });
    if (!product) return null;
    if (product.sellerId !== sellerId && userRole !== 'ADMIN') return null;

    await prisma.product.update({
      where: { id },
      data: { status: 'inactive' },
    });
    return true;
  },

  async orderProduct(
    productId: string,
    userId: string,
    quantity: number,
    address?: Record<string, unknown>
  ) {
    const product = await prisma.product.findUnique({
      where: { id: productId, status: 'active' },
    });
    if (!product) return null;

    if (product.type === 'PHYSICAL' && product.stock !== null) {
      if (product.stock < quantity) return null;
      await prisma.product.update({
        where: { id: productId },
        data: { stock: { decrement: quantity } },
      });
    }

    const total = product.price * quantity;

    return prisma.productOrder.create({
      data: {
        productId,
        userId,
        quantity,
        total,
        address: address ? JSON.stringify(address) : undefined,
      },
      include: {
        product: { select: { id: true, title: true, price: true } },
      },
    });
  },

  async listMyProducts(sellerId: string, query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { sellerId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where: { sellerId } }),
    ]);

    return { data: products, total, page, limit };
  },

  async listMyOrders(userId: string, query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);

    const [orders, total] = await Promise.all([
      prisma.productOrder.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { id: true, title: true, thumbnail: true, price: true },
          },
        },
      }),
      prisma.productOrder.count({ where: { userId } }),
    ]);

    return { data: orders, total, page, limit };
  },
};
