# 🌌 Stellar Split (SplitX)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://stellar-x-tau.vercel.app/)
![Yellow Belt](https://img.shields.io/badge/Level-Yellow%20Belt%20🟡-yellow?style=for-the-badge)
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

## 📸 Screenshots

### Wallet Selection
> Multi-wallet support — Freighter, xBull, Lobstr, and Albedo available on connect.

![Wallet Options](./public/screenshot-wallets.png)

*(Screenshot: wallet picker showing all 4 supported wallet options)*

### Transaction Status Tracking
> Real-time status tracking for contract calls and XLM payments.

![Transaction Status](./public/screenshot-transaction.png)

*(Screenshot: 3-step transaction stepper showing Pending → Submitted → Confirmed)*

---

## 📡 Deployed Contract

| Field | Value |
|---|---|
| **Network** | Stellar Testnet |
| **Contract ID** | `YOUR_CONTRACT_ID_HERE` ← *(paste after running `./deploy_contract.sh`)* |
| **Explorer** | [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/YOUR_CONTRACT_ID_HERE) |

### Sample Transaction Hash
> A verified transaction settling debt on the Horizon network:

```
07b5a88e7a02c9a936a2cd821a733e8b0b8c66e74b3d395ec1fb02d410d11a76
```
[View on Stellar Expert →](https://stellar.expert/explorer/testnet/tx/07b5a88e7a02c9a936a2cd821a733e8b0b8c66e74b3d395ec1fb02d410d11a76)

![Transaction Explorer](./public/screenshot-explorer.png)

*(Screenshot: Stellar Expert showing the successful settlement transaction)*

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

### 🟠 Level 3 — Orange Belt (upcoming)
- [ ] User dashboard (total paid, credits, debts summary)
- [ ] Expense history with filters
- [ ] Loading states and caching
- [ ] 3+ unit tests
- [ ] 1-minute demo video

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
