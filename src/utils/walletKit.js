import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit';
import { FreighterModule, FREIGHTER_ID } from '@creit.tech/stellar-wallets-kit/modules/freighter';
import { xBullModule, XBULL_ID } from '@creit.tech/stellar-wallets-kit/modules/xbull';
import { LobstrModule, LOBSTR_ID } from '@creit.tech/stellar-wallets-kit/modules/lobstr';
import { AlbedoModule, ALBEDO_ID } from '@creit.tech/stellar-wallets-kit/modules/albedo';

// ─── Error Types ────────────────────────────────────────────────────────────
export const ERROR_TYPES = {
  WALLET_NOT_FOUND: 'WALLET_NOT_FOUND',
  USER_REJECTED: 'USER_REJECTED',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  NETWORK_MISMATCH: 'NETWORK_MISMATCH',
  UNKNOWN: 'UNKNOWN',
};

export { FREIGHTER_ID, XBULL_ID, LOBSTR_ID, ALBEDO_ID };

// ─── Supported Wallets ───────────────────────────────────────────────────────
export const SUPPORTED_WALLETS = [
  {
    id: FREIGHTER_ID,
    name: 'Freighter',
    emoji: '🚀',
    description: 'Official Stellar wallet by SDF',
  },
  {
    id: XBULL_ID,
    name: 'xBull',
    emoji: '🐂',
    description: 'Feature-rich Stellar wallet',
  },
  {
    id: LOBSTR_ID,
    name: 'Lobstr',
    emoji: '🦞',
    description: 'Mobile-friendly Stellar wallet',
  },
  {
    id: ALBEDO_ID,
    name: 'Albedo',
    emoji: '🌐',
    description: 'Web-based Stellar signer',
  },
];

const modules = [
  new FreighterModule(),
  new xBullModule(),
  new LobstrModule(),
  new AlbedoModule(),
];

// ─── Init Kit ──────────────────────────────────────────────────
let kitInitialized = false;

export const initKit = (walletId) => {
  if (!kitInitialized) {
    StellarWalletsKit.init({
      network: Networks.TESTNET,
      modules,
    });
    kitInitialized = true;
  }
  if (walletId) {
    StellarWalletsKit.setWallet(walletId);
  }
};

export const getKit = () => StellarWalletsKit;

// ─── Connect ────────────────────────────────────────────────────────────────
/**
 * Connect to the selected wallet and return the public address.
 * Throws a categorised error object on failure.
 */
export const connectWallet = async (walletId) => {
  try {
    initKit(walletId);
    // fetchAddress interacts with the wallet extension
    const { address } = await StellarWalletsKit.fetchAddress();
    if (!address) throw new Error('No address returned from wallet.');
    return { address, walletId };
  } catch (err) {
    throw categorizeError(err);
  }
};

// ─── Sign ────────────────────────────────────────────────────────────────────
/**
 * Sign a transaction XDR string via the connected wallet.
 * Returns the signed XDR string.
 * Throws a categorised error object on failure.
 */
export const signXDR = async (xdr, address) => {
  try {
    const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
      network: Networks.TESTNET,
      networkPassphrase: Networks.TESTNET,
      fee: '100',
    });
    return signedTxXdr;
  } catch (err) {
    throw categorizeError(err);
  }
};

// ─── Error Categorisation ────────────────────────────────────────────────────
export const categorizeError = (err) => {
  const msg = (err?.message || err?.toString() || '').toLowerCase();

  if (
    msg.includes('not found') ||
    msg.includes('not installed') ||
    msg.includes('not available') ||
    msg.includes('extension') ||
    msg.includes('no wallet') ||
    msg.includes('undefined') ||
    msg.includes('cannot read')
  ) {
    return {
      type: ERROR_TYPES.WALLET_NOT_FOUND,
      message: 'Wallet extension not found. Please install it and refresh.',
    };
  }

  if (
    msg.includes('rejected') ||
    msg.includes('declined') ||
    msg.includes('cancel') ||
    msg.includes('user denied') ||
    msg.includes('closed')
  ) {
    return {
      type: ERROR_TYPES.USER_REJECTED,
      message: 'You rejected the request in your wallet.',
    };
  }

  if (
    msg.includes('main net') ||
    msg.includes('mainnet') ||
    msg.includes('network mismatch') ||
    msg.includes('wrong network') ||
    msg.includes('signing this transaction is not possible') ||
    (msg.includes('network') && msg.includes('test'))
  ) {
    return {
      type: ERROR_TYPES.NETWORK_MISMATCH,
      message: 'Freighter is set to Mainnet. Please switch Freighter to Testnet and try again.',
    };
  }

  if (
    msg.includes('insufficient') ||
    msg.includes('underfunded') ||
    msg.includes('balance') ||
    msg.includes('op_low_reserve')
  ) {
    return {
      type: ERROR_TYPES.INSUFFICIENT_BALANCE,
      message: 'Insufficient XLM balance to complete this transaction.',
    };
  }

  return {
    type: ERROR_TYPES.UNKNOWN,
    message: err?.message || 'An unknown error occurred.',
  };
};
