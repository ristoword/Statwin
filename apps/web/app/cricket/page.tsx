import { SyncedSportPage } from '../../components/synced-sport-page';

export default async function CricketPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  return <SyncedSportPage slug="cricket" competitionId={c} />;
}
