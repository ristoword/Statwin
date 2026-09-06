'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../../../lib/api';
import { useAdminSession } from '../../../lib/admin-session';

type Report = {
  id: string;
  type: string;
  createdAt: string;
  content?: {
    analysis?: string;
    predictedResult?: { scoreHome?: number; scoreAway?: number; outcome?: string } | null;
  };
  match?: {
    home?: string;
    away?: string;
    homeTeam?: { name: string };
    awayTeam?: { name: string };
  };
};

type ReportList = { items?: Report[] };

export default function Page() {
  const { token, ready, forbidden } = useAdminSession();
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load(currentToken: string) {
    try {
      const admin = await apiGet<Report[] | ReportList>('/admin/ai-reports', currentToken);
      setReports(Array.isArray(admin) ? admin : admin.items ?? []);
    } catch {
      setError('Report AI non disponibili');
    }
  }

  useEffect(() => {
    if (!token) return;
    load(token);
  }, [token]);

  async function generate() {
    if (!token) return;
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

  if (!ready || forbidden || !token) return null;

  return (
    <div>
      <h1>AI reports</h1>
      <p className="disclaimer">
        Analisi generate solo sui DATI / STATISTICHE / PROBABILITÀ già in archivio. Il risultato previsto è stima AI, non un DATO.
      </p>
      <button type="button" className="btn" onClick={generate} disabled={busy}>
        {busy ? 'Generazione…' : 'Genera report in sospeso'}
      </button>
      {error ? <p className="disclaimer">{error}</p> : null}
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
            {report.content?.predictedResult ? (
              <p>
                Stima AI: {report.content.predictedResult.scoreHome}–{report.content.predictedResult.scoreAway} (
                {report.content.predictedResult.outcome})
              </p>
            ) : null}
            <small>{new Date(report.createdAt).toLocaleString('it-IT')}</small>
          </div>
        ))
      )}
    </div>
  );
}
