import { SportDesk } from '../../components/sport-desk';

export default async function FootballPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  return <SportDesk slug="football" competitionId={c} />;
}
