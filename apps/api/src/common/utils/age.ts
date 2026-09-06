import { AGE_RESTRICTION_YEARS } from '../constants';

export function isAdult(dateOfBirth: Date, now = new Date()): boolean {
  const threshold = new Date(now);
  threshold.setFullYear(threshold.getFullYear() - AGE_RESTRICTION_YEARS);
  return dateOfBirth <= threshold;
}
