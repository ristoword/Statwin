import { SyncedSportPage } from '../../components/synced-sport-page';

export default async function IceHockeyPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  return <SyncedSportPage slug="ice-hockey" competitionId={c} />;
}
