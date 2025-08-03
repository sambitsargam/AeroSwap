import { ethers } from 'ethers';

// 1inch API configuration
const ONEINCH_API_BASE = 'https://api.1inch.dev';
const SUPPORTED_CHAINS = {
  1: { name: 'Ethereum', id: 1, symbol: 'ETH' },
  137: { name: 'Polygon', id: 137, symbol: 'MATIC' },
  56: { name: 'BNB Chain', id: 56, symbol: 'BNB' }
};

// 1inch Router contract addresses
const ROUTER_ADDRESSES = {
  1: '0x111111125421ca6dc452d289314280a0f8842a65',
  137: '0x111111125421ca6dc452d289314280a0f8842a65',
  56: '0x111111125421ca6dc452d289314280a0f8842a65'
};

class OneInchService {
  constructor() {
    // Get API key from environment variable
    this.apiKey = process.env.REACT_APP_ONEINCH_API_KEY || null;
    
    if (this.apiKey) {
      console.log('✅ 1inch API key loaded successfully');
    } else {
      console.warn('⚠️ 1inch API key not found. Some features may be rate limited.');
    }
  }

  // Get headers for API requests
  getHeaders() {
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    
    return headers;
  }

  // Fetch supported tokens for a chain
  async getTokens(chainId) {
    try {
      const response = await fetch(
        `${ONEINCH_API_BASE}/swap/v6.0/${chainId}/tokens`,
        {
          headers: this.getHeaders()
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tokens: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.tokens;
    } catch (error) {
      console.error('Error fetching tokens:', error);
      throw error;
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
