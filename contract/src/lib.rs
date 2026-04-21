#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Env, Symbol,
};

#[contracttype]
#[derive(Clone)]
pub struct Expense {
    pub payer: Address,
    pub amount: i128,
    pub split_count: u32,
    pub timestamp: u64,
    pub settled: bool,
}

#[contracttype]
pub enum DataKey {
    Expense(Symbol),
    TotalPaid(Address),
}

#[contract]
pub struct SplitXContract;

#[contractimpl]
impl SplitXContract {
    /// Store a new expense on-chain and emit an event.
    pub fn add_expense(
        env: Env,
        id: Symbol,
        payer: Address,
        amount: i128,
        split_count: u32,
    ) {
        payer.require_auth();

        let expense = Expense {
            payer: payer.clone(),
            amount,
            split_count,
            timestamp: env.ledger().timestamp(),
            settled: false,
        };

        env.storage()
            .instance()
            .set(&DataKey::Expense(id.clone()), &expense);

        let current: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalPaid(payer.clone()))
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::TotalPaid(payer.clone()), &(current + amount));

        // Emit: (topics: ["expense", "added"], data: (id, payer, amount, split_count))
        env.events().publish(
            (symbol_short!("expense"), symbol_short!("added")),
            (id, payer, amount, split_count),
        );
    }

    /// Record a debt settlement on-chain and emit an event.
    pub fn settle_debt(
        env: Env,
        from: Address,
        to: Address,
        expense_id: Symbol,
        amount: i128,
    ) {
        from.require_auth();

        // Mark as settled
        if let Some(mut expense) = env
            .storage()
            .instance()
            .get::<DataKey, Expense>(&DataKey::Expense(expense_id.clone()))
        {
            expense.settled = true;
            env.storage()
                .instance()
                .set(&DataKey::Expense(expense_id.clone()), &expense);
        }

        // Emit: (topics: ["debt", "settled"], data: (from, to, expense_id, amount))
        env.events().publish(
            (symbol_short!("debt"), symbol_short!("settled")),
            (from, to, expense_id, amount),
        );
    }

    /// Read an expense from storage.
    pub fn get_expense(env: Env, id: Symbol) -> Option<Expense> {
        env.storage()
            .instance()
            .get(&DataKey::Expense(id))
    }

    /// Get the total amount paid by an address across all expenses.
    pub fn get_total_paid(env: Env, address: Address) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::TotalPaid(address))
            .unwrap_or(0)
    }

    /// (Green Belt) Inter-contract call: Reward a user by transferring a custom token to them.
    /// The SplitX contract must hold a balance of the reward token and be authorized by the token contract.
    pub fn reward_user(env: Env, token_contract: Address, user: Address, amount: i128) {
        // We do NOT require user auth here because the contract is sending the token,
        // but we would typically restrict who can call this (e.g. only Admin or internal logic).
        
        let token_client = soroban_sdk::token::Client::new(&env, &token_contract);
        token_client.transfer(&env.current_contract_address(), &user, &amount);
        
        // Emit reward event
        env.events().publish(
            (symbol_short!("reward"), symbol_short!("sent")),
            (user, amount),
        );
    }
}
