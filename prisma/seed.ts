import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient, Role, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

loadLocalEnv();

const prisma = new PrismaClient();
const LEGACY_ADMIN_EMAIL = 'admin@statwin.local';
const DEFAULT_ADMIN_EMAIL = 'basilepaolo@me.com';

function loadLocalEnv() {
  const envPath = resolve(__dirname, '../.env');
  if (!existsSync(envPath)) return;
  for (const raw of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

async function main() {
  // Persistence contract: never delete users, subscriptions, tokens, or client accounts.
  // Seed only upserts catalog rows and the official admin. Francesco and other clients stay.

  const sports = [
    { slug: 'football', name: 'Calcio', isActive: true },
    { slug: 'basketball', name: 'Basket', isActive: true },
    { slug: 'tennis', name: 'Tennis', isActive: true },
    { slug: 'volleyball', name: 'Pallavolo', isActive: true },
    { slug: 'baseball', name: 'Baseball', isActive: true },
    { slug: 'american-football', name: 'Football americano', isActive: true },
    { slug: 'ice-hockey', name: 'Hockey su ghiaccio', isActive: true },
    { slug: 'formula1', name: 'Formula 1', isActive: true },
    { slug: 'horse-racing', name: 'Ippica', isActive: true },
    { slug: 'rugby', name: 'Rugby', isActive: true },
    { slug: 'handball', name: 'Pallamano', isActive: true },
    { slug: 'mma', name: 'MMA / UFC', isActive: true },
    { slug: 'golf', name: 'Golf', isActive: true },
    { slug: 'cycling', name: 'Ciclismo', isActive: true },
    { slug: 'cricket', name: 'Cricket', isActive: true },
    { slug: 'darts', name: 'Darts', isActive: true },
  ];

  for (const sport of sports) {
    await prisma.sport.upsert({
      where: { slug: sport.slug },
      update: sport,
      create: sport,
    });
  }

  // Catalog labels only. Copy lives in listPlans: Free includes 15 giorni Pro
  // per capire l'app, then DATI/STATISTICHE unless they subscribe. No winnings promised.
  const plans = [
    { slug: 'free', name: 'Free' },
    { slug: 'premium', name: 'Premium' },
    { slug: 'pro', name: 'Pro' },
  ];

  for (const plan of plans) {
    await prisma.market.upsert({
      where: { slug: `plan-${plan.slug}` },
      update: { name: `Piano ${plan.name}` },
      create: { slug: `plan-${plan.slug}`, name: `Piano ${plan.name}` },
    });
  }

  await prisma.predictionModel.upsert({
    where: { slug: 'baseline-poisson' },
    update: {},
    create: {
      slug: 'baseline-poisson',
      name: 'Baseline Poisson',
      version: '0.1.0',
      description: 'Modello statistico baseline sostituibile. Produce stime, non certezze.',
    },
  });

  await upsertOfficialAdmin();
  await reactivateFrancescoBasile();

  console.log('Seed strutturale completato: sport, piani, modello baseline. Nessun risultato sportivo inventato.');
}

async function upsertOfficialAdmin() {
  const adminEmail = (process.env.ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const now = new Date();

  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  const legacy =
    adminEmail !== LEGACY_ADMIN_EMAIL
      ? await prisma.user.findUnique({ where: { email: LEGACY_ADMIN_EMAIL } })
      : null;

  if (!admin && legacy) {
    admin = await prisma.user.update({
      where: { id: legacy.id },
      data: { email: adminEmail },
    });
    console.log(`Admin ufficiale migrato da ${LEGACY_ADMIN_EMAIL} a ${adminEmail}.`);
  }

  if (!adminPassword) {
    if (!admin) {
      console.warn(
        'ADMIN_PASSWORD non impostata: admin ufficiale non creato. Imposta ADMIN_EMAIL / ADMIN_PASSWORD nel .env locale.',
      );
    } else {
      await prisma.user.update({
        where: { id: admin.id },
        data: {
          role: Role.ADMIN,
          isActive: true,
          emailVerified: true,
        },
      });
      await ensureProSubscription(admin.id);
      await retireLeftoverLegacyAdmin(admin.id);
      console.log(`Admin ufficiale già presente: ${adminEmail} (password invariata).`);
    }
    return;
  }

  const bcryptMod = await import('bcryptjs');
  const bcrypt = bcryptMod.default ?? bcryptMod;
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        firstName: 'Paolo',
        lastName: 'Basile',
        role: Role.ADMIN,
        emailVerified: true,
        isActive: true,
        acceptedTermsAt: now,
        acceptedDisclaimerAt: now,
      },
    });
    await ensureProSubscription(admin.id);
    await retireLeftoverLegacyAdmin(admin.id);
    console.log(`Admin ufficiale creato: ${adminEmail}`);
    return;
  }

  await prisma.user.update({
    where: { id: admin.id },
    data: {
      passwordHash,
      firstName: 'Paolo',
      lastName: 'Basile',
      role: Role.ADMIN,
      isActive: true,
      emailVerified: true,
      acceptedTermsAt: admin.acceptedTermsAt ?? now,
      acceptedDisclaimerAt: admin.acceptedDisclaimerAt ?? now,
    },
  });
  await ensureProSubscription(admin.id);
  await retireLeftoverLegacyAdmin(admin.id);
  console.log(`Admin ufficiale aggiornato: ${adminEmail}`);
}

async function reactivateFrancescoBasile() {
  const matches = await prisma.user.findMany({
    where: {
      OR: [
        {
          AND: [
            { firstName: { equals: 'Francesco', mode: 'insensitive' } },
            { lastName: { equals: 'Basile', mode: 'insensitive' } },
          ],
        },
        { email: { contains: 'francesco.basile', mode: 'insensitive' } },
        { email: { contains: 'francescobasile', mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
      role: true,
      lastLoginAt: true,
    },
  });

  if (matches.length === 0) {
    console.log('Francesco Basile: nessun account in archivio (né attivo né bloccato).');
    return;
  }

  for (const user of matches) {
    const label = `${user.firstName ?? ''} ${user.lastName ?? ''} <${user.email}>`.trim();
    if (user.isActive) {
      console.log(`Francesco Basile già attivo: ${label} (${user.role})`);
      continue;
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { isActive: true },
    });
    console.log(`Francesco Basile sbloccato: ${label}`);
  }
}

async function retireLeftoverLegacyAdmin(officialAdminId: string) {
  const leftover = await prisma.user.findUnique({ where: { email: LEGACY_ADMIN_EMAIL } });
  if (!leftover || leftover.id === officialAdminId) {
    return;
  }
  await prisma.user.update({
    where: { id: leftover.id },
    data: { isActive: false },
  });
  console.log(
    `Account legacy ${LEGACY_ADMIN_EMAIL} disattivato. Accedi solo con l'email ufficiale.`,
  );
}

async function ensureProSubscription(userId: string) {
  await prisma.subscription.upsert({
    where: { userId },
    update: { plan: SubscriptionPlan.PRO, status: SubscriptionStatus.ACTIVE },
    create: {
      userId,
      plan: SubscriptionPlan.PRO,
      status: SubscriptionStatus.ACTIVE,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
