# quorum-vote-calc-js

Zero-dependency JavaScript (ESM) library for **parliamentary quorum**, **HOA & condo proxy rules**, **501(c)(3) nonprofit boards**, **share-weighted corporate shareholder meetings** (including Delaware DGCL §216 1/3 floor), and **Robert's Rules majority / two-thirds motion vote thresholds**.

> Prefer an interactive browser calculator with copy-paste minutes certification statements? Try the free, browser-local tools at **[QuorumBay](https://quorumbay.com/)**:
> - [Quorum Calculator (Boards, HOAs & Associations)](https://quorumbay.com/)
> - [HOA & Condo Quorum Calculator (Proxies & Reduced Quorum)](https://quorumbay.com/hoa-quorum-calculator)
> - [Board Meeting Quorum Calculator](https://quorumbay.com/board-meeting-quorum-calculator)
> - [Nonprofit 501(c)(3) Quorum Calculator](https://quorumbay.com/nonprofit-quorum-calculator)
> - [Shareholder Meeting Quorum Calculator (Weighted Shares)](https://quorumbay.com/shareholder-quorum-calculator)
> - [Majority & Two-Thirds (2/3) Vote Calculator](https://quorumbay.com/majority-vote-calculator)
> - [Printable Robert's Rules Quorum Chart (3–500 Members)](https://quorumbay.com/roberts-rules-quorum-chart)

## Usage

```js
import {
  requiredQuorum,
  evaluateMeetingQuorum,
  evaluateShareholderQuorum,
  evaluateMotionVote,
} from './src/index.js';

// Robert's Rules simple majority (> 50%) for an even 10-member board is 6, not 5
console.log(requiredQuorum(10, 'simple-majority')); // 6

// HOA annual meeting: 120 units, 8 suspended, 25% quorum, proxies allowed
console.log(
  evaluateMeetingQuorum({
    totalMembers: 120,
    ineligibleOrVacant: 8,
    ruleType: 'percentage',
    customPercentage: 25,
    inPersonCount: 18,
    proxyCount: 12,
    proxiesCountTowardQuorum: true,
  }),
);

// Shareholder meeting weighted by shares (excluding treasury stock)
console.log(
  evaluateShareholderQuorum({
    totalIssuedShares: 10_000_000,
    treasuryOrNonVotingShares: 500_000,
    ruleType: 'simple-majority',
    inPersonShares: 1_500_000,
    proxyShares: 3_100_000,
    brokerNonVoteShares: 300_000,
  }),
);

// Abstention check: 5 Yes, 4 No, 2 Abstain passes on "votes cast" but fails on "members present"
console.log(evaluateMotionVote({ yesVotes: 5, noVotes: 4, abstentions: 2, basis: 'majority-votes-cast' }));
console.log(evaluateMotionVote({ yesVotes: 5, noVotes: 4, abstentions: 2, basis: 'majority-present' }));
```

## Test

```bash
npm test
```

## License

MIT — mathematical convenience utility only, not legal advice. Verify exact rules against your governing bylaws and applicable state statute.
