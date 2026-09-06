import { Injectable } from '@nestjs/common';
import {
  OverUnderLine,
  PredictedScore,
  PredictionInput,
  PredictionModel,
  PredictionOutput,
} from './prediction-model';

const DISCLAIMER = 'Stima statistica, non una certezza. Non costituisce consiglio di scommessa.';
const SCORE_DISCLAIMER =
  'Punteggio più probabile del modello Poisson. Non è un risultato ufficiale e non appartiene al livello DATI.';
const IMPLIED_DISCLAIMER =
  'Quota implicita del modello (1/probabilità). Non è una quota bookmaker e non è un consiglio di scommessa.';
const MAX_GOALS = 6;
const OU_LINES = [1.5, 2.5, 3.5];

@Injectable()
export class BaselinePoissonModel implements PredictionModel {
  readonly slug = 'baseline-poisson';

  estimate(input: PredictionInput): PredictionOutput {
    const homeAdv = input.homeAdvantage ?? 0.1;
    const homeXg = clamp(0.4, 3.2, 0.75 + input.homeStrength * 1.7 + homeAdv * 0.5);
    const awayXg = clamp(0.35, 2.8, 0.65 + input.awayStrength * 1.55);

    let homeWin = 0;
    let draw = 0;
    let awayWin = 0;
    let bttsYes = 0;
    const overMass = new Map<number, number>(OU_LINES.map((line) => [line, 0]));
    let best = { home: 0, away: 0, p: -1 };

    for (let home = 0; home <= MAX_GOALS; home += 1) {
      for (let away = 0; away <= MAX_GOALS; away += 1) {
        const probability = poissonPmf(home, homeXg) * poissonPmf(away, awayXg);
        if (home > away) homeWin += probability;
        else if (home === away) draw += probability;
        else awayWin += probability;
        if (home > 0 && away > 0) bttsYes += probability;
        const totalGoals = home + away;
        for (const line of OU_LINES) {
          if (totalGoals > line) overMass.set(line, (overMass.get(line) ?? 0) + probability);
        }
        if (probability > best.p) best = { home, away, p: probability };
      }
    }

    const total = homeWin + draw + awayWin || 1;
    const homeP = homeWin / total;
    const drawP = draw / total;
    const awayP = awayWin / total;
    const yesP = clamp(0, 1, bttsYes / total);
    const noP = 1 - yesP;

    const overUnder: OverUnderLine[] = OU_LINES.map((line) => {
      const over = clamp(0, 1, (overMass.get(line) ?? 0) / total);
      return {
        line,
        over: round4(over),
        under: round4(1 - over),
        impliedOver: implied(over),
        impliedUnder: implied(1 - over),
      };
    });

    const predictedScore: PredictedScore = {
      layer: 'PROBABILITY',
      kind: 'model',
      home: best.home,
      away: best.away,
      homeXg: Number(homeXg.toFixed(2)),
      awayXg: Number(awayXg.toFixed(2)),
      scoreProbability: Number(best.p.toFixed(4)),
      outcome: best.home > best.away ? 'HOME' : best.home < best.away ? 'AWAY' : 'DRAW',
      disclaimer: SCORE_DISCLAIMER,
    };

    return {
      market: '1X2',
      model: this.slug,
      disclaimer: DISCLAIMER,
      impliedOddsDisclaimer: IMPLIED_DISCLAIMER,
      outcomes: [
        { selection: 'HOME', probability: round4(homeP), impliedOdds: implied(homeP) },
        { selection: 'DRAW', probability: round4(drawP), impliedOdds: implied(drawP) },
        { selection: 'AWAY', probability: round4(awayP), impliedOdds: implied(awayP) },
      ],
      markets: [
        { market: '1X2', selection: 'HOME', probability: round4(homeP), impliedOdds: implied(homeP) },
        { market: '1X2', selection: 'DRAW', probability: round4(drawP), impliedOdds: implied(drawP) },
        { market: '1X2', selection: 'AWAY', probability: round4(awayP), impliedOdds: implied(awayP) },
        ...overUnder.flatMap((row) => [
          { market: `OU_${row.line}`, selection: 'OVER', probability: row.over, impliedOdds: row.impliedOver },
          { market: `OU_${row.line}`, selection: 'UNDER', probability: row.under, impliedOdds: row.impliedUnder },
        ]),
        { market: 'BTTS', selection: 'YES', probability: round4(yesP), impliedOdds: implied(yesP) },
        { market: 'BTTS', selection: 'NO', probability: round4(noP), impliedOdds: implied(noP) },
      ],
      overUnder,
      btts: { yes: round4(yesP), no: round4(noP), impliedYes: implied(yesP), impliedNo: implied(noP) },
      predictedScore,
    };
  }
}

function clamp(min: number, max: number, value: number) {
  return Math.min(max, Math.max(min, value));
}

function poissonPmf(k: number, lambda: number) {
  return (Math.exp(-lambda) * lambda ** k) / factorial(k);
}

function factorial(n: number) {
  let result = 1;
  for (let i = 2; i <= n; i += 1) result *= i;
  return result;
}

function round4(value: number) {
  return Number(value.toFixed(4));
}

function implied(probability: number) {
  if (probability <= 0.02 || probability >= 0.98) return null;
  return Number((1 / probability).toFixed(2));
}
