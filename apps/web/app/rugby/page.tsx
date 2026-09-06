import { SyncedSportPage } from '../../components/synced-sport-page';

export default async function RugbyPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  return <SyncedSportPage slug="rugby" competitionId={c} />;
}
