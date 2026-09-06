import { SyncedSportPage } from '../../components/synced-sport-page';

export default async function BasketballPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  return <SyncedSportPage slug="basketball" competitionId={c} />;
}
