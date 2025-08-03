import OneInchService from './1inch';
import { ethers } from 'ethers';

/**
 * Partial Fill Engine
 * Allows liquidity providers to fulfill trades partially, reducing failed swaps
 */
class PartialFillEngine {
  constructor() {
    this.partialOrders = new Map();
    this.liquidityProviders = new Map();
    this.fillHistory = new Map();
    this.minFillAmount = ethers.parseEther('10'); // Minimum $10 equivalent
  }

  /**
   * Create a partial fill order
   */
  async createPartialOrder(orderParams) {
    try {
      const orderId = this.generateOrderId();
      const order = {
        id: orderId,
        user: orderParams.user,
        tokenIn: orderParams.tokenIn,
        tokenOut: orderParams.tokenOut,
        totalAmountIn: orderParams.amountIn,
        remainingAmountIn: orderParams.amountIn,
        minAmountOut: orderParams.minAmountOut,
        maxSlippage: orderParams.maxSlippage || 1,
        deadline: orderParams.deadline,
        fills: [],
        status: 'open',
        createdAt: Date.now(),
        chainId: orderParams.chainId
      };

      // Get initial quote from 1inch
      const quote = await OneInchService.getQuote({
        chainId: order.chainId,
        src: order.tokenIn,
        dst: order.tokenOut,
        amount: order.totalAmountIn.toString()
      });

      order.expectedAmountOut = quote.dstAmount;
      order.currentPrice = parseFloat(quote.dstAmount) / parseFloat(order.totalAmountIn);
      
      this.partialOrders.set(orderId, order);
      
      console.log(`📦 Partial order created: ${orderId}`);
      console.log(`💰 Total amount: ${ethers.formatEther(order.totalAmountIn)}`);
      
      // Start matching process
      this.matchOrder(orderId);
      
      return {
        orderId,
        status: 'open',
        totalAmount: order.totalAmountIn,
        expectedOutput: order.expectedAmountOut,
        estimatedFills: this.estimateFillCount(order)
      };
      
    } catch (error) {
      console.error('Failed to create partial order:', error);
      throw error;
    }
  }

  /**
   * Register liquidity provider
   */
  registerLiquidityProvider(provider) {
    const providerId = this.generateProviderId();
    
    const lpData = {
      id: providerId,
      address: provider.address,
      tokens: provider.supportedTokens,
      maxFillSize: provider.maxFillSize,
      minProfitBps: provider.minProfitBps || 10, // 0.1% minimum profit
      reputation: 100, // Starting reputation
      totalFills: 0,
      totalVolume: ethers.toBigInt(0),
      isActive: true
    };
    
    this.liquidityProviders.set(providerId, lpData);
    
    console.log(`🏦 LP registered: ${providerId}`);
    return providerId;
  }

  /**
   * Match orders with liquidity providers
   */
  async matchOrder(orderId) {
    const order = this.partialOrders.get(orderId);
    if (!order || order.status !== 'open') return;

    console.log(`🔍 Matching order ${orderId}`);
    
    // Find suitable liquidity providers
    const suitableLPs = this.findSuitableLPs(order);
    
    for (const lp of suitableLPs) {
      if (order.remainingAmountIn <= this.minFillAmount) break;
      
      try {
        await this.attemptFill(order, lp);
      } catch (error) {
        console.error(`Fill attempt failed with LP ${lp.id}:`, error);
      }
    }

    // Update order status
    if (order.remainingAmountIn <= this.minFillAmount) {
      order.status = 'completed';
      console.log(`✅ Order ${orderId} completed`);
    } else {
      // Schedule retry
      setTimeout(() => this.matchOrder(orderId), 10000); // Retry in 10 seconds
    }
  }

  /**
   * Attempt to fill part of an order
   */
  async attemptFill(order, lp) {
    // Calculate optimal fill size
    const fillSize = this.calculateFillSize(order, lp);
    
    if (fillSize < this.minFillAmount) return;

    // Get quote for this fill size
    const quote = await OneInchService.getQuote({
      chainId: order.chainId,
      src: order.tokenIn,
      dst: order.tokenOut,
      amount: fillSize.toString()
    });

    // Calculate expected output for this fill
    const expectedOutput = ethers.toBigInt(quote.dstAmount);
    const priceImpact = this.calculatePriceImpact(order.currentPrice, quote);
    
    // Check if fill is profitable for LP
    if (priceImpact > order.maxSlippage) {
      console.log(`⚠️ Fill rejected: price impact too high (${priceImpact}%)`);
      return;
    }

    // Execute the fill
    const fill = await this.executeFill(order, lp, fillSize, expectedOutput, quote);
    
    // Update order
    order.fills.push(fill);
    order.remainingAmountIn = order.remainingAmountIn - fillSize;
    
    // Update LP stats
    lp.totalFills++;
    lp.totalVolume = lp.totalVolume + fillSize;
    
    console.log(`🎯 Fill executed: ${ethers.formatEther(fillSize)} tokens`);
    
    return fill;
  }

  /**
   * Execute a partial fill
   */
  async executeFill(order, lp, fillSize, expectedOutput, quote) {
    // Simulate fill execution
    const fill = {
      id: this.generateFillId(),
      orderId: order.id,
      providerId: lp.id,
      amountIn: fillSize,
      amountOut: expectedOutput,
      price: parseFloat(expectedOutput) / parseFloat(fillSize),
      gasUsed: ethers.toBigInt(quote.estimatedGas || 150000),
      timestamp: Date.now(),
      txHash: this.generateTxHash(),
      status: 'executed'
    };

    // Simulate blockchain transaction
    await this.simulateSwapExecution(fill, quote);
    
    // Store fill history
    this.fillHistory.set(fill.id, fill);
    
    return fill;
  }

  /**
   * Find suitable liquidity providers for an order
   */
  findSuitableLPs(order) {
    const suitableLPs = [];
    
    for (const [id, lp] of this.liquidityProviders) {
      if (!lp.isActive) continue;
      
      // Check if LP supports the token pair
      const supportsTokenIn = lp.tokens.includes(order.tokenIn.toLowerCase());
      const supportsTokenOut = lp.tokens.includes(order.tokenOut.toLowerCase());
      
      if (supportsTokenIn && supportsTokenOut) {
        suitableLPs.push(lp);
      }
    }
    
    // Sort by reputation and total fills
    return suitableLPs.sort((a, b) => {
      const scoreA = a.reputation * 0.7 + a.totalFills * 0.3;
      const scoreB = b.reputation * 0.7 + b.totalFills * 0.3;
      return scoreB - scoreA;
    });
  }

  /**
   * Calculate optimal fill size
   */
  calculateFillSize(order, lp) {
    const maxLPFill = ethers.parseEther(lp.maxFillSize.toString());
    const remainingAmount = order.remainingAmountIn;
    
    // Use smaller of LP max fill size or remaining amount
    let fillSize = maxLPFill < remainingAmount ? maxLPFill : remainingAmount;
    
    // Ensure minimum fill size
    if (fillSize < this.minFillAmount) {
      fillSize = this.minFillAmount;
    }
    
    // Don't exceed remaining amount
    if (fillSize > remainingAmount) {
      fillSize = remainingAmount;
    }
    
    return fillSize;
  }

  /**
   * Calculate price impact
   */
  calculatePriceImpact(expectedPrice, actualQuote) {
    const actualPrice = parseFloat(actualQuote.dstAmount) / parseFloat(actualQuote.srcAmount);
    const impact = Math.abs((actualPrice - expectedPrice) / expectedPrice) * 100;
    return impact;
  }

  /**
   * Simulate swap execution
   */
  async simulateSwapExecution(fill, quote) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`⚡ Executing fill ${fill.id}`);
    console.log(`📊 Amount: ${ethers.formatEther(fill.amountIn)} → ${ethers.formatEther(fill.amountOut)}`);
    
    return true;
  }

  /**
   * Get order status
   */
  getOrderStatus(orderId) {
    const order = this.partialOrders.get(orderId);
    if (!order) return null;
    
    const completionPercentage = (
      (parseFloat(order.totalAmountIn) - parseFloat(order.remainingAmountIn)) / 
      parseFloat(order.totalAmountIn)
    ) * 100;
    
    return {
      orderId,
      status: order.status,
      totalAmount: order.totalAmountIn,
      remainingAmount: order.remainingAmountIn,
      completionPercentage,
      fillCount: order.fills.length,
      averageFillSize: order.fills.length > 0 ? 
        order.fills.reduce((sum, fill) => sum + parseFloat(fill.amountIn), 0) / order.fills.length : 0,
      estimatedCompletion: this.estimateCompletion(order)
    };
  }

  /**
   * Estimate completion time
   */
  estimateCompletion(order) {
    if (order.fills.length < 2) return 'Unknown';
    
    const avgFillInterval = (Date.now() - order.createdAt) / order.fills.length;
    const remainingFills = Math.ceil(
      parseFloat(order.remainingAmountIn) / 
      (order.fills.reduce((sum, fill) => sum + parseFloat(fill.amountIn), 0) / order.fills.length)
    );
    
    return Date.now() + (avgFillInterval * remainingFills);
  }

  /**
   * Estimate number of fills needed
   */
  estimateFillCount(order) {
    const avgFillSize = ethers.parseEther('1000'); // Assume $1000 average fill
    return Math.ceil(parseFloat(order.totalAmountIn) / parseFloat(avgFillSize));
  }

  /**
   * Get analytics
   */
  getAnalytics() {
    const allOrders = Array.from(this.partialOrders.values());
    const allFills = Array.from(this.fillHistory.values());
    
    return {
      totalOrders: allOrders.length,
      completedOrders: allOrders.filter(o => o.status === 'completed').length,
      totalFills: allFills.length,
      averageFillSize: allFills.reduce((sum, fill) => sum + parseFloat(fill.amountIn), 0) / (allFills.length || 1),
      totalVolume: allFills.reduce((sum, fill) => sum + parseFloat(fill.amountIn), 0),
      activeLPs: Array.from(this.liquidityProviders.values()).filter(lp => lp.isActive).length
    };
  }

  /**
   * Generate IDs
   */
  generateOrderId() {
    return `pf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateProviderId() {
    return `lp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateFillId() {
    return `fill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateTxHash() {
    return ethers.keccak256(ethers.toUtf8Bytes(`${Date.now()}_${Math.random()}`));
  }
}

// Create and export the service instance
const partialFillEngine = new PartialFillEngine();
export default partialFillEngine;
