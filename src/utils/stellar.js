import {
  isConnected,
  getPublicKey,
  signTransaction,
} from "@stellar/freighter-api";
import { Horizon, TransactionBuilder, Operation, Asset, Networks, Transaction } from "@stellar/stellar-sdk";

const server = new Horizon.Server("https://horizon-testnet.stellar.org");

export const checkConnection = async () => {
  const isAllowed = await isConnected();
  if (isAllowed) {
    return true;
  }
  return false;
};

export const retrievePublicKey = async () => {
  let publicKey = "";
  let error = "";
  try {
    publicKey = await getPublicKey();
  } catch (e) {
    error = e;
  }
  return { publicKey, error };
};

export const fetchBalance = async (publicKey) => {
  try {
    const account = await server.loadAccount(publicKey);
    const xlmBalance = account.balances.find((b) => b.asset_type === "native");
    return xlmBalance ? xlmBalance.balance : "0";
  } catch (error) {
    console.error("Error fetching balance:", error);
    if (error.response && error.response.status === 404) {
       return "0 (Unfunded Account)";
    }
    return "Error";
  }
};

export const submitPaymentTransaction = async (sourcePublicKey, destinationPublicKey, amount) => {
  try {
    // 1. Load the sender's account sequence number
    const account = await server.loadAccount(sourcePublicKey);
    
    // 2. Build the transaction
    const transaction = new TransactionBuilder(account, {
      fee: Horizon.BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(Operation.payment({
        destination: destinationPublicKey,
        asset: Asset.native(),
        amount: amount.toString(), // amount must be a string
      }))
      .setTimeout(30)
      .build();

    // 3. Convert transaction to XDR and ask Freighter to sign it
    const xdr = transaction.toXDR();
    const signedXdr = await signTransaction(xdr, { network: "TESTNET" });

    // 4. Reconstruct the signed transaction
    const signedTx = new Transaction(signedXdr, Networks.TESTNET);

    // 5. Submit the transaction to the Stellar network
    const response = await server.submitTransaction(signedTx);
    return { success: true, hash: response.hash };
  } catch (error) {
    console.error("Transaction failed:", error);
    return { success: false, error: error.message || "Transaction failed or was rejected" };
  }
};
