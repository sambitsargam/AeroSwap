import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import SwapInterface from './components/SwapInterface';
import WalletConnect from './components/WalletConnect';
import ChainSelector from './components/ChainSelector';
import walletService from './services/wallet';
import './App.css';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    try {
      if (walletService.isMetaMaskInstalled() && walletService.isConnected()) {
        setIsConnected(true);
        setAccount(walletService.getAccount());
        setChainId(walletService.getChainId());
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWalletConnect = async () => {
    try {
      const result = await walletService.connect();
      setIsConnected(true);
      setAccount(result.account);
      setChainId(result.chainId);
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const handleWalletDisconnect = () => {
    walletService.disconnect();
    setIsConnected(false);
    setAccount(null);
    setChainId(null);
  };

  const handleChainChange = async (newChainId) => {
    try {
      await walletService.switchChain(newChainId);
      setChainId(newChainId);
    } catch (error) {
      console.error('Error switching chain:', error);
    }
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading AeroSwap...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header />
      
      <main className="main-content">
        <div className="container">
          <div className="swap-container">
            <div className="swap-header">
              <h1>Fast Cross-Chain Swaps</h1>
              <p>Powered by 1inch aggregation protocol</p>
            </div>

            {!isConnected ? (
              <WalletConnect onConnect={handleWalletConnect} />
            ) : (
              <>
                <div className="wallet-info">
                  <div className="connected-account">
                    <span className="account-label">Connected:</span>
                    <span className="account-address">
                      {account?.slice(0, 6)}...{account?.slice(-4)}
                    </span>
                    <button 
                      className="disconnect-btn"
                      onClick={handleWalletDisconnect}
                    >
                      Disconnect
                    </button>
                  </div>
                  
                  <ChainSelector 
                    currentChainId={chainId}
                    onChainChange={handleChainChange}
                  />
                </div>

                <SwapInterface 
                  account={account}
                  chainId={chainId}
                />
              </>
            )}
          </div>
        </div>
      </main>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(255, 255, 255, 0.95)',
            color: '#333',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
          },
        }}
      />
    </div>
  );
}

export default App;
