import { SyncedSportPage } from '../../components/synced-sport-page';

export default async function DartsPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  return <SyncedSportPage slug="darts" competitionId={c} />;
}
