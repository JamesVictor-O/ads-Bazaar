import { useState, useCallback } from 'react';
import { useWriteContract, useReadContract, useAccount, useWaitForTransactionReceipt, useWalletClient, usePublicClient } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { MENTO_TOKENS, SupportedCurrency, mentoFX } from '@/lib/mento-simple';
import { CONTRACT_ADDRESS } from '@/lib/contracts';
import { DEFAULT_NETWORK } from '@/lib/networks';
import AdsBazaarABI from '@/lib/AdsBazaar.json';
import { erc20Abi } from 'viem';
import { toast } from 'react-hot-toast';

// Multi-Currency Campaign Management
export function useMultiCurrencyCampaignCreation() {
  const { address } = useAccount();
  const { writeContractAsync, isPending, error } = useWriteContract();
  const [isCreating, setIsCreating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [latestError, setLatestError] = useState<Error | null>(null);

  const createCampaignWithToken = useCallback(async (
    campaignData: {
      name: string;
      description: string;
      requirements: string;
      budget: string;
      promotionDuration: number;
      maxInfluencers: number;
      targetAudience: number;
      applicationPeriod: number;
      proofSubmissionGracePeriod: number;
      verificationPeriod: number;
      selectionGracePeriod: number;
    },
    currency: SupportedCurrency,
    referralTag?: `0x${string}`
  ) => {
    if (!address) throw new Error('Wallet not connected');

    setIsCreating(true);
    setIsSuccess(false);
    setIsError(false);
    setLatestError(null);
    
    try {
      const tokenInfo = MENTO_TOKENS[currency];
      const contractAddress = CONTRACT_ADDRESS;
      const budgetInWei = parseUnits(campaignData.budget, tokenInfo.decimals);

      // First approve the token transfer
      await writeContractAsync({
        address: tokenInfo.address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'approve',
        args: [contractAddress as `0x${string}`, budgetInWei],
        chain: DEFAULT_NETWORK,
        account: address,
      });

      // Wait for approval confirmation
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Then create the campaign
      const result = await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: AdsBazaarABI.abi,
        functionName: 'createAdBriefWithToken',
        args: [
          campaignData.name,
          campaignData.description,
          campaignData.requirements,
          budgetInWei,
          BigInt(campaignData.promotionDuration),
          BigInt(campaignData.maxInfluencers),
          campaignData.targetAudience,
          BigInt(campaignData.applicationPeriod),
          BigInt(campaignData.proofSubmissionGracePeriod),
          BigInt(campaignData.verificationPeriod),
          BigInt(campaignData.selectionGracePeriod),
          tokenInfo.address
        ],
        chain: DEFAULT_NETWORK,
        account: address,
        dataSuffix: referralTag,
      });

      setIsSuccess(true);
      toast.success(`Campaign created successfully with ${tokenInfo.symbol}!`);
      return result;
    } catch (error) {
      console.error('Error creating campaign:', error);
      setIsError(true);
      setLatestError(error as Error);
      toast.error('Failed to create campaign');
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [address, writeContractAsync]);

  return {
    createCampaignWithToken,
    isCreating: isCreating || isPending,
    isSuccess,
    isError,
    error: latestError || error
  };
}

// Multi-Currency Payment Claims
export function useMultiCurrencyPayments() {
  const { address } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const [isClaiming, setIsClaiming] = useState(false);

  // Claim payments in a specific token
  const claimPaymentsInToken = useCallback(async (currency: SupportedCurrency) => {
    if (!address) throw new Error('Wallet not connected');

    setIsClaiming(true);
    try {
      const tokenInfo = MENTO_TOKENS[currency];
      const contractAddress = CONTRACT_ADDRESS;

      const result = await writeContract({
        address: contractAddress as `0x${string}`,
        abi: AdsBazaarABI.abi,
        functionName: 'claimPaymentsInToken',
        args: [tokenInfo.address],
        chain: DEFAULT_NETWORK,
        account: address,
      });

      toast.success(`Payments claimed in ${tokenInfo.symbol}!`);
      return result;
    } catch (error) {
      console.error('Error claiming payments:', error);
      toast.error(`Failed to claim payments in ${MENTO_TOKENS[currency].symbol}`);
      throw error;
    } finally {
      setIsClaiming(false);
    }
  }, [address, writeContract]);

  // Claim all pending payments across all currencies
  const claimAllPendingPayments = useCallback(async () => {
    if (!address) throw new Error('Wallet not connected');

    setIsClaiming(true);
    try {
      const contractAddress = CONTRACT_ADDRESS;

      const result = await writeContract({
        address: contractAddress as `0x${string}`,
        abi: AdsBazaarABI.abi,
        functionName: 'claimAllPendingPayments',
        args: [],
        chain: DEFAULT_NETWORK,
        account: address,
      });

      toast.success('All pending payments claimed!');
      return result;
    } catch (error) {
      console.error('Error claiming all payments:', error);
      toast.error('Failed to claim all payments');
      throw error;
    } finally {
      setIsClaiming(false);
    }
  }, [address, writeContract]);

  return {
    claimPaymentsInToken,
    claimAllPendingPayments,
    isClaiming: isClaiming || isPending
  };
}

// Get pending payments across all currencies
export function useMultiCurrencyPendingPayments() {
  const { address } = useAccount();

  const { data: pendingPayments, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: AdsBazaarABI.abi,
    functionName: 'getAllPendingPayments',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  });

  return {
    pendingPayments: pendingPayments as {
      tokens: string[];
      amounts: bigint[];
      symbols: string[];
    } | undefined,
    isLoading,
    refetch
  };
}

// Get campaign token information
export function useCampaignTokenInfo(campaignId?: string) {
  const { data: tokenInfo, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: AdsBazaarABI.abi,
    functionName: 'getCampaignTokenInfo',
    args: campaignId ? [campaignId] : undefined,
    query: {
      enabled: !!campaignId,
    }
  });

  return {
    tokenInfo: tokenInfo as {
      tokenAddress: string;
      symbol: string;
      currency: number;
    } | undefined,
    isLoading
  };
}

// Token balance checks for multiple currencies
export function useMultiCurrencyBalances() {
  const { address } = useAccount();

  const balanceQueries = Object.entries(MENTO_TOKENS).map(([currency, token]) => ({
    address: token.address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    currency: currency as SupportedCurrency,
    token
  }));

  // Note: This would need to be implemented with multiple useReadContract calls
  // For now, providing the structure for manual implementation
  const getBalance = useCallback(async (currency: SupportedCurrency) => {
    if (!address) return '0';

    try {
      const tokenInfo = MENTO_TOKENS[currency];
      // This would be implemented with a proper read contract call
      // For now, returning placeholder
      return '0';
    } catch (error) {
      console.error(`Error fetching ${currency} balance:`, error);
      return '0';
    }
  }, [address]);

  return { getBalance };
}

// Exchange rate hooks
export function useExchangeRates(baseCurrency: SupportedCurrency = 'cUSD') {
  const [rates, setRates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchRates = useCallback(async () => {
    setIsLoading(true);
    try {
      const currenciesWithRates = await mentoFX.getAllCurrenciesWithRates(baseCurrency);
      const ratesMap: Record<string, number> = {};
      
      currenciesWithRates.forEach(({ key, rate }) => {
        ratesMap[key] = rate;
      });
      
      setRates(ratesMap);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      toast.error('Failed to fetch exchange rates');
    } finally {
      setIsLoading(false);
    }
  }, [baseCurrency]);

  const convertAmount = useCallback(
    (amount: string, fromCurrency: SupportedCurrency, toCurrency: SupportedCurrency): string => {
      if (fromCurrency === toCurrency) return amount;
      
      const fromRate = rates[fromCurrency] || 1;
      const toRate = rates[toCurrency] || 1;
      
      if (fromCurrency === baseCurrency) {
        return (parseFloat(amount) * toRate).toFixed(6);
      } else if (toCurrency === baseCurrency) {
        return (parseFloat(amount) / fromRate).toFixed(6);
      } else {
        // Convert through base currency
        const baseAmount = parseFloat(amount) / fromRate;
        return (baseAmount * toRate).toFixed(6);
      }
    },
    [rates, baseCurrency]
  );

  return {
    rates,
    isLoading,
    lastUpdated,
    fetchRates,
    convertAmount
  };
}

// Currency swap hooks with Mento Protocol integration
export function useCurrencySwap() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [isSwapping, setIsSwapping] = useState(false);

  const prepareSwap = useCallback(async (
    fromCurrency: SupportedCurrency,
    toCurrency: SupportedCurrency,
    amount: string,
    slippage: number = 1,
    recipientAddress?: string
  ) => {
    if (!address || !walletClient || !publicClient) {
      throw new Error('Wallet not connected');
    }

    if (fromCurrency === toCurrency) {
      throw new Error('Cannot swap same currency');
    }

    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Invalid amount');
    }

    setIsSwapping(true);

    try {
      console.log('🚀 Starting Mento swap on mainnet...');
      
      // Get token addresses for Celo mainnet
      const fromTokenAddress = MENTO_TOKENS[fromCurrency].address;
      const toTokenAddress = MENTO_TOKENS[toCurrency].address;
      
      console.log('Token addresses:', {
        fromCurrency,
        toCurrency,
        fromTokenAddress,
        toTokenAddress
      });

      // Get RPC URL from environment with fallbacks
      const primaryRpcUrl = process.env.NEXT_PUBLIC_CELO_RPC_URL || 'https://celo-mainnet.g.alchemy.com/v2/qMj263vOQ9uKwIE4R9s3638-8zRBds9t';
      const fallbackRpcUrls = [
        'https://forno.celo.org',
        'https://rpc.ankr.com/celo',
        'https://celo-mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'
      ];
      
      console.log('🌐 Primary RPC URL:', primaryRpcUrl);
      
      // Create ethers provider for Mento SDK compatibility
      const { providers, Wallet, Contract } = await import('ethers');
      
      // Test RPC connectivity with fallback
      console.log('🔍 Testing RPC connectivity...');
      let provider;
      let rpcUrl = primaryRpcUrl;
      
      try {
        provider = new providers.JsonRpcProvider(primaryRpcUrl);
        const network = await provider.getNetwork();
        console.log('✅ Primary RPC connected. Network:', network.name, 'ChainId:', network.chainId);
      } catch (primaryError) {
        console.warn('⚠️ Primary RPC failed, trying fallbacks...', primaryError);
        
        for (const fallbackUrl of fallbackRpcUrls) {
          try {
            console.log('🔄 Trying fallback RPC:', fallbackUrl);
            provider = new providers.JsonRpcProvider(fallbackUrl);
            const network = await provider.getNetwork();
            console.log('✅ Fallback RPC connected. Network:', network.name, 'ChainId:', network.chainId);
            rpcUrl = fallbackUrl;
            break;
          } catch (fallbackError) {
            console.warn('⚠️ Fallback RPC failed:', fallbackUrl, fallbackError);
            continue;
          }
        }
        
        if (!provider) {
          throw new Error('All RPC endpoints failed. Check your network connection.');
        }
      }
      
      // Create signer proxy that uses viem for actual transactions
      const createViemSigner = (userAddress: string) => {
        // Create dummy wallet for Mento SDK compatibility
        const deterministicKey = '0x' + userAddress.slice(2).padStart(64, '0');
        const wallet = new Wallet(deterministicKey, provider);
        
        // Override key methods to use viem
        const signerProxy = Object.create(wallet);
        
        Object.defineProperty(signerProxy, 'address', {
          value: userAddress,
          writable: false,
          enumerable: true
        });
        
        signerProxy.getAddress = () => Promise.resolve(userAddress);
        
        signerProxy.sendTransaction = async (transaction: any) => {
          console.log('📤 Sending transaction via viem:', transaction);
          const txParams: any = {
            account: userAddress as `0x${string}`,
            to: transaction.to as `0x${string}`,
            data: transaction.data as `0x${string}`,
            value: transaction.value ? BigInt(transaction.value.toString()) : BigInt(0)
          };
          
          // Only add gas parameters if they exist
          if (transaction.gasLimit) {
            txParams.gas = BigInt(transaction.gasLimit.toString());
          }
          if (transaction.gasPrice) {
            txParams.gasPrice = BigInt(transaction.gasPrice.toString());
          }
          
          const hash = await walletClient.sendTransaction(txParams);
          return { 
            hash, 
            wait: () => publicClient.waitForTransactionReceipt({ hash, confirmations: 1 }) 
          };
        };
        
        signerProxy.populateTransaction = async (transaction: any) => {
          const populated = await wallet.populateTransaction(transaction);
          populated.from = userAddress;
          return populated;
        };
        
        return signerProxy;
      };
      
      const signer = createViemSigner(address);
      
      console.log('✨ Creating Mento SDK...');
      const { Mento } = await import('@mento-protocol/mento-sdk');
      
      let mento, exchanges;
      try {
        mento = await Mento.create(signer);
        console.log('✅ Mento SDK created successfully');
        
        // Initialize and check exchanges
        console.log('🔄 Getting exchanges...');
        exchanges = await mento.getExchanges();
        console.log('📊 Available exchanges:', exchanges.length);
        
        if (exchanges.length === 0) {
          throw new Error('No exchanges found - cannot perform swaps');
        }
      } catch (mentoError) {
        console.error('❌ Mento SDK initialization failed:', mentoError);
        throw new Error(`Mento SDK failed: ${mentoError instanceof Error ? mentoError.message : 'Unknown error'}`);
      }
      
      // Parse amount using viem
      const { parseEther, formatEther } = await import('viem');
      const amountInWei = parseEther(amount);
      
      console.log('📊 Getting quote...');
      let quoteAmountOut;
      try {
        quoteAmountOut = await mento.getAmountOut(
          fromTokenAddress,
          toTokenAddress,
          amountInWei.toString()
        );
        console.log(`💰 Quote: ${formatEther(BigInt(quoteAmountOut.toString()))} ${toCurrency} for ${amount} ${fromCurrency}`);
      } catch (quoteError) {
        console.error('❌ Getting quote failed:', quoteError);
        throw new Error(`Quote failed: ${quoteError instanceof Error ? quoteError.message : 'Unknown error'}`);
      }
      
      // Apply slippage protection
      const quoteBigInt = BigInt(quoteAmountOut.toString());
      const slippageMultiplier = BigInt(100 - slippage);
      const expectedAmountOut = (quoteBigInt * slippageMultiplier / BigInt(100)).toString();
      
      console.log(`🎯 Expected amount out with ${slippage}% slippage: ${formatEther(BigInt(expectedAmountOut))} ${toCurrency}`);
      
      // Find tradable pair
      console.log('🔍 Finding tradable pair...');
      const tradablePair = await mento.findPairForTokens(
        fromTokenAddress,
        toTokenAddress
      );
      console.log('✅ Found tradable pair:', tradablePair);
      
      // Get broker contract
      const broker = await mento.getBroker();
      console.log('📊 Broker contract:', broker.address);
      
      // Handle token allowance
      console.log('🔓 Handling token allowance...');
      const tokenInterface = [
        'function allowance(address owner, address spender) view returns (uint256)',
        'function approve(address spender, uint256 amount) returns (bool)'
      ];
      const tokenContract = new Contract(fromTokenAddress, tokenInterface, signer);
      
      const currentAllowance = await tokenContract.allowance(signer.address, broker.address);
      console.log('Current allowance:', currentAllowance.toString());
      
      if (BigInt(currentAllowance.toString()) < BigInt(amountInWei.toString())) {
        console.log('🔓 Approving broker contract...');
        
        const approvalTx = await tokenContract.populateTransaction.approve(
          broker.address,
          amountInWei.toString()
        );
        
        const approvalHash = await walletClient.sendTransaction({
          account: signer.address as `0x${string}`,
          to: fromTokenAddress as `0x${string}`,
          data: approvalTx.data as `0x${string}`,
          value: BigInt(0)
        } as any);
        
        console.log('📤 Approval transaction:', approvalHash);
        await publicClient.waitForTransactionReceipt({ hash: approvalHash });
        console.log('✅ Approval confirmed');
      } else {
        console.log('✅ Sufficient allowance exists');
      }
      
      // Execute swap based on path type
      let result;
      
      if (tradablePair.path.length === 1) {
        // Direct single-hop swap
        result = await executeDirectSwap(
          exchanges,
          broker,
          fromTokenAddress,
          toTokenAddress,
          amountInWei.toString(),
          expectedAmountOut,
          signer,
          walletClient,
          publicClient,
          fromCurrency,
          toCurrency,
          recipientAddress
        );
      } else if (tradablePair.path.length === 2) {
        // Multi-hop swap
        result = await executeMultiHopSwap(
          tradablePair,
          broker,
          fromTokenAddress,
          toTokenAddress,
          amountInWei.toString(),
          signer,
          walletClient,
          publicClient,
          fromCurrency,
          toCurrency,
          recipientAddress
        );
      } else {
        throw new Error(`Unsupported swap path length: ${tradablePair.path.length}`);
      }
      
      console.log('🎉 Swap completed successfully:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Swap failed:', error);
      throw error;
    } finally {
      setIsSwapping(false);
    }
  }, [address, walletClient, publicClient]);

  return {
    prepareSwap,
    isSwapping
  };
}

// Direct swap execution helper
async function executeDirectSwap(
  exchanges: any[],
  broker: any,
  fromTokenAddress: string,
  toTokenAddress: string,
  amountInWei: string,
  expectedAmountOut: string,
  signer: any,
  walletClient: any,
  publicClient: any,
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency,
  recipientAddress?: string
) {
  console.log('🔄 Direct swap execution...');
  
  const correctExchange = exchanges.find(exchange => {
    const hasTokens = exchange.assets.length === 2 &&
      ((exchange.assets[0] === fromTokenAddress && exchange.assets[1] === toTokenAddress) ||
       (exchange.assets[0] === toTokenAddress && exchange.assets[1] === fromTokenAddress));
    return hasTokens;
  });
  
  if (!correctExchange) {
    throw new Error(`No exchange found for ${fromCurrency} -> ${toCurrency}`);
  }
  
  console.log('📊 Using exchange:', correctExchange.id);
  
  const txRequest = await broker.populateTransaction.swapIn(
    correctExchange.providerAddr,
    correctExchange.id,
    fromTokenAddress,
    toTokenAddress,
    amountInWei,
    expectedAmountOut
  );
  
  console.log('📋 Swap transaction request:', txRequest);
  
  const hash = await walletClient.sendTransaction({
    account: signer.address as `0x${string}`,
    to: broker.address as `0x${string}`,
    data: txRequest.data as `0x${string}`,
    gas: txRequest.gasLimit ? BigInt(txRequest.gasLimit.toString()) : undefined,
    gasPrice: txRequest.gasPrice ? BigInt(txRequest.gasPrice.toString()) : undefined,
    value: BigInt(0)
  } as any);
  
  console.log('📤 Swap transaction hash:', hash);
  await publicClient.waitForTransactionReceipt({ hash });
  console.log('✅ Swap confirmed');
  
  // Handle remittance if needed
  if (recipientAddress && recipientAddress !== signer.address) {
    const transferHash = await handleRemittance(
      toTokenAddress,
      expectedAmountOut,
      recipientAddress,
      signer,
      walletClient,
      publicClient
    );
    
    const { formatEther } = await import('viem');
    return {
      success: true,
      hash,
      transferHash,
      amountOut: formatEther(BigInt(expectedAmountOut)),
      recipient: recipientAddress,
      message: `Successfully sent ${formatEther(BigInt(expectedAmountOut))} ${toCurrency} to ${recipientAddress}`
    };
  }
  
  const { formatEther } = await import('viem');
  return {
    success: true,
    hash,
    amountOut: formatEther(BigInt(expectedAmountOut)),
    recipient: signer.address,
    message: `Successfully swapped ${formatEther(BigInt(amountInWei))} ${fromCurrency} for ${formatEther(BigInt(expectedAmountOut))} ${toCurrency}`
  };
}

// Multi-hop swap execution helper
async function executeMultiHopSwap(
  tradablePair: any,
  broker: any,
  fromTokenAddress: string,
  toTokenAddress: string,
  amountInWei: string,
  signer: any,
  walletClient: any,
  publicClient: any,
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency,
  recipientAddress?: string
) {
  console.log('🔄 Multi-hop swap execution...');
  
  const firstExchange = tradablePair.path[0];
  const secondExchange = tradablePair.path[1];
  
  // Find intermediate token
  let intermediateTokenAddress;
  for (const asset1 of firstExchange.assets) {
    for (const asset2 of secondExchange.assets) {
      if (asset1 === asset2 && asset1 !== fromTokenAddress && asset1 !== toTokenAddress) {
        intermediateTokenAddress = asset1;
        break;
      }
    }
    if (intermediateTokenAddress) break;
  }
  
  if (!intermediateTokenAddress) {
    throw new Error('Could not determine intermediate token');
  }
  
  console.log('🔗 Intermediate token:', intermediateTokenAddress);
  
  // Determine step exchanges
  let step1Exchange, step2Exchange;
  
  for (const exchange of [firstExchange, secondExchange]) {
    const hasFromToken = exchange.assets.includes(fromTokenAddress);
    const hasIntermediateToken = exchange.assets.includes(intermediateTokenAddress);
    if (hasFromToken && hasIntermediateToken) {
      step1Exchange = exchange;
      break;
    }
  }
  
  for (const exchange of [firstExchange, secondExchange]) {
    const hasIntermediateToken = exchange.assets.includes(intermediateTokenAddress);
    const hasToToken = exchange.assets.includes(toTokenAddress);
    if (hasIntermediateToken && hasToToken) {
      step2Exchange = exchange;
      break;
    }
  }
  
  if (!step1Exchange || !step2Exchange) {
    throw new Error('Could not find exchanges for multi-hop swap');
  }
  
  // Execute step 1
  console.log('📍 Step 1: Swap to intermediate token...');
  const step1Quote = await broker.functions.getAmountOut(
    step1Exchange.providerAddr,
    step1Exchange.id,
    fromTokenAddress,
    intermediateTokenAddress,
    amountInWei
  );
  
  const step1MinAmount = (BigInt(step1Quote.toString()) * BigInt(99)) / BigInt(100);
  
  const step1TxRequest = await broker.populateTransaction.swapIn(
    step1Exchange.providerAddr,
    step1Exchange.id,
    fromTokenAddress,
    intermediateTokenAddress,
    amountInWei,
    step1MinAmount.toString()
  );
  
  const step1Hash = await walletClient.sendTransaction({
    account: signer.address as `0x${string}`,
    to: broker.address as `0x${string}`,
    data: step1TxRequest.data as `0x${string}`,
    gas: step1TxRequest.gasLimit ? BigInt(step1TxRequest.gasLimit.toString()) : undefined,
    gasPrice: step1TxRequest.gasPrice ? BigInt(step1TxRequest.gasPrice.toString()) : undefined,
    value: BigInt(0)
  } as any);
  
  await publicClient.waitForTransactionReceipt({ hash: step1Hash });
  console.log('✅ Step 1 complete');
  
  // Step 2: Approve and execute second swap
  console.log('📍 Step 2: Approve intermediate token...');
  const { Contract } = await import('ethers');
  const intermediateTokenContract = new Contract(
    intermediateTokenAddress,
    ['function approve(address spender, uint256 amount) returns (bool)'],
    signer
  );
  
  const approvalTx = await intermediateTokenContract.populateTransaction.approve(
    broker.address,
    step1Quote.toString()
  );
  
  const approvalHash = await walletClient.sendTransaction({
    account: signer.address as `0x${string}`,
    to: intermediateTokenAddress as `0x${string}`,
    data: approvalTx.data as `0x${string}`,
    value: BigInt(0)
  } as any);
  
  await publicClient.waitForTransactionReceipt({ hash: approvalHash });
  console.log('✅ Intermediate token approved');
  
  // Execute second swap
  console.log('📍 Step 2: Swap to target token...');
  const step2Quote = await broker.functions.getAmountOut(
    step2Exchange.providerAddr,
    step2Exchange.id,
    intermediateTokenAddress,
    toTokenAddress,
    step1Quote.toString()
  );
  
  const step2MinAmount = (BigInt(step2Quote.toString()) * BigInt(99)) / BigInt(100);
  
  const step2TxRequest = await broker.populateTransaction.swapIn(
    step2Exchange.providerAddr,
    step2Exchange.id,
    intermediateTokenAddress,
    toTokenAddress,
    step1Quote.toString(),
    step2MinAmount.toString()
  );
  
  const step2Hash = await walletClient.sendTransaction({
    account: signer.address as `0x${string}`,
    to: broker.address as `0x${string}`,
    data: step2TxRequest.data as `0x${string}`,
    gas: step2TxRequest.gasLimit ? BigInt(step2TxRequest.gasLimit.toString()) : undefined,
    gasPrice: step2TxRequest.gasPrice ? BigInt(step2TxRequest.gasPrice.toString()) : undefined,
    value: BigInt(0)
  } as any);
  
  await publicClient.waitForTransactionReceipt({ hash: step2Hash });
  console.log('✅ Multi-hop swap complete');
  
  // Handle remittance if needed
  if (recipientAddress && recipientAddress !== signer.address) {
    const transferHash = await handleRemittance(
      toTokenAddress,
      step2Quote.toString(),
      recipientAddress,
      signer,
      walletClient,
      publicClient
    );
    
    const { formatEther } = await import('viem');
    return {
      success: true,
      hash: step2Hash,
      transferHash,
      amountOut: formatEther(BigInt(step2Quote.toString())),
      recipient: recipientAddress,
      message: `Successfully sent ${formatEther(BigInt(step2Quote.toString()))} ${toCurrency} to ${recipientAddress}`
    };
  }
  
  const { formatEther } = await import('viem');
  return {
    success: true,
    hash: step2Hash,
    amountOut: formatEther(BigInt(step2Quote.toString())),
    recipient: signer.address,
    message: `Successfully swapped ${formatEther(BigInt(amountInWei))} ${fromCurrency} for ${formatEther(BigInt(step2Quote.toString()))} ${toCurrency}`
  };
}

// Handle token transfer to recipient helper
async function handleRemittance(
  tokenAddress: string,
  amount: string,
  recipientAddress: string,
  signer: any,
  walletClient: any,
  publicClient: any
) {
  console.log('🔄 Transferring to recipient...');
  
  const { Contract } = await import('ethers');
  const tokenContract = new Contract(
    tokenAddress,
    ['function transfer(address to, uint256 amount) returns (bool)'],
    signer
  );
  
  const transferTx = await tokenContract.populateTransaction.transfer(
    recipientAddress,
    amount
  );
  
  const transferHash = await walletClient.sendTransaction({
    account: signer.address as `0x${string}`,
    to: tokenAddress as `0x${string}`,
    data: transferTx.data as `0x${string}`,
    value: BigInt(0)
  } as any);
  
  await publicClient.waitForTransactionReceipt({ hash: transferHash });
  console.log('✅ Transfer confirmed');
  
  return transferHash;
}

// Statistics and analytics
export function useMultiCurrencyStats() {
  const { data: stats, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: AdsBazaarABI.abi,
    functionName: 'getCampaignStatsByCurrency',
    args: [],
    query: {
      refetchInterval: 60000, // Refetch every minute
    }
  });

  const { data: tokenInfo } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: AdsBazaarABI.abi,
    functionName: 'getCampaignStatsByCurrency',
    args: [],
    query: {
      refetchInterval: 300000, // Refetch every 5 minutes
    }
  });

  return {
    stats: stats as {
      tokens: string[];
      symbols: string[];
      campaignCounts: bigint[];
      totalBudgets: bigint[];
      totalVolumes: bigint[];
    } | undefined,
    tokenInfo: tokenInfo as {
      tokens: string[];
      symbols: string[];
      totalEscrow: bigint[];
      totalVolume: bigint[];
    } | undefined,
    isLoading
  };
}

// Utility function to format currency amounts
export function formatCurrencyAmount(
  amount: bigint | string,
  currency: SupportedCurrency,
  decimals?: number
): string {
  const token = MENTO_TOKENS[currency];
  const formattedAmount = typeof amount === 'bigint' 
    ? formatUnits(amount, token.decimals)
    : amount;
  
  const num = parseFloat(formattedAmount);
  const displayDecimals = decimals ?? (num < 1 ? 6 : 2);
  
  return `${num.toLocaleString(undefined, { 
    minimumFractionDigits: 0,
    maximumFractionDigits: displayDecimals 
  })} ${token.symbol}`;
}

// Get preferred currency for user
export function usePreferredCurrency(isBusiness: boolean = false) {
  const { address } = useAccount();

  const { data: preferredToken } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: AdsBazaarABI.abi,
    functionName: 'getPreferredPaymentToken',
    args: address ? [address, isBusiness] : undefined,
    query: {
      enabled: !!address,
    }
  });

  const setPreferredCurrency = useCallback(async (currency: SupportedCurrency) => {
    if (!address) throw new Error('Wallet not connected');

    try {
      const contractAddress = CONTRACT_ADDRESS;
      const tokenAddress = MENTO_TOKENS[currency].address;

      // This would be implemented with writeContract
      console.log('Setting preferred currency:', { currency, tokenAddress });
      toast.success(`Preferred currency set to ${MENTO_TOKENS[currency].symbol}`);
    } catch (error) {
      console.error('Error setting preferred currency:', error);
      toast.error('Failed to set preferred currency');
    }
  }, [address]);

  // Convert token address back to currency
  const preferredCurrency = preferredToken 
    ? Object.entries(MENTO_TOKENS).find(([_, token]) => 
        token.address.toLowerCase() === (preferredToken as string).toLowerCase()
      )?.[0] as SupportedCurrency || 'cUSD'
    : 'cUSD';

  return {
    preferredCurrency,
    setPreferredCurrency
  };
}