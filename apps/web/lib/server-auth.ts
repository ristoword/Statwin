import { cookies } from 'next/headers';

export async function getServerAccessToken() {
  const jar = await cookies();
  return jar.get('statwin.accessToken')?.value;
}
