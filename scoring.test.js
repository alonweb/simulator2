import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bandOf, scoreCategory, scoreOverall, scoreMatchup, MAX_PER_MATCHUP } from './scoring.js';

test('bands cover the demonstrated ranges', () => {
  assert.equal(bandOf(50), 0);
  assert.equal(bandOf(59), 0);
  assert.equal(bandOf(60), 1);
  assert.equal(bandOf(69), 1);
  assert.equal(bandOf(70), 2);
  assert.equal(bandOf(89), 3);
  assert.equal(bandOf(90), 4);
  assert.equal(bandOf(100), 4);
});

test('a share below 51 is in no band', () => {
  assert.equal(bandOf(50.5), 0);
  assert.equal(bandOf(49), null);
  assert.equal(bandOf(0), null);
});

test('category scores one point for the right band', () => {
  assert.equal(scoreCategory({ contestant: 'A', share: 65 }, { A: 62 }).points, 1);
});

test('category scores six for an exact hit', () => {
  const r = scoreCategory({ contestant: 'A', share: 65 }, { A: 65 });
  assert.equal(r.points, 6);
  assert.equal(r.exact, true);
});

test('category scores zero for the wrong band', () => {
  assert.equal(scoreCategory({ contestant: 'A', share: 65 }, { A: 75 }).points, 0);
});

test('category scores zero when the predicted contestant fell below 51', () => {
  const r = scoreCategory({ contestant: 'A', share: 65 }, { A: 45 });
  assert.equal(r.points, 0);
  assert.equal(r.reason, 'below-floor');
});

test('overall scores two when right and zero when wrong', () => {
  assert.equal(scoreOverall('A', 'A'), 2);
  assert.equal(scoreOverall('A', 'B'), 0);
});

test('overall scores zero for everyone when the room tied', () => {
  assert.equal(scoreOverall('A', null), 0);
});

test('a wrong overall winner does not zero the categories', () => {
  const answer = {
    overall: { predicted: 'A' },
    categories: { smile: { contestant: 'A', share: 65 } }
  };
  const crowd = { overallWinner: 'B', categories: { smile: { A: 65, B: 35 } } };
  const r = scoreMatchup(answer, crowd);
  assert.equal(r.overall, 0);
  assert.equal(r.categories.smile.points, 6);
  assert.equal(r.total, 6);
});

// The devices game asks one question per matchup, so its slider share is scored too:
// the side the room picks +2, then the same bands and exact hit as a category.
test('the one question scores the side, then the band and the exact share', () => {
  const crowd = { overallWinner: 'A', overallShares: { A: 65, B: 35 }, categories: {} };
  const exact = scoreMatchup({ overall: { predicted: 'A', share: 65 } }, crowd);
  assert.equal(exact.overallSide, 2);
  assert.equal(exact.overallShare.points, 6);
  assert.equal(exact.overall, 8);
  assert.equal(exact.total, 8);
  const band = scoreMatchup({ overall: { predicted: 'A', share: 61 } }, crowd);
  assert.equal(band.overall, 3);
  assert.equal(band.overallShare.sameBand, true);
  const other = scoreMatchup({ overall: { predicted: 'A', share: 80 } }, crowd);
  assert.equal(other.overall, 2);
  assert.equal(other.overallShare.reason, 'wrong-band');
});

test('the wrong side scores nothing on the one question, whatever the share', () => {
  const crowd = { overallWinner: 'A', overallShares: { A: 65, B: 35 }, categories: {} };
  const r = scoreMatchup({ overall: { predicted: 'B', share: 65 } }, crowd);
  assert.equal(r.overall, 0);
  assert.equal(r.overallShare, null);
  assert.equal(r.total, 0);
});

test('a tied room scores nothing on the one question', () => {
  const crowd = { overallWinner: null, overallShares: { A: 50, B: 50 }, categories: {} };
  assert.equal(scoreMatchup({ overall: { predicted: 'A', share: 50 } }, crowd).total, 0);
});

test('an answer with no share, or a crowd with no shares, still scores the side', () => {
  const crowd = { overallWinner: 'A', overallShares: { A: 65, B: 35 }, categories: {} };
  assert.equal(scoreMatchup({ overall: { predicted: 'A' } }, crowd).total, 2);
  assert.equal(scoreMatchup({ overall: { predicted: 'A', share: 65 } }, { overallWinner: 'A', categories: {} }).total, 2);
});

test('the ceiling is 8 on one matchup: one question, no categories', () => {
  assert.equal(MAX_PER_MATCHUP, 8);
});
