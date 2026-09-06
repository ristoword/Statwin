import { SyncedSportPage } from '../../components/synced-sport-page';

export default async function TennisPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  return <SyncedSportPage slug="tennis" competitionId={c} />;
}
