import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crowdResult, leaderboard, sessionStats, contestantStanding } from './stats.js';

const rows = (votes) => votes.map((v, i) => ({
  submissionId: 's' + i,
  participant: v.name,
  answers: { m1: { overall: { vote: v.vote, predicted: v.pred },
                   categories: { smile: { vote: v.vote, contestant: v.pred, share: v.share } } } }
}));

test('crowd result counts votes and computes shares', () => {
  const r = crowdResult(rows([
    { name: 'a', vote: 'A', pred: 'A', share: 60 },
    { name: 'b', vote: 'A', pred: 'A', share: 60 },
    { name: 'c', vote: 'B', pred: 'A', share: 60 },
    { name: 'd', vote: 'A', pred: 'A', share: 60 }
  ]), 'm1', ['smile']);
  assert.equal(r.overallWinner, 'A');
  assert.equal(r.overallCounts.A, 3);
  assert.equal(r.categories.smile.A, 75);
  assert.equal(r.categories.smile.B, 25);
});

test('an even split has no winner and is reported as tied', () => {
  const r = crowdResult(rows([
    { name: 'a', vote: 'A', pred: 'A', share: 60 },
    { name: 'b', vote: 'B', pred: 'A', share: 60 }
  ]), 'm1', ['smile']);
  assert.equal(r.overallWinner, null);
  assert.equal(r.overallTied, true);
});

test('two people with the same name stay separate participants', () => {
  const data = rows([
    { name: 'Ana', vote: 'A', pred: 'A', share: 60 },
    { name: 'Ana', vote: 'A', pred: 'B', share: 60 }
  ]);
  const r = leaderboard(data, { m1: crowdResult(data, 'm1', ['smile']) });
  assert.equal(r.length, 2);
  assert.notEqual(r[0].submissionId, r[1].submissionId);
});

test('leaderboard ranks by total, highest first', () => {
  const data = rows([
    { name: 'high', vote: 'A', pred: 'A', share: 100 },
    { name: 'low', vote: 'A', pred: 'B', share: 51 }
  ]);
  const crowd = { m1: crowdResult(data, 'm1', ['smile']) };
  const board = leaderboard(data, crowd);
  assert.equal(board[0].participant, 'high');
  assert.ok(board[0].total >= board[1].total);
});

test('session stats rank the categories by how badly they were predicted', () => {
  const data = rows([
    { name: 'a', vote: 'A', pred: 'A', share: 100 },
    { name: 'b', vote: 'A', pred: 'A', share: 51 }
  ]);
  const s = sessionStats(data, { m1: crowdResult(data, 'm1', ['smile']) });
  assert.equal(s.categoryDifficulty.length, 1);
  assert.equal(s.categoryDifficulty[0].key, 'smile');
  assert.ok(s.spread.best >= s.spread.worst);
});

test('session stats report how often the room was exactly predicted', () => {
  const data = rows([
    { name: 'a', vote: 'A', pred: 'A', share: 100 },
    { name: 'b', vote: 'A', pred: 'A', share: 100 }
  ]);
  const s = sessionStats(data, { m1: crowdResult(data, 'm1', ['smile']) });
  assert.equal(s.participants, 2);
  assert.ok(s.exactRate >= 0 && s.exactRate <= 1);
  assert.ok('meanAbsoluteError' in s);
});

test('contestantStanding carries each category share, the opponent share and who won it', () => {
  const M = [{ id: 'm1', a: { id: 'c1', name: 'Ana', photo: 'photos/c1.jpg' }, b: { id: 'c2', name: 'Camila', photo: 'photos/c2.jpg' } }];
  const C = [{ key: 'smile' }, { key: 'style' }];
  const rows = [
    { submissionId: 'a', answers: { m1: { overall: { vote: 'c1' }, categories: { smile: { vote: 'c1' }, style: { vote: 'c2' } } } } },
    { submissionId: 'b', answers: { m1: { overall: { vote: 'c1' }, categories: { smile: { vote: 'c1' }, style: { vote: 'c1' } } } } },
    { submissionId: 'c', answers: { m1: { overall: { vote: 'c2' }, categories: { smile: { vote: 'c2' }, style: { vote: 'c1' } } } } }
  ];
  const ana = contestantStanding(rows, M, C).find(x => x.id === 'c1');
  assert.equal(ana.photo, 'photos/c1.jpg');
  assert.equal(ana.opponentPhoto, 'photos/c2.jpg');
  assert.deepEqual(ana.byCategory.smile, { share: 67, opponentShare: 33, won: true, tied: false });
  assert.deepEqual(ana.byCategory.style, { share: 67, opponentShare: 33, won: true, tied: false });
  assert.equal(ana.categoriesWon, 2);
});

// The devices game: one question per matchup and no categories, so the slider share on that
// question is what the room is measured on.
const oneQuestion = (votes) => votes.map((v, i) => ({
  submissionId: 's' + i, participant: 'p' + i,
  answers: { [v.m || 'm1']: { overall: { vote: v.vote, predicted: v.pred, share: v.share }, categories: {} } }
}));

test('crowd result gives each side its share of the room, zero for a side nobody picked', () => {
  const data = oneQuestion([{ vote: 'A', pred: 'A', share: 60 }, { vote: 'A', pred: 'A', share: 60 },
                            { vote: 'B', pred: 'A', share: 60 }]);
  assert.deepEqual(crowdResult(data, 'm1', [], ['A', 'B']).overallShares, { A: 67, B: 33 });
  const one = oneQuestion([{ vote: 'A', pred: 'A', share: 60 }]);
  assert.deepEqual(crowdResult(one, 'm1', [], ['A', 'B']).overallShares, { A: 100, B: 0 });
  assert.deepEqual(crowdResult([], 'm1', [], ['A', 'B']).overallShares, { A: 0, B: 0 });
});

test('with no categories, the stats measure the one question and rank the matchups', () => {
  // m1: the room goes 75/25 for A; m2: 50/50
  const data = oneQuestion([
    { vote: 'A', pred: 'A', share: 75 }, { vote: 'A', pred: 'A', share: 65 },
    { vote: 'A', pred: 'B', share: 60 }, { vote: 'B', pred: 'A', share: 75 },
    { m: 'm2', vote: 'C', pred: 'C', share: 90 }, { m: 'm2', vote: 'D', pred: 'D', share: 90 }
  ]);
  const crowd = { m1: crowdResult(data, 'm1', [], ['A', 'B']), m2: crowdResult(data, 'm2', [], ['C', 'D']) };
  const s = sessionStats(data, crowd);
  // errors: m1 0, 10, |25-60| 35, 0; m2 40, 40
  assert.equal(s.measuredAnswers, 6);
  assert.equal(s.exactRate, 2 / 6);
  assert.equal(s.meanAbsoluteError, 125 / 6);
  assert.deepEqual(s.matchupDifficulty.map(d => d.matchupId), ['m2', 'm1']);
  assert.equal(s.matchupDifficulty[0].meanAbsoluteError, 40);
  assert.deepEqual(s.categoryDifficulty, []);
  assert.deepEqual(s.ties, ['m2']);
});
