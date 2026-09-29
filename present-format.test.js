import { test } from 'node:test';
import assert from 'node:assert/strict';
import { answerRows } from './present-format.js';

const M = { id: 'm1', a: { id: 'c1', name: 'Ana' }, b: { id: 'c2', name: 'Camila' } };
const CATS = [{ key: 'smile', label: 'Best smile' }];
const crowd = { overallWinner: 'c2', overallTied: false, categories: { smile: { c1: 25, c2: 75 } } };
const score = { overall: 2, categories: { smile: { points: 1, exact: false, sameBand: true, actual: 75, reason: 'scored' } }, total: 3 };

test('answerRows puts what the player said next to what the room said, with points', () => {
  const answer = { overall: { vote: 'c1', predicted: 'c2' }, categories: { smile: { vote: 'c1', contestant: 'c2', share: 70 } } };
  const rows = answerRows(M, answer, crowd, score, CATS);
  assert.deepEqual(rows, [
    { question: 'Which is the one', yours: 'Camila (voted Ana)', room: 'Camila', points: 2, why: 'right side, +2' },
    { question: 'Best smile', yours: 'Camila 70% (voted Ana)', room: 'Camila 75%', points: 1, why: 'same band, +1' }
  ]);
});

test('answerRows survives a missing answer and a tied room', () => {
  const rows = answerRows(M, undefined, { ...crowd, overallWinner: null, overallTied: true }, undefined, CATS);
  assert.equal(rows[0].yours, 'not answered');
  assert.equal(rows[0].room, 'tied');
  assert.equal(rows[0].points, 0);
  assert.equal(rows[1].yours, 'not answered');
  assert.equal(rows[1].room, 'Ana 25%, Camila 75%');
  assert.equal(rows[0].why, 'not answered, 0');
});

test('answerRows names the rule behind every score', () => {
  const score2 = { overall: 0, categories: {
    smile: { points: 6, exact: true, sameBand: true, actual: 70 },
    style: { points: 0, exact: false, sameBand: false, actual: 40, reason: 'below-floor' },
    body:  { points: 0, exact: false, reason: 'no-data' },
    mama:  { points: 0, exact: false, sameBand: false, actual: 90, reason: 'wrong-band' } } };
  const cats = ['smile', 'style', 'body', 'mama'].map(k => ({ key: k, label: k }));
  const answer = { overall: { vote: 'c1', predicted: 'c1' }, categories: {
    smile: { vote: 'c1', contestant: 'c2', share: 70 }, style: { vote: 'c1', contestant: 'c1', share: 60 },
    body: { vote: 'c1', contestant: 'c1', share: 60 }, mama: { vote: 'c1', contestant: 'c2', share: 60 } } };
  const rows = answerRows(M, answer, { ...crowd, categories: { smile: { c2: 70 }, style: { c1: 40 }, body: {}, mama: { c2: 90 } } }, score2, cats);
  assert.deepEqual(rows.map(r => r.why), [
    'wrong side, 0',
    'exact hit: same band +1, exact +5',
    'room gave Ana 40%, below 51, 0',
    'nobody in the room picked Ana, 0',
    'room said 90%, another band, 0'
  ]);
});

test('the one question shows the share the player gave and the room\'s, and names every rule', () => {
  const room = { overallWinner: 'c2', overallTied: false, overallShares: { c1: 35, c2: 65 }, categories: {} };
  const row = (share, s) => answerRows(M, { overall: { vote: 'c1', predicted: 'c2', share } }, room,
    { overall: s.overall, overallSide: s.side, overallShare: s.share, categories: {}, total: s.overall }, [])[0];
  const exact = row(65, { overall: 8, side: 2, share: { points: 6, exact: true, sameBand: true, actual: 65 } });
  assert.deepEqual(exact, { question: 'Which is the one', yours: 'Camila 65% (voted Ana)', room: 'Camila 65%',
                            points: 8, why: 'right side +2, same band +1, exact +5' });
  assert.equal(row(61, { overall: 3, side: 2, share: { points: 1, exact: false, sameBand: true, actual: 65 } }).why,
               'right side +2, same band +1');
  assert.equal(row(80, { overall: 2, side: 2, share: { points: 0, exact: false, sameBand: false, actual: 65, reason: 'wrong-band' } }).why,
               'right side +2; room said 65%, another band');
  const wrong = answerRows(M, { overall: { vote: 'c1', predicted: 'c1', share: 70 } }, room,
    { overall: 0, overallSide: 0, overallShare: null, categories: {}, total: 0 }, []);
  assert.deepEqual(wrong.map(r => [r.yours, r.room, r.points, r.why]), [['Ana 70% (voted Ana)', 'Camila 65%', 0, 'wrong side, 0']]);
});
