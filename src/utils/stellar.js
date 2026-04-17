import {
  isConnected,
  getPublicKey,
  signTransaction,
} from "@stellar/freighter-api";
import { Horizon } from "@stellar/stellar-sdk";

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
