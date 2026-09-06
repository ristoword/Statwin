import { Prisma } from '@prisma/client';

export function isSchemaDriftError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === 'P2021' || error.code === 'P2022';
  }
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error && 'message' in error
        ? String((error as { message?: unknown }).message)
        : String(error);
  return /column .* does not exist/i.test(message) || /The column .* does not exist/i.test(message);
}

export const USER_CORE_SELECT = {
  id: true,
  email: true,
  passwordHash: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  emailVerified: true,
  emailVerifyToken: true,
  passwordResetToken: true,
  passwordResetExpires: true,
  dateOfBirth: true,
  acceptedTermsAt: true,
  acceptedDisclaimerAt: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export const SUBSCRIPTION_CORE_SELECT = {
  id: true,
  userId: true,
  plan: true,
  status: true,
  stripeCustomerId: true,
  stripeSubId: true,
  currentPeriodEnd: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SubscriptionSelect;
