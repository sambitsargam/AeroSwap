import React from 'react';
import ReactDOM from 'react-dom/client';
import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { mainnet, polygon, bsc, arbitrum, optimism, avalanche, fantom } from '@reown/appkit/networks';
import App from './App';

// Get project ID from environment variables
const projectId = process.env.REACT_APP_REOWN_PROJECT_ID || 'your-project-id-here';

// Enhanced network configuration
const networks = [
  mainnet,
  polygon,
  bsc,
  arbitrum,
  optimism,
  avalanche,
  fantom
];

// Enhanced metadata configuration
const metadata = {
  name: 'AeroSwap',
  description: 'Cross-chain token swaps powered by 1inch Protocol with comprehensive WalletConnect integration',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://aeroswap.example.com',
  icons: [
    'https://walletconnect.com/walletconnect-logo.png',
    typeof window !== 'undefined' ? `${window.location.origin}/favicon.ico` : 'https://aeroswap.example.com/favicon.ico'
  ]
};

// Enhanced features configuration
const features = {
  analytics: true,
  email: false,
  socials: false,
  emailShowWallets: false,
  onramp: true,
  swaps: true,
  history: true,
  allWallets: true
};

// Enhanced theme configuration
const themeVariables = {
  '--w3m-font-family': 'Arial, sans-serif',
  '--w3m-border-radius-master': '8px',
  '--w3m-border-radius-xs': '4px',
  '--w3m-border-radius-s': '6px',
  '--w3m-border-radius-m': '8px',
  '--w3m-border-radius-l': '12px',
  '--w3m-border-radius-xl': '16px',
  '--w3m-color-fg-1': '#141414',
  '--w3m-color-fg-2': '#949494',
  '--w3m-color-fg-3': '#B4B4B4',
  '--w3m-color-bg-1': '#FFFFFF',
  '--w3m-color-bg-2': '#F5F5F5',
  '--w3m-color-bg-3': '#EBEBEB'
};

try {
  // Create the AppKit instance with enhanced configuration
  const appKit = createAppKit({
    adapters: [new EthersAdapter()],
    networks,
    metadata,
    projectId,
    features,
    themeMode: 'light',
    themeVariables,
    enableOnramp: true,
    enableSwaps: true,
    tokens: {
      1: {
        address: '0xA0b86a33E6441c1e9C653f25a5c6D2b7a2e4e2E0',
        image: 'token_image_url'
      }
    },
    customWallets: [
      {
        id: 'myCustomWallet',
        name: 'My Custom Wallet',
        homepage: 'https://mycustomwallet.com',
        image_id: 'custom-wallet-icon',
        mobile_link: 'mycustomwallet://',
        desktop_link: 'https://mycustomwallet.com/download',
        webapp_link: 'https://app.mycustomwallet.com'
      }
    ],
    includeWalletIds: [
      'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
      '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
      '225affb176778569276e484e1b92637ad061b01e13a048b35a9d280c3b58970f', // Safe
      '19177a98252e07ddfc9af2083ba8e07ef627cb6103467ffebb3f8f4205fd7927', // Ledger Live
      'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa'  // Coinbase Wallet
    ],
    enableAnalytics: true,
    enableEmail: false,
    allWallets: 'SHOW'
  });

  console.log('AppKit initialized successfully:', appKit);
} catch (error) {
  console.error('Error initializing AppKit:', error);
  
  // Fallback initialization with minimal config
  const appKit = createAppKit({
    adapters: [new EthersAdapter()],
    networks: [mainnet, polygon, bsc],
    metadata: {
      name: 'AeroSwap',
      description: 'Cross-chain token swaps powered by 1inch Protocol',
      url: 'https://aeroswap.example.com',
      icons: ['https://walletconnect.com/walletconnect-logo.png']
    },
    projectId,
    features: {
      analytics: true
    },
    themeMode: 'light'
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
