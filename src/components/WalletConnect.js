import React, { useState, useEffect } from 'react';
import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { ethers } from 'ethers';
import './WalletConnect.css';

const WalletConnect = ({ onWalletConnected, onWalletDisconnected }) => {
  const { open } = useAppKit();
  const { address, isConnected, caipAddress, status } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();

  const [balance, setBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);

  // Handle wallet connection state changes
  useEffect(() => {
    if (isConnected && address && chainId) {
      // Get balance when connected
      loadBalance();
      // Notify parent component
      onWalletConnected({
        address,
        chainId: parseInt(chainId),
        balance
      });
    } else if (!isConnected) {
      setBalance('0');
      onWalletDisconnected();
    }
  }, [isConnected, address, chainId, onWalletConnected, onWalletDisconnected]);

  // Load wallet balance
  const loadBalance = async () => {
    try {
      if (window.ethereum && address) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const balance = await provider.getBalance(address);
        const formattedBalance = ethers.formatEther(balance);
        setBalance(parseFloat(formattedBalance).toFixed(4));
      }
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  // Handle connect button click
  const handleConnect = async () => {
    try {
      setIsLoading(true);
      await open();
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    try {
      // AppKit handles disconnection internally
      onWalletDisconnected();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  // Format address for display
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Get chain name
  const getChainName = (chainId) => {
    const chains = {
      1: 'Ethereum',
      137: 'Polygon',
      56: 'BSC'
    };
    return chains[chainId] || 'Unknown';
  };

  if (isConnected && address) {
    return (
      <div className="wallet-info">
        <div className="wallet-details">
          <span className="chain-name">{getChainName(parseInt(chainId))}</span>
          <span className="balance">{balance} ETH</span>
        </div>
        <button
          className="wallet-button connected"
          onClick={handleDisconnect}
          disabled={isLoading}
        >
          {formatAddress(address)}
        </button>
      </div>
    );
  }

  return (
    <button
      className="wallet-button"
      onClick={handleConnect}
      disabled={isLoading || status === 'connecting'}
    >
      {isLoading || status === 'connecting' ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
};

export default WalletConnect;