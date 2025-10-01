// WalletConnect SDKs Usage Examples
// This file demonstrates how to use all available WalletConnect SDKs

import { EthereumProvider } from '@walletconnect/ethereum-provider';
import Client from '@walletconnect/client';
import { SignClient } from '@walletconnect/sign-client';
import { formatJsonRpcRequest } from '@walletconnect/utils';

// Note: @walletconnect/modal is deprecated, use @reown/appkit instead
// @reown/appkit is already configured in index.js

/**
 * Example: Using @walletconnect/ethereum-provider
 * This is the modern Ethereum provider for WalletConnect v2
 */
export const createEthereumProvider = async (projectId) => {
  try {
    const provider = await EthereumProvider.init({
      projectId,
      chains: [1, 137, 56], // Ethereum, Polygon, BSC
      optionalChains: [42161, 10], // Arbitrum, Optimism
      showQrModal: true,
      qrModalOptions: {
        themeMode: 'light',
        themeVariables: {
          '--wcm-z-index': '1337'
        }
      },
      methods: [
        'eth_sendTransaction',
        'eth_signTransaction',
        'eth_sign',
        'personal_sign',
        'eth_signTypedData'
      ],
      events: ['chainChanged', 'accountsChanged']
    });

    return provider;
  } catch (error) {
    console.error('Error creating Ethereum provider:', error);
    throw error;
  }
};

/**
 * Example: Using @walletconnect/client
 * Legacy client for WalletConnect v1 (consider upgrading to v2)
 */
export const createWalletConnectClient = async () => {
  try {
    const client = await Client.init({
      controller: true,
      relayUrl: 'wss://relay.walletconnect.com',
      metadata: {
        name: 'AeroSwap',
        description: 'Cross-chain token swaps',
        url: 'https://aeroswap.example.com',
        icons: ['https://walletconnect.com/walletconnect-logo.png']
      }
    });

    return client;
  } catch (error) {
    console.error('Error creating WalletConnect client:', error);
    throw error;
  }
};

/**
 * Example: Using @walletconnect/sign-client
 * Modern Sign Client for WalletConnect v2 protocol
 */
export const createSignClient = async (projectId) => {
  try {
    const client = await SignClient.init({
      projectId,
      metadata: {
        name: 'AeroSwap',
        description: 'Cross-chain token swaps powered by 1inch Protocol',
        url: 'https://aeroswap.example.com',
        icons: ['https://walletconnect.com/walletconnect-logo.png']
      }
    });

    return client;
  } catch (error) {
    console.error('Error creating Sign Client:', error);
    throw error;
  }
};

/**
 * Example: Using @walletconnect/utils
 * Utility functions for formatting requests and handling data
 */
export const createFormattedRequest = (method, params) => {
  return formatJsonRpcRequest(method, params, 1);
};

/**
 * Example: Complete flow using Sign Client
 */
export const connectWithSignClient = async (signClient, requiredNamespaces) => {
  try {
    const { uri, approval } = await signClient.connect({
      requiredNamespaces
    });

    // Display QR code with uri
    console.log('Connection URI:', uri);

    // Wait for approval
    const session = await approval();
    console.log('Session established:', session);

    return session;
  } catch (error) {
    console.error('Error connecting with Sign Client:', error);
    throw error;
  }
};

/**
 * Example: Send transaction using Ethereum Provider
 */
export const sendTransactionWithProvider = async (provider, transaction) => {
  try {
    const result = await provider.request({
      method: 'eth_sendTransaction',
      params: [transaction]
    });

    return result;
  } catch (error) {
    console.error('Error sending transaction:', error);
    throw error;
  }
};

/**
 * Example: Sign message using Ethereum Provider
 */
export const signMessageWithProvider = async (provider, message, address) => {
  try {
    const result = await provider.request({
      method: 'personal_sign',
      params: [message, address]
    });

    return result;
  } catch (error) {
    console.error('Error signing message:', error);
    throw error;
  }
};

/**
 * Example: Sign typed data using Ethereum Provider
 */
export const signTypedDataWithProvider = async (provider, typedData, address) => {
  try {
    const result = await provider.request({
      method: 'eth_signTypedData_v4',
      params: [address, JSON.stringify(typedData)]
    });

    return result;
  } catch (error) {
    console.error('Error signing typed data:', error);
    throw error;
  }
};

/**
 * Example: Using legacy @walletconnect/web3-provider
 * Note: This is for WalletConnect v1, consider upgrading
 */
export const createLegacyWeb3Provider = async () => {
  // This would require additional setup for v1
  // Implementation depends on specific use case
  console.log('Legacy Web3 Provider - consider upgrading to v2');
};

/**
 * Utility: Get required namespaces for EIP-155 (Ethereum)
 */
export const getEthereumNamespaces = (chains, methods, events) => {
  return {
    eip155: {
      chains,
      methods,
      events
    }
  };
};

/**
 * Utility: Get default chains, methods, and events
 */
export const getDefaultConfig = () => {
  return {
    chains: ['eip155:1', 'eip155:137', 'eip155:56'], // ETH, Polygon, BSC
    methods: [
      'eth_sendTransaction',
      'eth_signTransaction',
      'eth_sign',
      'personal_sign',
      'eth_signTypedData',
      'eth_signTypedData_v4'
    ],
    events: ['chainChanged', 'accountsChanged']
  };
};

export default {
  createEthereumProvider,
  createWalletConnectClient,
  createSignClient,
  createFormattedRequest,
  connectWithSignClient,
  sendTransactionWithProvider,
  signMessageWithProvider,
  signTypedDataWithProvider,
  createLegacyWeb3Provider,
  getEthereumNamespaces,
  getDefaultConfig
};