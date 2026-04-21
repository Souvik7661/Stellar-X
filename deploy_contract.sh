#!/bin/bash
# ============================================================
# SplitX Contract Deploy Script
# Requires: stellar-cli (https://github.com/stellar/stellar-cli)
# Install:  cargo install stellar-cli --locked
# ============================================================

set -e

echo "🔨 Building SplitX Soroban contract..."
cd contract
stellar contract build

echo "🔑 Generating Alice identity if not exists..."
stellar keys generate --network testnet alice || true

echo "🚀 Deploying to Stellar Testnet..."
CONTRACT_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/splitx_contract.wasm \
  --source-account alice \
  --network testnet)

echo ""
echo "✅ Contract deployed successfully!"
echo "📋 Contract ID: $CONTRACT_ID"
echo ""
echo "👉 Add this to your .env file:"
echo "VITE_CONTRACT_ID=$CONTRACT_ID"
echo ""
echo "🔗 View on Stellar Expert:"
echo "https://stellar.expert/explorer/testnet/contract/$CONTRACT_ID"
