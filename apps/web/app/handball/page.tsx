import { SyncedSportPage } from '../../components/synced-sport-page';

export default async function HandballPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  return <SyncedSportPage slug="handball" competitionId={c} />;
}
