# 🌌 Stellar Split (SplitX)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://stellar-x-tau.vercel.app/)
![Yellow Belt](https://img.shields.io/badge/Level-Yellow%20Belt%20🟡-yellow?style=for-the-badge)

> 🚀 **Live App:** [https://stellar-x-tau.vercel.app/](https://stellar-x-tau.vercel.app/)

Stellar Split is a decentralized payment distribution application built on the Stellar blockchain. Users track shared expenses, calculate debts, and settle them on-chain using XLM — with multi-wallet support, a deployed Soroban smart contract, and real-time event streaming.

---

## 🥋 Belt Progression

### ⚪️ Level 1 — White Belt ✅
- [x] Freighter wallet connect & disconnect
- [x] Fetch and display XLM balance
- [x] Add expense (amount + participants)
- [x] Calculate "who owes whom" (debt minimisation engine)
- [x] Send XLM payment to settle debt
- [x] Transaction status (Success/Failure + hash)

### 🟡 Level 2 — Yellow Belt ✅
- [x] **Multi-wallet support** via `@creit.tech/stellar-wallets-kit` (Freighter, xBull, Lobstr, Albedo)
- [x] **4 error types handled**: `WALLET_NOT_FOUND` | `USER_REJECTED` | `INSUFFICIENT_BALANCE` | `NETWORK_MISMATCH`
- [x] **Soroban smart contract** deployed on Stellar Testnet (`SplitX` — stores expenses + emits events)
- [x] **Contract called from frontend** — `add_expense` and `settle_debt` invocations via Soroban RPC
- [x] **Real-time event feed** — polls contract events via `SorobanRpc.getEvents` every 10 seconds
- [x] **Transaction status tracker** — 3-step stepper: Pending → Submitted → Confirmed/Failed
- [x] **Bug fixes**: `BASE_FEE` import corrected, wallet `fee` option in `signTransaction`, network mismatch detection

### 🟠 Level 3 — Orange Belt
- [ ] User Dashboard (total expenses, debts, credits)
- [ ] Expense history with filters
- [ ] Loading states and caching
- [ ] Write at least 3 tests
- [ ] 1-minute demo video

---

## 🏗️ Architecture

```
Frontend (React + Vite)
    │
    ├── StellarWalletsKit  ──► Freighter / xBull / Lobstr / Albedo
    │
    ├── stellar.js         ──► Horizon Testnet (balance, payments)
    │
    └── contractClient.js  ──► Soroban RPC Testnet
                                    │
                             SplitX Smart Contract
                             (expenses on-chain, events emitted)
```

### Key Files
| File | Purpose |
|------|---------|
| `src/utils/walletKit.js` | StellarWalletsKit wrapper + error categorisation |
| `src/utils/contractClient.js` | Soroban RPC invocations + event polling |
| `src/utils/stellar.js` | Horizon API (balance, XDR build/submit) |
| `src/utils/splitEngine.js` | Off-chain debt minimisation algorithm |
| `contract/src/lib.rs` | Soroban Rust contract source |
| `deploy_contract.sh` | One-command deploy script |

---

## 🚀 Running Locally

### 1. Install dependencies
```bash
npm install
```

### 2. Set up your Freighter wallet
1. Install the [Freighter browser extension](https://freighter.app)
2. Open Freighter → click the network icon → select **Testnet**
3. Copy your public key (`G...` address)
4. Fund your account with free test XLM via [Stellar Friendbot](https://friendbot.stellar.org/?addr=YOUR_PUBLIC_KEY)

### 3. Deploy the Soroban contract (optional but recommended)
```bash
# Requires stellar-cli: cargo install stellar-cli --locked
chmod +x deploy_contract.sh
./deploy_contract.sh
```
Copy the printed Contract ID.

### 4. Set environment variables
```bash
cp .env.example .env
# Edit .env and paste your contract ID:
VITE_CONTRACT_ID=C...YOUR_ID...
```

### 5. Start dev server
```bash
npm run dev
```
Open `http://localhost:5173`.

---

## ⚡ Error Handling

| Error Type | Trigger | UI |
|---|---|---|
| `WALLET_NOT_FOUND` 🟠 | Extension not installed | Orange banner |
| `USER_REJECTED` 🟡 | User closes wallet popup | Yellow banner |
| `INSUFFICIENT_BALANCE` 🔴 | Balance < debt amount | Red banner |
| `NETWORK_MISMATCH` 🟠 | Freighter on Mainnet, tx is Testnet | Amber banner — instructs user to switch |

---

## ⚠️ Common Issues

### "must specify fee for the transaction (in stroops)"
Fixed in `stellar.js` — `BASE_FEE` is now imported directly from `@stellar/stellar-sdk` instead of the incorrect `Horizon.BASE_FEE` (which is `undefined` in current SDK versions).

### "Freighter is set to Main Net"
Your Freighter wallet is on Mainnet. Switch to **Testnet** in the Freighter extension and retry.

### "$0.00 balance / account not funded"
Stellar accounts need a minimum balance to activate. Fund your Testnet account for free:
```
https://friendbot.stellar.org/?addr=YOUR_PUBLIC_KEY
```

---

## 📡 Smart Contract — SplitX

**Source:** `contract/src/lib.rs`
**Network:** Stellar Testnet
**Contract ID:** _(set in `.env` after deploy)_

### Interface
```rust
fn add_expense(env, id: Symbol, payer: Address, amount: i128, split_count: u32)
fn settle_debt(env, from: Address, to: Address, expense_id: Symbol, amount: i128)
fn get_expense(env, id: Symbol) -> Option<Expense>
fn get_total_paid(env, address: Address) -> i128
```

### Events Emitted
| Event | Topics | Data |
|---|---|---|
| Expense stored | `["expense", "added"]` | `(id, payer, amount, split_count)` |
| Debt settled | `["debt", "settled"]` | `(from, to, expense_id, amount)` |
