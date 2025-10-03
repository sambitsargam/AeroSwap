import React, { useState, useEffect, useCallback } from 'react';
import { useAppKit, useAppKitAccount, useAppKitNetwork, useAppKitProvider } from '@reown/appkit/react';
import { ethers } from 'ethers';
import walletConnectService from '../services/walletconnect';
import './WalletConnect.css';

const WalletConnect = ({ onWalletConnected, onWalletDisconnected }) => {
  const { open, close } = useAppKit();
  const { address, isConnected, caipAddress, status } = useAppKitAccount();
  const { chainId, caipNetwork, switchNetwork } = useAppKitNetwork();
  const { walletProvider } = useAppKitProvider('eip155');

  const [balance, setBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [wcService, setWcService] = useState(null);
  const [connectionMethod, setConnectionMethod] = useState('appkit'); // 'appkit' or 'walletconnect'
  const [supportedChains] = useState([
    { id: 1, name: 'Ethereum', symbol: 'ETH' },
    { id: 137, name: 'Polygon', symbol: 'MATIC' },
    { id: 56, name: 'BSC', symbol: 'BNB' },
    { id: 42161, name: 'Arbitrum', symbol: 'ETH' },
    { id: 10, name: 'Optimism', symbol: 'ETH' },
    { id: 43114, name: 'Avalanche', symbol: 'AVAX' },
    { id: 250, name: 'Fantom', symbol: 'FTM' }
  ]);

  // Initialize WalletConnect service
  useEffect(() => {
    const initWalletConnectService = async () => {
      try {
        await walletConnectService.initialize();
        setWcService(walletConnectService);

        // Set up event listeners
        walletConnectService.on('accountsChanged', handleWCAccountsChanged);
        walletConnectService.on('chainChanged', handleWCChainChanged);
        walletConnectService.on('session_created', handleWCSessionCreated);
        walletConnectService.on('disconnected', handleWCDisconnected);
      } catch (error) {
        console.error('Error initializing WalletConnect service:', error);
      }
    };

    initWalletConnectService();

    return () => {
      // Cleanup event listeners
      if (walletConnectService) {
        walletConnectService.off('accountsChanged', handleWCAccountsChanged);
        walletConnectService.off('chainChanged', handleWCChainChanged);
        walletConnectService.off('session_created', handleWCSessionCreated);
        walletConnectService.off('disconnected', handleWCDisconnected);
      }
    };
  }, []);

  // WalletConnect event handlers
  const handleWCAccountsChanged = useCallback((accounts) => {
    console.log('WalletConnect accounts changed:', accounts);
    if (accounts.length > 0) {
      loadBalance(accounts[0]);
    }
  }, []);

  const handleWCChainChanged = useCallback((chainId) => {
    console.log('WalletConnect chain changed:', chainId);
    if (address) {
      loadBalance(address);
    }
  }, [address]);

  const handleWCSessionCreated = useCallback((session) => {
    console.log('WalletConnect session created:', session);
    setConnectionMethod('walletconnect');
  }, []);

  const handleWCDisconnected = useCallback(() => {
    console.log('WalletConnect disconnected');
    if (connectionMethod === 'walletconnect') {
      setBalance('0');
      onWalletDisconnected();
    }
  }, [connectionMethod, onWalletDisconnected]);

  // Handle wallet connection state changes (AppKit)
  useEffect(() => {
    if (isConnected && address && chainId) {
      setConnectionMethod('appkit');
      loadBalance(address);
      onWalletConnected({
        address,
        chainId: parseInt(chainId),
        balance,
        provider: 'appkit'
      });
    } else if (!isConnected && connectionMethod === 'appkit') {
      setBalance('0');
      onWalletDisconnected();
    }
  }, [isConnected, address, chainId, balance, onWalletConnected, onWalletDisconnected, connectionMethod]);

  // Load wallet balance
  const loadBalance = async (walletAddress = address) => {
    try {
      if (!walletAddress) return;

      let provider;
      
      if (walletProvider) {
        // Use AppKit provider
        provider = new ethers.BrowserProvider(walletProvider);
      } else if (wcService && wcService.ethereumProvider) {
        // Use WalletConnect provider
        provider = new ethers.BrowserProvider(wcService.ethereumProvider);
      } else if (window.ethereum) {
        // Fallback to window.ethereum
        provider = new ethers.BrowserProvider(window.ethereum);
      } else {
        throw new Error('No provider available');
      }

      const balance = await provider.getBalance(walletAddress);
      const formattedBalance = ethers.formatEther(balance);
      setBalance(parseFloat(formattedBalance).toFixed(4));
    } catch (error) {
      console.error('Error loading balance:', error);
      setBalance('0');
    }
  };

  // Handle connect with AppKit
  const handleConnectAppKit = async () => {
    try {
      setIsLoading(true);
      await open();
    } catch (error) {
      console.error('Error connecting with AppKit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle connect with WalletConnect
  const handleConnectWalletConnect = async () => {
    try {
      setIsLoading(true);
      if (wcService) {
        const result = await wcService.connectEthereumProvider();
        console.log('Connected with WalletConnect:', result);
        
        if (result.accounts && result.accounts.length > 0) {
          onWalletConnected({
            address: result.accounts[0],
            chainId: result.chainId,
            balance: '0',
            provider: 'walletconnect'
          });
          loadBalance(result.accounts[0]);
        }
      }
    } catch (error) {
      console.error('Error connecting with WalletConnect:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    try {
      if (connectionMethod === 'appkit') {
        // AppKit handles disconnection internally
        close();
      } else if (connectionMethod === 'walletconnect' && wcService) {
        await wcService.disconnect();
      }
      
      setBalance('0');
      setConnectionMethod('appkit');
      onWalletDisconnected();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  // Handle chain switching
  const handleSwitchChain = async (newChainId) => {
    try {
      setIsLoading(true);
      
      if (connectionMethod === 'appkit' && switchNetwork) {
        await switchNetwork(supportedChains.find(chain => chain.id === newChainId));
      } else if (connectionMethod === 'walletconnect' && wcService) {
        await wcService.switchChain(newChainId);
      }
      
      // Reload balance after chain switch
      setTimeout(() => loadBalance(), 1000);
    } catch (error) {
      console.error('Error switching chain:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sign message utility
  const signMessage = async (message) => {
    try {
      if (!address) throw new Error('No wallet connected');
      
      let signature;
      
      if (connectionMethod === 'appkit' && walletProvider) {
        const provider = new ethers.BrowserProvider(walletProvider);
        const signer = await provider.getSigner();
        signature = await signer.signMessage(message);
      } else if (connectionMethod === 'walletconnect' && wcService) {
        signature = await wcService.signMessage(message, address);
      } else {
        throw new Error('No suitable provider for signing');
      }
      
      console.log('Message signed:', signature);
      return signature;
    } catch (error) {
      console.error('Error signing message:', error);
      throw error;
    }
  };

  // Send transaction utility
  const sendTransaction = async (transaction) => {
    try {
      if (!address) throw new Error('No wallet connected');
      
      let txHash;
      
      if (connectionMethod === 'appkit' && walletProvider) {
        const provider = new ethers.BrowserProvider(walletProvider);
        const signer = await provider.getSigner();
        const tx = await signer.sendTransaction(transaction);
        txHash = tx.hash;
      } else if (connectionMethod === 'walletconnect' && wcService) {
        txHash = await wcService.sendTransaction(transaction);
      } else {
        throw new Error('No suitable provider for transactions');
      }
      
      console.log('Transaction sent:', txHash);
      return txHash;
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  };

  // Format address for display
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Get chain info
  const getChainInfo = (chainId) => {
    const chain = supportedChains.find(c => c.id === parseInt(chainId));
    return chain || { name: 'Unknown', symbol: 'ETH' };
  };

  // Get current connection info
  const getCurrentConnection = () => {
    if (isConnected && address) {
      return {
        address,
        chainId: parseInt(chainId),
        chainInfo: getChainInfo(chainId),
        balance,
        method: connectionMethod
      };
    }
    
    if (wcService && wcService.isConnected()) {
      return {
        address: 'Connected via WC',
        chainId: 1,
        chainInfo: getChainInfo(1),
        balance,
        method: connectionMethod
      };
    }
    
    return null;
  };

  const currentConnection = getCurrentConnection();

  if (currentConnection) {
    return (
      <div className="wallet-info">
        <div className="wallet-details">
          <div className="chain-info">
            <span className="chain-name">{currentConnection.chainInfo.name}</span>
            <span className="connection-method">{currentConnection.method}</span>
          </div>
          <span className="balance">{balance} {currentConnection.chainInfo.symbol}</span>
        </div>
        
        <div className="wallet-controls">
          <select 
            className="chain-selector"
            value={currentConnection.chainId}
            onChange={(e) => handleSwitchChain(parseInt(e.target.value))}
            disabled={isLoading}
          >
            {supportedChains.map(chain => (
              <option key={chain.id} value={chain.id}>
                {chain.name}
              </option>
            ))}
          </select>
          
          <button
            className="wallet-button connected"
            onClick={handleDisconnect}
            disabled={isLoading}
          >
            {formatAddress(currentConnection.address)}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-connect-options">
      <button
        className="wallet-button appkit"
        onClick={handleConnectAppKit}
        disabled={isLoading || status === 'connecting'}
      >
        {isLoading || status === 'connecting' ? 'Connecting...' : 'Connect with AppKit'}
      </button>
      
      <button
        className="wallet-button walletconnect"
        onClick={handleConnectWalletConnect}
        disabled={isLoading || !wcService}
      >
        {isLoading ? 'Connecting...' : 'Connect with WalletConnect'}
      </button>
    </div>
  );
};

// Export utilities for use in other components
export { WalletConnect as default };
export const useWalletConnectUtils = () => {
  const walletConnect = React.useRef();
  
  return {
    signMessage: (message) => walletConnect.current?.signMessage(message),
    sendTransaction: (transaction) => walletConnect.current?.sendTransaction(transaction),
    switchChain: (chainId) => walletConnect.current?.handleSwitchChain(chainId)
  };
};