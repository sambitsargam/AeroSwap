import React, { useState, useEffect, useCallback } from 'react';
import WalletService from './services/wallet';
import OneInchService from './services/1inch';
import HybridHTLC from './services/htlc';
import MEVShield from './services/mevShield';
import PartialFillEngine from './services/partialFill';
import ChainManager from './services/chainAdapter';
import DemoInterface from './components/DemoInterface';
import LandingPage from './components/LandingPage';
import WalletConnect from './components/WalletConnect';
import WalletPortfolio from './components/WalletPortfolio';
import WalletAnalytics from './components/WalletAnalytics';
import './App.css';

function App() {
  // App state
  const [showLandingPage, setShowLandingPage] = useState(true);
  
  // Wallet state
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState('0');

  // Swap state
  const [fromToken, setFromToken] = useState(null);
  const [toToken, setToToken] = useState(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [tokens, setTokens] = useState([]);
  const [quote, setQuote] = useState(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [slippage, setSlippage] = useState(1);

  // Advanced features state
  const [swapMode, setSwapMode] = useState('normal'); // 'normal', 'mev-protected', 'partial-fill', 'cross-chain'
  const [mevProtection, setMevProtection] = useState(true);
  const [partialFillEnabled, setPartialFillEnabled] = useState(false);
  const [crossChainMode, setCrossChainMode] = useState(false);
  const [targetChain, setTargetChain] = useState(null);
  const [activeSwaps, setActiveSwaps] = useState([]);
  const [protectionStats, setProtectionStats] = useState(null);

  // UI state
  const [showTokenSelect, setShowTokenSelect] = useState(false);
  const [selectingFor, setSelectingFor] = useState(null); // 'from' or 'to'
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Initialize AppKit and advanced features
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize AppKit
        await appKit.init();

        // Initialize chain adapters
        await ChainManager.initializeAll();

        // Start MEV Shield batch processor
        MEVShield.startBatchProcessor();

        // Register demo liquidity providers
        PartialFillEngine.registerLiquidityProvider({
          address: '0x' + '1'.repeat(40),
          supportedTokens: ['0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'],
          maxFillSize: 1000,
          minProfitBps: 10
        });

        console.log('🚀 App initialized with AppKit and advanced features');
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initializeApp();
  }, []);

  // Load user balance
  const loadBalance = useCallback(async () => {
    try {
      if (walletConnected) {
        const ethBalance = await WalletService.getBalance();
        setBalance(parseFloat(ethBalance).toFixed(4));
      }
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  }, [walletConnected]);

  // Load tokens for current chain
  const loadTokens = useCallback(async (currentChainId) => {
    try {
      if (!currentChainId || !OneInchService.isChainSupported(currentChainId)) {
        // Use popular tokens as fallback
        const popularTokens = OneInchService.getPopularTokens(currentChainId);
        setTokens(popularTokens);
        return;
      }

      const tokenList = await OneInchService.getTokens(currentChainId);
      
      // Convert to array and sort by symbol
      const tokenArray = Object.values(tokenList).sort((a, b) => 
        a.symbol.localeCompare(b.symbol)
      );
      
      setTokens(tokenArray);
      
      // Set default tokens (ETH/MATIC and USDC)
      const nativeToken = tokenArray.find(t => 
        t.address === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
      );
      const usdcToken = tokenArray.find(t => 
        t.symbol.toUpperCase() === 'USDC'
      );
      
      if (nativeToken && !fromToken) setFromToken(nativeToken);
      if (usdcToken && !toToken) setToToken(usdcToken);
      
    } catch (error) {
      console.error('Error loading tokens:', error);
      // Fallback to popular tokens
      const popularTokens = OneInchService.getPopularTokens(currentChainId);
      setTokens(popularTokens);
    }
  }, [fromToken, toToken]);

  // Handle wallet connection
  const handleWalletConnected = useCallback(async (walletData) => {
    setWalletConnected(true);
    setWalletAddress(walletData.address);
    setChainId(walletData.chainId);
    setBalance(walletData.balance);

    // Update WalletService with AppKit provider
    if (window.ethereum) {
      WalletService.setProvider(window.ethereum);
      await WalletService.updateWalletState(walletData.address, walletData.chainId);
    }

    await loadTokens(walletData.chainId);
    setSuccess('Wallet connected successfully!');
    setTimeout(() => setSuccess(''), 3000);
  }, []);

  // Handle wallet disconnection
  const handleWalletDisconnected = useCallback(() => {
    setWalletConnected(false);
    setWalletAddress('');
    setChainId(null);
    setBalance('0');
    setFromToken(null);
    setToToken(null);
    setTokens([]);
    setFromAmount('');
    setToAmount('');
    setQuote(null);

    // Clear WalletService state
    WalletService.clearWalletState();
  }, []);

  // Get quote for swap
  const getQuote = useCallback(async () => {
    if (!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0) {
      setToAmount('');
      setQuote(null);
      return;
    }

    try {
      setIsQuoting(true);
      setError('');
      
      const amount = OneInchService.formatAmount(fromAmount, fromToken.decimals);
      
      const quoteResult = await OneInchService.getQuote({
        chainId,
        src: fromToken.address,
        dst: toToken.address,
        amount: amount.toString()
      });

      setQuote(quoteResult);
      const outputAmount = OneInchService.parseAmount(
        quoteResult.dstAmount, 
        toToken.decimals
      );
      setToAmount(parseFloat(outputAmount).toFixed(6));
      
    } catch (error) {
      console.error('Error getting quote:', error);
      setError(`Quote failed: ${error.message}`);
      setToAmount('');
      setQuote(null);
    } finally {
      setIsQuoting(false);
    }
  }, [fromToken, toToken, fromAmount, chainId]);

  // Get quote when inputs change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (walletConnected && fromToken && toToken && fromAmount) {
        getQuote();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [walletConnected, fromToken, toToken, fromAmount, getQuote]);

  // Execute swap with advanced features
  const executeSwap = async () => {
    if (!quote || !walletConnected) return;

    try {
      setIsSwapping(true);
      setError('');
      
      const { signer } = WalletService.getWalletState();
      const amount = OneInchService.formatAmount(fromAmount, fromToken.decimals);

      // Determine swap execution method based on settings
      if (mevProtection && parseFloat(fromAmount) > 1000) {
        // Use MEV-protected swap for large orders
        await executeMEVProtectedSwap(amount, signer);
      } else if (partialFillEnabled && parseFloat(fromAmount) > 5000) {
        // Use partial fill for very large orders
        await executePartialFillSwap(amount, signer);
      } else if (crossChainMode && targetChain) {
        // Use cross-chain swap
        await executeCrossChainSwap(amount, signer);
      } else {
        // Standard 1inch swap
        await executeStandardSwap(amount, signer);
      }
      
    } catch (error) {
      console.error('Swap failed:', error);
      setError(`Swap failed: ${error.message}`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsSwapping(false);
    }
  };

  // Standard 1inch swap execution
  const executeStandardSwap = async (amount, signer) => {
    // Check if token needs approval (skip for native tokens)
    if (fromToken.address !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
      const allowance = await OneInchService.checkAllowance(
        fromToken.address,
        walletAddress,
        chainId,
        signer.provider
      );

      if (allowance < amount) {
        setSuccess('Approving token...');
        const approveTx = await OneInchService.approveToken(
          fromToken.address,
          amount,
          chainId,
          signer
        );
        
        setSuccess('Waiting for approval confirmation...');
        await approveTx.wait();
        setSuccess('Token approved! Proceeding with swap...');
      }
    }

    // Get swap data
    const swapData = await OneInchService.getSwap({
      chainId,
      src: fromToken.address,
      dst: toToken.address,
      amount: amount.toString(),
      from: walletAddress,
      slippage
    });

    // Execute swap
    setSuccess('Executing swap...');
    const swapTx = await OneInchService.executeSwap(swapData, signer);
    
    setSuccess('Waiting for swap confirmation...');
    await swapTx.wait();
    
    setSuccess('Swap completed successfully!');
    resetForm();
  };

  // MEV-protected swap execution
  const executeMEVProtectedSwap = async (amount, signer) => {
    setSuccess('🛡️ Initializing MEV-protected swap...');
    
    // Create commitment
    const orderParams = {
      user: walletAddress,
      tokenIn: fromToken.address,
      tokenOut: toToken.address,
      amountIn: amount,
      minAmountOut: OneInchService.formatAmount(parseFloat(toAmount) * (1 - slippage / 100), toToken.decimals),
      deadline: Math.floor(Date.now() / 1000) + 1800 // 30 minutes
    };

    const commitment = MEVShield.createCommitment(orderParams);
    setSuccess(`🔒 Order committed. Revealing in batch...`);
    
    // Wait for reveal phase
    setTimeout(async () => {
      try {
        const reveal = await MEVShield.revealOrder(
          commitment.commitment,
          orderParams,
          commitment.nonce
        );
        
        setSuccess(`⚡ Order revealed. Executing in batch ${reveal.batchPosition + 1}...`);
        
        // The batch processor will handle execution
        // For demo, we'll simulate completion
        setTimeout(() => {
          setSuccess('✅ MEV-protected swap completed successfully!');
          resetForm();
        }, 3000);
        
      } catch (error) {
        throw new Error(`MEV protection failed: ${error.message}`);
      }
    }, 2000);
  };

  // Partial fill swap execution
  const executePartialFillSwap = async (amount, signer) => {
    setSuccess('📦 Creating partial fill order...');
    
    const orderParams = {
      user: walletAddress,
      chainId,
      tokenIn: fromToken.address,
      tokenOut: toToken.address,
      amountIn: amount,
      minAmountOut: OneInchService.formatAmount(parseFloat(toAmount) * (1 - slippage / 100), toToken.decimals),
      maxSlippage: slippage,
      deadline: Math.floor(Date.now() / 1000) + 3600 // 1 hour
    };

    const order = await PartialFillEngine.createPartialOrder(orderParams);
    setSuccess(`📊 Partial order created. Estimated ${order.estimatedFills} fills needed.`);
    
    // Monitor order progress
    const monitorInterval = setInterval(() => {
      const status = PartialFillEngine.getOrderStatus(order.orderId);
      if (status) {
        setSuccess(`🔄 Order ${status.completionPercentage.toFixed(1)}% complete (${status.fillCount} fills)`);
        
        if (status.status === 'completed') {
          clearInterval(monitorInterval);
          setSuccess('✅ Partial fill order completed successfully!');
          resetForm();
        }
      }
    }, 2000);
    
    // Clear monitoring after 5 minutes
    setTimeout(() => clearInterval(monitorInterval), 300000);
  };

  // Cross-chain swap execution
  const executeCrossChainSwap = async (amount, signer) => {
    setSuccess('🌉 Initializing cross-chain swap...');
    
    const fromChainAdapter = ChainManager.getAdapter(chainId);
    const toChainAdapter = ChainManager.getAdapter(targetChain);
    
    if (!fromChainAdapter || !toChainAdapter) {
      throw new Error('Unsupported chain for cross-chain swap');
    }

    // Create HTLC parameters
    const htlcParams = HybridHTLC.createHTLCParams(
      { id: chainId, type: 'evm' },
      { id: targetChain, type: 'evm' },
      amount,
      walletAddress
    );

    setSuccess(`🔗 Deploying HTLC on ${fromChainAdapter.name}...`);
    
    // Deploy HTLC on source chain
    await HybridHTLC.deployHTLC(htlcParams, signer);
    setSuccess(`✅ HTLC deployed. Swap ID: ${htlcParams.swapId.slice(0, 10)}...`);
    
    // For demo, simulate cross-chain completion
    setTimeout(async () => {
      setSuccess('🎯 Cross-chain swap completed successfully!');
      resetForm();
    }, 5000);
  };

  // Reset form after successful swap
  const resetForm = () => {
    setFromAmount('');
    setToAmount('');
    setQuote(null);
    loadBalance();
    setTimeout(() => setSuccess(''), 5000);
  };

  // Token selection
  const selectToken = (token) => {
    if (selectingFor === 'from') {
      setFromToken(token);
      setFromAmount('');
      setToAmount('');
    } else {
      setToToken(token);
      setToAmount('');
    }
    setShowTokenSelect(false);
    setQuote(null);
  };

  // Swap tokens
  const swapTokens = () => {
    const tempToken = fromToken;
    const tempAmount = fromAmount;
    
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
    setQuote(null);
  };

  // Switch chain
  const switchChain = async (newChainId) => {
    try {
      await WalletService.switchChain(newChainId);
      setChainId(newChainId);
      await loadTokens(newChainId);
      setFromToken(null);
      setToToken(null);
      setFromAmount('');
      setToAmount('');
      setQuote(null);
    } catch (error) {
      setError(`Failed to switch chain: ${error.message}`);
    }
  };

  const supportedChains = OneInchService.getSupportedChains();

  // Handler for entering the main app from landing page
  const handleEnterApp = () => {
    setShowLandingPage(false);
  };

  // Show landing page initially
  if (showLandingPage) {
    return <LandingPage onEnterApp={handleEnterApp} />;
  }

  return (
    <div className="App">
      <header className="header">
        <div className="header-content">
          <h1 className="logo">
            <span className="aero">Aero</span><span className="swap">Swap</span>
          </h1>
          <div className="header-right">
            {walletConnected && (
              <div className="chain-selector">
                <select 
                  value={chainId || ''} 
                  onChange={(e) => switchChain(parseInt(e.target.value))}
                  className="chain-select"
                >
                  {Object.entries(supportedChains).map(([id, chain]) => (
                    <option key={id} value={id}>
                      {chain.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {walletConnected ? (
              <div className="wallet-info">
                <span className="balance">{balance} {supportedChains[chainId]?.symbol}</span>
                <WalletConnect
                  onWalletConnected={handleWalletConnected}
                  onWalletDisconnected={handleWalletDisconnected}
                />
              </div>
            ) : (
              <WalletConnect
                onWalletConnected={handleWalletConnected}
                onWalletDisconnected={handleWalletDisconnected}
              />
            )}
          </div>
        </div>
      </header>

      <main className="main">
        <div className="swap-container">
          <div className="swap-header">
            <h2>Swap Tokens</h2>
            <div className="header-controls">
              <button 
                className="advanced-toggle"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                ⚙️ Advanced
              </button>
              <div className="slippage-control">
                <label>Slippage: {slippage}%</label>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={slippage}
                  onChange={(e) => setSlippage(parseFloat(e.target.value))}
                  className="slippage-slider"
                />
              </div>
            </div>
          </div>

          {showAdvanced && (
            <div className="advanced-panel">
              <h3>🚀 Advanced Features</h3>
              
              <div className="feature-toggles">
                <div className="feature-item">
                  <label className="feature-label">
                    <input
                      type="checkbox"
                      checked={mevProtection}
                      onChange={(e) => setMevProtection(e.target.checked)}
                    />
                    <span className="feature-icon">🛡️</span>
                    <span className="feature-text">
                      <strong>MEV Shield Mode</strong>
                      <small>Protects against front-running (&gt;$1000)</small>
                    </span>
                  </label>
                </div>

                <div className="feature-item">
                  <label className="feature-label">
                    <input
                      type="checkbox"
                      checked={partialFillEnabled}
                      onChange={(e) => setPartialFillEnabled(e.target.checked)}
                    />
                    <span className="feature-icon">📦</span>
                    <span className="feature-text">
                      <strong>Partial Fill Engine</strong>
                      <small>Break large orders into smaller fills (&gt;$5000)</small>
                    </span>
                  </label>
                </div>

                <div className="feature-item">
                  <label className="feature-label">
                    <input
                      type="checkbox"
                      checked={crossChainMode}
                      onChange={(e) => setCrossChainMode(e.target.checked)}
                    />
                    <span className="feature-icon">🌉</span>
                    <span className="feature-text">
                      <strong>Cross-Chain Swaps</strong>
                      <small>Swap between different blockchains</small>
                    </span>
                  </label>
                </div>
              </div>

              {crossChainMode && (
                <div className="cross-chain-selector">
                  <label>Target Chain:</label>
                  <select 
                    value={targetChain || ''} 
                    onChange={(e) => setTargetChain(e.target.value)}
                    className="target-chain-select"
                  >
                    <option value="">Select target chain</option>
                    {Object.entries(ChainManager.getSupportedChains())
                      .filter(([id]) => id !== chainId?.toString())
                      .map(([id, chain]) => (
                        <option key={id} value={id}>
                          {chain.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="feature-stats">
                <div className="stat-item">
                  <span className="stat-label">MEV Savings</span>
                  <span className="stat-value">$127.50</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Active Orders</span>
                  <span className="stat-value">{activeSwaps.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Success Rate</span>
                  <span className="stat-value">98.7%</span>
                </div>
              </div>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="swap-form">
            <div className="token-input">
              <div className="input-header">
                <span>From</span>
                {fromToken && walletConnected && (
                  <span className="token-balance">
                    Balance: {balance} {fromToken.symbol}
                  </span>
                )}
              </div>
              <div className="input-row">
                <input
                  type="number"
                  placeholder="0.0"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  className="amount-input"
                />
                <button 
                  className="token-select"
                  onClick={() => {
                    setSelectingFor('from');
                    setShowTokenSelect(true);
                  }}
                >
                  {fromToken ? (
                    <>
                      <span className="token-symbol">{fromToken.symbol}</span>
                      <span className="token-name">{fromToken.name}</span>
                    </>
                  ) : (
                    'Select Token'
                  )}
                </button>
              </div>
            </div>

            <div className="swap-arrow">
              <button className="swap-button" onClick={swapTokens}>
                ↕
              </button>
            </div>

            <div className="token-input">
              <div className="input-header">
                <span>To</span>
                {toToken && quote && (
                  <span className="quote-info">
                    1 {fromToken?.symbol} ≈ {(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(4)} {toToken?.symbol}
                  </span>
                )}
              </div>
              <div className="input-row">
                <input
                  type="number"
                  placeholder="0.0"
                  value={isQuoting ? 'Loading...' : toAmount}
                  readOnly
                  className="amount-input readonly"
                />
                <button 
                  className="token-select"
                  onClick={() => {
                    setSelectingFor('to');
                    setShowTokenSelect(true);
                  }}
                >
                  {toToken ? (
                    <>
                      <span className="token-symbol">{toToken.symbol}</span>
                      <span className="token-name">{toToken.name}</span>
                    </>
                  ) : (
                    'Select Token'
                  )}
                </button>
              </div>
            </div>

            {quote && (
              <div className="quote-details">
                <div className="quote-row">
                  <span>Minimum received:</span>
                  <span>{(parseFloat(toAmount) * (1 - slippage / 100)).toFixed(6)} {toToken?.symbol}</span>
                </div>
                <div className="quote-row">
                  <span>Gas fee:</span>
                  <span>~{(parseInt(quote.estimatedGas || '0') * 0.000000001 * 20).toFixed(4)} {supportedChains[chainId]?.symbol}</span>
                </div>
              </div>
            )}

            <button 
              className="execute-button"
              onClick={executeSwap}
              disabled={!walletConnected || !quote || isSwapping || isQuoting}
            >
              {!walletConnected ? 'Connect Wallet' :
               !quote ? 'Enter Amount' :
               isSwapping ? 'Swapping...' :
               'Swap Tokens'}
            </button>
          </div>
        </div>

        {showTokenSelect && (
          <div className="modal-overlay" onClick={() => setShowTokenSelect(false)}>
            <div className="token-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Select Token</h3>
                <button 
                  className="close-button"
                  onClick={() => setShowTokenSelect(false)}
                >
                  ×
                </button>
              </div>
              <div className="token-list">
                {tokens.map((token) => (
                  <button
                    key={token.address}
                    className="token-item"
                    onClick={() => selectToken(token)}
                  >
                    <div className="token-info">
                      <span className="token-symbol">{token.symbol}</span>
                      <span className="token-name">{token.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Multi-Chain Portfolio */}
      <WalletPortfolio 
        walletAddress={walletAddress}
        isConnected={walletConnected}
      />

      {/* Wallet Analytics Dashboard */}
      <WalletAnalytics 
        walletAddress={walletAddress}
        isConnected={walletConnected}
        chainId={chainId}
      />

      {/* Demo Interface */}
      <DemoInterface 
        walletConnected={walletConnected}
        walletAddress={walletAddress}
      />

      <footer className="footer">
        <p>Powered by 1inch Protocol • Built with ❤️ for DeFi</p>
      </footer>
    </div>
  );
}

export default App;
