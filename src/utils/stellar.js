import {
  Horizon,
  TransactionBuilder,
  Operation,
  Asset,
  Networks,
  Transaction,
  BASE_FEE,
} from '@stellar/stellar-sdk';

export const server = new Horizon.Server('https://horizon-testnet.stellar.org');

// ─── Check Freighter Connection (legacy helper) ───────────────────────────────
export const checkConnection = async () => {
  try {
    const { isConnected } = await import('@stellar/freighter-api');
    return await isConnected();
  } catch {
    return false;
  }
};

// ─── Fetch XLM Balance ────────────────────────────────────────────────────────
export const fetchBalance = async (publicKey) => {
  try {
    const account = await server.loadAccount(publicKey);
    const xlm = account.balances.find((b) => b.asset_type === 'native');
    return xlm ? parseFloat(xlm.balance).toFixed(4) : '0';
  } catch (error) {
    if (error?.response?.status === 404) return '0 (Unfunded)';
    return 'Error';
  }
};

// ─── Build a Payment XDR (unsigned) ──────────────────────────────────────────
/**
 * Build and return the unsigned XDR string for a native XLM payment.
 * The caller is responsible for signing and submitting.
 */
export const buildPaymentXDR = async (sourceKey, destinationKey, amount) => {
  const account = await server.loadAccount(sourceKey);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.payment({
        destination: destinationKey,
        asset: Asset.native(),
        amount: parseFloat(amount).toFixed(7),
      })
    )
    .setTimeout(60)
    .build();

  return tx.toXDR();
};

// ─── Submit a Signed XDR ──────────────────────────────────────────────────────
/**
 * Reconstruct a Transaction from a signed XDR string and submit it to Horizon.
 * Returns { success, hash } or { success: false, error }.
 */
export const submitSignedXDR = async (signedXdr) => {
  try {
    const tx = new Transaction(signedXdr, Networks.TESTNET);
    const response = await server.submitTransaction(tx);
    return { success: true, hash: response.hash };
  } catch (error) {
    const msg =
      error?.response?.data?.extras?.result_codes?.operations?.[0] ||
      error?.response?.data?.extras?.result_codes?.transaction ||
      error?.message ||
      'Transaction failed';
    return { success: false, error: msg };
  }
};

// ─── Legacy all-in-one submit (kept for reference) ────────────────────────────
export const submitPaymentTransaction = async (
  sourcePublicKey,
  destinationPublicKey,
  amount
) => {
  try {
    const { signTransaction } = await import('@stellar/freighter-api');
    const xdr = await buildPaymentXDR(sourcePublicKey, destinationPublicKey, amount);
    const signedXdr = await signTransaction(xdr, { network: 'TESTNET' });
    return submitSignedXDR(signedXdr);
  } catch (error) {
    return { success: false, error: error.message || 'Transaction failed' };
  }
};
