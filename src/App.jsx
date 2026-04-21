import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Wallet, LogOut, Send, Plus, Layout, Zap, Cpu, X, User,
  ArrowRight, CheckCircle2, AlertCircle, Activity, WifiOff,
  ShieldX, AlertTriangle, Clock, Radio, Layers, ChevronRight,
  RefreshCw, Globe,
} from 'lucide-react';

import { connectWallet, signXDR, ERROR_TYPES, SUPPORTED_WALLETS } from './utils/walletKit';
import { fetchBalance, buildPaymentXDR, submitSignedXDR } from './utils/stellar';
import { calculateDebts } from './utils/splitEngine';
import {
  addExpenseOnChain,
  settleDebtOnChain,
  fetchContractEvents,
  pollTxResult,
  CONTRACT_ID,
} from './utils/contractClient';

// ─── Constants ───────────────────────────────────────────────────────────────
const ERROR_CONFIG = {
  [ERROR_TYPES.WALLET_NOT_FOUND]: {
    Icon: WifiOff, color: '#ff8c42', bg: 'rgba(255,140,66,0.12)',
    border: 'rgba(255,140,66,0.35)', label: 'Wallet Not Found',
  },
  [ERROR_TYPES.USER_REJECTED]: {
    Icon: ShieldX, color: '#f5d020', bg: 'rgba(245,208,32,0.10)',
    border: 'rgba(245,208,32,0.35)', label: 'Request Rejected',
  },
  [ERROR_TYPES.INSUFFICIENT_BALANCE]: {
    Icon: AlertTriangle, color: '#ff4d6d', bg: 'rgba(255,77,109,0.10)',
    border: 'rgba(255,77,109,0.35)', label: 'Insufficient Balance',
  },
  [ERROR_TYPES.NETWORK_MISMATCH]: {
    Icon: Globe, color: '#f5a623', bg: 'rgba(245,166,35,0.12)',
    border: 'rgba(245,166,35,0.45)', label: 'Wrong Network',
  },
  [ERROR_TYPES.UNKNOWN]: {
    Icon: AlertCircle, color: '#ff4d6d', bg: 'rgba(255,77,109,0.10)',
    border: 'rgba(255,77,109,0.35)', label: 'Error',
  },
};

const TX_STEPS = ['Pending', 'Submitted', 'Confirmed'];
const stepIndex = { idle: -1, pending: 0, submitted: 1, confirmed: 2, failed: 1 };

const isContractLive = CONTRACT_ID !== 'YOUR_CONTRACT_ID_HERE';

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  // Wallet
  const [pubKey, setPubKey]           = useState('');
  const [balance, setBalance]         = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [activeWallet, setActiveWallet] = useState(null);
  const [isLoading, setIsLoading]     = useState(false);

  // Modals
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  // Errors
  const [walletError, setWalletError] = useState(null); // { type, message }

  // TX Status  — step: 'idle' | 'pending' | 'submitted' | 'confirmed' | 'failed'
  const [txStatus, setTxStatus] = useState({ step: 'idle', hash: '', message: '' });

  // App data
  const [expenses, setExpenses]   = useState([]);
  const [debts, setDebts]         = useState([]);
  const [settlingIdx, setSettlingIdx] = useState(null);

  // Live events
  const [liveEvents, setLiveEvents] = useState([]);
  const [isEventsLoading, setIsEventsLoading] = useState(false);
  const pollRef = useRef(null);
  const lastLedgerRef = useRef(null);

  // Form
  const [expenseDesc, setExpenseDesc]   = useState('');
  const [expenseAmt, setExpenseAmt]     = useState('');
  const [participantCount, setParticipantCount] = useState(2);
  const [receiverAddresses, setReceiverAddresses] = useState(['']);

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const short = (k) => k ? `${k.slice(0, 5)}…${k.slice(-4)}` : '';

  const pushEvent = (type, meta) =>
    setLiveEvents((prev) =>
      [{ id: Date.now(), type, meta, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 12)
    );

  const loadBalance = async (key) => {
    setIsLoading(true);
    setBalance(await fetchBalance(key));
    setIsLoading(false);
  };

  // ─── Event polling ─────────────────────────────────────────────────────────
  const startPolling = useCallback(async () => {
    if (pollRef.current) clearInterval(pollRef.current);
    
    // Initial fetch loading state
    if (isContractLive && liveEvents.length === 0) {
      setIsEventsLoading(true);
      const events = await fetchContractEvents(lastLedgerRef.current);
      events.forEach((ev) => {
        if (ev.ledger > (lastLedgerRef.current || 0)) lastLedgerRef.current = ev.ledger;
      });
      setLiveEvents(events.map(ev => ({ id: ev.id, type: ev.type, meta: ev.raw, time: new Date().toLocaleTimeString() })).slice(0, 12));
      setIsEventsLoading(false);
    }

    pollRef.current = setInterval(async () => {
      if (!isContractLive) return;
      const events = await fetchContractEvents(lastLedgerRef.current);
      events.forEach((ev) => {
        if (ev.ledger > (lastLedgerRef.current || 0)) lastLedgerRef.current = ev.ledger;
        pushEvent(ev.type, ev.raw);
      });
    }, 10_000);
  }, [liveEvents.length]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  // ─── Connect wallet ────────────────────────────────────────────────────────
  const handleConnect = async (walletId) => {
    setWalletError(null);
    try {
      const { address } = await connectWallet(walletId);
      setPubKey(address);
      setIsConnected(true);
      setActiveWallet(SUPPORTED_WALLETS.find((w) => w.id === walletId));
      setWalletModalOpen(false);
      loadBalance(address);
      startPolling();
    } catch (err) {
      setWalletError(err);
    }
  };

  // ─── Disconnect ────────────────────────────────────────────────────────────
  const handleDisconnect = () => {
    setPubKey(''); setBalance(''); setIsConnected(false); setActiveWallet(null);
    setExpenses([]); setDebts([]); setLiveEvents([]);
    setWalletError(null); setTxStatus({ step: 'idle', hash: '', message: '' });
    if (pollRef.current) clearInterval(pollRef.current);
  };

  // ─── Add expense ───────────────────────────────────────────────────────────
  const handleAddExpense = async (e) => {
    e.preventDefault();
    setWalletError(null);
    const parts = [...new Set([
      ...receiverAddresses.filter(Boolean),
      pubKey,
    ])];
    const expenseId = `exp_${Date.now()}`;
    const newExp = {
      id: expenseId, description: expenseDesc,
      amount: parseFloat(expenseAmt), payer: pubKey,
      participants: parts, onChain: false,
    };
    const updated = [...expenses, newExp];
    setExpenses(updated);
    setDebts(calculateDebts(updated));
    setExpenseModalOpen(false);
    setExpenseDesc(''); setExpenseAmt(''); setParticipantCount(2); setReceiverAddresses(['']);

    // Store on-chain if contract is deployed
    if (isContractLive) {
      try {
        setTxStatus({ step: 'pending', hash: '', message: `Storing "${newExp.description}" on-chain…` });
        const res = await addExpenseOnChain(pubKey, expenseId, newExp.amount, parts.length);
        if (res?.hash) {
          setTxStatus({ step: 'submitted', hash: res.hash, message: 'Expense submitted to contract!' });
          pushEvent('expense_added', { desc: newExp.description, amount: newExp.amount });
          const poll = await pollTxResult(res.hash);
          setTxStatus({ step: poll.status === 'confirmed' ? 'confirmed' : 'failed', hash: res.hash, message: poll.status === 'confirmed' ? 'Expense stored on-chain ✓' : 'Contract call failed.' });
          if (poll.status === 'confirmed') {
            setExpenses((prev) => prev.map((x) => x.id === expenseId ? { ...x, onChain: true } : x));
          }
          setTimeout(() => setTxStatus({ step: 'idle', hash: '', message: '' }), 6000);
        }
      } catch (err) {
        setWalletError(err.type ? err : { type: ERROR_TYPES.UNKNOWN, message: err.message });
        setTxStatus({ step: 'failed', hash: '', message: 'Contract call rejected.' });
        setTimeout(() => setTxStatus({ step: 'idle', hash: '', message: '' }), 5000);
      }
    }
  };

  // ─── Settle debt ───────────────────────────────────────────────────────────
  const handleSettle = async (debt, idx) => {
    setWalletError(null);

    // ① Insufficient balance check
    const bal = parseFloat(balance);
    if (!isNaN(bal) && bal < debt.amount + 0.5) {
      setWalletError({
        type: ERROR_TYPES.INSUFFICIENT_BALANCE,
        message: `Need ${debt.amount} XLM + fees but wallet has ${balance} XLM.`,
      });
      return;
    }

    setSettlingIdx(idx);
    setTxStatus({ step: 'pending', hash: '', message: `Settling ${debt.amount} XLM…` });

    try {
      // Build unsigned XDR
      const xdr = await buildPaymentXDR(pubKey, debt.creditor, debt.amount);

      // ② Sign via wallet kit — may throw USER_REJECTED
      const signedXdr = await signXDR(xdr, pubKey);

      // Submit to Horizon
      const result = await submitSignedXDR(signedXdr);

      if (!result.success) {
        const msg = (result.error || '').toLowerCase();
        if (msg.includes('insufficient') || msg.includes('underfunded')) {
          throw { type: ERROR_TYPES.INSUFFICIENT_BALANCE, message: result.error };
        }
        throw { type: ERROR_TYPES.UNKNOWN, message: result.error };
      }

      setTxStatus({ step: 'submitted', hash: result.hash, message: 'Payment submitted!' });
      pushEvent('debt_settled', { from: pubKey, to: debt.creditor, amount: debt.amount });

      // Optimistically remove debt
      setDebts((prev) => prev.filter((_, i) => i !== idx));
      loadBalance(pubKey);

      // Poll horizon for confirmation
      let attempts = 0;
      const confirm = setInterval(async () => {
        if (++attempts > 20) { clearInterval(confirm); return; }
        try {
          const { server } = await import('./utils/stellar');
          await server.transactions().transaction(result.hash).call();
          clearInterval(confirm);
          setTxStatus({ step: 'confirmed', hash: result.hash, message: 'Settlement confirmed! ✓' });
          setTimeout(() => setTxStatus({ step: 'idle', hash: '', message: '' }), 7000);
        } catch (_) { /* not yet */ }
      }, 3000);

      // Also record on contract (non-critical)
      if (isContractLive) {
        settleDebtOnChain(pubKey, debt.creditor, 'settle', debt.amount).catch(() => {});
      }

    } catch (err) {
      const categorised = err.type ? err : { type: ERROR_TYPES.UNKNOWN, message: err.message };
      setWalletError(categorised);
      setTxStatus({ step: 'failed', hash: '', message: categorised.message });
      setTimeout(() => setTxStatus({ step: 'idle', hash: '', message: '' }), 5000);
    }

    setSettlingIdx(null);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  const currentErrCfg = walletError ? ERROR_CONFIG[walletError.type] || ERROR_CONFIG[ERROR_TYPES.UNKNOWN] : null;

  return (
    <div className="app-root">
      {/* Ambient orbs */}
      <div className="orb orb-cyan" />
      <div className="orb orb-pink" />
      <div className="orb orb-purple" />

      <div className="main-wrap">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <header className="app-header">
          <div className="header-logo">
            <Layout size={22} />
          </div>
          <div>
            <h1 className="header-title">STELLAR SPLIT</h1>
          </div>
          {isConnected && activeWallet && (
            <div className="header-wallet-chip">
              <span>{activeWallet.emoji}</span>
              <span>{activeWallet.name}</span>
            </div>
          )}
        </header>

        {/* ── Error Banner ─────────────────────────────────────────────── */}
        {walletError && currentErrCfg && (
          <div className="error-banner" style={{ background: currentErrCfg.bg, borderColor: currentErrCfg.border }}>
            <currentErrCfg.Icon size={18} style={{ color: currentErrCfg.color, flexShrink: 0 }} />
            <div className="error-banner-body">
              <span className="error-banner-label" style={{ color: currentErrCfg.color }}>{currentErrCfg.label}</span>
              <span className="error-banner-msg">{walletError.message}</span>
            </div>
            <button className="error-banner-close" onClick={() => setWalletError(null)}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── TX Status Stepper ─────────────────────────────────────────── */}
        {txStatus.step !== 'idle' && (
          <div className={`tx-stepper ${txStatus.step === 'failed' ? 'tx-stepper-fail' : ''}`}>
            <div className="tx-stepper-steps">
              {TX_STEPS.map((label, i) => {
                const current = stepIndex[txStatus.step];
                const done = i < current || txStatus.step === 'confirmed';
                const active = i === current && txStatus.step !== 'confirmed';
                return (
                  <React.Fragment key={label}>
                    <div className={`tx-step ${done ? 'done' : ''} ${active ? 'active' : ''} ${txStatus.step === 'failed' && i === 1 ? 'failed' : ''}`}>
                      <div className="tx-step-dot">
                        {done ? <CheckCircle2 size={14} /> : active ? <Clock size={12} className="spin" /> : <span>{i + 1}</span>}
                      </div>
                      <span>{label}</span>
                    </div>
                    {i < TX_STEPS.length - 1 && <div className={`tx-step-line ${done ? 'done' : ''}`} />}
                  </React.Fragment>
                );
              })}
            </div>
            <p className="tx-stepper-msg">{txStatus.message}</p>
            {txStatus.hash && (
              <a className="tx-stepper-link" href={`https://stellar.expert/explorer/testnet/tx/${txStatus.hash}`} target="_blank" rel="noreferrer">
                View on Stellar Expert →
              </a>
            )}
          </div>
        )}

        {/* ── NOT CONNECTED ─────────────────────────────────────────────── */}
        {!isConnected ? (
          <div className="card card-welcome">
            <div className="welcome-orb-wrap">
              <div className="welcome-orb-glow" />
              <div className="welcome-orb-icon"><Cpu size={42} /></div>
            </div>
            <h2 className="welcome-title">Sync Your Vault</h2>
            <p className="welcome-sub">
              Connect a Stellar wallet to start splitting expenses on-chain with real-time event tracking.
            </p>
            <div className="wallet-grid">
              {SUPPORTED_WALLETS.map((w) => (
                <button key={w.id} className="wallet-option-btn" onClick={() => handleConnect(w.id)}>
                  <span className="wallet-emoji">{w.emoji}</span>
                  <span className="wallet-name">{w.name}</span>
                  <span className="wallet-desc">{w.description}</span>
                </button>
              ))}
            </div>
          </div>

        ) : (
          /* ── CONNECTED ─────────────────────────────────────────────── */
          <div className="dashboard">

            {/* Balance card */}
            <div className="balance-card">
              <div className="balance-card-inner">
                <div>
                  <p className="balance-label"><Zap size={12} /> Live Balance</p>
                  <div className="balance-amount">
                    {isLoading ? <RefreshCw size={28} className="spin" /> : balance}
                    <span className="balance-unit">XLM</span>
                  </div>
                </div>
                <div className="balance-meta">
                  <span className="balance-key-label">Authenticated Key</span>
                  <code className="balance-key">{short(pubKey)}</code>
                  {activeWallet && <span className="balance-wallet-badge">{activeWallet.emoji} {activeWallet.name}</span>}
                </div>
              </div>
              {isContractLive && (
                <div className="contract-pill">
                  <Layers size={12} /> Contract Live
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="action-row">
              <button className="action-btn action-btn-cyan" onClick={() => setExpenseModalOpen(true)}>
                <div className="action-btn-icon"><Plus size={18} /></div>
                <span>DISTRIBUTE PAYMENT</span>
              </button>
              <button className="action-btn action-btn-pink" onClick={() => { const d = debts.find((_, i) => i === 0); if (d) handleSettle(d, 0); }}>
                <div className="action-btn-icon"><Send size={18} /></div>
                <span>SETTLE DEBT</span>
              </button>
            </div>

            {/* ── Debts ──────────────────────────────────────────────── */}
            {debts.length > 0 && (
              <div className="card">
                <h3 className="section-title"><User size={18} className="text-pink" /> Pending Payments</h3>
                <div className="debt-list">
                  {debts.map((debt, idx) => {
                    const isMine = debt.debtor === pubKey;
                    return (
                      <div key={idx} className="debt-row">
                        <div>
                          <p className="debt-who">{isMine ? 'You owe' : `${short(debt.debtor)} owes`}</p>
                          <p className="debt-route">
                            {short(debt.debtor)} <ArrowRight size={10} /> {short(debt.creditor)}
                          </p>
                        </div>
                        <div className="debt-right">
                          <span className={`debt-amount ${isMine ? 'amount-pink' : 'amount-cyan'}`}>
                            {debt.amount} XLM
                          </span>
                          {isMine && (
                            <button
                              className="settle-btn"
                              disabled={settlingIdx === idx}
                              onClick={() => handleSettle(debt, idx)}
                            >
                              {settlingIdx === idx ? <RefreshCw size={12} className="spin" /> : 'SETTLE'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Live Event Feed ─────────────────────────────────────── */}
            <div className="card">
              <h3 className="section-title">
                <Radio size={16} className="pulse-dot" /> Live Event Feed
                <span className="event-count-badge">{liveEvents.length}</span>
              </h3>
              {isEventsLoading ? (
                <div className="empty-state" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <RefreshCw size={16} className="spin" /> Loading historical events...
                </div>
              ) : liveEvents.length === 0 ? (
                <p className="empty-state">
                  {isContractLive
                    ? 'Listening for contract events…'
                    : 'Deploy the contract to see live events. Events from UI actions will appear here.'}
                </p>
              ) : (
                <div className="event-list">
                  {liveEvents.map((ev) => (
                    <div key={ev.id} className="event-row">
                      <span className={`event-type-badge ${ev.type === 'expense_added' ? 'badge-cyan' : 'badge-pink'}`}>
                        {ev.type === 'expense_added' ? '📥 Distribution' : '✅ Settled'}
                      </span>
                      <span className="event-meta">
                        {ev.meta?.desc || ev.meta?.amount ? `${ev.meta.desc || ''} ${ev.meta.amount ? ev.meta.amount + ' XLM' : ''}` : ev.type}
                      </span>
                      <span className="event-time">{ev.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Expenses ─────────────────────────────────────────────── */}
            {expenses.length > 0 && (
              <div className="card">
                <h3 className="section-title"><Activity size={16} /> Distributions</h3>
                <div className="expense-list">
                  {expenses.map((exp) => (
                    <div key={exp.id} className="expense-row">
                      <div>
                        <p className="expense-desc">{exp.description}</p>
                        <p className="expense-meta">{exp.participants.length} participants</p>
                      </div>
                      <div className="expense-right">
                        <span className="expense-amount">{exp.amount} XLM</span>
                        {isContractLive && (
                          <span className={`onchain-badge ${exp.onChain ? 'badge-green' : 'badge-grey'}`}>
                            {exp.onChain ? '⛓ On-chain' : '⏳ Local'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disconnect */}
            <button className="disconnect-btn" onClick={handleDisconnect}>
              <LogOut size={15} /> DISCONNECT VAULT
            </button>
          </div>
        )}
      </div>

      {/* ── Wallet Picker Modal ───────────────────────────────────────────── */}
      {walletModalOpen && (
        <div className="modal-overlay" onClick={() => setWalletModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setWalletModalOpen(false)}><X size={16} /></button>
            <h2 className="modal-title">Choose Wallet</h2>
            <p className="modal-sub">Select your Stellar wallet to connect.</p>
            <div className="wallet-grid">
              {SUPPORTED_WALLETS.map((w) => (
                <button key={w.id} className="wallet-option-btn" onClick={() => handleConnect(w.id)}>
                  <span className="wallet-emoji">{w.emoji}</span>
                  <span className="wallet-name">{w.name}</span>
                  <span className="wallet-desc">{w.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Distribute Payment Modal ─────────────────────────────────────────────── */}
      {expenseModalOpen && (
        <div className="modal-overlay" onClick={() => setExpenseModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setExpenseModalOpen(false)}><X size={16} /></button>
            <div className="modal-icon-wrap"><Plus size={22} /></div>
            <h2 className="modal-title">Distribute Payment</h2>
            <p className="modal-sub">Distribute a payment to multiple receivers. It will be stored on the Stellar blockchain.</p>
            <form className="expense-form" onSubmit={handleAddExpense}>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" type="text" placeholder="e.g. Team Lunch" value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Amount (XLM)</label>
                <input className="form-input" type="number" step="0.0000001" placeholder="0.00" value={expenseAmt} onChange={(e) => setExpenseAmt(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Total Participants (including you)</label>
                <input className="form-input" type="number" min="2" max="20" value={participantCount} onChange={(e) => {
                  const val = parseInt(e.target.value) || 2;
                  setParticipantCount(val);
                  setReceiverAddresses(Array(Math.max(1, val - 1)).fill(''));
                }} required />
              </div>
              <div className="form-group">
                <label className="form-label">Receiver Wallet Addresses</label>
                {receiverAddresses.map((addr, idx) => (
                  <input key={idx} className="form-input" style={{ marginBottom: '8px' }} type="text" placeholder={`Receiver ${idx + 1} Public Key (G...)`} value={addr} onChange={(e) => {
                    const newArr = [...receiverAddresses];
                    newArr[idx] = e.target.value.trim();
                    setReceiverAddresses(newArr);
                  }} required />
                ))}
              </div>
              <button type="submit" className="form-submit">DISTRIBUTE PAYMENT</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
