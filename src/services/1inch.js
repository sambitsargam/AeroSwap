import axios from 'axios';

// 1inch API base URLs for different chains
const API_BASE_URLS = {
  1: 'https://api.1inch.dev/swap/v6.0/1',     // Ethereum
  137: 'https://api.1inch.dev/swap/v6.0/137', // Polygon
  56: 'https://api.1inch.dev/swap/v6.0/56',   // BNB Chain
};

// 1inch Router contract addresses
export const ROUTER_ADDRESSES = {
  1: '0x111111125421cA6dc452d289314280a0f8842A65',   // Ethereum
  137: '0x111111125421cA6dc452d289314280a0f8842A65', // Polygon
  56: '0x111111125421cA6dc452d289314280a0f8842A65',  // BNB Chain
};

// Chain configurations
export const SUPPORTED_CHAINS = {
  1: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://eth.public-rpc.com',
    explorer: 'https://etherscan.io',
  },
  137: {
    name: 'Polygon',
    symbol: 'MATIC',
    decimals: 18,
    rpcUrl: 'https://polygon-rpc.com',
    explorer: 'https://polygonscan.com',
  },
  56: {
    name: 'BNB Chain',
    symbol: 'BNB',
    decimals: 18,
    rpcUrl: 'https://bsc-dataseed.binance.org',
    explorer: 'https://bscscan.com',
  },
};

class OneInchService {
  constructor() {
    this.apiKey = process.env.REACT_APP_1INCH_API_KEY;
  }

  getHeaders() {
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    
    return headers;
  }

  /**
   * Get list of tokens available for a specific chain
   */
  async getTokens(chainId) {
    try {
      const baseUrl = API_BASE_URLS[chainId];
      if (!baseUrl) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
      }

      const response = await axios.get(`${baseUrl}/tokens`, {
        headers: this.getHeaders(),
      });

      return response.data.tokens;
    } catch (error) {
      console.error('Error fetching tokens:', error);
      throw new Error(`Failed to fetch tokens: ${error.message}`);
    }
  }

  /**
   * Get quote for token swap
   */
  async getQuote(chainId, params) {
    try {
      const baseUrl = API_BASE_URLS[chainId];
      if (!baseUrl) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
      }

      const queryParams = new URLSearchParams({
        src: params.fromToken,
        dst: params.toToken,
        amount: params.amount,
        includeTokensInfo: 'true',
        includeProtocols: 'true',
        includeGas: 'true',
      });

      const response = await axios.get(`${baseUrl}/quote?${queryParams}`, {
        headers: this.getHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error('Error getting quote:', error);
      throw new Error(`Failed to get quote: ${error.message}`);
    }
  }

  /**
   * Get swap transaction data
   */
  async getSwap(chainId, params) {
    try {
      const baseUrl = API_BASE_URLS[chainId];
      if (!baseUrl) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
      }

      const queryParams = new URLSearchParams({
        src: params.fromToken,
        dst: params.toToken,
        amount: params.amount,
        from: params.from,
        slippage: params.slippage || '1',
        disableEstimate: 'false',
        allowPartialFill: 'false',
      });

      const response = await axios.get(`${baseUrl}/swap?${queryParams}`, {
        headers: this.getHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error('Error getting swap data:', error);
      throw new Error(`Failed to get swap data: ${error.message}`);
    }
  }

  /**
   * Get allowance for a token
   */
  async getAllowance(chainId, params) {
    try {
      const baseUrl = API_BASE_URLS[chainId];
      if (!baseUrl) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
      }

      const queryParams = new URLSearchParams({
        tokenAddress: params.tokenAddress,
        walletAddress: params.walletAddress,
      });

      const response = await axios.get(`${baseUrl}/approve/allowance?${queryParams}`, {
        headers: this.getHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error('Error getting allowance:', error);
      throw new Error(`Failed to get allowance: ${error.message}`);
    }
  }

  /**
   * Get approve transaction data
   */
  async getApprove(chainId, params) {
    try {
      const baseUrl = API_BASE_URLS[chainId];
      if (!baseUrl) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
      }

      const queryParams = new URLSearchParams({
        tokenAddress: params.tokenAddress,
        amount: params.amount || '115792089237316195423570985008687907853269984665640564039457584007913129639935', // Max uint256
      });

      const response = await axios.get(`${baseUrl}/approve/transaction?${queryParams}`, {
        headers: this.getHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error('Error getting approve data:', error);
      throw new Error(`Failed to get approve data: ${error.message}`);
    }
  }

  /**
   * Check if token needs approval
   */
  async checkApproval(chainId, tokenAddress, walletAddress, amount) {
    try {
      const allowanceData = await this.getAllowance(chainId, {
        tokenAddress,
        walletAddress,
      });

      const allowance = BigInt(allowanceData.allowance);
      const requiredAmount = BigInt(amount);

      return allowance >= requiredAmount;
    } catch (error) {
      console.error('Error checking approval:', error);
      return false;
    }
  }
}

export default new OneInchService();
