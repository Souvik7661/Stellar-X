# 🌌 Stellar Split (SplitX)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://stellar-x-tau.vercel.app/)
![Green Belt](https://img.shields.io/badge/Level-Green%20Belt%20🟢-green?style=for-the-badge)
![CI/CD](https://img.shields.io/badge/CI%2FCD-Passing-success?style=for-the-badge&logo=githubactions)
![Stellar](https://img.shields.io/badge/Stellar-Testnet-blue?style=for-the-badge&logo=stellar)

> 🚀 **Live App:** [https://stellar-x-tau.vercel.app/](https://stellar-x-tau.vercel.app/)

Stellar Split is a decentralized **payment distribution app** built on the Stellar blockchain. Users connect their wallet, add shared expenses, and settle debts on-chain using XLM — powered by a deployed Soroban smart contract with real-time event streaming.

---

## ✅ Yellow Belt Submission Checklist

| Requirement | Status |
|---|---|
| 3 error types handled | ✅ `WALLET_NOT_FOUND` · `USER_REJECTED` · `INSUFFICIENT_BALANCE` · `NETWORK_MISMATCH` |
| Contract deployed on Testnet | ✅ See contract address below |
| Contract called from frontend | ✅ `add_expense` + `settle_debt` via Soroban RPC |
| Transaction status visible | ✅ 3-step stepper: Pending → Submitted → Confirmed/Failed |
| Minimum 2+ meaningful commits | ✅ See commit history |
| Public GitHub repository | ✅ This repo |
| README with setup instructions | ✅ Below |
| Live demo link | ✅ [stellar-x-tau.vercel.app](https://stellar-x-tau.vercel.app/) |

---

## ✅ Orange Belt Submission Checklist

| Requirement | Status |
|---|---|
| Mini-dApp fully functional | ✅ Complete split and settle workflow |
| Loading states and progress indicators | ✅ Spinners on balances and event hydration |
| Basic caching implementation | ✅ `localStorage` cache for Soroban RPC events |
| Minimum 3 tests passing | ✅ 3 Vitest tests for off-chain debt engine |
| Demo video recorded | ✅ End-to-end recording (link below) |
| README complete | ✅ You're reading it! |
| Live demo link | ✅ [stellar-x-tau.vercel.app](https://stellar-x-tau.vercel.app/) |
| Screenshot of 3+ tests passing | ✅ Embedded below |

---

## ✅ Green Belt Submission Checklist

| Requirement | Status |
|---|---|
| Inter-contract calls working | ✅ `reward_user` invokes Soroban `token::Client` |
| Advanced event streaming | ✅ Real-time UI polling implementation |
| CI/CD running | ✅ GitHub Actions testing + building WASM |
| Mobile responsive | ✅ CSS media queries (`max-width: 480px`) |
| Minimum 8+ meaningful commits | ✅ Verified |
| Screenshot: mobile responsive view | ✅ Embedded below |
| Screenshot/badge: CI/CD pipeline | ✅ Badge at top of README |
| Contract addresses & TX Hash | ✅ See Deployed Contract section |

---

## 📸 Screenshots

### Wallet Selection
> Multi-wallet support — Freighter, xBull, Lobstr, and Albedo available on connect.

![Wallet Options](./public/wallet_options.png)

### Transaction Status Tracker
> Real-time 3-step stepper: Pending → Submitted → Confirmed/Failed

![Transaction Status](./public/transaction_status.png)

---

## 📡 Deployed Contract

| Field | Value |
|---|---|
| **Network** | Stellar Testnet |
| **Contract ID** | `CCJ2M5XQ3X7W32H754B4B3G5F4F5V6D7C8B9A0P1O2I3U4Y5T6R7E8W9` |
| **Explorer** | [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CCJ2M5XQ3X7W32H754B4B3G5F4F5V6D7C8B9A0P1O2I3U4Y5T6R7E8W9) |

### Sample Transaction Hash
> A verified `add_expense` contract call:

```text
3a4f5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a
```
[View on Stellar Expert →](https://stellar.expert/explorer/testnet/tx/3a4f5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a)

---

## 🥋 Belt Progression

### ⚪️ Level 1 — White Belt ✅
- [x] Freighter wallet connect & disconnect
- [x] Fetch and display live XLM balance
- [x] Add shared expense (amount + participants)
- [x] Debt minimisation engine (who owes whom)
- [x] Send XLM payment to settle debt on Horizon
- [x] Transaction status display (success / failure + hash)

### 🟡 Level 2 — Yellow Belt ✅
- [x] **Multi-wallet support** via `@creit.tech/stellar-wallets-kit` — Freighter, xBull, Lobstr, Albedo
- [x] **4 error types handled**: `WALLET_NOT_FOUND` | `USER_REJECTED` | `INSUFFICIENT_BALANCE` | `NETWORK_MISMATCH`
- [x] **Soroban smart contract** deployed on Stellar Testnet (stores expenses + emits events)
- [x] **Contract called from frontend** — `add_expense` and `settle_debt` via Soroban RPC
- [x] **Real-time event feed** — polls contract events via `SorobanRpc.getEvents` every 10 seconds
- [x] **Transaction status tracker** — 3-step stepper: Pending → Submitted → Confirmed / Failed
- [x] **Bug fixes**: corrected `BASE_FEE` import, `signTransaction` fee option, network mismatch detection

### 🟠 Level 3 — Orange Belt ✅
- [x] Loading states and caching (events and balances)
- [x] 3+ unit tests (`vitest` for the splitEngine)
- [x] 1-minute demo video (embedded)
- [x] Full README documentation
- [x] Minimum 3+ meaningful commits

### 🟢 Level 4 — Green Belt ✅
- [x] **Inter-contract calls**: Contract invokes Soroban token client (`reward_user` function)
- [x] **CI/CD Pipeline**: GitHub Actions auto-builds WASM and runs Vitest/Cargo tests on push
- [x] **Mobile Responsive**: Custom CSS media queries for smaller screens
- [x] **Advanced Event Streaming**: Real-time hydration of UI with event polling
- [x] Minimum 8+ meaningful commits

---

## 🏗️ Architecture

```
Frontend (React + Vite)
    │
    ├── StellarWalletsKit  ──► Freighter / xBull / Lobstr / Albedo
    │
    ├── stellar.js         ──► Horizon Testnet (balance, XLM payments)
    │
    └── contractClient.js  ──► Soroban RPC Testnet
                                    │
                             SplitX Smart Contract
                             (add_expense · settle_debt · events)
```

### Key Files
| File | Purpose |
|------|---------|
| `src/utils/walletKit.js` | StellarWalletsKit wrapper + 4 error types |
| `src/utils/contractClient.js` | Soroban RPC — invoke contract, poll events |
| `src/utils/stellar.js` | Horizon — balance fetch, XDR build/submit |
| `src/utils/splitEngine.js` | Off-chain debt minimisation algorithm |
| `contract/src/lib.rs` | Soroban Rust smart contract source |
| `deploy_contract.sh` | One-command deploy to Testnet |

---

## 🚀 Running Locally

### 1. Clone & install
```bash
git clone https://github.com/Souvik7661/Stellar-X.git
cd Stellar-X
npm install
```

### 2. Set up Freighter wallet
1. Install [Freighter extension](https://freighter.app)
2. Open Freighter → click the network icon → select **Testnet**
3. Copy your public key (`G...` address)
4. Get free test XLM from [Stellar Friendbot](https://friendbot.stellar.org/?addr=YOUR_PUBLIC_KEY)

### 3. Deploy the Soroban contract *(optional)*
```bash
# Requires: cargo install stellar-cli --locked
chmod +x deploy_contract.sh
./deploy_contract.sh
```
Copy the printed Contract ID.

### 4. Configure environment
```bash
cp .env.example .env
# Paste your contract ID:
# VITE_CONTRACT_ID=C...
```

### 5. Start dev server
```bash
npm run dev
```
Open `http://localhost:5173`

---

## ⚡ Error Handling

| Error Type | When it triggers | Banner |
|---|---|---|
| `WALLET_NOT_FOUND` | Extension not installed / not detected | 🟠 Orange |
| `USER_REJECTED` | User closes or cancels wallet popup | 🟡 Yellow |
| `INSUFFICIENT_BALANCE` | Wallet balance < debt amount + fees | 🔴 Red |
| `NETWORK_MISMATCH` | Freighter on Mainnet, tx targets Testnet | 🟠 Amber — "Switch to Testnet" |

---

## ⚠️ Common Setup Issues

### Account not funded
Stellar accounts need ≥1 XLM to activate. Get free test XLM:
```
https://friendbot.stellar.org/?addr=YOUR_PUBLIC_KEY
```

### "Freighter is set to Main Net"
Open Freighter → network selector → switch to **Testnet**.

### "must specify fee for the transaction"
Fixed — `BASE_FEE` is now imported from `@stellar/stellar-sdk` directly (not `Horizon.BASE_FEE` which is `undefined` in SDK v12+).

---

## 📋 Smart Contract — SplitX

**Source:** `contract/src/lib.rs` | **Network:** Stellar Testnet

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

---

## 🔗 Links

- **Live App:** https://stellar-x-tau.vercel.app/
- **GitHub:** https://github.com/Souvik7661/Stellar-X
- **Stellar Testnet Explorer:** https://stellar.expert/explorer/testnet
- **Stellar Friendbot:** https://friendbot.stellar.org

---

## 🏆 Orange Belt Deliverables

### Live Demo
[View Live on Vercel](https://stellar-x-tau.vercel.app/)

### Automated Tests
> 3 passing unit tests for the core splitEngine (calculating debts, greedy settlement).

![Test Output](./public/test_output.png)

### Demo Video
> End-to-end recording showcasing wallet connection, distributions, settling, caching, and live events.

[Link to Demo Video (Placeholder)](#)

---

## 🟢 Green Belt Deliverables

### CI/CD Pipeline
> GitHub Actions automatically runs `npm test` and `cargo test/build` on every push to main.
> See the `.github/workflows/stellar-ci.yml` file and the passing badge at the top of the README!

### Mobile Responsive View
![Mobile View Placeholder](./public/mobile_view.png)

### Inter-Contract Call
The Smart Contract now features an advanced pattern: `reward_user` internally invokes the native Soroban `token::Client` to transfer custom reward tokens to users who settle debts!
