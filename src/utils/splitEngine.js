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
    const splitAmount = totalAmount / expense.participants.length;

    // Credit the payer (they paid the total, but they owe their own split)
    balances[expense.payer] = (balances[expense.payer] || 0) + (totalAmount - splitAmount);

    // Debit everyone else (they owe their split)
    expense.participants.forEach(participant => {
      if (participant !== expense.payer) {
        balances[participant] = (balances[participant] || 0) - splitAmount;
      }
    });
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
