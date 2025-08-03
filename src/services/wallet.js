import { ethers } from 'ethers';

class WalletService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.chainId = null;
    this.isConnected = false;
  }

  // Check if MetaMask is available
  isMetaMaskAvailable() {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  }

  // Connect to wallet
  async connect() {
    try {
      if (!this.isMetaMaskAvailable()) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Create provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      this.address = await this.signer.getAddress();

      // Get network info
      const network = await this.provider.getNetwork();
      this.chainId = Number(network.chainId);

      this.isConnected = true;

      // Listen for account changes
      window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
      
      // Listen for chain changes
      window.ethereum.on('chainChanged', this.handleChainChanged.bind(this));

      return {
        address: this.address,
        chainId: this.chainId
      };
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }

  // Disconnect wallet
  disconnect() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.chainId = null;
    this.isConnected = false;

    // Remove listeners
    if (window.ethereum) {
      window.ethereum.removeAllListeners('accountsChanged');
      window.ethereum.removeAllListeners('chainChanged');
    }
  }

  // Handle account changes
  handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      // User disconnected
      this.disconnect();
      window.location.reload();
    } else {
      // User switched accounts
      window.location.reload();
    }
  }

  // Handle chain changes
  handleChainChanged(chainId) {
    // Reload the page when chain changes
    window.location.reload();
  }

  // Switch to a specific chain
  async switchChain(chainId) {
    try {
      if (!this.isMetaMaskAvailable()) {
        throw new Error('MetaMask is not available');
      }

      const chainIdHex = `0x${chainId.toString(16)}`;
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }]
      });

      // Update local chain ID
      this.chainId = chainId;
      
      return true;
    } catch (error) {
      // If the chain is not added to MetaMask, add it
      if (error.code === 4902) {
        return await this.addChain(chainId);
      }
      console.error('Error switching chain:', error);
      throw error;
    }
  }

  // Add a new chain to MetaMask
  async addChain(chainId) {
    try {
      const chainConfig = this.getChainConfig(chainId);
      
      if (!chainConfig) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
      }

      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [chainConfig]
      });

      this.chainId = chainId;
      return true;
    } catch (error) {
      console.error('Error adding chain:', error);
      throw error;
    }
  }

  // Get chain configuration for adding to MetaMask
  getChainConfig(chainId) {
    const chainConfigs = {
      1: {
        chainId: '0x1',
        chainName: 'Ethereum Mainnet',
        nativeCurrency: {
          name: 'Ethereum',
          symbol: 'ETH',
          decimals: 18
        },
        rpcUrls: ['https://mainnet.infura.io/v3/'],
        blockExplorerUrls: ['https://etherscan.io/']
      },
      137: {
        chainId: '0x89',
        chainName: 'Polygon Mainnet',
        nativeCurrency: {
          name: 'MATIC',
          symbol: 'MATIC',
          decimals: 18
        },
        rpcUrls: ['https://polygon-rpc.com/'],
        blockExplorerUrls: ['https://polygonscan.com/']
      },
      56: {
        chainId: '0x38',
        chainName: 'BNB Smart Chain',
        nativeCurrency: {
          name: 'BNB',
          symbol: 'BNB',
          decimals: 18
        },
        rpcUrls: ['https://bsc-dataseed.binance.org/'],
        blockExplorerUrls: ['https://bscscan.com/']
      }
    };

    return chainConfigs[chainId];
  }

  // Get current wallet state
  getWalletState() {
    return {
      isConnected: this.isConnected,
      address: this.address,
      chainId: this.chainId,
      provider: this.provider,
      signer: this.signer
    };
  }

  // Format address for display
  formatAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Get ETH balance
  async getBalance(address = null) {
    try {
      if (!this.provider) {
        throw new Error('Provider not available');
      }

      const targetAddress = address || this.address;
      if (!targetAddress) {
        throw new Error('No address provided');
      }

      const balance = await this.provider.getBalance(targetAddress);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  }

  // Get token balance
  async getTokenBalance(tokenAddress, address = null) {
    try {
      if (!this.provider) {
        throw new Error('Provider not available');
      }

      const targetAddress = address || this.address;
      if (!targetAddress) {
        throw new Error('No address provided');
      }

      // ERC20 ABI for balance function
      const erc20Abi = [
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)'
      ];

      const contract = new ethers.Contract(tokenAddress, erc20Abi, this.provider);
      const [balance, decimals] = await Promise.all([
        contract.balanceOf(targetAddress),
        contract.decimals()
      ]);

      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      console.error('Error getting token balance:', error);
      throw error;
    }
  }

  // Check if wallet is connected and on the correct chain
  async validateConnection(requiredChainId = null) {
    if (!this.isConnected) {
      throw new Error('Wallet not connected');
    }

    if (requiredChainId && this.chainId !== requiredChainId) {
      throw new Error(`Please switch to chain ${requiredChainId}`);
    }

    return true;
  }

  // Auto-connect if previously connected
  async autoConnect() {
    try {
      if (!this.isMetaMaskAvailable()) {
        return false;
      }

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length > 0) {
        await this.connect();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error auto-connecting:', error);
      return false;
    }
  }
}

// Create and export the service instance
const walletService = new WalletService();
export default walletService;
