import React, { useState, useEffect, useCallback } from 'react';
import WalletService from './services/wallet';
import OneInchService from './services/1inch';
import './App.css';

function App() {
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

  // UI state
  const [showTokenSelect, setShowTokenSelect] = useState(false);
  const [selectingFor, setSelectingFor] = useState(null); // 'from' or 'to'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Auto-connect wallet on load
  useEffect(() => {
    const autoConnect = async () => {
      try {
        const connected = await WalletService.autoConnect();
        if (connected) {
          const state = WalletService.getWalletState();
          setWalletConnected(true);
          setWalletAddress(state.address);
          setChainId(state.chainId);
          await loadBalance();
          await loadTokens(state.chainId);
        }
      } catch (error) {
        console.error('Auto-connect failed:', error);
      }
    };

    autoConnect();
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

  // Connect wallet
  const connectWallet = async () => {
    try {
      setError('');
      const result = await WalletService.connect();
      setWalletConnected(true);
      setWalletAddress(result.address);
      setChainId(result.chainId);
      await loadBalance();
      await loadTokens(result.chainId);
      setSuccess('Wallet connected successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    WalletService.disconnect();
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
  };

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

  // Execute swap
  const executeSwap = async () => {
    if (!quote || !walletConnected) return;

    try {
      setIsSwapping(true);
      setError('');
      
      const { signer } = WalletService.getWalletState();
      const amount = OneInchService.formatAmount(fromAmount, fromToken.decimals);

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
      
      // Reset form
      setFromAmount('');
      setToAmount('');
      setQuote(null);
      
      // Reload balance
      await loadBalance();
      
      setTimeout(() => setSuccess(''), 5000);
      
    } catch (error) {
      console.error('Swap failed:', error);
      setError(`Swap failed: ${error.message}`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsSwapping(false);
    }
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
                <button className="wallet-button connected" onClick={disconnectWallet}>
                  {WalletService.formatAddress(walletAddress)}
                </button>
              </div>
            ) : (
              <button className="wallet-button" onClick={connectWallet}>
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="main">
        <div className="swap-container">
          <div className="swap-header">
            <h2>Swap Tokens</h2>
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

      <footer className="footer">
        <p>Powered by 1inch Protocol • Built with ❤️ for DeFi</p>
      </footer>
    </div>
  );
}

export default App;
