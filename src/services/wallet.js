import { ethers } from 'ethers';
import { SUPPORTED_CHAINS } from './1inch';

class WalletService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.account = null;
    this.chainId = null;
  }

  /**
   * Check if MetaMask is installed
   */
  isMetaMaskInstalled() {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  }

  /**
   * Connect to MetaMask wallet
   */
  async connect() {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      // Create provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      this.account = accounts[0];

      // Get current chain ID
      const network = await this.provider.getNetwork();
      this.chainId = Number(network.chainId);

      // Set up event listeners
      this.setupEventListeners();

      return {
        account: this.account,
        chainId: this.chainId,
      };
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      throw new Error(`Failed to connect wallet: ${error.message}`);
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect() {
    this.provider = null;
    this.signer = null;
    this.account = null;
    this.chainId = null;
  }

  /**
   * Switch to a specific chain
   */
  async switchChain(targetChainId) {
    if (!this.provider) {
      throw new Error('Wallet not connected');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });

      this.chainId = targetChainId;
      return true;
    } catch (error) {
      // Chain not added to MetaMask
      if (error.code === 4902) {
        return await this.addChain(targetChainId);
      }
      throw new Error(`Failed to switch chain: ${error.message}`);
    }
  }

  /**
   * Add a new chain to MetaMask
   */
  async addChain(chainId) {
    const chainConfig = SUPPORTED_CHAINS[chainId];
    if (!chainConfig) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: `0x${chainId.toString(16)}`,
            chainName: chainConfig.name,
            nativeCurrency: {
              name: chainConfig.name,
              symbol: chainConfig.symbol,
              decimals: chainConfig.decimals,
            },
            rpcUrls: [chainConfig.rpcUrl],
            blockExplorerUrls: [chainConfig.explorer],
          },
        ],
      });

      this.chainId = chainId;
      return true;
    } catch (error) {
      throw new Error(`Failed to add chain: ${error.message}`);
    }
  }

  /**
   * Get account balance
   */
  async getBalance(address = null) {
    if (!this.provider) {
      throw new Error('Wallet not connected');
    }

    try {
      const account = address || this.account;
      const balance = await this.provider.getBalance(account);
      return ethers.formatEther(balance);
    } catch (error) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  /**
   * Get ERC20 token balance
   */
  async getTokenBalance(tokenAddress, address = null) {
    if (!this.provider) {
      throw new Error('Wallet not connected');
    }

    try {
      const account = address || this.account;
      const tokenContract = new ethers.Contract(
        tokenAddress,
        [
          'function balanceOf(address) view returns (uint256)',
          'function decimals() view returns (uint8)',
        ],
        this.provider
      );

      const [balance, decimals] = await Promise.all([
        tokenContract.balanceOf(account),
        tokenContract.decimals(),
      ]);

      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      throw new Error(`Failed to get token balance: ${error.message}`);
    }
  }

  /**
   * Send transaction
   */
  async sendTransaction(txData) {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const tx = await this.signer.sendTransaction(txData);
      return tx;
    } catch (error) {
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(txData) {
    if (!this.provider) {
      throw new Error('Wallet not connected');
    }

    try {
      const gasEstimate = await this.provider.estimateGas(txData);
      return gasEstimate;
    } catch (error) {
      throw new Error(`Failed to estimate gas: ${error.message}`);
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice() {
    if (!this.provider) {
      throw new Error('Wallet not connected');
    }

    try {
      const feeData = await this.provider.getFeeData();
      return feeData.gasPrice;
    } catch (error) {
      throw new Error(`Failed to get gas price: ${error.message}`);
    }
  }

  /**
   * Setup event listeners for account and chain changes
   */
  setupEventListeners() {
    if (!window.ethereum) return;

    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        this.disconnect();
        window.location.reload();
      } else if (accounts[0] !== this.account) {
        this.account = accounts[0];
        window.location.reload();
      }
    });

    window.ethereum.on('chainChanged', (chainId) => {
      this.chainId = parseInt(chainId, 16);
      window.location.reload();
    });
  }

  /**
   * Check if currently connected
   */
  isConnected() {
    return this.account !== null && this.provider !== null;
  }

  /**
   * Get current account
   */
  getAccount() {
    return this.account;
  }

  /**
   * Get current chain ID
   */
  getChainId() {
    return this.chainId;
  }
}

export default new WalletService();
