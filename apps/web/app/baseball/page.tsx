import { SyncedSportPage } from '../../components/synced-sport-page';

export default async function BaseballPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  return <SyncedSportPage slug="baseball" competitionId={c} />;
}
