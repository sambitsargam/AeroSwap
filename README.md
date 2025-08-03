# AeroSwap - Cross-chain Token Swaps Powered by 1inch

![AeroSwap](https://img.shields.io/badge/AeroSwap-DeFi-blue)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![1inch](https://img.shields.io/badge/1inch-Protocol-orange)
![License](https://img.shields.io/badge/License-MIT-green)

AeroSwap is a decentralized application (dApp) that enables **fast, secure, and cost-efficient token swaps** across multiple blockchains using the [1inch Aggregation Protocol](https://docs.1inch.io/docs/aggregation-protocol/overview/). Experience the future of DeFi with seamless cross-chain swaps.

## ✨ Features

- 🚀 **Lightning Fast Swaps** - Powered by 1inch's advanced routing algorithms
- 🔗 **Multi-Chain Support** - Ethereum, Polygon, and BNB Chain
- 🛡️ **Secure & Trustless** - Direct smart contract interactions
- 💰 **Best Prices** - Access to 100+ DEX aggregated liquidity
- 🎨 **Intuitive UI** - Clean, modern interface with real-time quotes
- ⚡ **Gas Optimization** - Minimal transaction costs
- 🔄 **Slippage Control** - Customizable slippage tolerance
- 📱 **Mobile Responsive** - Works seamlessly on all devices

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [MetaMask](https://metamask.io/) browser extension
- ETH, MATIC, or BNB for gas fees

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sambitsargam/AeroSwap.git
   cd AeroSwap
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # The project comes pre-configured with a 1inch API key
   # No additional setup required for development
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

### Additional Setup

- Ensure you have **MetaMask** installed in your browser
- Make sure you have some ETH, MATIC, or BNB for gas fees
- Switch to a supported network (Ethereum, Polygon, or BNB Chain)

## 🔧 Configuration

### 1inch API Setup

The project is pre-configured with a 1inch API key for optimal performance. The API key is stored in the `.env` file:

```bash
REACT_APP_ONEINCH_API_KEY=PQhD96FwMMeUvWzIXVK8Pd9R1OkAv93Y
```

For production deployment or to use your own API key:

1. Get your API key from [1inch Developer Portal](https://portal.1inch.dev/)
2. Update the `.env` file:
   ```bash
   REACT_APP_ONEINCH_API_KEY=your-api-key-here
   ```
3. Restart the development server

**Benefits of using an API key:**
- Higher rate limits
- Priority access to 1inch services
- Better reliability for production use

### Supported Networks

| Network | Chain ID | Status |
|---------|----------|--------|
| Ethereum | 1 | ✅ Supported |
| Polygon | 137 | ✅ Supported |
| BNB Chain | 56 | ✅ Supported |

## 🏗️ Architecture

### Project Structure

```
src/
├── App.js              # Main React component
├── App.css             # Styling and themes
├── index.js            # React DOM entry point
└── services/
    ├── 1inch.js        # 1inch Protocol integration
    └── wallet.js       # Wallet connection & management
```

### Core Services

#### 1inch Service (`src/services/1inch.js`)
- Token list fetching
- Price quotes and swap data
- Smart contract interactions
- Gas estimation
- Error handling

#### Wallet Service (`src/services/wallet.js`)
- MetaMask integration
- Multi-chain support
- Account management
- Network switching
- Balance tracking

## 🔗 How It Works

### 1. **Connect Wallet**
- Connect your MetaMask wallet
- Automatically detects supported networks
- Displays your token balances

### 2. **Select Tokens**
- Choose source and destination tokens
- Browse from 1000+ supported tokens
- View real-time exchange rates

### 3. **Get Quote**
- Enter swap amount
- Receive instant price quotes
- See gas estimates and slippage

### 4. **Execute Swap**
- Approve token allowance (if needed)
- Confirm transaction in MetaMask
- Track transaction progress

## 🛠️ Technical Implementation

### Smart Contract Integration

AeroSwap integrates directly with 1inch smart contracts:

- **Router Contracts**: `0x111111125421ca6dc452d289314280a0f8842a65`
- **API Endpoints**: Official 1inch v6.0 API
- **Security**: Direct contract calls, no intermediaries

### Key Features Implementation

#### Real-time Quotes
```javascript
const quote = await OneInchService.getQuote({
  chainId: 1,
  src: fromTokenAddress,
  dst: toTokenAddress,
  amount: amountInWei
});
```

#### Token Approval
```javascript
const approveTx = await OneInchService.approveToken(
  tokenAddress,
  amount,
  chainId,
  signer
);
```

#### Swap Execution
```javascript
const swapData = await OneInchService.getSwap(params);
const txResponse = await OneInchService.executeSwap(swapData, signer);
```

## 🔒 Security

- ✅ Direct 1inch smart contract integration
- ✅ No private key storage
- ✅ Client-side transaction signing
- ✅ Open source codebase
- ✅ Minimal external dependencies

## 🎨 UI/UX Design

AeroSwap features a modern, gradient-based design:

- **Color Scheme**: Purple to blue gradients with accent colors
- **Typography**: Inter font family for optimal readability
- **Responsive**: Mobile-first design approach
- **Animations**: Smooth transitions and hover effects
- **Loading States**: Real-time feedback for all operations

## 📊 Performance

- ⚡ **Fast Loading**: Optimized bundle size
- 🔄 **Real-time Updates**: Live price feeds
- 📱 **Mobile Optimized**: Works on all devices
- 🌐 **Cross-browser**: Compatible with modern browsers

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow React best practices
- Write clean, commented code
- Test on multiple chains
- Ensure mobile responsiveness

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [1inch Protocol](https://1inch.io/) for providing the aggregation infrastructure
- [React](https://reactjs.org/) for the frontend framework
- [Ethers.js](https://ethers.org/) for Ethereum interactions
- [MetaMask](https://metamask.io/) for wallet connectivity

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/sambitsargam/AeroSwap/issues)
- **Documentation**: [1inch API Docs](https://docs.1inch.io/)
- **Community**: Join our Discord server

## 🚀 Roadmap

- [ ] Additional chain support (Arbitrum, Optimism)
- [ ] Advanced trading features (limit orders, DCA)
- [ ] Portfolio tracking
- [ ] Multi-language support
- [ ] Mobile app (React Native)

---

**Made with ❤️ for the DeFi community**

*Disclaimer: This is experimental software. Use at your own risk. Always verify transactions before confirming.* 
