# Audit Agent Report #1 — Findings Response

This document records our stance on the findings in
[`audit_agent_report_1_043969fe-043e-410a-8008-df48a77bc1dd.pdf`](./audit_agent_report_1_043969fe-043e-410a-8008-df48a77bc1dd.pdf).

## Finding #1 — Acknowledged

By design, 1 USDC is never less valuable than 1 eToken, so `rebalanceETokenToUSDC` poses no
risk to the Onyx vault: the caller receives 1 eToken for each USDC it transfers. In some cases —
e.g. when there is a lack of liquidity in the Ensuro Pools — 1 eToken might be less valuable than
1 USDC. Calls to `rebalanceUSDCToEToken` could then imply a loss to the Onyx vault. However,
since most of the vault's liquidity is eToken, this is limited: only a small fraction remains in
USDC, and that USDC is always held with the intention of being converted to eToken.

## Finding #2 — Rejected

Not a bug — it's a feature. Ensuro's Onyx vault has no off-chain positions, which is why we
deliberately always pass `0` as the number of assets not tracked on-chain.

## Finding #3 — Acknowledged

Not relevant, because `netShareValue` should never be zero in practice. Moreover, if it were
zero, the redemption should fail anyway.
