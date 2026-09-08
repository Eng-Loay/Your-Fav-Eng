import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../config/database';
import { env } from '../../config/env';
import { Prisma } from '@prisma/client';
import type {
  RegisterInput,
  LoginInput,
  RefreshInput,
  ForgotPasswordInput,
  LogoutInput,
  UpdateProfileInput,
  ChangePasswordInput,
} from './auth.validation';

const SALT_ROUNDS = 10;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  bio: string | null;
  role: string;
  status: string;
  emailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

function sanitizeUser(user: {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  bio: string | null;
  role: string;
  status: string;
  emailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  teacherProfile?: { verified: boolean } | null;
}): AuthUser & { verified?: boolean } {
  const result: AuthUser & { verified?: boolean } = {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    phone: user.phone,
    city: user.city,
    country: user.country,
    bio: user.bio,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
  if (user.role === 'TEACHER' && user.teacherProfile) {
    result.verified = user.teacherProfile.verified;
  }
  return result;
}

function generateTokens(userId: string): AuthTokens {
  const accessToken = jwt.sign(
    { userId },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn } as jwt.SignOptions
  );
  const refreshToken = jwt.sign(
    { userId, jti: uuidv4() },
    env.jwtRefreshSecret,
    { expiresIn: env.jwtRefreshExpiresIn } as jwt.SignOptions
  );
  return {
    accessToken,
    refreshToken,
    expiresIn: env.jwtExpiresIn,
  };
}

function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function storeRefreshToken(userId: string, token: string): Promise<void> {
  const decoded = jwt.decode(token) as { exp?: number };
  const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const tokenHash = hashRefreshToken(token);

  await prisma.refreshToken.create({
    data: {
      token: tokenHash,
      userId,
      expiresAt,
    },
  });
}

export const authService = {
  async register(input: RegisterInput): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const emailLower = input.email?.toLowerCase();
    const phoneTrimmed = input.phone?.trim();

    if (emailLower) {
      const existing = await prisma.user.findUnique({ where: { email: emailLower } });
      if (existing) throw new Error('Email already registered');
    }
    if (phoneTrimmed) {
      const existing = await prisma.user.findFirst({ where: { phone: phoneTrimmed } });
      if (existing) throw new Error('Phone number already registered');
    }

    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);
    const role = input.role;

    const isTeacher = role === 'TEACHER';
    const isStudent = role === 'STUDENT';
    const user = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const newUser = await tx.user.create({
        data: {
          email: emailLower || `phone_${phoneTrimmed}@placeholder.local`,
          password: hashedPassword,
          name: input.name,
          phone: phoneTrimmed || undefined,
          role,
          status: isTeacher || isStudent ? 'PENDING_REVIEW' : 'ACTIVE',
        },
      });

      switch (role) {
        case 'TEACHER':
          await tx.teacherProfile.create({ data: { userId: newUser.id } });
          break;
        case 'STUDENT':
          await tx.studentProfile.create({ data: { userId: newUser.id } });
          break;
        case 'PARENT':
          await tx.parentProfile.create({ data: { userId: newUser.id } });
          if (input.childContact) {
            const child = await tx.user.findFirst({
              where: {
                OR: [
                  { email: input.childContact.toLowerCase() },
                  { phone: input.childContact },
                ],
                role: 'STUDENT',
              },
            });
            if (child) {
              await tx.parentChild.create({
                data: { parentId: newUser.id, childId: child.id },
              });
            }
          }
          break;
      }

      return newUser;
    });

    const tokens = generateTokens(user.id);
    await storeRefreshToken(user.id, tokens.refreshToken);

    const fullUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: {
        id: true, email: true, name: true, avatar: true, phone: true,
        city: true, country: true, bio: true, role: true, status: true,
        emailVerified: true, lastLoginAt: true, createdAt: true,
        teacherProfile: { select: { verified: true } },
      },
    });

    return {
      user: sanitizeUser(fullUser),
      tokens,
    };
  },

  async lookupStudent(emailOrPhone: string): Promise<{ id: string; name: string; email: string } | null> {
    const q = emailOrPhone?.trim();
    if (!q) return null;
    const isEmail = q.includes('@');
    const user = await prisma.user.findFirst({
      where: isEmail
        ? { email: q.toLowerCase(), role: 'STUDENT' }
        : { phone: q, role: 'STUDENT' },
      select: { id: true, name: true, email: true },
    });
    return user;
  },

  async login(input: LoginInput): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
    const identifier = input.email?.toLowerCase() || input.phone?.trim();
    if (!identifier) throw new Error('Email or phone is required');

    let user;
    if (input.phone) {
      user = await prisma.user.findFirst({ where: { phone: input.phone.trim() } });
    } else {
      user = await prisma.user.findUnique({ where: { email: identifier } });
    }

    if (!user) throw new Error('Invalid credentials');
    const allowedStatuses = ['ACTIVE'];
    if (user.role === 'TEACHER') allowedStatuses.push('PENDING_REVIEW');
    if (!allowedStatuses.includes(user.status)) throw new Error('Account is not active');

    const valid = await bcrypt.compare(input.password, user.password);
    if (!valid) throw new Error('Invalid credentials');

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = generateTokens(user.id);
    await storeRefreshToken(user.id, tokens.refreshToken);

    const fullUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: {
        id: true, email: true, name: true, avatar: true, phone: true,
        city: true, country: true, bio: true, role: true, status: true,
        emailVerified: true, lastLoginAt: true, createdAt: true,
        teacherProfile: { select: { verified: true } },
      },
    });

    return {
      user: sanitizeUser(fullUser),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  },

  async refresh(input: RefreshInput): Promise<AuthTokens> {
    const decoded = jwt.verify(input.refreshToken, env.jwtRefreshSecret) as { userId: string };
    const tokenHash = hashRefreshToken(input.refreshToken);
    const stored = await prisma.refreshToken.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    });
    if (!stored || stored.expiresAt < new Date() || stored.userId !== decoded.userId) {
      throw new Error('Invalid or expired refresh token');
    }

    await prisma.refreshToken.delete({
      where: { id: stored.id },
    });

    const tokens = generateTokens(decoded.userId);
    await storeRefreshToken(decoded.userId, tokens.refreshToken);

    return tokens;
  },

  async forgotPassword(_input: ForgotPasswordInput): Promise<void> {
    // Mark as sent for now - no actual email sending
    return;
  },

  async logout(input: LogoutInput): Promise<void> {
    const tokenHash = hashRefreshToken(input.refreshToken);
    await prisma.refreshToken.deleteMany({
      where: { token: tokenHash },
    });
  },

  async getMe(userId: string): Promise<AuthUser & { verified?: boolean }> {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, avatar: true, phone: true,
        city: true, country: true, bio: true, role: true, status: true,
        emailVerified: true, lastLoginAt: true, createdAt: true,
        teacherProfile: { select: { verified: true } },
      },
    });
    return sanitizeUser(user);
  },

  async updateMe(userId: string, input: UpdateProfileInput): Promise<AuthUser> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.city !== undefined && { city: input.city }),
        ...(input.country !== undefined && { country: input.country }),
        ...(input.bio !== undefined && { bio: input.bio }),
        ...(input.avatar !== undefined && input.avatar !== '' && { avatar: input.avatar }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        phone: true,
        city: true,
        country: true,
        bio: true,
        role: true,
        status: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
    return sanitizeUser(user);
  },

  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { password: true },
    });
    const valid = await bcrypt.compare(input.currentPassword, user.password);
    if (!valid) {
      throw new Error('Current password is incorrect');
    }
    const hashedPassword = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  },

  async uploadAvatar(userId: string, filename: string): Promise<AuthUser> {
    const avatarPath = `uploads/${filename}`;
    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarPath },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        phone: true,
        city: true,
        country: true,
        bio: true,
        role: true,
        status: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
    return sanitizeUser(user);
  },
};
