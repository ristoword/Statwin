import { Prisma } from '@prisma/client';
import { isSchemaDriftError } from './schema-compat';

describe('isSchemaDriftError', () => {
  it('detects Prisma missing-column codes', () => {
    const missingColumn = new Prisma.PrismaClientKnownRequestError('column missing', {
      code: 'P2022',
      clientVersion: 'test',
    });
    const missingTable = new Prisma.PrismaClientKnownRequestError('table missing', {
      code: 'P2021',
      clientVersion: 'test',
    });
    expect(isSchemaDriftError(missingColumn)).toBe(true);
    expect(isSchemaDriftError(missingTable)).toBe(true);
  });

  it('detects raw SQL missing-column messages', () => {
    expect(isSchemaDriftError(new Error('The column `phone` does not exist in the current database.'))).toBe(
      true,
    );
    expect(isSchemaDriftError(new Error('column "trialEndsAt" does not exist'))).toBe(true);
  });

  it('ignores unrelated errors', () => {
    expect(isSchemaDriftError(new Error('connection refused'))).toBe(false);
    expect(isSchemaDriftError(new Prisma.PrismaClientKnownRequestError('unique', {
      code: 'P2002',
      clientVersion: 'test',
    }))).toBe(false);
  });
});
