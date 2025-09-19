import { ethers } from 'ethers';

class WalletService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.chainId = null;
    this.isConnected = false;
  }

  // Initialize with AppKit provider
  setProvider(provider) {
    if (provider) {
      this.provider = new ethers.BrowserProvider(provider);
      this.isConnected = true;
    }
  }

  // Update wallet state from AppKit
  async updateWalletState(address, chainId) {
    this.address = address;
    this.chainId = parseInt(chainId);

    if (this.provider) {
      this.signer = await this.provider.getSigner();
    }
  }

  // Clear wallet state
  clearWalletState() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.chainId = null;
    this.isConnected = false;
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

  // Switch to a specific chain using AppKit
  async switchChain(chainId) {
    try {
      // AppKit handles chain switching internally
      // This is just a placeholder for compatibility
      console.log(`Switching to chain ${chainId}`);
      return true;
    } catch (error) {
      console.error('Error switching chain:', error);
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

  // Format address for display
  formatAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}

// Create and export the service instance
const walletService = new WalletService();
export default walletService;
