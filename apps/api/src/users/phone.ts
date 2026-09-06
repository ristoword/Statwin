import { BadRequestException } from '@nestjs/common';

const E164 = /^\+[1-9]\d{6,14}$/;

/**
 * Optional phone: empty clears. Accepts E.164, Italian mobile, or loose international.
 */
export function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  let value = trimmed.replace(/[\s()./-]/g, '');
  if (value.startsWith('00')) {
    value = `+${value.slice(2)}`;
  }
  if (/^3\d{8,9}$/.test(value)) {
    value = `+39${value}`;
  }
  if (/^[1-9]\d{7,14}$/.test(value)) {
    value = `+${value}`;
  }
  if (!E164.test(value)) {
    throw new BadRequestException(
      'Numero non valido. Usa il formato internazionale, ad esempio +393331234567.',
    );
  }
  return value;
}
