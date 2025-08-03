import React, { useState, useEffect } from 'react';
import HybridHTLC from '../services/htlc';
import MEVShield from '../services/mevShield';
import PartialFillEngine from '../services/partialFill';
import ChainManager from '../services/chainAdapter';

const DemoInterface = ({ walletConnected, walletAddress }) => {
  const [activeDemo, setActiveDemo] = useState(null);
  const [demoData, setDemoData] = useState({});
  const [isRunning, setIsRunning] = useState(false);

  // Demo scenarios
  const demos = {
    htlc: {
      title: "🔗 Cross-Chain HTLC Demo",
      description: "Demonstrate atomic swaps between different blockchain networks",
      steps: [
        "Create hash-locked contract",
        "Deploy on source chain",
        "Monitor cross-chain state",
        "Claim with secret reveal",
        "Complete atomic swap"
      ]
    },
    mev: {
      title: "🛡️ MEV Protection Demo",
      description: "Show how commit-reveal scheme protects against front-running",
      steps: [
        "Submit order commitment",
        "Wait for batch collection",
        "Reveal order details",
        "Execute in protected batch",
        "Compare with unprotected swap"
      ]
    },
    partialFill: {
      title: "📦 Partial Fill Demo",
      description: "Break large orders into smaller, executable chunks",
      steps: [
        "Create large order",
        "Match with liquidity providers",
        "Execute partial fills",
        "Track completion progress",
        "Final settlement"
      ]
    },
    crossChain: {
      title: "🌉 Universal Adapter Demo",
      description: "Showcase support for multiple blockchain types",
      steps: [
        "Initialize chain adapters",
        "Query different networks",
        "Compare transaction costs",
        "Execute cross-chain operation",
        "Verify on both chains"
      ]
    }
  };

  // Run HTLC Demo
  const runHTLCDemo = async () => {
    setIsRunning(true);
    const updates = {};
    
    try {
      // Step 1: Create HTLC
      updates.step = 0;
      setDemoData({...updates});
      await new Promise(resolve => setTimeout(resolve, 1000));

      const htlcParams = HybridHTLC.createHTLCParams(
        { id: 1, type: 'evm' },
        { id: 137, type: 'evm' },
        '1000000000000000000', // 1 ETH
        walletAddress
      );

      updates.swapId = htlcParams.swapId;
      updates.hashLock = htlcParams.hashLock;
      updates.step = 1;
      setDemoData({...updates});
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 2: Deploy HTLC
      const deployResult = await HybridHTLC.deployHTLC(htlcParams, { 
        sendTransaction: async () => ({ hash: 'demo_tx_hash' }) 
      });

      updates.deployTx = deployResult.hash;
      updates.step = 2;
      setDemoData({...updates});
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 3: Monitor
      const monitorResult = await HybridHTLC.monitorSwap(htlcParams.swapId);
      updates.monitorData = monitorResult;
      updates.step = 3;
      setDemoData({...updates});
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 4: Claim
      const claimResult = await HybridHTLC.claimHTLC(
        htlcParams.swapId, 
        htlcParams.secret,
        { sendTransaction: async () => ({ hash: 'claim_tx_hash' }) }
      );

      updates.claimTx = claimResult.hash;
      updates.step = 4;
      setDemoData({...updates});
      
      updates.completed = true;
      setDemoData({...updates});

    } catch (error) {
      updates.error = error.message;
      setDemoData({...updates});
    } finally {
      setIsRunning(false);
    }
  };

  // Run MEV Protection Demo
  const runMEVDemo = async () => {
    setIsRunning(true);
    const updates = {};
    
    try {
      // Step 1: Create commitment
      updates.step = 0;
      setDemoData({...updates});
      await new Promise(resolve => setTimeout(resolve, 1000));

      const orderParams = {
        user: walletAddress,
        tokenIn: '0xA0b86a33E6441b8c4a0ffe1d7a6c78b4e123d25e',
        tokenOut: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        amountIn: '1000000000000000000000', // 1000 tokens
        minAmountOut: '995000000000000000000',
        deadline: Math.floor(Date.now() / 1000) + 1800
      };

      const commitment = MEVShield.createCommitment(orderParams);
      updates.commitment = commitment.commitment;
      updates.step = 1;
      setDemoData({...updates});
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: Wait for batch
      updates.step = 2;
      updates.batchSize = 5;
      setDemoData({...updates});
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 3: Reveal
      const reveal = await MEVShield.revealOrder(
        commitment.commitment,
        orderParams,
        commitment.nonce
      );

      updates.revealed = true;
      updates.batchPosition = reveal.batchPosition;
      updates.step = 3;
      setDemoData({...updates});
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 4: Execute
      updates.step = 4;
      updates.executionResult = {
        mevSavings: '15.50',
        gasUsed: '145000',
        finalPrice: '0.9975'
      };
      setDemoData({...updates});
      
      updates.completed = true;
      setDemoData({...updates});

    } catch (error) {
      updates.error = error.message;
      setDemoData({...updates});
    } finally {
      setIsRunning(false);
    }
  };

  // Run Partial Fill Demo
  const runPartialFillDemo = async () => {
    setIsRunning(true);
    const updates = {};
    
    try {
      // Step 1: Create large order
      updates.step = 0;
      setDemoData({...updates});
      await new Promise(resolve => setTimeout(resolve, 1000));

      const orderParams = {
        user: walletAddress,
        chainId: 1,
        tokenIn: '0xA0b86a33E6441b8c4a0ffe1d7a6c78b4e123d25e',
        tokenOut: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        amountIn: '10000000000000000000000', // 10k tokens
        minAmountOut: '9900000000000000000000',
        maxSlippage: 1,
        deadline: Math.floor(Date.now() / 1000) + 3600
      };

      const order = await PartialFillEngine.createPartialOrder(orderParams);
      updates.orderId = order.orderId;
      updates.totalAmount = '10,000';
      updates.estimatedFills = order.estimatedFills;
      updates.step = 1;
      setDemoData({...updates});
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2-4: Simulate fills
      const fills = [
        { amount: '2,500', lp: 'LP-001', time: '2s' },
        { amount: '3,000', lp: 'LP-002', time: '5s' },
        { amount: '2,200', lp: 'LP-003', time: '8s' },
        { amount: '2,300', lp: 'LP-001', time: '12s' }
      ];

      for (let i = 0; i < fills.length; i++) {
        updates.step = 2 + i;
        updates.currentFill = fills[i];
        updates.completedFills = fills.slice(0, i + 1);
        updates.remainingAmount = 10000 - fills.slice(0, i + 1).reduce((sum, fill) => 
          sum + parseFloat(fill.amount.replace(',', '')), 0);
        updates.progress = ((10000 - updates.remainingAmount) / 10000) * 100;
        setDemoData({...updates});
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      updates.completed = true;
      setDemoData({...updates});

    } catch (error) {
      updates.error = error.message;
      setDemoData({...updates});
    } finally {
      setIsRunning(false);
    }
  };

  // Run Cross-Chain Demo
  const runCrossChainDemo = async () => {
    setIsRunning(true);
    const updates = {};
    
    try {
      // Step 1: Initialize adapters
      updates.step = 0;
      setDemoData({...updates});
      await new Promise(resolve => setTimeout(resolve, 1000));

      await ChainManager.initializeAll();
      updates.supportedChains = ChainManager.getSupportedChains();
      updates.step = 1;
      setDemoData({...updates});
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 2: Query networks
      updates.step = 2;
      updates.networkData = {
        ethereum: { gasPrice: '25 gwei', blockTime: '12s', tvl: '$45.2B' },
        polygon: { gasPrice: '30 gwei', blockTime: '2s', tvl: '$1.8B' },
        binance: { gasPrice: '5 gwei', blockTime: '3s', tvl: '$4.1B' },
        bitcoin: { feeRate: '15 sat/vB', blockTime: '10m', tvl: '$890B' },
        solana: { fee: '0.000005 SOL', blockTime: '400ms', tvl: '$1.2B' }
      };
      setDemoData({...updates});
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 3: Compare costs
      updates.step = 3;
      updates.costComparison = {
        ethereum: '$45.20',
        polygon: '$0.85',
        binance: '$2.10',
        solana: '$0.02'
      };
      setDemoData({...updates});
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 4: Execute cross-chain
      updates.step = 4;
      const crossChainResult = await ChainManager.executeCrossChainSwap(1, 137, {
        amount: '1000000000000000000',
        token: 'USDC'
      });
      updates.crossChainResult = crossChainResult;
      setDemoData({...updates});
      
      updates.completed = true;
      setDemoData({...updates});

    } catch (error) {
      updates.error = error.message;
      setDemoData({...updates});
    } finally {
      setIsRunning(false);
    }
  };

  const runDemo = (demoType) => {
    setActiveDemo(demoType);
    setDemoData({});
    
    switch (demoType) {
      case 'htlc':
        runHTLCDemo();
        break;
      case 'mev':
        runMEVDemo();
        break;
      case 'partialFill':
        runPartialFillDemo();
        break;
      case 'crossChain':
        runCrossChainDemo();
        break;
      default:
        break;
    }
  };

  const resetDemo = () => {
    setActiveDemo(null);
    setDemoData({});
    setIsRunning(false);
  };

  if (!walletConnected) {
    return (
      <div className="demo-interface">
        <div className="demo-placeholder">
          <h3>🔌 Connect Wallet</h3>
          <p>Connect your wallet to access the interactive demo features</p>
        </div>
      </div>
    );
  }

  return (
    <div className="demo-interface">
      <div className="demo-header">
        <h2>🚀 AeroSwap Advanced Features Demo</h2>
        <p>Experience the future of DeFi with interactive demonstrations</p>
      </div>

      {!activeDemo ? (
        <div className="demo-grid">
          {Object.entries(demos).map(([key, demo]) => (
            <div key={key} className="demo-card">
              <h3>{demo.title}</h3>
              <p>{demo.description}</p>
              <div className="demo-steps">
                {demo.steps.map((step, index) => (
                  <div key={index} className="demo-step">
                    <span className="step-number">{index + 1}</span>
                    <span className="step-text">{step}</span>
                  </div>
                ))}
              </div>
              <button 
                className="demo-button"
                onClick={() => runDemo(key)}
                disabled={isRunning}
              >
                {isRunning ? 'Running...' : 'Run Demo'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="demo-execution">
          <div className="demo-controls">
            <button className="back-button" onClick={resetDemo}>
              ← Back to Demos
            </button>
            <h3>{demos[activeDemo].title}</h3>
          </div>

          <div className="demo-progress">
            {demos[activeDemo].steps.map((step, index) => (
              <div 
                key={index} 
                className={`progress-step ${
                  demoData.step > index ? 'completed' : 
                  demoData.step === index ? 'active' : 'pending'
                }`}
              >
                <div className="step-icon">
                  {demoData.step > index ? '✓' : index + 1}
                </div>
                <div className="step-label">{step}</div>
              </div>
            ))}
          </div>

          <div className="demo-output">
            {activeDemo === 'htlc' && (
              <div className="htlc-output">
                {demoData.swapId && (
                  <div className="output-item">
                    <strong>Swap ID:</strong> {demoData.swapId.slice(0, 10)}...
                  </div>
                )}
                {demoData.hashLock && (
                  <div className="output-item">
                    <strong>Hash Lock:</strong> {demoData.hashLock.slice(0, 20)}...
                  </div>
                )}
                {demoData.deployTx && (
                  <div className="output-item">
                    <strong>Deploy Tx:</strong> {demoData.deployTx}
                  </div>
                )}
                {demoData.monitorData && (
                  <div className="output-item">
                    <strong>Status:</strong> {demoData.monitorData.status}
                    <br />
                    <strong>Time Remaining:</strong> {demoData.monitorData.timeRemaining}s
                  </div>
                )}
                {demoData.claimTx && (
                  <div className="output-item">
                    <strong>Claim Tx:</strong> {demoData.claimTx}
                  </div>
                )}
              </div>
            )}

            {activeDemo === 'mev' && (
              <div className="mev-output">
                {demoData.commitment && (
                  <div className="output-item">
                    <strong>Commitment:</strong> {demoData.commitment.slice(0, 20)}...
                  </div>
                )}
                {demoData.batchSize && (
                  <div className="output-item">
                    <strong>Batch Size:</strong> {demoData.batchSize} orders
                  </div>
                )}
                {demoData.batchPosition !== undefined && (
                  <div className="output-item">
                    <strong>Batch Position:</strong> #{demoData.batchPosition + 1}
                  </div>
                )}
                {demoData.executionResult && (
                  <div className="output-item">
                    <strong>MEV Savings:</strong> ${demoData.executionResult.mevSavings}
                    <br />
                    <strong>Gas Used:</strong> {demoData.executionResult.gasUsed}
                    <br />
                    <strong>Final Price:</strong> {demoData.executionResult.finalPrice}
                  </div>
                )}
              </div>
            )}

            {activeDemo === 'partialFill' && (
              <div className="partial-fill-output">
                {demoData.orderId && (
                  <div className="output-item">
                    <strong>Order ID:</strong> {demoData.orderId}
                  </div>
                )}
                {demoData.totalAmount && (
                  <div className="output-item">
                    <strong>Total Amount:</strong> {demoData.totalAmount} tokens
                  </div>
                )}
                {demoData.progress !== undefined && (
                  <div className="output-item">
                    <strong>Progress:</strong> {demoData.progress.toFixed(1)}%
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${demoData.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                {demoData.completedFills && (
                  <div className="output-item">
                    <strong>Completed Fills:</strong>
                    {demoData.completedFills.map((fill, index) => (
                      <div key={index} className="fill-item">
                        {fill.amount} tokens by {fill.lp} ({fill.time})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeDemo === 'crossChain' && (
              <div className="cross-chain-output">
                {demoData.supportedChains && (
                  <div className="output-item">
                    <strong>Supported Chains:</strong> {demoData.supportedChains.length}
                  </div>
                )}
                {demoData.networkData && (
                  <div className="output-item">
                    <strong>Network Data:</strong>
                    {Object.entries(demoData.networkData).map(([chain, data]) => (
                      <div key={chain} className="network-item">
                        <strong>{chain}:</strong> {data.gasPrice || data.feeRate || data.fee} 
                        (Block: {data.blockTime}, TVL: {data.tvl})
                      </div>
                    ))}
                  </div>
                )}
                {demoData.costComparison && (
                  <div className="output-item">
                    <strong>Cost Comparison (1000 USDC swap):</strong>
                    {Object.entries(demoData.costComparison).map(([chain, cost]) => (
                      <div key={chain} className="cost-item">
                        {chain}: {cost}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {demoData.error && (
              <div className="error-output">
                <strong>Error:</strong> {demoData.error}
              </div>
            )}

            {demoData.completed && (
              <div className="success-output">
                🎉 Demo completed successfully!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoInterface;
