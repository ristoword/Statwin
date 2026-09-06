import { BadRequestException } from '@nestjs/common';
import { normalizePhone } from './phone';

describe('normalizePhone', () => {
  it('clears empty values', () => {
    expect(normalizePhone('')).toBeNull();
    expect(normalizePhone('   ')).toBeNull();
  });

  it('accepts E.164 and Italian mobile', () => {
    expect(normalizePhone('+39 333 123 4567')).toBe('+393331234567');
    expect(normalizePhone('3331234567')).toBe('+393331234567');
    expect(normalizePhone('00393331234567')).toBe('+393331234567');
  });

  it('rejects invalid numbers', () => {
    expect(() => normalizePhone('12')).toThrow(BadRequestException);
    expect(() => normalizePhone('abc')).toThrow(BadRequestException);
  });
});
