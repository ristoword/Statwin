import { SportDesk } from './sport-desk';

export async function SyncedSportPage({
  slug,
  competitionId,
}: {
  slug: string;
  competitionId?: string;
}) {
  return <SportDesk slug={slug} competitionId={competitionId} />;
}
