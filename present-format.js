/** Vote counts as a sentence a presenter can read out, highest first. */
export function formatCounts(counts, matchup) {
  const names = { [matchup.a.id]: matchup.a.name, [matchup.b.id]: matchup.b.name };
  const entries = Object.entries(counts || {});
  const total = entries.reduce((sum, [, n]) => sum + n, 0);
  if (!total) return 'no votes yet';
  return entries
    .sort((x, y) => y[1] - x[1])
    .map(([id, n]) => `${names[id] || id} ${n} (${Math.round((n * 100) / total)}%)`)
    .join(', ');
}

/** One matchup's answers read back to the participant before they lock. */
export function summariseMatchup(matchup, entry, categories) {
  const name = (id) => id === matchup.a.id ? matchup.a.name : id === matchup.b.id ? matchup.b.name : 'unknown';
  const e = entry || { overall: null, categories: {} };
  const lines = [];
  let complete = true;
  const add = (text, answered, key) => {
    if (!answered) complete = false;
    lines.push(answered ? { text, answered: true, key, matchupId: matchup.id }
                        : { text, answered: false, key, matchupId: matchup.id });
  };

  const o = e.overall;
  if (o && o.vote && o.predicted) {
    const call = typeof o.share === 'number' ? `gives ${name(o.predicted)} ${o.share}%` : `picks ${name(o.predicted)}`;
    add(`Which is the one — you picked ${name(o.vote)}, you think the room ${call}`, true, 'overall');
  } else { add('Which is the one — not answered', false, 'overall'); }

  for (const c of categories) {
    const a = (e.categories || {})[c.key];
    if (a && a.vote && a.contestant && typeof a.share === 'number') {
      add(`${c.label} — you picked ${name(a.vote)}, you think the room gives ${name(a.contestant)} ${a.share}%`, true, c.key);
    } else { add(`${c.label} — not answered`, false, c.key); }
  }
  return { title: `${matchup.a.name} v ${matchup.b.name}`, lines, complete };
}

/** One player's answers on one matchup, each next to the room's answer, for the presenter. */
export function answerRows(matchup, answer, crowd, score, categories) {
  const name = (id) => id === matchup.a.id ? matchup.a.name : id === matchup.b.id ? matchup.b.name : 'unknown';
  const rows = [];
  const o = (answer && answer.overall) || {};
  const c = crowd || {};
  const overallPts = score ? score.overall || 0 : 0;
  // the side, then the share on it (scored only once the side is right)
  const side = score ? (score.overallSide !== undefined ? score.overallSide : score.overall) || 0 : 0;
  const sh = score && score.overallShare;
  const pct = (id) => c.overallShares && c.overallShares[id] !== undefined ? ` ${c.overallShares[id]}%` : '';
  rows.push({
    question: 'Which is the one',
    yours: o.predicted ? `${name(o.predicted)}${typeof o.share === 'number' ? ` ${o.share}%` : ''} (voted ${name(o.vote)})` : 'not answered',
    room: c.overallTied ? 'tied' : c.overallWinner ? `${name(c.overallWinner)}${pct(c.overallWinner)}` : 'no votes',
    points: overallPts,
    why: !o.predicted ? 'not answered, 0'
      : c.overallTied ? 'room tied, nobody scores'
      : !c.overallWinner ? 'no votes, 0'
      : !side ? 'wrong side, 0'
      : !sh ? 'right side, +2'
      : sh.exact ? 'right side +2, same band +1, exact +5'
      : sh.sameBand ? 'right side +2, same band +1'
      : sh.reason === 'below-floor' ? `right side +2; room gave it ${sh.actual}%, below 51`
      : `right side +2; room said ${sh.actual}%, another band`
  });
  for (const cat of categories || []) {
    const a = ((answer && answer.categories) || {})[cat.key];
    const s = score && score.categories && score.categories[cat.key];
    const shares = (c.categories || {})[cat.key] || {};
    const all = Object.entries(shares).map(([id, p]) => `${name(id)} ${p}%`).join(', ') || 'no votes';
    rows.push({
      question: cat.label,
      yours: a && a.contestant ? `${name(a.contestant)} ${a.share}% (voted ${name(a.vote)})` : 'not answered',
      room: a && a.contestant && shares[a.contestant] !== undefined ? `${name(a.contestant)} ${shares[a.contestant]}%` : all,
      points: s ? s.points || 0 : 0,
      why: !a || !a.contestant || !s ? 'not answered, 0'
        : s.exact ? 'exact hit: same band +1, exact +5'
        : s.sameBand ? 'same band, +1'
        : s.reason === 'below-floor' ? `room gave ${name(a.contestant)} ${s.actual}%, below 51, 0`
        : s.reason === 'no-data' ? `nobody in the room picked ${name(a.contestant)}, 0`
        : `room said ${s.actual}%, another band, 0`
    });
  }
  return rows;
}
