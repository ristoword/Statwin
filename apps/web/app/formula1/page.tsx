import { SyncedSportPage } from '../../components/synced-sport-page';

export default async function Formula1Page({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  return <SyncedSportPage slug="formula1" competitionId={c} />;
}
