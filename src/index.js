import React from 'react';
import ReactDOM from 'react-dom/client';
import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { mainnet, polygon, bsc } from '@reown/appkit/networks';
import App from './App';

// Get project ID from environment variables
const projectId = process.env.REACT_APP_REOWN_PROJECT_ID || 'your-project-id-here';

// Set up the networks
const networks = [mainnet, polygon, bsc];

// Create the AppKit instance
const appKit = createAppKit({
  adapters: [new EthersAdapter()],
  networks,
  metadata: {
    name: 'AeroSwap',
    description: 'Cross-chain token swaps powered by 1inch Protocol',
    url: 'https://aeroswap.example.com',
    icons: ['https://walletconnect.com/walletconnect-logo.png']
  },
  projectId,
  features: {
    analytics: true,
    email: false,
    socials: false,
    emailShowWallets: false
  },
  themeMode: 'light'
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
