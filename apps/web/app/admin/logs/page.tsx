'use client';

import { useAdminSession } from '../../../lib/admin-session';

export default function Page() {
  const { ready, forbidden, token } = useAdminSession();
  if (!ready || forbidden || !token) return null;
  return (
    <div className="card">
      <h1>Logs</h1>
      <p className="disclaimer">Registro applicativo: usa la sezione Accessi per gli eventi account.</p>
    </div>
  );
}
