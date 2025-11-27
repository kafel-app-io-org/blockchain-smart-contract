# Kafel Blockchain Smart Contracts

This repository contains the **Kafel smart contracts** used to power on-chain parts of the donation
ecosystem, including the KFL token and donation/settlement logic.

---

## Features

- 🪙 KFL ERC-20 token (with custom decimals / fees / pause/burn – depending on implementation)
- 🏦 Donation and distribution contracts
- 🧾 On-chain ledger / events for transparency
- 🧪 Unit tests and deployment scripts
- 🧰 Support for testnets and mainnet

---

## Tech Stack

- **Language:** Solidity
- **Framework:** Hardhat (or Foundry / Truffle – check repo)
- **Libraries:** OpenZeppelin Contracts
- **Network:** EVM-compatible chains (e.g., Ethereum, Polygon, etc.)

---

## Getting Started

### 1. Prerequisites

- Node.js (LTS)
- npm or yarn
- A supported wallet / RPC endpoints (e.g., Alchemy, Infura)

### 2. Installation

```bash
git clone https://github.com/kafel-app-io-org/blockchain-smart-contract.git
cd blockchain-smart-contract
npm install
# or: yarn install
```

---

## Environment Variables

Create `.env` in the root:

```bash
cp .env.example .env
```

Typical variables:

```env
# RPC URLs
RPC_URL_MAINNET=https://...
RPC_URL_TESTNET=https://...

# Private key for deployment (use test key, never commit!)
DEPLOYER_PRIVATE_KEY=0x...

# Optional: Etherscan/Polygonscan API keys for verification
ETHERSCAN_API_KEY=xxxxx
POLYGONSCAN_API_KEY=xxxxx
```

---

## Scripts (Hardhat example)

```bash
# Run tests
npx hardhat test

# Compile contracts
npx hardhat compile

# Run a local node
npx hardhat node

# Deploy to local network
npx hardhat run scripts/deploy.ts --network localhost

# Deploy to testnet
npx hardhat run scripts/deploy.ts --network <your-testnet>
```

Check `hardhat.config` and `package.json` for the actual script names.

---

## Project Structure (example)

```text
contracts/
  KFLToken.sol
  DonationManager.sol
  ...

scripts/
  deploy.ts
  verify.ts

test/
  KFLToken.test.ts
  DonationManager.test.ts
  ...
```

---

## Security Notes

- **Never** commit private keys or secrets.
- Use `.env` and `.gitignore` to keep sensitive data out of the repo.
- Consider external audits before deploying to mainnet.

---

## License

Smart contract code licensing and usage terms are defined by the Kafel organization.
