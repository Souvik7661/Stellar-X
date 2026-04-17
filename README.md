# 🌌 Stellar Split (SplitX)

Stellar Split is a decentralized expense-splitting application built on the Stellar blockchain. It allows users to track shared expenses, calculate who owes whom, and settle debts seamlessly using XLM and Freighter.

Designed to win, Stellar Split features a stunning "Neon Galaxy" glassmorphic UI, ensuring a premium user experience while interacting with Web3 technologies.

### 📸 App Screenshots
![Landing Page](/Users/souvikkundu/.gemini/antigravity/brain/08dec005-783c-4b25-b903-37f5d4f3aa34/landing_page_unconnected_1776459544450.png)
![Connected Dashboard](/Users/souvikkundu/.gemini/antigravity/brain/08dec005-783c-4b25-b903-37f5d4f3aa34/connected_dashboard_balance_1776459558962.png)

---

## 🏗️ System Architecture

Stellar Split is a fully decentralized dApp relying on a client-side architecture that interacts directly with the Stellar network.

* **Frontend Framework:** React.js powered by Vite for lightning-fast HMR and optimized builds.
* **Styling:** Tailwind CSS with custom glassmorphism utilities, animated keyframes, and mesh gradients for a futuristic FinTech aesthetic.
* **Blockchain Network:** Stellar Testnet.
* **Node Provider:** Stellar Horizon API (`https://horizon-testnet.stellar.org`) for querying network data and submitting transactions.
* **Wallet Integration:** Freighter Wallet (`@stellar/freighter-api`) for secure key management and transaction signing without exposing private keys to the application.
* **Blockchain SDK:** `@stellar/stellar-sdk` for constructing payment operations and fetching account balances.

---

## 🌊 System Flow

1. **Authentication (Wallet Connect):**
   - The user clicks "Connect Freighter".
   - The app calls Freighter's `isConnected()` and `getPublicKey()`.
   - Upon approval, the app retrieves the user's public key and queries the Horizon API for their live XLM balance.

2. **Expense Input:**
   - The user navigates to "Add Expense".
   - They input the total expense amount and manually enter the public keys of the participants splitting the bill.

3. **Debt Calculation Engine:**
   - The app processes the input to determine the split.
   - It calculates exactly "who owes whom" and generates a list of pending settlements.

4. **Settlement (Transaction Execution):**
   - A debtor selects a pending debt to settle.
   - The app uses `stellar-sdk` to build an XLM payment transaction directed to the creditor's public key.
   - The transaction envelope is passed to Freighter (`signTransaction()`) for user authorization.

5. **Broadcasting & Verification:**
   - Once signed, the app submits the transaction to the Stellar Testnet.
   - The app listens for the network response and updates the UI with the **Transaction Hash** and **Success/Failure Status**.

---

## 🥋 Belt Progression Status

### ⚪️ Level 1 (White Belt) - Current Focus
- [x] Freighter wallet connect & disconnect
- [x] Fetch and display XLM balance
- [x] Add expense (amount + participants or manual input)
- [x] Calculate "who owes whom"
- [x] Send XLM transaction to settle debt
- [x] Show transaction status (Success/Failure, Transaction Hash)

### 🟡 Level 2 (Yellow Belt)
- [ ] Integrate StellarWalletsKit (multi-wallet support)
- [ ] Deploy a Soroban smart contract
- [ ] Store expenses on-chain
- [ ] Track debts between users
- [ ] Advanced Error handling

### 🟠 Level 3 (Orange Belt)
- [ ] User Dashboard (Total expenses, Debts, Credits)
- [ ] Expense history
- [ ] Debt minimization algorithm
- [ ] Loading states and caching
- [ ] Write at least 3 tests
- [ ] Prepare a 1-minute demo video

### 🟢 Level 4 (Green Belt)
- [ ] Group expense system (multiple users)
- [ ] Auto-settlement smart contract
- [ ] Real-time activity feed
- [ ] Fully mobile responsive UI
- [ ] Setup CI/CD pipeline

---

## 🚀 Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.
4. Ensure you have the **Freighter Wallet Extension** installed and set to the **Testnet**.
