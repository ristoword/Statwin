import { isAdult } from './age';

describe('isAdult', () => {
  it('rejects a 17 year old', () => {
    const now = new Date('2026-09-06');
    expect(isAdult(new Date('2008-09-07'), now)).toBe(false);
  });

  it('accepts an 18 year old', () => {
    const now = new Date('2026-09-06');
    expect(isAdult(new Date('2008-09-06'), now)).toBe(true);
  });
});
