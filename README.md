# Boost Test

A TypeScript project for testing Boost protocol functionality on Base Sepolia testnet.

## Prerequisites

- Node.js (v18 or higher)
- pnpm package manager
- A wallet with a private key that has ETH and USDC on Base Sepolia testnet

## Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo-url>
   cd boost-test
   pnpm install
   ```

2. **Environment Configuration:**
   
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your private key:
   ```
   ACCOUNT_PRIVATE_KEY=your_private_key_here
   ```
   
   ⚠️ **Important**: Never commit your `.env` file or share your private key!

3. **Get Testnet Tokens:**
   
   Your wallet needs both ETH and USDC on Base Sepolia testnet:
   
   - **ETH (Base Sepolia)**: Get free testnet ETH from [Alchemy Base Sepolia Faucet](https://www.alchemy.com/faucets/base-sepolia)
   - **USDC (Base Sepolia)**: Get free testnet USDC from [Circle Testnet Faucet](https://faucet.circle.com/)
   
   You can request:
   - ETH: Available from Alchemy faucet
   - USDC: 10 USDC per hour, per address from Circle faucet

## Usage

Start the development script:
```bash
pnpm dev
```

This will:
1. Load your environment variables
2. Connect to Base Sepolia testnet
3. Create a boost with transparent budget
4. Approve USDC spending
5. Deploy the boost and log the boost ID

## Project Structure

- `src/index.ts` - Main script entry point
- `src/config.ts` - Configuration and client setup
- `src/utils/` - Utility functions for budget and event actions
- `.env.example` - Environment template

## Scripts

- `pnpm dev` - Run the development script
- `pnpm build` - Compile TypeScript to JavaScript
- `pnpm start` - Run the compiled JavaScript
- `pnpm watch` - Watch for changes and recompile
- `pnpm clean` - Remove compiled output

## Troubleshooting

### Common Issues

1. **"ACCOUNT_PRIVATE_KEY is not set"**
   - Make sure you've created a `.env` file with your private key

2. **"Insufficient funds"**
   - Ensure your wallet has both ETH (for gas) and USDC (for the boost reward) on Base Sepolia
   - Use the faucets mentioned above to get testnet tokens

3. **Network connection issues**
   - The script uses Base Sepolia testnet via ThirdWeb RPC
   - Check your internet connection and try again

### Getting Help

If you encounter issues:
1. Check that your private key is correctly formatted (with '0x' prefix)
2. Verify you have sufficient testnet tokens
3. Ensure you're using the correct network (Base Sepolia)
