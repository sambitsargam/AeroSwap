/**
 * Comprehensive WalletConnect SDK Service
 * Integrates all WalletConnect packages for AeroSwap
 */

import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { SignClient } from '@walletconnect/sign-client';
import { UniversalProvider } from '@walletconnect/universal-provider';
import { Core } from '@walletconnect/core';
import { formatJsonRpcRequest, formatJsonRpcResult, formatJsonRpcError } from '@walletconnect/utils';
import { getSdkError } from '@walletconnect/utils';
import { ethers } from 'ethers';

class WalletConnectService {
  constructor() {
    this.ethereumProvider = null;
    this.signClient = null;
    this.universalProvider = null;
    this.core = null;
    this.sessions = new Map();
    this.pendingRequests = new Map();
    this.eventListeners = new Map();
    
    // Configuration
    this.projectId = process.env.REACT_APP_REOWN_PROJECT_ID || 'your-project-id-here';
    this.metadata = {
      name: 'AeroSwap',
      description: 'Cross-chain token swaps powered by 1inch Protocol',
      url: typeof window !== 'undefined' ? window.location.origin : 'https://aeroswap.example.com',
      icons: ['https://walletconnect.com/walletconnect-logo.png']
    };
    
    // Supported chains
    this.supportedChains = [
      'eip155:1',    // Ethereum
      'eip155:137',  // Polygon
      'eip155:56',   // BSC
      'eip155:42161', // Arbitrum
      'eip155:10',   // Optimism
      'eip155:43114', // Avalanche
      'eip155:250'   // Fantom
    ];
    
    // Supported methods
    this.supportedMethods = [
      'eth_sendTransaction',
      'eth_signTransaction',
      'eth_sign',
      'personal_sign',
      'eth_signTypedData',
      'eth_signTypedData_v3',
      'eth_signTypedData_v4',
      'wallet_switchEthereumChain',
      'wallet_addEthereumChain',
      'wallet_getPermissions',
      'wallet_requestPermissions'
    ];
    
    // Supported events
    this.supportedEvents = [
      'chainChanged',
      'accountsChanged',
      'message',
      'disconnect',
      'connect'
    ];
  }

  /**
   * Initialize the WalletConnect service
   */
  async initialize() {
    try {
      console.log('Initializing WalletConnect service...');
      
      // Initialize Core
      await this.initializeCore();
      
      // Initialize Sign Client
      await this.initializeSignClient();
      
      // Initialize Ethereum Provider
      await this.initializeEthereumProvider();
      
      // Initialize Universal Provider
      await this.initializeUniversalProvider();
      
      console.log('WalletConnect service initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing WalletConnect service:', error);
      throw error;
    }
  }

  /**
   * Initialize WalletConnect Core
   */
  async initializeCore() {
    try {
      this.core = new Core({
        projectId: this.projectId,
        logger: 'error'
      });
      
      console.log('WalletConnect Core initialized');
    } catch (error) {
      console.error('Error initializing Core:', error);
      throw error;
    }
  }

  /**
   * Initialize Sign Client
   */
  async initializeSignClient() {
    try {
      this.signClient = await SignClient.init({
        projectId: this.projectId,
        metadata: this.metadata,
        core: this.core
      });

      // Set up event listeners
      this.setupSignClientEvents();
      
      console.log('Sign Client initialized');
    } catch (error) {
      console.error('Error initializing Sign Client:', error);
      throw error;
    }
  }

  /**
   * Initialize Ethereum Provider
   */
  async initializeEthereumProvider() {
    try {
      this.ethereumProvider = await EthereumProvider.init({
        projectId: this.projectId,
        chains: [1, 137, 56, 42161, 10, 43114, 250],
        optionalChains: [1, 137, 56, 42161, 10, 43114, 250],
        methods: this.supportedMethods,
        events: this.supportedEvents,
        metadata: this.metadata,
        showQrModal: true,
        qrModalOptions: {
          themeMode: 'light',
          themeVariables: {
            '--wcm-z-index': '1337'
          }
        }
      });

      // Set up event listeners
      this.setupEthereumProviderEvents();
      
      console.log('Ethereum Provider initialized');
    } catch (error) {
      console.error('Error initializing Ethereum Provider:', error);
      throw error;
    }
  }

  /**
   * Initialize Universal Provider
   */
  async initializeUniversalProvider() {
    try {
      this.universalProvider = await UniversalProvider.init({
        projectId: this.projectId,
        metadata: this.metadata,
        client: this.signClient
      });

      console.log('Universal Provider initialized');
    } catch (error) {
      console.error('Error initializing Universal Provider:', error);
      throw error;
    }
  }

  /**
   * Set up Sign Client event listeners
   */
  setupSignClientEvents() {
    if (!this.signClient) return;

    // Session proposal
    this.signClient.on('session_proposal', async (proposal) => {
      console.log('Session proposal received:', proposal);
      this.emit('session_proposal', proposal);
    });

    // Session request
    this.signClient.on('session_request', async (requestEvent) => {
      console.log('Session request received:', requestEvent);
      this.emit('session_request', requestEvent);
    });

    // Session delete
    this.signClient.on('session_delete', (deleteEvent) => {
      console.log('Session deleted:', deleteEvent);
      this.sessions.delete(deleteEvent.topic);
      this.emit('session_delete', deleteEvent);
    });

    // Session expire
    this.signClient.on('session_expire', (expireEvent) => {
      console.log('Session expired:', expireEvent);
      this.sessions.delete(expireEvent.topic);
      this.emit('session_expire', expireEvent);
    });

    // Session update
    this.signClient.on('session_update', (updateEvent) => {
      console.log('Session updated:', updateEvent);
      this.emit('session_update', updateEvent);
    });
  }

  /**
   * Set up Ethereum Provider event listeners
   */
  setupEthereumProviderEvents() {
    if (!this.ethereumProvider) return;

    this.ethereumProvider.on('accountsChanged', (accounts) => {
      console.log('Accounts changed:', accounts);
      this.emit('accountsChanged', accounts);
    });

    this.ethereumProvider.on('chainChanged', (chainId) => {
      console.log('Chain changed:', chainId);
      this.emit('chainChanged', chainId);
    });

    this.ethereumProvider.on('connect', (connectInfo) => {
      console.log('Provider connected:', connectInfo);
      this.emit('connect', connectInfo);
    });

    this.ethereumProvider.on('disconnect', (error) => {
      console.log('Provider disconnected:', error);
      this.emit('disconnect', error);
    });

    this.ethereumProvider.on('session_delete', (deleteInfo) => {
      console.log('Session deleted via provider:', deleteInfo);
      this.emit('session_delete', deleteInfo);
    });
  }

  /**
   * Connect wallet using Ethereum Provider
   */
  async connectEthereumProvider() {
    try {
      if (!this.ethereumProvider) {
        await this.initializeEthereumProvider();
      }

      const accounts = await this.ethereumProvider.request({
        method: 'eth_requestAccounts'
      });

      const chainId = await this.ethereumProvider.request({
        method: 'eth_chainId'
      });

      console.log('Connected to Ethereum Provider:', { accounts, chainId });
      
      return {
        accounts,
        chainId: parseInt(chainId, 16)
      };
    } catch (error) {
      console.error('Error connecting Ethereum Provider:', error);
      throw error;
    }
  }

  /**
   * Create a new session using Sign Client
   */
  async createSession(requiredNamespaces) {
    try {
      if (!this.signClient) {
        await this.initializeSignClient();
      }

      const { uri, approval } = await this.signClient.connect({
        requiredNamespaces: requiredNamespaces || this.getDefaultNamespaces()
      });

      console.log('Session URI generated:', uri);
      
      // Show QR code or handle URI
      this.emit('session_uri', uri);

      // Wait for approval
      const session = await approval();
      this.sessions.set(session.topic, session);
      
      console.log('Session created:', session);
      this.emit('session_created', session);
      
      return session;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Send a request via Sign Client
   */
  async sendRequest(topic, chainId, request) {
    try {
      if (!this.signClient) {
        throw new Error('Sign Client not initialized');
      }

      const result = await this.signClient.request({
        topic,
        chainId,
        request
      });

      console.log('Request result:', result);
      return result;
    } catch (error) {
      console.error('Error sending request:', error);
      throw error;
    }
  }

  /**
   * Sign a message
   */
  async signMessage(message, address, provider = 'ethereum') {
    try {
      let result;
      
      if (provider === 'ethereum' && this.ethereumProvider) {
        result = await this.ethereumProvider.request({
          method: 'personal_sign',
          params: [message, address]
        });
      } else if (this.signClient && this.sessions.size > 0) {
        const session = Array.from(this.sessions.values())[0];
        const request = formatJsonRpcRequest('personal_sign', [message, address]);
        result = await this.sendRequest(session.topic, 'eip155:1', request);
      } else {
        throw new Error('No suitable provider available for signing');
      }

      console.log('Message signed:', result);
      return result;
    } catch (error) {
      console.error('Error signing message:', error);
      throw error;
    }
  }

  /**
   * Sign typed data
   */
  async signTypedData(typedData, address, provider = 'ethereum') {
    try {
      let result;
      
      if (provider === 'ethereum' && this.ethereumProvider) {
        result = await this.ethereumProvider.request({
          method: 'eth_signTypedData_v4',
          params: [address, JSON.stringify(typedData)]
        });
      } else if (this.signClient && this.sessions.size > 0) {
        const session = Array.from(this.sessions.values())[0];
        const request = formatJsonRpcRequest('eth_signTypedData_v4', [address, JSON.stringify(typedData)]);
        result = await this.sendRequest(session.topic, 'eip155:1', request);
      } else {
        throw new Error('No suitable provider available for signing');
      }

      console.log('Typed data signed:', result);
      return result;
    } catch (error) {
      console.error('Error signing typed data:', error);
      throw error;
    }
  }

  /**
   * Send a transaction
   */
  async sendTransaction(transaction, provider = 'ethereum') {
    try {
      let result;
      
      if (provider === 'ethereum' && this.ethereumProvider) {
        result = await this.ethereumProvider.request({
          method: 'eth_sendTransaction',
          params: [transaction]
        });
      } else if (this.signClient && this.sessions.size > 0) {
        const session = Array.from(this.sessions.values())[0];
        const request = formatJsonRpcRequest('eth_sendTransaction', [transaction]);
        result = await this.sendRequest(session.topic, 'eip155:1', request);
      } else {
        throw new Error('No suitable provider available for transactions');
      }

      console.log('Transaction sent:', result);
      return result;
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  }

  /**
   * Switch chain
   */
  async switchChain(chainId, provider = 'ethereum') {
    try {
      const hexChainId = `0x${chainId.toString(16)}`;
      let result;
      
      if (provider === 'ethereum' && this.ethereumProvider) {
        result = await this.ethereumProvider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: hexChainId }]
        });
      } else if (this.signClient && this.sessions.size > 0) {
        const session = Array.from(this.sessions.values())[0];
        const request = formatJsonRpcRequest('wallet_switchEthereumChain', [{ chainId: hexChainId }]);
        result = await this.sendRequest(session.topic, 'eip155:1', request);
      } else {
        throw new Error('No suitable provider available for chain switching');
      }

      console.log('Chain switched:', result);
      return result;
    } catch (error) {
      console.error('Error switching chain:', error);
      throw error;
    }
  }

  /**
   * Disconnect all sessions
   */
  async disconnect() {
    try {
      // Disconnect Ethereum Provider
      if (this.ethereumProvider) {
        await this.ethereumProvider.disconnect();
      }

      // Disconnect all Sign Client sessions
      if (this.signClient) {
        for (const [topic, session] of this.sessions) {
          await this.signClient.disconnect({
            topic,
            reason: getSdkError('USER_DISCONNECTED')
          });
        }
      }

      // Clear sessions
      this.sessions.clear();
      this.pendingRequests.clear();

      console.log('All sessions disconnected');
      this.emit('disconnected');
    } catch (error) {
      console.error('Error disconnecting:', error);
      throw error;
    }
  }

  /**
   * Get default namespaces for EIP-155 (Ethereum)
   */
  getDefaultNamespaces() {
    return {
      eip155: {
        chains: this.supportedChains,
        methods: this.supportedMethods,
        events: this.supportedEvents
      }
    };
  }

  /**
   * Get active sessions
   */
  getActiveSessions() {
    return Array.from(this.sessions.values());
  }

  /**
   * Get session by topic
   */
  getSession(topic) {
    return this.sessions.get(topic);
  }

  /**
   * Event emitter functionality
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Utility: Check if provider is connected
   */
  isConnected(provider = 'ethereum') {
    if (provider === 'ethereum') {
      return this.ethereumProvider?.connected || false;
    }
    return this.sessions.size > 0;
  }

  /**
   * Utility: Get current account
   */
  async getCurrentAccount(provider = 'ethereum') {
    try {
      if (provider === 'ethereum' && this.ethereumProvider) {
        const accounts = await this.ethereumProvider.request({
          method: 'eth_accounts'
        });
        return accounts[0] || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting current account:', error);
      return null;
    }
  }

  /**
   * Utility: Get current chain ID
   */
  async getCurrentChainId(provider = 'ethereum') {
    try {
      if (provider === 'ethereum' && this.ethereumProvider) {
        const chainId = await this.ethereumProvider.request({
          method: 'eth_chainId'
        });
        return parseInt(chainId, 16);
      }
      return null;
    } catch (error) {
      console.error('Error getting current chain ID:', error);
      return null;
    }
  }

  /**
   * Utility: Format error response
   */
  formatError(error, id = 1) {
    return formatJsonRpcError(id, error.message || 'Unknown error', error);
  }

  /**
   * Utility: Format success response
   */
  formatResult(result, id = 1) {
    return formatJsonRpcResult(id, result);
  }
}

// Create and export singleton instance
const walletConnectService = new WalletConnectService();

export default walletConnectService;
export { WalletConnectService };