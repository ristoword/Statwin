'use client';

import { useAdminSession } from '../../../lib/admin-session';

export default function Page() {
  const { ready, forbidden, token } = useAdminSession();
  if (!ready || forbidden || !token) return null;
  return (
    <div className="card">
      <h1>Jobs e sincronizzazioni</h1>
      <p className="disclaimer">
        I job restano sul backend. La sync si lancia dalle API sport (`POST /api/v1/sports/sync`).
      </p>
    </div>
  );
}
