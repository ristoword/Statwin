export type Plan = 'FREE' | 'PREMIUM' | 'PRO';

export type AdminUser = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  isActive: boolean;
  emailVerified?: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  subscription?: { plan: Plan | string; status: string; currentPeriodEnd?: string | null } | null;
};

export type AuditRow = {
  id: string;
  action: string;
  ip?: string | null;
  userAgent?: string | null;
  path?: string | null;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
  user?: { id: string; email: string } | null;
  actor?: { id: string; email: string } | null;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  skip: number;
  take: number;
};

export type Overview = {
  users: number;
  blocked: number;
  logins24h: number;
  plans: { FREE: number; PREMIUM: number; PRO: number };
  recentAudit: AuditRow[];
};

export type UserDossier = {
  profile: AdminUser;
  subscription?: AdminUser['subscription'];
  usage: {
    aiReports: number;
    payments: number;
    lastActivityAt?: string | null;
  };
  payments: Array<{
    id: string;
    plan: string;
    status: string;
    amountCents: number;
    currency: string;
    createdAt: string;
  }>;
  access: AuditRow[];
  impersonation: { allowed: boolean; reason: string };
};

export type PasswordOnce = {
  temporaryPassword: string;
  passwordShownOnce: boolean;
  note?: string;
  user?: AdminUser;
};
