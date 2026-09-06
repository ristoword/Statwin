import { OutcomeRecord, Venue } from '../interfaces';

export function byVenue(outcomes: OutcomeRecord[], venue: Venue): OutcomeRecord[] {
  return outcomes.filter((item) => item.venue === venue);
}
