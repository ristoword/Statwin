import { PrismaClient, Role, SubscriptionPlan } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const sports = [
    { slug: 'football', name: 'Calcio', isActive: true },
    { slug: 'basketball', name: 'Basket', isActive: false },
    { slug: 'volleyball', name: 'Pallavolo', isActive: false },
    { slug: 'tennis', name: 'Tennis', isActive: false },
    { slug: 'horse-racing', name: 'Ippica', isActive: false },
    { slug: 'baseball', name: 'Baseball', isActive: false },
    { slug: 'formula1', name: 'Formula 1', isActive: false },
  ];

  for (const sport of sports) {
    await prisma.sport.upsert({
      where: { slug: sport.slug },
      update: sport,
      create: sport,
    });
  }

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

  const adminEmail = 'admin@statwin.local';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const bcryptMod = await import('bcryptjs');
    const bcrypt = bcryptMod.default ?? bcryptMod;
    const passwordHash = await bcrypt.hash('ChangeMeAdmin1!', 10);
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        firstName: 'Admin',
        lastName: 'STATWIN',
        role: Role.ADMIN,
        emailVerified: true,
        acceptedTermsAt: new Date(),
        acceptedDisclaimerAt: new Date(),
      },
    });
    await prisma.subscription.create({
      data: {
        userId: admin.id,
        plan: SubscriptionPlan.PRO,
      },
    });
  }

  console.log('Seed strutturale completato: sport, piani, modello baseline. Nessun risultato sportivo inventato.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
