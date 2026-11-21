import assert from 'node:assert/strict';
import test from 'node:test';
import {
  evaluateMeetingQuorum,
  evaluateMotionVote,
  evaluateShareholderQuorum,
  requiredQuorum,
} from '../src/index.js';

test('simple majority strictly exceeds 50% on even and odd assemblies', () => {
  assert.equal(requiredQuorum(10, 'simple-majority'), 6);
  assert.equal(requiredQuorum(11, 'simple-majority'), 6);
  assert.equal(requiredQuorum(10, 'half'), 5);
  assert.equal(requiredQuorum(10, 'one-third'), 4);
  assert.equal(requiredQuorum(10, 'two-thirds'), 7);
});

test('HOA quorum counts proxies and excludes suspended units', () => {
  const res = evaluateMeetingQuorum({
    totalMembers: 120,
    ineligibleOrVacant: 8,
    ruleType: 'percentage',
    customPercentage: 25,
    inPersonCount: 18,
    proxyCount: 12,
    proxiesCountTowardQuorum: true,
  });
  assert.equal(res.eligibleMembers, 112);
  assert.equal(res.quorumRequired, 28);
  assert.equal(res.quorumMet, true);
  assert.equal(res.margin, 2);
});

test('shareholder quorum supports treasury exclusions and Delaware 1/3 floor', () => {
  const res = evaluateShareholderQuorum({
    totalIssuedShares: 10_000_000,
    treasuryOrNonVotingShares: 500_000,
    ruleType: 'simple-majority',
    inPersonShares: 1_500_000,
    proxyShares: 3_100_000,
    brokerNonVoteShares: 300_000,
    brokerNonVotesCountTowardQuorum: true,
  });
  assert.equal(res.outstandingVotingShares, 9_500_000);
  assert.equal(res.requiredShares, 4_750_001);
  assert.equal(res.quorumMet, true);
});

test('motion vote distinguishes Robert\'s Rules votes cast vs members present with abstentions', () => {
  const cast = evaluateMotionVote({ yesVotes: 5, noVotes: 4, abstentions: 2, basis: 'majority-votes-cast' });
  const present = evaluateMotionVote({ yesVotes: 5, noVotes: 4, abstentions: 2, basis: 'majority-present' });
  assert.equal(cast.passed, true);
  assert.equal(cast.abstentionsActAsNo, false);
  assert.equal(present.passed, false);
  assert.equal(present.abstentionsActAsNo, true);
});
