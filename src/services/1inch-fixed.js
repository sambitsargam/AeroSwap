import { ethers } from 'ethers';

// 1inch API configuration - Updated for v6.0
const ONEINCH_API_BASE = 'https://api.1inch.dev';
const SUPPORTED_CHAINS = {
  1: { name: 'Ethereum', id: 1, symbol: 'ETH' },
  137: { name: 'Polygon', id: 137, symbol: 'MATIC' },
  56: { name: 'BNB Chain', id: 56, symbol: 'BNB' },
  42161: { name: 'Arbitrum', id: 42161, symbol: 'ETH' },
  10: { name: 'Optimism', id: 10, symbol: 'ETH' },
  43114: { name: 'Avalanche', id: 43114, symbol: 'AVAX' }
};

// 1inch Router contract addresses (v6.0)
const ROUTER_ADDRESSES = {
  1: '0x111111125421ca6dc452d289314280a0f8842a65',
  137: '0x111111125421ca6dc452d289314280a0f8842a65',
  56: '0x111111125421ca6dc452d289314280a0f8842a65',
  42161: '0x111111125421ca6dc452d289314280a0f8842a65',
  10: '0x111111125421ca6dc452d289314280a0f8842a65',
  43114: '0x111111125421ca6dc452d289314280a0f8842a65'
};

class OneInchService {
  constructor() {
    // Get API key from environment variable
    this.apiKey = process.env.REACT_APP_ONEINCH_API_KEY || null;
    this.requestCount = 0;
    this.lastRequestTime = 0;
    this.rateLimitDelay = 100; // Minimum delay between requests (ms)
    
    if (this.apiKey) {
      console.log('✅ 1inch API key loaded successfully');
    } else {
      console.warn('⚠️ 1inch API key not found. Some features may be rate limited.');
    }
  }

  // Rate limiting helper
  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const delay = this.rateLimitDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  // Get headers for API requests with improved error handling
  getHeaders() {
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    };
    
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    
    return headers;
  }

  // Enhanced fetch with retry logic and better error handling
  async fetchWithRetry(url, options = {}, maxRetries = 3) {
    await this.waitForRateLimit();
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            ...this.getHeaders(),
            ...options.headers
          }
        });
        
        clearTimeout(timeoutId);
        
        // Handle different HTTP status codes
        if (response.ok) {
          return response;
        }
        
        // Handle specific error codes
        if (response.status === 429) {
          // Rate limited - wait and retry
          const retryAfter = response.headers.get('Retry-After') || 1;
          console.warn(`Rate limited. Waiting ${retryAfter}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          continue;
        }
        
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your 1inch API key configuration.');
        }
        
        if (response.status === 400) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.description || errorData.message || 'Bad request - check your parameters');
        }
        
        if (response.status >= 500) {
          // Server error - retry
          if (attempt < maxRetries) {
            console.warn(`Server error (${response.status}). Retrying attempt ${attempt + 1}...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        
      } catch (error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - 1inch API is taking too long to respond');
        }
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        console.warn(`Attempt ${attempt} failed:`, error.message);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // Fetch supported tokens for a chain
  async getTokens(chainId) {
    try {
      if (!this.isChainSupported(chainId)) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
      }

      const response = await this.fetchWithRetry(
        `${ONEINCH_API_BASE}/swap/v6.0/${chainId}/tokens`
      );
      
      const data = await response.json();
      
      // Validate response structure
      if (!data.tokens) {
        console.warn('Invalid tokens response structure, using fallback');
        return this.getPopularTokens(chainId);
      }
      
      return data.tokens;
    } catch (error) {
      console.error('Error fetching tokens:', error);
      // Return popular tokens as fallback
      console.log('Using fallback tokens...');
      return this.getPopularTokens(chainId);
    }
  }

  // Get quote for a swap with enhanced error handling
  async getQuote(params) {
    const { chainId, src, dst, amount } = params;
    
    try {
      // Validate parameters
      if (!chainId || !src || !dst || !amount) {
        throw new Error('Missing required parameters: chainId, src, dst, amount');
      }
      
      if (!this.isChainSupported(chainId)) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
      }
      
      // Validate amount is positive
      if (parseFloat(amount) <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      const queryParams = new URLSearchParams({
        src: src.toLowerCase(),
        dst: dst.toLowerCase(),
        amount: amount.toString(),
        includeTokensInfo: 'true',
        includeProtocols: 'true',
        fee: '0', // No fee for quotes
        gasLimit: '750000', // Default gas limit
        complexityLevel: '2', // Balanced complexity
        mainRouteParts: '10', // Number of main route parts
        parts: '50' // Total number of parts
      });

      const response = await this.fetchWithRetry(
        `${ONEINCH_API_BASE}/swap/v6.0/${chainId}/quote?${queryParams}`
      );
      
      const data = await response.json();
      
      // Validate response structure
      if (!data.dstAmount) {
        throw new Error('Invalid quote response - missing destination amount');
      }
      
      return {
        ...data,
        // Add calculated fields for better UX
        estimatedGas: data.estimatedGas || '150000',
        priceImpact: this.calculatePriceImpact(data),
        route: data.protocols || []
      };
    } catch (error) {
      console.error('Error getting quote:', error);
      
      // Provide more specific error messages
      if (error.message.includes('insufficient liquidity')) {
        throw new Error('Insufficient liquidity for this trading pair. Try a smaller amount.');
      }
      
      if (error.message.includes('cannot estimate')) {
        throw new Error('Cannot estimate this trade. The tokens may not be tradeable on this network.');
      }
      
      throw error;
    }
  }

  // Get swap transaction data with enhanced validation
  async getSwap(params) {
    const { chainId, src, dst, amount, from, slippage = 1 } = params;
    
    try {
      // Validate parameters
      if (!chainId || !src || !dst || !amount || !from) {
        throw new Error('Missing required parameters: chainId, src, dst, amount, from');
      }
      
      if (!this.isChainSupported(chainId)) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
      }
      
      // Validate slippage
      if (slippage < 0.1 || slippage > 50) {
        throw new Error('Slippage must be between 0.1% and 50%');
      }
      
      // Validate Ethereum address format
      if (!ethers.isAddress(from)) {
        throw new Error('Invalid from address format');
      }

      const queryParams = new URLSearchParams({
        src: src.toLowerCase(),
        dst: dst.toLowerCase(),
        amount: amount.toString(),
        from: from.toLowerCase(),
        slippage: slippage.toString(),
        disableEstimate: 'false', // Enable gas estimation
        allowPartialFill: 'false', // Disable partial fills for safety
        fee: '0',
        gasLimit: '750000',
        complexityLevel: '2',
        mainRouteParts: '10',
        parts: '50'
      });

      const response = await this.fetchWithRetry(
        `${ONEINCH_API_BASE}/swap/v6.0/${chainId}/swap?${queryParams}`
      );
      
      const data = await response.json();
      
      // Validate transaction data
      if (!data.tx) {
        throw new Error('Invalid swap response - missing transaction data');
      }
      
      if (!data.tx.to || !data.tx.data) {
        throw new Error('Invalid transaction data - missing required fields');
      }
      
      return {
        ...data,
        // Add safety checks
        tx: {
          ...data.tx,
          // Ensure gas limit is reasonable
          gasLimit: data.tx.gasLimit || '750000',
          // Ensure value is properly formatted
          value: data.tx.value || '0'
        }
      };
    } catch (error) {
      console.error('Error getting swap data:', error);
      
      // Provide specific error messages
      if (error.message.includes('insufficient allowance')) {
        throw new Error('Insufficient token allowance. Please approve the token first.');
      }
      
      if (error.message.includes('insufficient balance')) {
        throw new Error('Insufficient token balance for this transaction.');
      }
      
      throw error;
    }
  }

  // Calculate price impact (helper method)
  calculatePriceImpact(quoteData) {
    try {
      if (!quoteData.srcAmount || !quoteData.dstAmount) {
        return '0';
      }
      
      // This is a simplified price impact calculation
      // In a real implementation, you'd need market price data
      const srcAmount = parseFloat(quoteData.srcAmount);
      const dstAmount = parseFloat(quoteData.dstAmount);
      
      if (srcAmount === 0 || dstAmount === 0) {
        return '0';
      }
      
      // For demonstration purposes - actual calculation would require market prices
      return '0.1'; // Return 0.1% as default
    } catch (error) {
      console.warn('Error calculating price impact:', error);
      return '0';
    }
  }

  // Check if token needs approval with enhanced error handling
  async checkAllowance(tokenAddress, ownerAddress, chainId, provider) {
    try {
      const routerAddress = ROUTER_ADDRESSES[chainId];
      if (!routerAddress) {
        throw new Error(`Unsupported chain: ${chainId}`);
      }

      // Validate addresses
      if (!ethers.isAddress(tokenAddress) || !ethers.isAddress(ownerAddress)) {
        throw new Error('Invalid token or owner address format');
      }

      // ERC20 ABI for allowance function
      const erc20Abi = [
        'function allowance(address owner, address spender) view returns (uint256)'
      ];

      const contract = new ethers.Contract(tokenAddress, erc20Abi, provider);
      const allowance = await contract.allowance(ownerAddress, routerAddress);
      
      return allowance;
    } catch (error) {
      console.error('Error checking allowance:', error);
      
      if (error.message.includes('call revert exception')) {
        throw new Error('Unable to check token allowance. The token contract may not be valid.');
      }
      
      throw error;
    }
  }

  // Approve token spending with better error handling
  async approveToken(tokenAddress, spenderAddress, amount, signer) {
    try {
      // Validate addresses
      if (!ethers.isAddress(tokenAddress) || !ethers.isAddress(spenderAddress)) {
        throw new Error('Invalid token or spender address format');
      }

      const erc20Abi = [
        'function approve(address spender, uint256 amount) returns (bool)'
      ];

      const contract = new ethers.Contract(tokenAddress, erc20Abi, signer);
      
      // Use maximum allowance for better UX (avoids repeated approvals)
      const maxAllowance = ethers.MaxUint256;
      
      const tx = await contract.approve(spenderAddress, maxAllowance);
      
      console.log(`Approval transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      
      if (receipt.status !== 1) {
        throw new Error('Approval transaction failed');
      }
      
      return receipt;
    } catch (error) {
      console.error('Error approving token:', error);
      
      if (error.code === 'ACTION_REJECTED') {
        throw new Error('Transaction was rejected by user');
      }
      
      if (error.message.includes('insufficient funds')) {
        throw new Error('Insufficient ETH for transaction fees');
      }
      
      throw error;
    }
  }

  // Get popular tokens for a chain (fallback if API fails)
  getPopularTokens(chainId) {
    const popularTokens = {
      1: [
        {
          address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
          symbol: 'ETH',
          name: 'Ethereum',
          decimals: 18
        },
        {
          address: '0xa0b86a33e6441b8c4a0ffe1d7a6c78b4e123d25e',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6
        },
        {
          address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
          symbol: 'USDT',
          name: 'Tether USD',
          decimals: 6
        }
      ],
      137: [
        {
          address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
          symbol: 'MATIC',
          name: 'Polygon',
          decimals: 18
        },
        {
          address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6
        }
      ]
    };

    return popularTokens[chainId] || [];
  }

  // Format amount with proper decimals
  formatAmount(amount, decimals) {
    return ethers.parseUnits(amount.toString(), decimals);
  }

  // Parse amount from wei
  parseAmount(amount, decimals) {
    return ethers.formatUnits(amount.toString(), decimals);
  }

  // Get supported chains
  getSupportedChains() {
    return SUPPORTED_CHAINS;
  }

  // Validate chain support
  isChainSupported(chainId) {
    return chainId in SUPPORTED_CHAINS;
  }
}

// Create and export the service instance
const oneInchService = new OneInchService();
export default oneInchService;
