# PerpX - Next-Generation Perpetual DEX

**Perpetual Trading Reimagined**

PerpX is a decentralized perpetual exchange built on Base, offering up to 100x leverage on crypto perpetuals with deep liquidity, minimal slippage, and institutional-grade execution.

---

## Features

- **100x Leverage**: Maximum capital efficiency for experienced traders
- **Deep Liquidity**: Oracle-based liquidity pools ensure minimal slippage
- **Lightning Fast**: Built on Base for sub-second execution
- **Zero Fees**: No trading fees during launch period
- **Decentralized**: Non-custodial, trustless trading
- **Oracle-Powered**: Chainlink Price Feeds for accurate pricing

---

## Tech Stack

- **Frontend**: React 19 + Vite + Tailwind CSS 4
- **Blockchain**: Base (Ethereum L2)
- **Smart Contracts**: Solidity (GMX-style architecture)
- **Price Oracles**: Chainlink
- **Wallet**: Web3 + WalletConnect

---

## Project Structure

```
perpx-frontend/
├── client/                 # Frontend application
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions
│   │   └── App.tsx        # Main application component
│   ├── public/            # Static assets
│   └── index.html         # HTML entry point
├── contracts/             # Smart contracts (coming soon)
└── docs/                  # Documentation

```

---

## Development

### Prerequisites

- Node.js 22+
- pnpm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/perpx-official/perpx-frontend.git
cd perpx-frontend

# Install dependencies
cd client
pnpm install
```

### Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
pnpm build
```

---

## Deployment

This project is deployed on Vercel and accessible at:

- **Production**: https://perpx.fi
- **Preview**: https://perpx.vercel.app

---

## Roadmap

### Phase 1: UI/UX & Frontend (Current)
- ✅ Landing page
- ✅ Responsive design
- ✅ Dark theme
- 🔄 Trading interface (in progress)

### Phase 2: Smart Contracts (Q2 2025)
- 🔄 Liquidity pool (Vault)
- 🔄 Position manager
- 🔄 Chainlink integration
- 🔄 Fee management
- 🔄 Liquidation engine

### Phase 3: Testnet Launch (Q2 2025)
- 🔄 Base Sepolia deployment
- 🔄 Internal testing
- 🔄 Security audit
- 🔄 Public beta

### Phase 4: Mainnet Launch (Q3 2025)
- 🔄 Base Mainnet deployment
- 🔄 Initial liquidity provision
- 🔄 Marketing campaign
- 🔄 Community launch

### Phase 5: Expansion (Q4 2025)
- 🔄 Multi-chain support (Arbitrum, Optimism)
- 🔄 Mobile app
- 🔄 Advanced trading features
- 🔄 Governance token

---

## Smart Contract Architecture

PerpX uses an Oracle-based architecture with the following components:

1. **Vault**: Liquidity pool for traders to trade against
2. **Position Manager**: Manages long/short positions
3. **Price Feed**: Chainlink oracle integration
4. **Fee Manager**: Trading fees and LP rewards
5. **Liquidator**: Automated liquidation system

---

## Security

- **Audits**: Security audits by CertiK and OpenZeppelin (planned)
- **Bug Bounty**: Up to $100,000 for critical vulnerabilities (post-launch)
- **Insurance**: Smart contract insurance coverage (planned)

---

## Community

- **Website**: https://perpx.fi
- **X (Twitter)**: https://x.com/perpx_official
- **Discord**: Coming soon
- **Telegram**: Coming soon
- **Email**: admin@perpx.fi

---

## License

This project is licensed under the MIT License.

---

## Disclaimer

PerpX is currently in development. Trading perpetual contracts involves significant risk and may not be suitable for all investors. Please do your own research and trade responsibly.

---

**Built with ❤️ by the PerpX team**
