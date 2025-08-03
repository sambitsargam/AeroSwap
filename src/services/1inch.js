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

  // Get quote for a swap
  async getQuote(params) {
    const { chainId, src, dst, amount } = params;
    
    try {
      const queryParams = new URLSearchParams({
        src,
        dst,
        amount: amount.toString(),
        includeTokensInfo: 'true',
        includeProtocols: 'true'
      });

      const response = await fetch(
        `${ONEINCH_API_BASE}/swap/v6.0/${chainId}/quote?${queryParams}`,
        {
          headers: this.getHeaders()
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.description || `Quote failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting quote:', error);
      throw error;
    }
  }

  // Get swap transaction data
  async getSwap(params) {
    const { chainId, src, dst, amount, from, slippage = 1 } = params;
    
    try {
      const queryParams = new URLSearchParams({
        src,
        dst,
        amount: amount.toString(),
        from,
        slippage: slippage.toString(),
        disableEstimate: 'true'
      });

      const response = await fetch(
        `${ONEINCH_API_BASE}/swap/v6.0/${chainId}/swap?${queryParams}`,
        {
          headers: this.getHeaders()
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.description || `Swap failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting swap data:', error);
      throw error;
    }
  }

  // Check if token needs approval
  async checkAllowance(tokenAddress, ownerAddress, chainId, provider) {
    try {
      const routerAddress = ROUTER_ADDRESSES[chainId];
      if (!routerAddress) {
        throw new Error(`Unsupported chain: ${chainId}`);
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
      throw error;
    }
  }

  // Approve token for 1inch router
  async approveToken(tokenAddress, amount, chainId, signer) {
    try {
      const routerAddress = ROUTER_ADDRESSES[chainId];
      if (!routerAddress) {
        throw new Error(`Unsupported chain: ${chainId}`);
      }

      // ERC20 ABI for approve function
      const erc20Abi = [
        'function approve(address spender, uint256 amount) returns (bool)'
      ];

      const contract = new ethers.Contract(tokenAddress, erc20Abi, signer);
      
      // Use maximum uint256 for unlimited approval
      const maxAmount = ethers.MaxUint256;
      const tx = await contract.approve(routerAddress, maxAmount);
      
      return tx;
    } catch (error) {
      console.error('Error approving token:', error);
      throw error;
    }
  }

  // Execute swap transaction
  async executeSwap(swapData, signer) {
    try {
      const { tx } = swapData;
      
      const transaction = {
        to: tx.to,
        data: tx.data,
        value: tx.value || '0',
        gasLimit: tx.gas,
        gasPrice: tx.gasPrice
      };

      const txResponse = await signer.sendTransaction(transaction);
      return txResponse;
    } catch (error) {
      console.error('Error executing swap:', error);
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
