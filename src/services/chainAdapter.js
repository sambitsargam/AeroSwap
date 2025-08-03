/**
 * Universal Chain Adapter SDK
 * A standardized module for adding new non-EVM chains
 */
class ChainAdapter {
  constructor(chainConfig) {
    this.chainId = chainConfig.chainId;
    this.name = chainConfig.name;
    this.type = chainConfig.type; // 'evm', 'bitcoin', 'solana', 'aptos', etc.
    this.nativeCurrency = chainConfig.nativeCurrency;
    this.rpcUrls = chainConfig.rpcUrls;
    this.blockExplorerUrls = chainConfig.blockExplorerUrls;
    this.contracts = chainConfig.contracts || {};
    this.isTestnet = chainConfig.isTestnet || false;
  }

  /**
   * Initialize connection to the chain
   */
  async initialize() {
    throw new Error('initialize() must be implemented by chain adapter');
  }

  /**
   * Get account balance
   */
  async getBalance(address, tokenAddress = null) {
    throw new Error('getBalance() must be implemented by chain adapter');
  }

  /**
   * Get token information
   */
  async getTokenInfo(tokenAddress) {
    throw new Error('getTokenInfo() must be implemented by chain adapter');
  }

  /**
   * Create a transaction
   */
  async createTransaction(params) {
    throw new Error('createTransaction() must be implemented by chain adapter');
  }

  /**
   * Sign and broadcast transaction
   */
  async sendTransaction(transaction, signer) {
    throw new Error('sendTransaction() must be implemented by chain adapter');
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(txHash) {
    throw new Error('getTransactionStatus() must be implemented by chain adapter');
  }

  /**
   * Estimate transaction fees
   */
  async estimateFees(transaction) {
    throw new Error('estimateFees() must be implemented by chain adapter');
  }
}

/**
 * EVM Chain Adapter (Ethereum, Polygon, BNB, etc.)
 */
class EVMChainAdapter extends ChainAdapter {
  constructor(chainConfig) {
    super(chainConfig);
    this.provider = null;
  }

  async initialize() {
    const { ethers } = await import('ethers');
    this.provider = new ethers.JsonRpcProvider(this.rpcUrls[0]);
    console.log(`✅ EVM Chain ${this.name} initialized`);
  }

  async getBalance(address, tokenAddress = null) {
    if (!tokenAddress) {
      // Native token balance
      const balance = await this.provider.getBalance(address);
      return {
        balance: balance.toString(),
        decimals: 18,
        symbol: this.nativeCurrency.symbol
      };
    } else {
      // ERC-20 token balance
      const { ethers } = await import('ethers');
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'],
        this.provider
      );
      
      const [balance, decimals] = await Promise.all([
        tokenContract.balanceOf(address),
        tokenContract.decimals()
      ]);
      
      return {
        balance: balance.toString(),
        decimals: decimals,
        symbol: 'TOKEN' // Would need to fetch symbol separately
      };
    }
  }

  async getTokenInfo(tokenAddress) {
    const { ethers } = await import('ethers');
    const tokenContract = new ethers.Contract(
      tokenAddress,
      [
        'function name() view returns (string)',
        'function symbol() view returns (string)',
        'function decimals() view returns (uint8)',
        'function totalSupply() view returns (uint256)'
      ],
      this.provider
    );

    const [name, symbol, decimals, totalSupply] = await Promise.all([
      tokenContract.name(),
      tokenContract.symbol(),
      tokenContract.decimals(),
      tokenContract.totalSupply()
    ]);

    return { name, symbol, decimals, totalSupply: totalSupply.toString() };
  }

  async createTransaction(params) {
    return {
      to: params.to,
      value: params.value || '0',
      data: params.data || '0x',
      gasLimit: params.gasLimit,
      gasPrice: params.gasPrice,
      nonce: params.nonce
    };
  }

  async sendTransaction(transaction, signer) {
    const txResponse = await signer.sendTransaction(transaction);
    return {
      hash: txResponse.hash,
      wait: () => txResponse.wait()
    };
  }

  async getTransactionStatus(txHash) {
    const receipt = await this.provider.getTransactionReceipt(txHash);
    return {
      hash: txHash,
      status: receipt ? (receipt.status === 1 ? 'success' : 'failed') : 'pending',
      blockNumber: receipt?.blockNumber,
      gasUsed: receipt?.gasUsed?.toString()
    };
  }

  async estimateFees(transaction) {
    const gasPrice = await this.provider.getFeeData();
    const gasLimit = await this.provider.estimateGas(transaction);
    
    return {
      gasLimit: gasLimit.toString(),
      gasPrice: gasPrice.gasPrice.toString(),
      maxFeePerGas: gasPrice.maxFeePerGas?.toString(),
      maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas?.toString()
    };
  }
}

/**
 * Bitcoin Chain Adapter
 */
class BitcoinChainAdapter extends ChainAdapter {
  constructor(chainConfig) {
    super(chainConfig);
    this.client = null;
  }

  async initialize() {
    // Mock Bitcoin client initialization
    this.client = {
      getBalance: async (address) => ({ balance: '0.001' }),
      sendTransaction: async (tx) => ({ hash: 'btc_tx_hash_' + Date.now() })
    };
    console.log(`✅ Bitcoin Chain ${this.name} initialized`);
  }

  async getBalance(address) {
    const result = await this.client.getBalance(address);
    return {
      balance: result.balance,
      decimals: 8,
      symbol: 'BTC'
    };
  }

  async getTokenInfo(tokenAddress) {
    // Bitcoin doesn't have smart contracts like Ethereum
    throw new Error('Bitcoin does not support token contracts');
  }

  async createTransaction(params) {
    return {
      inputs: params.inputs,
      outputs: params.outputs,
      fee: params.fee
    };
  }

  async sendTransaction(transaction, signer) {
    // Mock Bitcoin transaction
    const result = await this.client.sendTransaction(transaction);
    return {
      hash: result.hash,
      wait: async () => ({ status: 'confirmed' })
    };
  }

  async getTransactionStatus(txHash) {
    // Mock Bitcoin transaction status
    return {
      hash: txHash,
      status: 'confirmed',
      confirmations: 6
    };
  }

  async estimateFees(transaction) {
    // Mock Bitcoin fee estimation
    return {
      fee: '0.0001', // BTC
      feeRate: '10', // sat/vB
      estimatedSize: '250' // bytes
    };
  }
}

/**
 * Solana Chain Adapter
 */
class SolanaChainAdapter extends ChainAdapter {
  constructor(chainConfig) {
    super(chainConfig);
    this.connection = null;
  }

  async initialize() {
    // Mock Solana connection
    this.connection = {
      getBalance: async (address) => ({ value: 1000000000 }), // lamports
      sendTransaction: async (tx) => 'sol_tx_' + Date.now()
    };
    console.log(`✅ Solana Chain ${this.name} initialized`);
  }

  async getBalance(address, mintAddress = null) {
    if (!mintAddress) {
      const result = await this.connection.getBalance(address);
      return {
        balance: result.value.toString(),
        decimals: 9,
        symbol: 'SOL'
      };
    } else {
      // SPL token balance
      return {
        balance: '0',
        decimals: 6,
        symbol: 'SPL'
      };
    }
  }

  async getTokenInfo(mintAddress) {
    return {
      name: 'Solana Token',
      symbol: 'SPL',
      decimals: 6,
      totalSupply: '1000000000'
    };
  }

  async createTransaction(params) {
    return {
      instructions: params.instructions,
      recentBlockhash: params.recentBlockhash,
      feePayer: params.feePayer
    };
  }

  async sendTransaction(transaction, signer) {
    const signature = await this.connection.sendTransaction(transaction);
    return {
      hash: signature,
      wait: async () => ({ status: 'finalized' })
    };
  }

  async getTransactionStatus(signature) {
    return {
      hash: signature,
      status: 'finalized',
      slot: 123456789
    };
  }

  async estimateFees(transaction) {
    return {
      fee: '5000', // lamports
      computeUnits: '200000'
    };
  }
}

/**
 * Universal Chain Manager
 */
class UniversalChainManager {
  constructor() {
    this.adapters = new Map();
    this.supportedChains = new Map();
  }

  /**
   * Register a new chain adapter
   */
  registerChain(chainConfig) {
    let adapter;
    
    switch (chainConfig.type) {
      case 'evm':
        adapter = new EVMChainAdapter(chainConfig);
        break;
      case 'bitcoin':
        adapter = new BitcoinChainAdapter(chainConfig);
        break;
      case 'solana':
        adapter = new SolanaChainAdapter(chainConfig);
        break;
      default:
        throw new Error(`Unsupported chain type: ${chainConfig.type}`);
    }
    
    this.adapters.set(chainConfig.chainId, adapter);
    this.supportedChains.set(chainConfig.chainId, chainConfig);
    
    console.log(`🔗 Registered chain: ${chainConfig.name} (${chainConfig.type})`);
    return adapter;
  }

  /**
   * Get chain adapter
   */
  getAdapter(chainId) {
    return this.adapters.get(chainId);
  }

  /**
   * Initialize all registered chains
   */
  async initializeAll() {
    const initPromises = Array.from(this.adapters.values()).map(adapter => 
      adapter.initialize().catch(error => {
        console.error(`Failed to initialize ${adapter.name}:`, error);
      })
    );
    
    await Promise.all(initPromises);
    console.log('🚀 All chain adapters initialized');
  }

  /**
   * Get supported chains
   */
  getSupportedChains() {
    return Array.from(this.supportedChains.values());
  }

  /**
   * Check if chain is supported
   */
  isChainSupported(chainId) {
    return this.adapters.has(chainId);
  }

  /**
   * Execute cross-chain operation
   */
  async executeCrossChainSwap(fromChainId, toChainId, params) {
    const fromAdapter = this.getAdapter(fromChainId);
    const toAdapter = this.getAdapter(toChainId);
    
    if (!fromAdapter || !toAdapter) {
      throw new Error('Unsupported chain in cross-chain swap');
    }
    
    console.log(`🌉 Executing cross-chain swap: ${fromAdapter.name} → ${toAdapter.name}`);
    
    // This would implement the actual cross-chain logic
    // For now, return a mock result
    return {
      fromChain: fromAdapter.name,
      toChain: toAdapter.name,
      status: 'initiated',
      estimatedTime: '5-10 minutes'
    };
  }
}

// Pre-configure supported chains
const chainManager = new UniversalChainManager();

// Register EVM chains
chainManager.registerChain({
  chainId: 1,
  name: 'Ethereum',
  type: 'evm',
  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['https://mainnet.infura.io/v3/'],
  blockExplorerUrls: ['https://etherscan.io/']
});

chainManager.registerChain({
  chainId: 137,
  name: 'Polygon',
  type: 'evm',
  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  rpcUrls: ['https://polygon-rpc.com/'],
  blockExplorerUrls: ['https://polygonscan.com/']
});

chainManager.registerChain({
  chainId: 56,
  name: 'BNB Chain',
  type: 'evm',
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  rpcUrls: ['https://bsc-dataseed.binance.org/'],
  blockExplorerUrls: ['https://bscscan.com/']
});

// Register non-EVM chains
chainManager.registerChain({
  chainId: 'bitcoin',
  name: 'Bitcoin',
  type: 'bitcoin',
  nativeCurrency: { name: 'Bitcoin', symbol: 'BTC', decimals: 8 },
  rpcUrls: ['https://bitcoin-rpc.com/'],
  blockExplorerUrls: ['https://blockstream.info/']
});

chainManager.registerChain({
  chainId: 'solana',
  name: 'Solana',
  type: 'solana',
  nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
  rpcUrls: ['https://api.mainnet-beta.solana.com/'],
  blockExplorerUrls: ['https://explorer.solana.com/']
});

export { ChainAdapter, EVMChainAdapter, BitcoinChainAdapter, SolanaChainAdapter };
export default chainManager;
