import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import walletConnectService from '../services/walletconnect';
import './WalletAnalytics.css';

const WalletAnalytics = ({ walletAddress, isConnected, chainId }) => {
  const [analytics, setAnalytics] = useState({
    transactionCount: 0,
    totalVolume: 0,
    gasUsed: 0,
    portfolioValue: 0,
    connectedDapps: [],
    securityScore: 0,
    recentTransactions: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [showDetails, setShowDetails] = useState(false);

  // Load analytics data
  const loadAnalytics = useCallback(async () => {
    if (!isConnected || !walletAddress) return;

    try {
      setIsLoading(true);

      // Get transaction history using WalletConnect
      const txHistory = await fetchTransactionHistory(walletAddress, chainId, selectedTimeframe);

      // Calculate portfolio value
      const portfolioValue = await calculatePortfolioValue(walletAddress, chainId);

      // Get connected dApps
      const connectedDapps = await getConnectedDapps();

      // Calculate security score
      const securityScore = await calculateSecurityScore(walletAddress, txHistory);

      // Calculate gas usage
      const gasStats = calculateGasStatistics(txHistory);

      setAnalytics({
        transactionCount: txHistory.length,
        totalVolume: calculateTotalVolume(txHistory),
        gasUsed: gasStats.totalGas,
        portfolioValue,
        connectedDapps,
        securityScore,
        recentTransactions: txHistory.slice(0, 10)
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, isConnected, chainId, selectedTimeframe]);

  // Fetch transaction history using WalletConnect
  const fetchTransactionHistory = async (address, chainId, timeframe) => {
    try {
      // Use WalletConnect to query blockchain data
      const provider = walletConnectService.ethereumProvider ||
                      (walletConnectService.signClient ? await getProviderFromSignClient() : null);

      if (!provider) {
        throw new Error('No WalletConnect provider available');
      }

      // For demo purposes, we'll simulate transaction data
      // In a real implementation, you'd use services like Etherscan API or similar
      const mockTransactions = generateMockTransactions(address, timeframe);

      return mockTransactions;
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  };

  // Calculate portfolio value
  const calculatePortfolioValue = async (address, chainId) => {
    try {
      // Get ETH balance
      const ethBalance = await walletConnectService.ethereumProvider?.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });

      const ethValue = parseFloat(ethers.formatEther(ethBalance || '0')) * 2500; // Mock ETH price

      // Add token balances (mock data for demo)
      const tokenBalances = [
        { symbol: 'USDC', balance: 1500, price: 1 },
        { symbol: 'WBTC', balance: 0.05, price: 45000 },
        { symbol: 'UNI', balance: 100, price: 8 }
      ];

      const tokenValue = tokenBalances.reduce((sum, token) => sum + (token.balance * token.price), 0);

      return ethValue + tokenValue;
    } catch (error) {
      console.error('Error calculating portfolio value:', error);
      return 0;
    }
  };

  // Get connected dApps
  const getConnectedDapps = async () => {
    try {
      const sessions = walletConnectService.getActiveSessions();
      return sessions.map(session => ({
        name: session.peer.metadata.name,
        url: session.peer.metadata.url,
        icon: session.peer.metadata.icons[0],
        connectedAt: new Date(session.expiry * 1000)
      }));
    } catch (error) {
      console.error('Error getting connected dApps:', error);
      return [];
    }
  };

  // Calculate security score
  const calculateSecurityScore = async (address, transactions) => {
    let score = 100;

    // Deduct points for risky patterns
    if (transactions.length > 50) score -= 10; // High activity
    if (hasLargeTransactions(transactions)) score -= 15; // Large transfers
    if (hasFrequentApprovals(transactions)) score -= 20; // Token approvals
    if (!hasRecentActivity(transactions)) score -= 5; // Inactive wallet

    return Math.max(0, Math.min(100, score));
  };

  // Calculate gas statistics
  const calculateGasStatistics = (transactions) => {
    const gasTransactions = transactions.filter(tx => tx.gasUsed);
    const totalGas = gasTransactions.reduce((sum, tx) => sum + parseFloat(tx.gasUsed || 0), 0);
    const avgGas = gasTransactions.length > 0 ? totalGas / gasTransactions.length : 0;

    return { totalGas, avgGas, transactionCount: gasTransactions.length };
  };

  // Calculate total volume
  const calculateTotalVolume = (transactions) => {
    return transactions
      .filter(tx => tx.value && parseFloat(tx.value) > 0)
      .reduce((sum, tx) => sum + parseFloat(tx.value), 0);
  };

  // Helper functions for security scoring
  const hasLargeTransactions = (transactions) => {
    return transactions.some(tx => parseFloat(tx.value || 0) > 10); // > 10 ETH equivalent
  };

  const hasFrequentApprovals = (transactions) => {
    const approvals = transactions.filter(tx => tx.method === 'approve');
    return approvals.length > 5;
  };

  const hasRecentActivity = (transactions) => {
    if (transactions.length === 0) return false;
    const lastTx = transactions[0];
    const daysSinceLastTx = (Date.now() - lastTx.timestamp) / (1000 * 60 * 60 * 24);
    return daysSinceLastTx < 30;
  };

  // Generate mock transaction data for demo
  const generateMockTransactions = (address, timeframe) => {
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    const transactions = [];

    for (let i = 0; i < Math.min(days * 2, 50); i++) {
      const timestamp = Date.now() - (Math.random() * days * 24 * 60 * 60 * 1000);
      transactions.push({
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        from: Math.random() > 0.5 ? address : `0x${Math.random().toString(16).substr(2, 40)}`,
        to: Math.random() > 0.5 ? `0x${Math.random().toString(16).substr(2, 40)}` : address,
        value: (Math.random() * 5).toFixed(4),
        gasUsed: (Math.random() * 21000 + 21000).toFixed(0),
        timestamp,
        method: ['transfer', 'approve', 'swap'][Math.floor(Math.random() * 3)],
        status: Math.random() > 0.1 ? 'success' : 'failed'
      });
    }

    return transactions.sort((a, b) => b.timestamp - a.timestamp);
  };

  // Load analytics on mount and when dependencies change
  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  // Format address
  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Get security score color
  const getSecurityScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  if (!isConnected) {
    return (
      <div className="wallet-analytics">
        <div className="analytics-placeholder">
          <h3>🔍 Wallet Analytics</h3>
          <p>Connect your wallet to view detailed analytics and insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-analytics">
      <div className="analytics-header">
        <h3>🔍 Wallet Analytics</h3>
        <div className="analytics-controls">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="timeframe-select"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="details-toggle"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-spinner">Loading analytics...</div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon">📊</div>
              <div className="metric-content">
                <h4>{analytics.transactionCount}</h4>
                <p>Total Transactions</p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">💰</div>
              <div className="metric-content">
                <h4>{formatCurrency(analytics.totalVolume)}</h4>
                <p>Transaction Volume</p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">⛽</div>
              <div className="metric-content">
                <h4>{analytics.gasUsed.toLocaleString()}</h4>
                <p>Gas Used</p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">💎</div>
              <div className="metric-content">
                <h4>{formatCurrency(analytics.portfolioValue)}</h4>
                <p>Portfolio Value</p>
              </div>
            </div>
          </div>

          {/* Security Score */}
          <div className="security-score">
            <div className="score-header">
              <h4>🛡️ Security Score</h4>
              <span
                className="score-value"
                style={{ color: getSecurityScoreColor(analytics.securityScore) }}
              >
                {analytics.securityScore}/100
              </span>
            </div>
            <div className="score-bar">
              <div
                className="score-fill"
                style={{
                  width: `${analytics.securityScore}%`,
                  backgroundColor: getSecurityScoreColor(analytics.securityScore)
                }}
              />
            </div>
          </div>

          {/* Connected dApps */}
          {analytics.connectedDapps.length > 0 && (
            <div className="connected-dapps">
              <h4>🔗 Connected dApps ({analytics.connectedDapps.length})</h4>
              <div className="dapps-list">
                {analytics.connectedDapps.map((dapp, index) => (
                  <div key={index} className="dapp-item">
                    <img src={dapp.icon} alt={dapp.name} className="dapp-icon" />
                    <div className="dapp-info">
                      <span className="dapp-name">{dapp.name}</span>
                      <span className="dapp-url">{dapp.url}</span>
                    </div>
                    <span className="dapp-connected">
                      {new Date(dapp.connectedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          {showDetails && analytics.recentTransactions.length > 0 && (
            <div className="recent-transactions">
              <h4>📝 Recent Transactions</h4>
              <div className="transactions-list">
                {analytics.recentTransactions.map((tx, index) => (
                  <div key={index} className="transaction-item">
                    <div className="tx-info">
                      <span className="tx-hash">{formatAddress(tx.hash)}</span>
                      <span className="tx-method">{tx.method}</span>
                    </div>
                    <div className="tx-details">
                      <span className={`tx-status ${tx.status}`}>
                        {tx.status === 'success' ? '✅' : '❌'} {tx.status}
                      </span>
                      <span className="tx-value">{tx.value} ETH</span>
                      <span className="tx-date">
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics Insights */}
          <div className="analytics-insights">
            <h4>💡 Insights</h4>
            <div className="insights-list">
              {analytics.transactionCount > 20 && (
                <div className="insight-item high-activity">
                  ⚡ High transaction activity detected
                </div>
              )}
              {analytics.securityScore < 70 && (
                <div className="insight-item security-warning">
                  ⚠️ Consider reviewing your wallet security practices
                </div>
              )}
              {analytics.connectedDapps.length > 5 && (
                <div className="insight-item many-connections">
                  🌐 Connected to multiple dApps - stay vigilant!
                </div>
              )}
              {analytics.gasUsed > 1000000 && (
                <div className="insight-item gas-usage">
                  ⛽ Consider optimizing gas usage for future transactions
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WalletAnalytics;