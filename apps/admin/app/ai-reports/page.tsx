'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../../lib/api';

type Report = {
  id: string;
  type: string;
  createdAt: string;
  content?: { analysis?: string };
  match?: {
    home?: string;
    away?: string;
    homeTeam?: { name: string };
    awayTeam?: { name: string };
  };
};

type ReportList = { items?: Report[] };

export default function Page() {
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load(token?: string) {
    try {
      if (token) {
        const admin = await apiGet<Report[] | ReportList>('/admin/ai-reports', token);
        setReports(Array.isArray(admin) ? admin : admin.items ?? []);
        return;
      }
      const pub = await apiGet<ReportList>('/ai/reports');
      setReports(pub.items ?? []);
    } catch {
      setError('Report AI non disponibili');
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('statwin.admin.token') ?? undefined;
    load(token);
  }, []);

  async function generate() {
    const token = localStorage.getItem('statwin.admin.token');
    if (!token) {
      setError('Login admin richiesto per generare i report');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await apiPost('/admin/ai-reports/generate', {}, token);
      await load(token);
    } catch {
      setError('Generazione non riuscita');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1>AI reports</h1>
      <p>Analisi generate solo sui DATI / STATISTICHE / PROBABILITÀ già in archivio. Nessun risultato inventato.</p>
      <button type="button" onClick={generate} disabled={busy}>
        {busy ? 'Generazione…' : 'Genera report in sospeso'}
      </button>
      {error ? <p>{error}</p> : null}
      {reports.length === 0 ? (
        <div className="card">Nessun report AI.</div>
      ) : (
        reports.map((report) => (
          <div className="card" key={report.id}>
            <h3>
              {report.match?.home ?? report.match?.homeTeam?.name ?? 'Partita'} vs{' '}
              {report.match?.away ?? report.match?.awayTeam?.name ?? ''}
            </h3>
            <p>{report.content?.analysis ?? report.type}</p>
            <small>{new Date(report.createdAt).toLocaleString('it-IT')}</small>
          </div>
        ))
      )}
    </div>
  );
}
