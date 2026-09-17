# Enzyme Onyx Rebalancer

Smart contracts for rebalancing and redeeming assets in an [Enzyme Onyx](https://docs.enzyme.finance/onyx-protocol) vault. The Onyx vault (the `Shares` contract) holds two assets — **USDC** and **eToken** (a rebasing token pegged 1:1 to USDC) — and these contracts let privileged roles keep the vault's USDC liquidity in balance with incoming redemption requests.

Built with [Hardhat 3](https://hardhat.org/) (TypeScript + Ethers) and Solidity `0.8.35` (`evmVersion: prague`).

## Contracts

### `OnyxRebalancer`

Swaps the USDC/eToken composition held by the Onyx vault. Each direction is guarded by its own role, so one direction can be left open (or restricted) independently of the other.

| Role | Function | Effect |
| --- | --- | --- |
| `USDC_TO_ETOKEN_ROLE` | `rebalanceUSDCToEToken(uint256 amount)` | Pulls `amount` eToken from the caller into the vault and withdraws `amount` USDC back to the caller. Vault ends up with **less USDC, more eToken**. |
| `ETOKEN_TO_USDC_ROLE` | `rebalanceETokenToUSDC(uint256 amount)` | Pulls `amount` USDC from the caller into the vault and withdraws `amount` eToken back to the caller. Vault ends up with **more USDC, less eToken**. |

```solidity
constructor(IERC20 usdc_, IERC20 eToken_, IOnyxVault onyxVault_, address admin_, address[] memory rebalancers_)
```

The constructor grants `DEFAULT_ADMIN_ROLE` to `admin_` and **both** rebalancer roles to every address in `rebalancers_`. After deployment the admin can grant/revoke each role independently.

### `OnyxRedeemer`

Updates the Onyx share value and executes redemption requests on a redemption handler.

| Role | Function | Effect |
| --- | --- | --- |
| `SCALE_UPDATER_ROLE` | `updateScale()` | Calls `ValuationHandler.updateShareValue(0)` and returns the net share value. |
| `REDEEM_EXECUTOR_ROLE` | `executeRedeemRequests(uint256[] requestIds)` | Calls `updateScale()` first, then `redemptionHandler.executeRedeemRequests(requestIds)`. |

```solidity
constructor(
  IOnyxVault onyxVault_,
  IRedemptionHandler redemptionHandler_,
  address admin_,
  address[] memory updateScalers_,
  address[] memory redeemExecutors_
)
```

### `onlyRoleOrOpenRole`

Both contracts copy OpenZeppelin's `onlyRoleOrOpenRole` modifier from `TimelockController`. Granting a role to `address(0)` makes that role open to everyone:

```solidity
modifier onlyRoleOrOpenRole(bytes32 role) {
    if (!hasRole(role, address(0))) {
        _checkRole(role, _msgSender());
    }
    _;
}
```

### Interfaces

- `IOnyxVault` — `withdrawAssetTo(address asset, address to, uint256 amount)` and `getValuationHandler()` (subset of the Onyx `Shares` contract).
- `IValuationHandler` — `updateShareValue(int256 untrackedPositionsValue) returns (uint256)`.
- `IRedemptionHandler` — `executeRedeemRequests(uint256[] requestIds)` (the ERC-7540-like redeem queue).

## Prerequisites

- Node.js `24` (see `.nvmrc`); `nvm use`
- npm

## Setup

```bash
npm install
```

Create a `.env` file (see `.env.example`):

```bash
MAINNET_RPC_URL=     # archive-capable RPC, used for deployment and forking
ETHERSCAN_API_KEY=   # for --verify
```

The deployer private key is **not** stored in `.env` — it lives in Hardhat's encrypted keystore:

```bash
npx hardhat keystore set MAINNET_PRIVATE_KEY
```

## Commands

| Command | Description |
| --- | --- |
| `npm run build` | Compile contracts (`hardhat build`) |
| `npm test` | Run unit tests |
| `npm run solhint` | Lint Solidity |
| `npm run lint` | Lint TypeScript (ESLint) |
| `npm run prettier` | Format Solidity/TS/JS with Prettier |

## Tests

Unit tests run on the default in-memory network:

```bash
npm test
```

## Deployment

Source `.env` first, then deploy via [Hardhat Ignition](https://hardhat.org/ignition).

### Rebalancer

```bash
npx hardhat ignition deploy ignition/modules/OnyxRebalancer.ts \
  --network mainnet \
  --parameters params.json \
  --deployment-id onyx-rebalancer-v2 \
  --verify
```

### Redeemers (one per redemption handler)

```bash
# USDC redemption handler
npx hardhat ignition deploy ignition/modules/OnyxRedeemer.ts \
  --network mainnet --parameters params-redeemer-usdc.json \
  --deployment-id onyx-redeemer-usdc --verify

# eToken redemption handler
npx hardhat ignition deploy ignition/modules/OnyxRedeemer.ts \
  --network mainnet --parameters params-redeemer-etoken.json \
  --deployment-id onyx-redeemer-etoken --verify
```

Use a distinct `--deployment-id` per deployment; otherwise Ignition's reconciliation will report that an already-executed future's arguments changed.

## Audit

The contracts were audited; see
[`audits/audit_agent_report_1_043969fe-043e-410a-8008-df48a77bc1dd.pdf`](audits/audit_agent_report_1_043969fe-043e-410a-8008-df48a77bc1dd.pdf).
Our stance on the audit findings is documented in
[`audits/audit_agent_report_1_findings.md`](audits/audit_agent_report_1_findings.md).
