import { SyncedSportPage } from '../../components/synced-sport-page';

export default async function CyclingPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  return <SyncedSportPage slug="cycling" competitionId={c} />;
}
