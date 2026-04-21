/**
 * Calculates who owes whom based on a list of expenses.
 * 
 * Expense object structure:
 * {
 *   id: string,
 *   description: string,
 *   amount: number, // Total amount paid in XLM
 *   payer: string, // Public Key of the person who paid
 *   participants: string[] // Array of Public Keys of everyone involved (including the payer)
 * }
 * 
 * Returns an array of Debt objects:
 * {
 *   debtor: string, // Public Key of who owes money
 *   creditor: string, // Public Key of who should receive money
 *   amount: number // Amount owed in XLM
 * }
 */
export function calculateDebts(expenses) {
  const balances = {};

  // 1. Calculate net balances for everyone
  expenses.forEach(expense => {
    const totalAmount = parseFloat(expense.amount);
    
    // Total participants (N). User + entered receivers.
    const totalNodes = expense.participants.length;
    
    if (totalNodes > 1) {
      // The amount is divided by N (all participants including the payer)
      const splitAmount = totalAmount / totalNodes;

      // Identify the N-1 receiver nodes (everyone except the payer)
      const receivers = expense.participants.filter(p => p !== expense.payer);

      // The payer keeps their share, and owes the rest to the N-1 receivers
      // Total owed = splitAmount * (N-1)
      const totalOwedByPayer = splitAmount * receivers.length;
      balances[expense.payer] = (balances[expense.payer] || 0) - totalOwedByPayer;

      // Credit the N-1 receiver nodes (each gets their splitAmount)
      receivers.forEach(receiver => {
        balances[receiver] = (balances[receiver] || 0) + splitAmount;
      });
    }
  });

  // 2. Separate into debtors and creditors
  const debtors = [];
  const creditors = [];

  for (const [pubKey, balance] of Object.entries(balances)) {
    // We use a small epsilon to avoid floating point precision issues
    if (balance > 0.000001) {
      creditors.push({ pubKey, balance });
    } else if (balance < -0.000001) {
      debtors.push({ pubKey, balance: Math.abs(balance) });
    }
  }

  // Sort by largest amounts first to minimize transactions (Greedy approach)
  debtors.sort((a, b) => b.balance - a.balance);
  creditors.sort((a, b) => b.balance - a.balance);

  // 3. Settle debts
  const debts = [];
  let d = 0; // debtor index
  let c = 0; // creditor index

  while (d < debtors.length && c < creditors.length) {
    const debtor = debtors[d];
    const creditor = creditors[c];

    const settlementAmount = Math.min(debtor.balance, creditor.balance);

    debts.push({
      debtor: debtor.pubKey,
      creditor: creditor.pubKey,
      amount: parseFloat(settlementAmount.toFixed(7)) // Stellar uses 7 decimals
    });

    debtor.balance -= settlementAmount;
    creditor.balance -= settlementAmount;

    if (debtor.balance < 0.000001) d++;
    if (creditor.balance < 0.000001) c++;
  }

  return debts;
}
