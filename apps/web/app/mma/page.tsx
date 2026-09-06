import { SyncedSportPage } from '../../components/synced-sport-page';

export default async function MmaPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  return <SyncedSportPage slug="mma" competitionId={c} />;
}
