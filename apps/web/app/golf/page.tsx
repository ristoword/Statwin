import { SyncedSportPage } from '../../components/synced-sport-page';

export default async function GolfPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  return <SyncedSportPage slug="golf" competitionId={c} />;
}
