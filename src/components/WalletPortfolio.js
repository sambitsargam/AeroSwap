import React, { useState, useEffect } from 'react';
import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { SignClient } from '@walletconnect/sign-client';
import { ethers } from 'ethers';
import './WalletPortfolio.css';

const WalletPortfolio = ({ walletAddress, isConnected }) => {
  const [portfolio, setPortfolio] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedChain, setSelectedChain] = useState(1);
  const [totalValue, setTotalValue] = useState(0);
  const [showSignModal, setShowSignModal] = useState(false);
  const [signMessage, setSignMessage] = useState('');
  const [signResult, setSignResult] = useState('');
  const [signing, setSigning] = useState(false);

  // Supported chains for portfolio
  const chains = {
    1: { name: 'Ethereum', rpc: 'https://eth.llamarpc.com', symbol: 'ETH', color: '#627EEA' },
    137: { name: 'Polygon', rpc: 'https://polygon.llamarpc.com', symbol: 'MATIC', color: '#8247E5' },
    56: { name: 'BSC', rpc: 'https://bsc.llamarpc.com', symbol: 'BNB', color: '#F3BA2F' },
    42161: { name: 'Arbitrum', rpc: 'https://arb1.arbitrum.io/rpc', symbol: 'ETH', color: '#28A0F0' },
    10: { name: 'Optimism', rpc: 'https://mainnet.optimism.io', symbol: 'ETH', color: '#FF0420' }
  };

  // Popular tokens to check balances for
  const popularTokens = {
    1: [ // Ethereum
      { symbol: 'ETH', address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', decimals: 18 },
      { symbol: 'USDC', address: '0xA0b86a33E6441b8c4a0ffe1d7a6c78b4e123d25e', decimals: 6 },
      { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
      { symbol: 'WBTC', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8 },
      { symbol: 'UNI', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18 }
    ],
    137: [ // Polygon
      { symbol: 'MATIC', address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', decimals: 18 },
      { symbol: 'USDC', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6 },
      { symbol: 'USDT', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
      { symbol: 'WBTC', address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', decimals: 8 }
    ],
    56: [ // BSC
      { symbol: 'BNB', address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', decimals: 18 },
      { symbol: 'USDC', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18 },
      { symbol: 'USDT', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
      { symbol: 'CAKE', address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', decimals: 18 }
    ]
  };

  // ERC20 ABI for balance checking
  const erc20Abi = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)"
  ];

  // Load portfolio data
  const loadPortfolio = async () => {
    if (!walletAddress || !isConnected) return;

    setLoading(true);
    const newPortfolio = {};
    let total = 0;

    try {
      // Check balances on each chain
      for (const [chainId, chain] of Object.entries(chains)) {
        const provider = new ethers.JsonRpcProvider(chain.rpc);
        newPortfolio[chainId] = { chain: chain, tokens: [] };

        // Get native token balance
        const nativeBalance = await provider.getBalance(walletAddress);
        const nativeFormatted = ethers.formatEther(nativeBalance);
        const nativeValue = parseFloat(nativeFormatted) * getTokenPrice(chain.symbol);

        newPortfolio[chainId].tokens.push({
          symbol: chain.symbol,
          balance: parseFloat(nativeFormatted).toFixed(4),
          value: nativeValue.toFixed(2),
          address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
        });

        total += nativeValue;

        // Check popular token balances
        if (popularTokens[chainId]) {
          for (const token of popularTokens[chainId].slice(1)) { // Skip native token
            try {
              const tokenContract = new ethers.Contract(token.address, erc20Abi, provider);
              const balance = await tokenContract.balanceOf(walletAddress);
              const formattedBalance = ethers.formatUnits(balance, token.decimals);

              if (parseFloat(formattedBalance) > 0.0001) { // Only show if balance > 0.0001
                const value = parseFloat(formattedBalance) * getTokenPrice(token.symbol);
                newPortfolio[chainId].tokens.push({
                  symbol: token.symbol,
                  balance: parseFloat(formattedBalance).toFixed(4),
                  value: value.toFixed(2),
                  address: token.address
                });
                total += value;
              }
            } catch (error) {
              // Skip tokens that fail
              console.log(`Failed to check ${token.symbol} on ${chain.name}:`, error.message);
            }
          }
        }
      }

      setPortfolio(newPortfolio);
      setTotalValue(total);

    } catch (error) {
      console.error('Error loading portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock price function (in real app, use price API)
  const getTokenPrice = (symbol) => {
    const prices = {
      'ETH': 3500,
      'MATIC': 0.8,
      'BNB': 400,
      'USDC': 1,
      'USDT': 1,
      'WBTC': 65000,
      'UNI': 8,
      'CAKE': 2.5
    };
    return prices[symbol] || 0;
  };

  // Sign message using WalletConnect Sign Client
  const signMessageWithWallet = async () => {
    if (!signMessage.trim()) return;

    setSigning(true);
    setSignResult('');

    try {
      // For demo purposes, we'll use the browser's ethereum provider
      // In a real app, you'd use the WalletConnect Sign Client properly
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        const signature = await signer.signMessage(signMessage);
        setSignResult(`✅ Message signed successfully!\n\nSignature: ${signature}`);
      } else {
        throw new Error('No Ethereum provider found');
      }
    } catch (error) {
      setSignResult(`❌ Signing failed: ${error.message}`);
    } finally {
      setSigning(false);
    }
  };

  // Auto-load portfolio when wallet connects
  useEffect(() => {
    if (isConnected && walletAddress) {
      loadPortfolio();
    }
  }, [isConnected, walletAddress]);

  // Calculate chain total
  const getChainTotal = (chainId) => {
    if (!portfolio[chainId]) return 0;
    return portfolio[chainId].tokens.reduce((sum, token) => sum + parseFloat(token.value), 0);
  };

  if (!isConnected) {
    return (
      <div className="portfolio-widget">
        <div className="portfolio-placeholder">
          <h3>📊 Multi-Chain Portfolio</h3>
          <p>Connect your wallet to view your portfolio across multiple blockchains</p>
        </div>
      </div>
    );
  }

  return (
    <div className="portfolio-widget">
      <div className="portfolio-header">
        <h3>📊 Multi-Chain Portfolio</h3>
        <div className="portfolio-controls">
          <button
            className="sign-button"
            onClick={() => setShowSignModal(true)}
            disabled={!isConnected}
          >
            ✍️ Sign
          </button>
          <button
            className="refresh-button"
            onClick={refreshPortfolio}
            disabled={loading}
          >
            {loading ? '🔄' : '↻'}
          </button>
        </div>
      </div>

      <div className="portfolio-summary">
        <div className="total-value">
          <span className="total-label">Total Value</span>
          <span className="total-amount">${totalValue.toFixed(2)}</span>
        </div>
        <div className="chain-selector">
          {Object.entries(chains).map(([chainId, chain]) => (
            <button
              key={chainId}
              className={`chain-tab ${selectedChain == chainId ? 'active' : ''}`}
              onClick={() => setSelectedChain(parseInt(chainId))}
              style={{ borderColor: chain.color }}
            >
              <span className="chain-name">{chain.name}</span>
              <span className="chain-value">${getChainTotal(chainId).toFixed(2)}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading portfolio data...</p>
        </div>
      ) : (
        <div className="portfolio-details">
          {portfolio[selectedChain] && portfolio[selectedChain].tokens.length > 0 ? (
            <div className="token-list">
              {portfolio[selectedChain].tokens.map((token, index) => (
                <div key={index} className="token-item">
                  <div className="token-info">
                    <span className="token-symbol">{token.symbol}</span>
                    <span className="token-balance">{token.balance}</span>
                  </div>
                  <div className="token-value">
                    ${token.value}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-chain">
              <p>No tokens found on {chains[selectedChain].name}</p>
              <small>Try refreshing or check if you have tokens on this chain</small>
            </div>
          )}
        </div>
      )}

      <div className="portfolio-footer">
        <small>💡 Portfolio data refreshes automatically. Prices are approximate.</small>
      </div>

      {/* Sign Message Modal */}
      {showSignModal && (
        <div className="modal-overlay" onClick={() => setShowSignModal(false)}>
          <div className="sign-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✍️ Sign Message</h3>
              <button 
                className="close-button"
                onClick={() => setShowSignModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <textarea
                className="message-input"
                placeholder="Enter message to sign..."
                value={signMessage}
                onChange={(e) => setSignMessage(e.target.value)}
                rows={4}
              />
              <button
                className="sign-submit-button"
                onClick={signMessageWithWallet}
                disabled={!signMessage.trim() || signing}
              >
                {signing ? '🔄 Signing...' : '✍️ Sign Message'}
              </button>
              {signResult && (
                <div className="sign-result">
                  <pre>{signResult}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletPortfolio;