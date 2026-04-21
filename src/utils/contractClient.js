import {
  Contract,
  SorobanRpc,
  TransactionBuilder,
  Networks,
  nativeToScVal,
  scValToNative,
} from '@stellar/stellar-sdk';
import { signXDR } from './walletKit';

// ─── Config ──────────────────────────────────────────────────────────────────
export const CONTRACT_ID =
  import.meta.env.VITE_CONTRACT_ID || 'YOUR_CONTRACT_ID_HERE';

const SOROBAN_RPC = 'https://soroban-testnet.stellar.org';
const rpc = new SorobanRpc.Server(SOROBAN_RPC);

const isContractDeployed = () => CONTRACT_ID !== 'YOUR_CONTRACT_ID_HERE';

// ─── Invoke Helper ───────────────────────────────────────────────────────────
const invokeContract = async (publicKey, method, args) => {
  const account = await rpc.getAccount(publicKey);
  const contract = new Contract(CONTRACT_ID);

  const tx = new TransactionBuilder(account, {
    fee: '100000',
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(60)
    .build();

  // Simulate first to get fees / auth
  const prepared = await rpc.prepareTransaction(tx);

  // Sign via wallet kit
  const signedXdr = await signXDR(prepared.toXDR(), publicKey);

  // Submit to Soroban RPC
  const response = await rpc.sendTransaction(signedXdr);
  return response;
};

// ─── Poll for Transaction Result ─────────────────────────────────────────────
export const pollTxResult = async (hash, maxAttempts = 20) => {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    try {
      const result = await rpc.getTransaction(hash);
      if (result.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
        return { status: 'confirmed', hash };
      }
      if (result.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
        return { status: 'failed', hash };
      }
    } catch (_) {
      // still pending
    }
  }
  return { status: 'timeout', hash };
};

// ─── Add Expense On-Chain ────────────────────────────────────────────────────
export const addExpenseOnChain = async (
  publicKey,
  expenseId,
  amountXLM,
  splitCount
) => {
  if (!isContractDeployed()) return null;
  const amountStroops = BigInt(Math.round(amountXLM * 10_000_000));
  return invokeContract(publicKey, 'add_expense', [
    nativeToScVal(expenseId, { type: 'symbol' }),
    nativeToScVal(publicKey, { type: 'address' }),
    nativeToScVal(amountStroops, { type: 'i128' }),
    nativeToScVal(splitCount, { type: 'u32' }),
  ]);
};

// ─── Settle Debt On-Chain ────────────────────────────────────────────────────
export const settleDebtOnChain = async (
  fromKey,
  toKey,
  expenseId,
  amountXLM
) => {
  if (!isContractDeployed()) return null;
  const amountStroops = BigInt(Math.round(amountXLM * 10_000_000));
  return invokeContract(fromKey, 'settle_debt', [
    nativeToScVal(fromKey, { type: 'address' }),
    nativeToScVal(toKey, { type: 'address' }),
    nativeToScVal(expenseId, { type: 'symbol' }),
    nativeToScVal(amountStroops, { type: 'i128' }),
  ]);
};

// ─── Fetch Contract Events ───────────────────────────────────────────────────
/**
 * Fetch recent Soroban contract events via RPC with basic caching.
 * Returns an array of normalised event objects.
 */
export const fetchContractEvents = async (startLedger) => {
  if (!isContractDeployed()) return [];
  try {
    const CACHE_KEY = `splitx_events_${CONTRACT_ID}`;
    const cachedEventsRaw = localStorage.getItem(CACHE_KEY);
    const cachedEvents = cachedEventsRaw ? JSON.parse(cachedEventsRaw) : [];
    
    // Determine the ledger to start fetching from (either provided, or the highest cached, or recent)
    let ledger = startLedger;
    if (!ledger) {
      if (cachedEvents.length > 0) {
        ledger = Math.max(...cachedEvents.map(e => e.ledger)) + 1;
      } else {
        ledger = (await rpc.getLatestLedger()).sequence - 50;
      }
    }

    const result = await rpc.getEvents({
      startLedger: ledger,
      filters: [
        {
          type: 'contract',
          contractIds: [CONTRACT_ID],
        },
      ],
      limit: 20,
    });

    const newEvents = (result.events || []).map((ev) => {
      const topicStrings = ev.topic.map((t) => {
        try { return scValToNative(t)?.toString(); } catch { return '?'; }
      });
      const category = topicStrings[0] || 'unknown';
      const action = topicStrings[1] || 'unknown';
      return {
        id: ev.id,
        type: `${category}_${action}`,
        ledger: ev.ledger,
        raw: ev, // might not serialize perfectly if it contains BigInt, but it's okay for our usage
      };
    });

    // Merge new events with cached events
    const allEvents = [...newEvents, ...cachedEvents];
    
    // De-duplicate by ID
    const uniqueEvents = Array.from(new Map(allEvents.map(item => [item.id, item])).values());
    
    // Keep only the 50 most recent events to prevent localStorage overflow
    const sortedEvents = uniqueEvents.sort((a, b) => b.ledger - a.ledger).slice(0, 50);
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(sortedEvents));
    return sortedEvents;

  } catch (e) {
    console.warn('Event fetch failed:', e.message);
    
    // Fallback to cache on error
    const cachedEventsRaw = localStorage.getItem(`splitx_events_${CONTRACT_ID}`);
    return cachedEventsRaw ? JSON.parse(cachedEventsRaw) : [];
  }
};
