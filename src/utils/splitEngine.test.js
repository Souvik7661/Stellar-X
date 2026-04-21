import { describe, it, expect } from 'vitest';
import { calculateDebts } from './splitEngine';

describe('calculateDebts', () => {
  it('should calculate an even split between two participants', () => {
    const expenses = [
      {
        id: '1',
        description: 'Lunch',
        amount: 100,
        payer: 'Alice',
        participants: ['Alice', 'Bob']
      }
    ];

    const debts = calculateDebts(expenses);
    
    expect(debts).toHaveLength(1);
    expect(debts[0]).toEqual({
      debtor: 'Bob',
      creditor: 'Alice',
      amount: 50 // 100 / 2
    });
  });

  it('should net out mutual debts', () => {
    const expenses = [
      {
        id: '1',
        description: 'Lunch',
        amount: 100, // Alice pays for Alice and Bob
        payer: 'Alice',
        participants: ['Alice', 'Bob']
      },
      {
        id: '2',
        description: 'Dinner',
        amount: 100, // Bob pays for Alice and Bob
        payer: 'Bob',
        participants: ['Alice', 'Bob']
      }
    ];

    const debts = calculateDebts(expenses);
    
    // They both paid 100 for each other, so no one owes anyone
    expect(debts).toHaveLength(0);
  });

  it('should calculate multiple participants and minimize transactions', () => {
    const expenses = [
      {
        id: '1',
        description: 'Trip',
        amount: 300, // Alice pays 300 for Alice, Bob, Charlie (100 each)
        payer: 'Alice',
        participants: ['Alice', 'Bob', 'Charlie']
      },
      {
        id: '2',
        description: 'Gas',
        amount: 60, // Bob pays 60 for Bob, Charlie (30 each)
        payer: 'Bob',
        participants: ['Bob', 'Charlie']
      }
    ];

    const debts = calculateDebts(expenses);
    
    // Alice paid 300, owes 100. Net +200
    // Bob paid 60, owes 100 to Alice and 30 for gas. Net -70.
    // Charlie paid 0, owes 100 to Alice and 30 to Bob. Net -130.

    // Bob owes 70, Charlie owes 130. Total owed = 200 (all goes to Alice).
    // Greedy algorithm sorts debtors (Charlie 130, Bob 70) and creditors (Alice 200).
    // Charlie pays Alice 130. Alice remaining = 70.
    // Bob pays Alice 70. Alice remaining = 0.
    
    expect(debts).toHaveLength(2);
    
    expect(debts).toContainEqual({
      debtor: 'Charlie',
      creditor: 'Alice',
      amount: 130
    });
    
    expect(debts).toContainEqual({
      debtor: 'Bob',
      creditor: 'Alice',
      amount: 70
    });
  });
});
