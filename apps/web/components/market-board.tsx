const LABELS: Record<string, string> = {
  HOME: '1 Casa',
  DRAW: 'X Pareggio',
  AWAY: '2 Trasferta',
  OVER: 'Over',
  UNDER: 'Under',
  YES: 'Gol sì',
  NO: 'Gol no',
};

function pct(value: number) {
  return `${Math.round(value * 1000) / 10}%`;
}

function label(selection: string) {
  return LABELS[selection] ?? selection;
}

type Outcome = { selection: string; probability: number; impliedOdds?: number | null };
type OverUnder = {
  line: number;
  over: number;
  under: number;
  impliedOver?: number | null;
  impliedUnder?: number | null;
};
type Btts = { yes: number; no: number; impliedYes?: number | null; impliedNo?: number | null };

export function MarketBoard({
  outcomes = [],
  overUnder = [],
  btts,
  disclaimer,
}: {
  outcomes?: Outcome[];
  overUnder?: OverUnder[] | null;
  btts?: Btts | null;
  disclaimer?: string | null;
}) {
  if (outcomes.length === 0 && !overUnder?.length && !btts) return null;

  return (
    <div className="markets">
      {outcomes.length > 0 ? (
        <div>
          <p className="muted market-title">1X2 · probabilità e quota implicita</p>
          <div className="quote-grid">
            {outcomes.map((row) => (
              <div className="quote-chip" key={row.selection}>
                <span>{label(row.selection)}</span>
                <strong>{pct(row.probability)}</strong>
                <em>{row.impliedOdds ? row.impliedOdds.toFixed(2) : '—'}</em>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {overUnder?.length ? (
        <div>
          <p className="muted market-title">Over / Under</p>
          <div className="quote-grid">
            {overUnder.map((row) => (
              <div className="quote-chip" key={`ou-${row.line}`}>
                <span>O/U {row.line}</span>
                <strong>
                  Over {pct(row.over)} · {row.impliedOver?.toFixed(2) ?? '—'}
                </strong>
                <em>
                  Under {pct(row.under)} · {row.impliedUnder?.toFixed(2) ?? '—'}
                </em>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {btts ? (
        <div>
          <p className="muted market-title">Entrambe segnano</p>
          <div className="quote-grid">
            <div className="quote-chip">
              <span>Gol sì</span>
              <strong>{pct(btts.yes)}</strong>
              <em>{btts.impliedYes?.toFixed(2) ?? '—'}</em>
            </div>
            <div className="quote-chip">
              <span>Gol no</span>
              <strong>{pct(btts.no)}</strong>
              <em>{btts.impliedNo?.toFixed(2) ?? '—'}</em>
            </div>
          </div>
        </div>
      ) : null}

      <p className="disclaimer">
        {disclaimer ??
          'Quote implicite del modello (1/probabilità). Non sono quote bookmaker e non sono un consiglio di scommessa.'}
      </p>
    </div>
  );
}
