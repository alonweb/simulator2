export const BANDS = [[50, 59], [60, 69], [70, 79], [80, 89], [90, 100]];
export const FLOOR = 51;
// one question per matchup in the devices game: the side +2, its share band +1 and exact +5
export const MAX_PER_MATCHUP = 2 + (1 + 5);

export function bandOf(share) {
  if (share < 50) return null;
  for (let i = 0; i < BANDS.length; i++) {
    if (share >= BANDS[i][0] && share <= BANDS[i][1]) return i;
  }
  return null;
}

export function scoreCategory(prediction, crowdShares) {
  const actual = crowdShares[prediction.contestant];
  if (actual === undefined) return { points: 0, exact: false, reason: 'no-data' };
  if (actual < FLOOR) return { points: 0, exact: false, reason: 'below-floor', actual };
  const exact = Math.round(actual) === Math.round(prediction.share);
  const sameBand = bandOf(actual) !== null && bandOf(actual) === bandOf(prediction.share);
  const points = (sameBand ? 1 : 0) + (exact ? 5 : 0);
  return { points, exact, sameBand, actual, reason: points ? 'scored' : 'wrong-band' };
}

export function scoreOverall(predicted, crowdWinner) {
  if (crowdWinner === null || crowdWinner === undefined) return 0;
  return predicted === crowdWinner ? 2 : 0;
}

/**
 * The devices game asks only the one question, so its slider share counts as well: once the
 * side is right, the share scores like a category. A wrong side or a tied room scores
 * nothing, share included. `overall` is the question's whole score.
 */
export function scoreMatchup(answer, crowd) {
  const a = answer || {};
  const o = a.overall || {};
  const overallSide = scoreOverall(o.predicted, crowd.overallWinner);
  const overallShare = overallSide && typeof o.share === 'number' && crowd.overallShares
    ? scoreCategory({ contestant: o.predicted, share: o.share }, crowd.overallShares)
    : null;
  const overall = overallSide + (overallShare ? overallShare.points : 0);
  const categories = {};
  let total = overall;
  for (const key of Object.keys(a.categories || {})) {
    const r = scoreCategory(a.categories[key], crowd.categories[key] || {});
    categories[key] = r;
    total += r.points;
  }
  return { overall, overallSide, overallShare, categories, total };
}
