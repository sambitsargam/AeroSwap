/**
 * WalletConnect Utilities
 * Utility functions for common WalletConnect operations
 */

import { ethers } from 'ethers';
import { formatJsonRpcRequest } from '@walletconnect/utils';
import walletConnectService from './walletconnect';

/**
 * Chain configurations
 */
export const CHAIN_CONFIGS = {
  1: {
    chainId: '0x1',
    chainName: 'Ethereum Mainnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.infura.io/v3/YOUR_INFURA_KEY'],
    blockExplorerUrls: ['https://etherscan.io']
  },
  137: {
    chainId: '0x89',
    chainName: 'Polygon Mainnet',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    rpcUrls: ['https://polygon-rpc.com'],
    blockExplorerUrls: ['https://polygonscan.com']
  },
  56: {
    chainId: '0x38',
    chainName: 'Binance Smart Chain',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: ['https://bsc-dataseed.binance.org'],
    blockExplorerUrls: ['https://bscscan.com']
  },
  42161: {
    chainId: '0xa4b1',
    chainName: 'Arbitrum One',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://arbiscan.io']
  },
  10: {
    chainId: '0xa',
    chainName: 'Optimism',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.optimism.io'],
    blockExplorerUrls: ['https://optimistic.etherscan.io']
  },
  43114: {
    chainId: '0xa86a',
    chainName: 'Avalanche C-Chain',
    nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
    rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
    blockExplorerUrls: ['https://snowtrace.io']
  },
  250: {
    chainId: '0xfa',
    chainName: 'Fantom Opera',
    nativeCurrency: { name: 'FTM', symbol: 'FTM', decimals: 18 },
    rpcUrls: ['https://rpc.ftm.tools'],
    blockExplorerUrls: ['https://ftmscan.com']
  }
};

/**
 * WalletConnect utility class
 */
export class WalletConnectUtils {
  constructor() {
    this.provider = null;
    this.signer = null;
  }

  /**
   * Set provider (from AppKit or WalletConnect)
   */
  setProvider(provider) {
    this.provider = provider;
    if (provider) {
      this.signer = new ethers.BrowserProvider(provider).getSigner();
    }
  }

  /**
   * Get account information
   */
  async getAccountInfo() {
    try {
      if (!this.provider) throw new Error('No provider available');

      const accounts = await this.provider.request({
        method: 'eth_accounts'
      });

      const chainId = await this.provider.request({
        method: 'eth_chainId'
      });

      return {
        accounts,
        chainId: parseInt(chainId, 16),
        address: accounts[0] || null
      };
    } catch (error) {
      console.error('Error getting account info:', error);
      throw error;
    }
  }

  /**
   * Get balance for an address
   */
  async getBalance(address, chainId = null) {
    try {
      if (!this.provider) throw new Error('No provider available');

      const balance = await this.provider.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });

      return {
        wei: balance,
        ether: ethers.formatEther(balance),
        formatted: parseFloat(ethers.formatEther(balance)).toFixed(4)
      };
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  }

  /**
   * Sign a personal message
   */
  async signPersonalMessage(message, address) {
    try {
      if (!this.provider) throw new Error('No provider available');

      const signature = await this.provider.request({
        method: 'personal_sign',
        params: [ethers.hexlify(ethers.toUtf8Bytes(message)), address]
      });

      return signature;
    } catch (error) {
      console.error('Error signing personal message:', error);
      throw error;
    }
  }

  /**
   * Sign typed data (EIP-712)
   */
  async signTypedData(typedData, address) {
    try {
      if (!this.provider) throw new Error('No provider available');

      const signature = await this.provider.request({
        method: 'eth_signTypedData_v4',
        params: [address, JSON.stringify(typedData)]
      });

      return signature;
    } catch (error) {
      console.error('Error signing typed data:', error);
      throw error;
    }
  }

  /**
   * Send a transaction
   */
  async sendTransaction(transaction) {
    try {
      if (!this.provider) throw new Error('No provider available');

      // Ensure transaction has required fields
      const tx = {
        to: transaction.to,
        value: transaction.value || '0x0',
        gas: transaction.gas || transaction.gasLimit,
        gasPrice: transaction.gasPrice,
        data: transaction.data || '0x',
        ...transaction
      };

      const txHash = await this.provider.request({
        method: 'eth_sendTransaction',
        params: [tx]
      });

      return txHash;
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  }

  /**
   * Switch to a different chain
   */
  async switchChain(chainId) {
    try {
      if (!this.provider) throw new Error('No provider available');

      const hexChainId = `0x${chainId.toString(16)}`;

      try {
        // Try to switch to the chain
        await this.provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: hexChainId }]
        });
      } catch (switchError) {
        // If the chain doesn't exist, add it
        if (switchError.code === 4902) {
          await this.addChain(chainId);
        } else {
          throw switchError;
        }
      }
    } catch (error) {
      console.error('Error switching chain:', error);
      throw error;
    }
  }

  /**
   * Add a new chain to the wallet
   */
  async addChain(chainId) {
    try {
      if (!this.provider) throw new Error('No provider available');

      const chainConfig = CHAIN_CONFIGS[chainId];
      if (!chainConfig) {
        throw new Error(`Chain ${chainId} not supported`);
      }

      await this.provider.request({
        method: 'wallet_addEthereumChain',
        params: [chainConfig]
      });
    } catch (error) {
      console.error('Error adding chain:', error);
      throw error;
    }
  }

  /**
   * Watch for an asset (ERC-20 token)
   */
  async watchAsset(tokenAddress, tokenSymbol, tokenDecimals = 18, tokenImage = null) {
    try {
      if (!this.provider) throw new Error('No provider available');

      const wasAdded = await this.provider.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: tokenAddress,
            symbol: tokenSymbol,
            decimals: tokenDecimals,
            image: tokenImage
          }
        }
      });

      return wasAdded;
    } catch (error) {
      console.error('Error watching asset:', error);
      throw error;
    }
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash) {
    try {
      if (!this.provider) throw new Error('No provider available');

      const receipt = await this.provider.request({
        method: 'eth_getTransactionReceipt',
        params: [txHash]
      });

      return receipt;
    } catch (error) {
      console.error('Error getting transaction receipt:', error);
      throw error;
    }
  }

  /**
   * Get gas price
   */
  async getGasPrice() {
    try {
      if (!this.provider) throw new Error('No provider available');

      const gasPrice = await this.provider.request({
        method: 'eth_gasPrice'
      });

      return {
        wei: gasPrice,
        gwei: ethers.formatUnits(gasPrice, 'gwei'),
        formatted: parseFloat(ethers.formatUnits(gasPrice, 'gwei')).toFixed(2)
      };
    } catch (error) {
      console.error('Error getting gas price:', error);
      throw error;
    }
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(transaction) {
    try {
      if (!this.provider) throw new Error('No provider available');

      const gasEstimate = await this.provider.request({
        method: 'eth_estimateGas',
        params: [transaction]
      });

      return {
        wei: gasEstimate,
        units: parseInt(gasEstimate, 16),
        formatted: parseInt(gasEstimate, 16).toLocaleString()
      };
    } catch (error) {
      console.error('Error estimating gas:', error);
      throw error;
    }
  }

  /**
   * Get block number
   */
  async getBlockNumber() {
    try {
      if (!this.provider) throw new Error('No provider available');

      const blockNumber = await this.provider.request({
        method: 'eth_blockNumber'
      });

      return parseInt(blockNumber, 16);
    } catch (error) {
      console.error('Error getting block number:', error);
      throw error;
    }
  }

  /**
   * Call a contract method (read-only)
   */
  async callContract(contractAddress, data, blockTag = 'latest') {
    try {
      if (!this.provider) throw new Error('No provider available');

      const result = await this.provider.request({
        method: 'eth_call',
        params: [
          {
            to: contractAddress,
            data: data
          },
          blockTag
        ]
      });

      return result;
    } catch (error) {
      console.error('Error calling contract:', error);
      throw error;
    }
  }
}

/**
 * Utility functions for EIP-712 typed data
 */
export const EIP712Utils = {
  /**
   * Create a basic EIP-712 domain
   */
  createDomain(name, version, chainId, verifyingContract) {
    return {
      name,
      version,
      chainId,
      verifyingContract
    };
  },

  /**
   * Create a typed data structure
   */
  createTypedData(domain, types, primaryType, message) {
    return {
      domain,
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' }
        ],
        ...types
      },
      primaryType,
      message
    };
  },

  /**
   * Create a permit typed data structure
   */
  createPermitTypedData(domain, owner, spender, value, nonce, deadline) {
    return this.createTypedData(
      domain,
      {
        Permit: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ]
      },
      'Permit',
      { owner, spender, value, nonce, deadline }
    );
  }
};

/**
 * Transaction utilities
 */
export const TransactionUtils = {
  /**
   * Create a basic transaction object
   */
  createTransaction(to, value = '0', data = '0x', gasLimit = null, gasPrice = null) {
    const tx = {
      to,
      value: typeof value === 'string' ? value : ethers.parseEther(value.toString()).toString(),
      data
    };

    if (gasLimit) tx.gas = gasLimit;
    if (gasPrice) tx.gasPrice = gasPrice;

    return tx;
  },

  /**
   * Create an ERC-20 transfer transaction
   */
  createERC20Transfer(tokenAddress, to, amount, decimals = 18) {
    const iface = new ethers.Interface([
      'function transfer(address to, uint256 amount) returns (bool)'
    ]);
    
    const data = iface.encodeFunctionData('transfer', [
      to,
      ethers.parseUnits(amount.toString(), decimals)
    ]);

    return this.createTransaction(tokenAddress, '0', data);
  },

  /**
   * Create an ERC-20 approve transaction
   */
  createERC20Approve(tokenAddress, spender, amount, decimals = 18) {
    const iface = new ethers.Interface([
      'function approve(address spender, uint256 amount) returns (bool)'
    ]);
    
    const data = iface.encodeFunctionData('approve', [
      spender,
      ethers.parseUnits(amount.toString(), decimals)
    ]);

    return this.createTransaction(tokenAddress, '0', data);
  }
};

/**
 * Format utilities
 */
export const FormatUtils = {
  /**
   * Format address for display
   */
  formatAddress(address, length = 4) {
    if (!address) return '';
    return `${address.slice(0, 2 + length)}...${address.slice(-length)}`;
  },

  /**
   * Format token amount
   */
  formatTokenAmount(amount, decimals = 18, displayDecimals = 4) {
    const formatted = ethers.formatUnits(amount, decimals);
    return parseFloat(formatted).toFixed(displayDecimals);
  },

  /**
   * Format chain ID to network name
   */
  formatChainId(chainId) {
    const chainNames = {
      1: 'Ethereum',
      137: 'Polygon',
      56: 'BSC',
      42161: 'Arbitrum',
      10: 'Optimism',
      43114: 'Avalanche',
      250: 'Fantom'
    };
    return chainNames[chainId] || `Chain ${chainId}`;
  },

  /**
   * Format gas price
   */
  formatGasPrice(gasPrice, unit = 'gwei') {
    const formatted = ethers.formatUnits(gasPrice, unit);
    return `${parseFloat(formatted).toFixed(2)} ${unit.toUpperCase()}`;
  }
};

// Create singleton instance
export const walletConnectUtils = new WalletConnectUtils();

// Export everything
export default {
  WalletConnectUtils,
  EIP712Utils,
  TransactionUtils,
  FormatUtils,
  CHAIN_CONFIGS,
  walletConnectUtils
};