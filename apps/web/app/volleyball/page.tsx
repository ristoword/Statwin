import { SyncedSportPage } from '../../components/synced-sport-page';

export default async function VolleyballPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  return <SyncedSportPage slug="volleyball" competitionId={c} />;
}
