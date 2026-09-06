import { SyncedSportPage } from '../../components/synced-sport-page';

export default async function AmericanFootballPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  return <SyncedSportPage slug="american-football" competitionId={c} />;
}
