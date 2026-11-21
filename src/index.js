/**
 * quorum-vote-calc-js
 * Zero-dependency parliamentary & corporate governance math library.
 * Interactive web calculators: https://quorumbay.com
 */

function clampInt(value, min = 0, max = 100_000_000_000) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

function ceilRatio(numerator, denominator) {
  if (numerator <= 0 || denominator <= 0) return 0;
  return Math.ceil(numerator / denominator - 1e-12);
}

/**
 * Calculate required headcount quorum for a board, HOA, nonprofit, or association.
 * @param {number} eligibleMembers
 * @param {'simple-majority'|'half'|'one-third'|'two-thirds'|'three-quarters'|'percentage'|'fixed'} ruleType
 * @param {{ customPercentage?: number, fixedMinimum?: number }} [options]
 */
export function requiredQuorum(eligibleMembers, ruleType = 'simple-majority', options = {}) {
  const n = clampInt(eligibleMembers, 0);
  if (n === 0) return 0;
  switch (ruleType) {
    case 'simple-majority':
      return Math.floor(n / 2) + 1;
    case 'half':
      return ceilRatio(n, 2);
    case 'one-third':
      return ceilRatio(n, 3);
    case 'two-thirds':
      return ceilRatio(n * 2, 3);
    case 'three-quarters':
      return ceilRatio(n * 3, 4);
    case 'percentage': {
      const pct = Number.isFinite(options.customPercentage)
        ? Math.min(100, Math.max(0.1, options.customPercentage))
        : 25;
      return Math.max(1, Math.min(n, Math.ceil((n * pct) / 100 - 1e-9)));
    }
    case 'fixed':
      return clampInt(options.fixedMinimum ?? 1, 1, n);
    default:
      throw new RangeError(`Unsupported quorum ruleType: ${ruleType}`);
  }
}

/**
 * Evaluate full headcount quorum including vacancies/ineligible members and proxies.
 */
export function evaluateMeetingQuorum({
  totalMembers,
  ineligibleOrVacant = 0,
  ruleType = 'simple-majority',
  customPercentage = 25,
  fixedMinimum = 1,
  inPersonCount = 0,
  proxyCount = 0,
  proxiesCountTowardQuorum = false,
}) {
  const total = clampInt(totalMembers, 0);
  const excluded = Math.min(total, clampInt(ineligibleOrVacant, 0));
  const eligibleMembers = Math.max(0, total - excluded);
  const quorumRequired = requiredQuorum(eligibleMembers, ruleType, {
    customPercentage,
    fixedMinimum,
  });
  const inPerson = clampInt(inPersonCount, 0, eligibleMembers);
  const proxies = proxiesCountTowardQuorum
    ? clampInt(proxyCount, 0, Math.max(0, eligibleMembers - inPerson))
    : 0;
  const countedAttendance = inPerson + proxies;
  const quorumMet = eligibleMembers > 0 && countedAttendance >= quorumRequired;
  return {
    eligibleMembers,
    quorumRequired,
    countedAttendance,
    quorumMet,
    margin: countedAttendance - quorumRequired,
    additionalNeeded: Math.max(0, quorumRequired - countedAttendance),
  };
}

/**
 * Evaluate corporate shareholder quorum weighted by voting shares (supports Delaware DGCL §216 1/3 floor).
 */
export function evaluateShareholderQuorum({
  totalIssuedShares,
  treasuryOrNonVotingShares = 0,
  ruleType = 'simple-majority',
  customPercentage = 50,
  inPersonShares = 0,
  proxyShares = 0,
  brokerNonVoteShares = 0,
  brokerNonVotesCountTowardQuorum = true,
}) {
  const issued = clampInt(totalIssuedShares, 0);
  const excluded = Math.min(issued, clampInt(treasuryOrNonVotingShares, 0));
  const outstandingVotingShares = Math.max(0, issued - excluded);
  const requiredShares = requiredQuorum(outstandingVotingShares, ruleType, {
    customPercentage,
  });
  const inPerson = clampInt(inPersonShares, 0, outstandingVotingShares);
  const proxy = clampInt(proxyShares, 0, Math.max(0, outstandingVotingShares - inPerson));
  const broker = brokerNonVotesCountTowardQuorum
    ? clampInt(brokerNonVoteShares, 0, Math.max(0, outstandingVotingShares - inPerson - proxy))
    : 0;
  const representedShares = inPerson + proxy + broker;
  const quorumMet = outstandingVotingShares > 0 && representedShares >= requiredShares;
  return {
    outstandingVotingShares,
    requiredShares,
    representedShares,
    quorumMet,
    additionalSharesNeeded: Math.max(0, requiredShares - representedShares),
  };
}

/**
 * Evaluate whether a parliamentary motion passes under Robert's Rules votes-cast vs present/entire bases.
 */
export function evaluateMotionVote({
  yesVotes,
  noVotes,
  abstentions = 0,
  totalEligibleMembers = 0,
  basis = 'majority-votes-cast',
}) {
  const yes = clampInt(yesVotes, 0);
  const no = clampInt(noVotes, 0);
  const abstain = clampInt(abstentions, 0);
  const votesCast = yes + no;
  const present = votesCast + abstain;
  const entire = Math.max(present, clampInt(totalEligibleMembers, 0));

  let denominator = votesCast;
  let yesRequired = 1;
  let abstentionsActAsNo = false;

  if (basis === 'majority-votes-cast') {
    denominator = votesCast;
    yesRequired = denominator > 0 ? Math.floor(denominator / 2) + 1 : 1;
  } else if (basis === 'two-thirds-votes-cast') {
    denominator = votesCast;
    yesRequired = denominator > 0 ? ceilRatio(denominator * 2, 3) : 1;
  } else if (basis === 'majority-present') {
    denominator = present;
    yesRequired = denominator > 0 ? Math.floor(denominator / 2) + 1 : 1;
    abstentionsActAsNo = true;
  } else if (basis === 'two-thirds-present') {
    denominator = present;
    yesRequired = denominator > 0 ? ceilRatio(denominator * 2, 3) : 1;
    abstentionsActAsNo = true;
  } else if (basis === 'majority-entire') {
    denominator = entire;
    yesRequired = denominator > 0 ? Math.floor(denominator / 2) + 1 : 1;
    abstentionsActAsNo = true;
  } else {
    throw new RangeError(`Unsupported vote basis: ${basis}`);
  }

  return {
    denominator,
    yesRequired,
    passed: denominator > 0 && yes >= yesRequired,
    margin: yes - yesRequired,
    abstentionsActAsNo,
  };
}
