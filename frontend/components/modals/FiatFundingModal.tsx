"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CreditCard,
  Smartphone,
  Building2,
  ArrowRight,
  CheckCircle,
  Loader2,
  AlertTriangle,
  ExternalLink,
  Copy,
  QrCode,
  Clock,
  Shield,
  Info
} from "lucide-react";
import { SupportedCurrency, MENTO_TOKENS } from "@/lib/mento-simple";
import { useAccount } from "wagmi";
import { toast } from "react-hot-toast";

interface FundingMethod {
  icon: React.ComponentType<any>;
  label: string;
  description: string;
}

interface FiatFundingModalProps {
  currency: SupportedCurrency;
  onClose: () => void;
  fundingMethods: FundingMethod[];
}

type FundingStep = "method" | "amount" | "details" | "processing" | "success";

interface PaymentDetails {
  accountNumber?: string;
  bankName?: string;
  reference?: string;
  phoneNumber?: string;
  amount?: string;
  exchangeRate?: string;
  fee?: string;
  estimatedTotal?: string;
}

export function FiatFundingModal({ currency, onClose, fundingMethods }: FiatFundingModalProps) {
  const { address } = useAccount();
  const [currentStep, setCurrentStep] = useState<FundingStep>("method");
  const [selectedMethod, setSelectedMethod] = useState<FundingMethod | null>(null);
  const [amount, setAmount] = useState("");
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");

  const getCurrencyInfo = () => {
    const currencyMap: Record<SupportedCurrency, { symbol: string; name: string; flag: string; network: string }> = {
      cNGN: { symbol: "₦", name: "Nigerian Naira", flag: "🇳🇬", network: "Kotani Pay" },
      cKES: { symbol: "KSh", name: "Kenyan Shilling", flag: "🇰🇪", network: "Kotani Pay" },
      cEUR: { symbol: "€", name: "Euro", flag: "🇪🇺", network: "Alchemy Pay" },
      cUSD: { symbol: "$", name: "US Dollar", flag: "🇺🇸", network: "Alchemy Pay" },
      cREAL: { symbol: "R$", name: "Brazilian Real", flag: "🇧🇷", network: "Alchemy Pay" },
      eXOF: { symbol: "CFA", name: "West African CFA", flag: "🌍", network: "Kotani Pay" }
    };
    return currencyMap[currency];
  };

  const currencyInfo = getCurrencyInfo();

  const generateMockPaymentDetails = () => {
    const baseAmount = parseFloat(amount) || 100;
    const fee = currency === "cNGN" ? baseAmount * 0.025 : baseAmount * 0.035; // 2.5% for NGN, 3.5% for others
    const exchangeRate = currency === "cNGN" ? 0.0012 : currency === "cKES" ? 0.0077 : 1.0;
    const estimatedTokens = (baseAmount - fee) * exchangeRate;

    const details: PaymentDetails = {
      amount: baseAmount.toFixed(2),
      fee: fee.toFixed(2),
      estimatedTotal: (baseAmount - fee).toFixed(2),
      exchangeRate: exchangeRate.toFixed(4)
    };

    if (currency === "cNGN" && selectedMethod?.label === "Bank Transfer") {
      details.bankName = "Kotani Pay - First Bank Nigeria";
      details.accountNumber = "3087654321";
      details.reference = `ADB-${Date.now().toString().slice(-6)}`;
    } else if (currency === "cKES" && selectedMethod?.label === "M-Pesa") {
      details.phoneNumber = "254700123456";
      details.reference = `MP-${Date.now().toString().slice(-6)}`;
    } else if (currency === "cEUR") {
      details.bankName = "Alchemy Pay IBAN";
      details.accountNumber = "DE89370400440532013000";
      details.reference = `EUR-${Date.now().toString().slice(-6)}`;
    }

    setPaymentDetails(details);
  };

  const handleMethodSelect = (method: FundingMethod) => {
    setSelectedMethod(method);
    setCurrentStep("amount");
  };

  const handleAmountSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    generateMockPaymentDetails();
    setCurrentStep("details");
  };

  const handlePaymentInitiate = async () => {
    setIsProcessing(true);
    setCurrentStep("processing");
    
    // Simulate payment processing
    setProcessingMessage("Connecting to payment provider...");
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setProcessingMessage("Verifying payment details...");
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setProcessingMessage("Processing payment...");
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setProcessingMessage("Minting tokens to your wallet...");
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsProcessing(false);
    setCurrentStep("success");
    
    // Auto-close after success
    setTimeout(() => {
      onClose();
      toast.success(`${paymentDetails.estimatedTotal} ${currency} added to your wallet!`);
    }, 3000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: "method", label: "Method" },
      { key: "amount", label: "Amount" },
      { key: "details", label: "Payment" },
      { key: "processing", label: "Processing" },
      { key: "success", label: "Complete" }
    ];

    const currentIndex = steps.findIndex(step => step.key === currentStep);

    return (
      <div className="flex items-center justify-center gap-2 mb-6">
        {steps.map((step, index) => (
          <React.Fragment key={step.key}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
              index <= currentIndex 
                ? "bg-emerald-500 text-white" 
                : "bg-slate-700 text-slate-400"
            }`}>
              {index + 1}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-8 h-0.5 transition-colors ${
                index < currentIndex ? "bg-emerald-500" : "bg-slate-700"
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderMethodSelection = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="text-3xl mb-2">{currencyInfo.flag}</div>
        <h3 className="text-xl font-semibold text-white">Fund with {currencyInfo.name}</h3>
        <p className="text-slate-400 text-sm">Choose your preferred payment method</p>
      </div>

      <div className="space-y-3">
        {fundingMethods.map((method, index) => (
          <button
            key={index}
            onClick={() => handleMethodSelect(method)}
            className="w-full p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-emerald-500/50 rounded-lg transition-all duration-200 text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-700/50 group-hover:bg-emerald-500/20 rounded-lg flex items-center justify-center transition-colors">
                <method.icon className="w-6 h-6 text-slate-400 group-hover:text-emerald-400 transition-colors" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-white group-hover:text-emerald-400 transition-colors">
                  {method.label}
                </h4>
                <p className="text-sm text-slate-400">{method.description}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 transition-colors" />
            </div>
          </button>
        ))}
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-6">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-400 mb-1">Secure & Regulated</h4>
            <p className="text-sm text-slate-300">
              Powered by {currencyInfo.network} - regulated payment infrastructure with bank-level security.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAmountInput = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-2">Enter Amount</h3>
        <p className="text-slate-400 text-sm">
          How much {currencyInfo.name} do you want to add?
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Amount in {currencyInfo.name}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-lg">
              {currencyInfo.symbol}
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-8 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white text-lg focus:border-emerald-500 focus:outline-none"
              placeholder="100"
              min="1"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {["100", "500", "1000"].map((presetAmount) => (
            <button
              key={presetAmount}
              onClick={() => setAmount(presetAmount)}
              className="py-2 px-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-emerald-500/50 rounded-lg text-slate-300 hover:text-white transition-colors"
            >
              {currencyInfo.symbol}{presetAmount}
            </button>
          ))}
        </div>

        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">Fee Information</span>
          </div>
          <div className="text-sm text-slate-400 space-y-1">
            <p>• Processing fee: {currency === "cNGN" ? "2.5%" : "3.5%"}</p>
            <p>• Minimum amount: {currencyInfo.symbol}10</p>
            <p>• Maximum amount: {currencyInfo.symbol}50,000</p>
            <p>• Processing time: 2-10 minutes</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setCurrentStep("method")}
          className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleAmountSubmit}
          disabled={!amount || parseFloat(amount) <= 0}
          className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-400 text-white font-medium rounded-lg transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderPaymentDetails = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-2">Payment Details</h3>
        <p className="text-slate-400 text-sm">
          Complete your payment using the details below
        </p>
      </div>

      {/* Payment Summary */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 space-y-3">
        <h4 className="font-medium text-slate-300">Payment Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Amount:</span>
            <span className="text-white">{currencyInfo.symbol}{paymentDetails.amount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Processing fee:</span>
            <span className="text-white">{currencyInfo.symbol}{paymentDetails.fee}</span>
          </div>
          <div className="border-t border-slate-700/50 pt-2 flex justify-between font-medium">
            <span className="text-slate-300">You'll receive:</span>
            <span className="text-emerald-400">{paymentDetails.estimatedTotal} {currency}</span>
          </div>
        </div>
      </div>

      {/* Payment Instructions */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
        <h4 className="font-medium text-emerald-400 mb-3">
          {selectedMethod?.label} Instructions
        </h4>
        
        {currency === "cNGN" && selectedMethod?.label === "Bank Transfer" && (
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-slate-400">Bank Name:</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-white font-mono">{paymentDetails.bankName}</span>
                <button onClick={() => copyToClipboard(paymentDetails.bankName!)}>
                  <Copy className="w-4 h-4 text-slate-400 hover:text-white" />
                </button>
              </div>
            </div>
            <div>
              <span className="text-slate-400">Account Number:</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-white font-mono">{paymentDetails.accountNumber}</span>
                <button onClick={() => copyToClipboard(paymentDetails.accountNumber!)}>
                  <Copy className="w-4 h-4 text-slate-400 hover:text-white" />
                </button>
              </div>
            </div>
            <div>
              <span className="text-slate-400">Reference:</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-white font-mono">{paymentDetails.reference}</span>
                <button onClick={() => copyToClipboard(paymentDetails.reference!)}>
                  <Copy className="w-4 h-4 text-slate-400 hover:text-white" />
                </button>
              </div>
            </div>
          </div>
        )}

        {currency === "cKES" && selectedMethod?.label === "M-Pesa" && (
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-slate-400">M-Pesa Number:</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-white font-mono">{paymentDetails.phoneNumber}</span>
                <button onClick={() => copyToClipboard(paymentDetails.phoneNumber!)}>
                  <Copy className="w-4 h-4 text-slate-400 hover:text-white" />
                </button>
              </div>
            </div>
            <div>
              <span className="text-slate-400">Reference:</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-white font-mono">{paymentDetails.reference}</span>
                <button onClick={() => copyToClipboard(paymentDetails.reference!)}>
                  <Copy className="w-4 h-4 text-slate-400 hover:text-white" />
                </button>
              </div>
            </div>
            <p className="text-slate-300 mt-3">
              Send KSh {paymentDetails.amount} to the number above with reference "{paymentDetails.reference}"
            </p>
          </div>
        )}

        {currency === "cEUR" && (
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-slate-400">IBAN:</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-white font-mono">{paymentDetails.accountNumber}</span>
                <button onClick={() => copyToClipboard(paymentDetails.accountNumber!)}>
                  <Copy className="w-4 h-4 text-slate-400 hover:text-white" />
                </button>
              </div>
            </div>
            <div>
              <span className="text-slate-400">Reference:</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-white font-mono">{paymentDetails.reference}</span>
                <button onClick={() => copyToClipboard(paymentDetails.reference!)}>
                  <Copy className="w-4 h-4 text-slate-400 hover:text-white" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Important Notes */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-400 mb-1">Important</h4>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• Use the exact reference code provided</li>
              <li>• Tokens will be minted to: {address?.slice(0, 6)}...{address?.slice(-4)}</li>
              <li>• Processing time: 2-10 minutes after payment</li>
              <li>• Contact support if payment is not processed within 1 hour</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setCurrentStep("amount")}
          className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors"
        >
          Back
        </button>
        <button
          onClick={handlePaymentInitiate}
          className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          I've Made Payment
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">Processing Payment</h3>
        <p className="text-slate-400">{processingMessage}</p>
      </div>
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Clock className="w-4 h-4" />
          <span>This usually takes 2-10 minutes</span>
        </div>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-8 h-8 text-emerald-400" />
      </div>
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">Payment Successful!</h3>
        <p className="text-slate-400">
          {paymentDetails.estimatedTotal} {currency} has been added to your wallet
        </p>
      </div>
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-400">Amount received:</span>
            <span className="text-emerald-400 font-medium">{paymentDetails.estimatedTotal} {currency}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Wallet address:</span>
            <span className="text-slate-300 font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
          </div>
        </div>
      </div>
      <button
        onClick={onClose}
        className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
      >
        Close
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-white">Fund Wallet</h2>
            <p className="text-sm text-slate-400">
              Add {currency} to your wallet
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {renderStepIndicator()}
          
          {currentStep === "method" && renderMethodSelection()}
          {currentStep === "amount" && renderAmountInput()}
          {currentStep === "details" && renderPaymentDetails()}
          {currentStep === "processing" && renderProcessing()}
          {currentStep === "success" && renderSuccess()}
        </div>
      </div>
    </div>
  );
}