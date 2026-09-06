import Link from 'next/link';

export function AdminForbidden() {
  return (
    <div className="card">
      <p className="kicker">Control room</p>
      <h1>Accesso riservato</h1>
      <p className="disclaimer">
        Questa area è solo per gli account ADMIN. Il tuo login è valido sul desk pubblico,
        ma non sulla control room.
      </p>
      <p>
        <Link className="btn" href="/dashboard">Torna al desk</Link>
      </p>
    </div>
  );
}
