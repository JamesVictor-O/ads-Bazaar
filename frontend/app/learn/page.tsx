"use client";
  import { useMemo } from "react";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  ArrowLeft,
  User,
  Building2,
  Shield,
  DollarSign,
  CheckCircle,
  Clock,
  Star,
  Target,
  Zap,
  Scale,
  Globe,
  Wallet,
  FileText,
  Eye,
  Award,
  Users,
  Sparkles,
  MessageSquare,
  PlayCircle,
  PauseCircle,
  Flag,
  ChevronDown,
  BookOpen,
  HelpCircle,
  Upload,
  Lock,
  X,
} from "lucide-react";
import Link from "next/link";

type JourneyKey = "influencer" | "business";

const EducationPage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedJourney, setSelectedJourney] =
    useState<JourneyKey>("influencer");
  const [expandedFeature, setExpandedFeature] = useState<null | number>(null);
  const [expandedScenario, setExpandedScenario] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // User journey data

  const userJourneys = useMemo<Record<
    JourneyKey,
    {
      title: string;
      icon: React.ElementType;
      color: string;
      steps: {
        title: string;
        description: string;
        details: string[];
        tips: string[];
        icon: React.ElementType;
      }[];
    }
  >>(
    () => ({
      influencer: {
        title: "Influencer Journey",
        icon: User,
        color: "emerald",
        steps: [
          {
            title: "Connect & Register",
            description: "Connect your wallet and register as an influencer",
            details: [
              "Connect your crypto wallet (MetaMask, WalletConnect, etc.)",
              "Register on AdsBazaar as an influencer",
              "Choose your niche and content category",
              "Set up your basic profile information",
            ],
            tips: [
              "Make sure you're on the Celo network",
              "Keep your wallet secure",
            ],
            icon: Wallet,
          },
          {
            title: "Get Verified (Optional)",
            description: "Boost your profile with Self Protocol verification",
            details: [
              "Visit the Self Verification page",
              "Scan QR code with Self app",
              "Complete identity verification",
              "Unlock premium campaigns and 30% higher rates",
            ],
            tips: [
              "Verification increases trust and earnings",
              "Premium campaigns require verification",
            ],
            icon: Shield,
          },
          {
            title: "Connect Social Accounts",
            description: "Link your Farcaster and other social profiles",
            details: [
              "Connect your Farcaster account",
              "Verify your social media presence",
              "Showcase your follower count and engagement",
              "Build credibility with brands",
            ],
            tips: ["Strong social presence = better campaign opportunities"],
            icon: MessageSquare,
          },
          {
            title: "Browse & Apply",
            description: "Find campaigns that match your audience",
            details: [
              "Browse the marketplace for active campaigns",
              "Filter by category, budget, and requirements",
              "Read campaign requirements carefully",
              "Submit compelling applications with 20+ character messages",
            ],
            tips: [
              "Personalize each application",
              "Highlight relevant experience",
            ],
            icon: Target,
          },
          {
            title: "Get Selected",
            description: "Wait for brand approval and assignment",
            details: [
              "Brands review applications during the application period",
              "Selected influencers are notified via dashboard",
              "Review campaign timeline and requirements",
              "Prepare content according to guidelines",
            ],
            tips: [
              "Check your dashboard regularly",
              "Start planning content early",
            ],
            icon: Star,
          },
          {
            title: "Create Content",
            description: "Develop and publish campaign content",
            details: [
              "Create content following campaign requirements",
              "Publish on specified social media platforms",
              "Ensure content meets quality standards",
              "Wait for campaign promotion period to end",
            ],
            tips: [
              "Follow brand guidelines exactly",
              "Engage with your audience",
            ],
            icon: FileText,
          },
          {
            title: "Submit Proof",
            description: "Submit links to your published content",
            details: [
              "Wait for proof submission period to begin",
              "Submit direct links to your published content",
              "Include all required campaign posts",
              "Ensure links are accessible and working",
            ],
            tips: [
              "Submit proof as soon as period opens",
              "Double-check all links work",
            ],
            icon: Upload,
          },
          {
            title: "Verification & Payment",
            description: "Get approved and claim your earnings",
            details: [
              "Brands review submitted content during verification period",
              "Approved content becomes eligible for payment",
              "Claim payments through your dashboard",
              "Payments are made in cUSD cryptocurrency",
            ],
            tips: ["Monitor verification period", "Claim payments promptly"],
            icon: DollarSign,
          },
        ],
      },
      business: {
        title: "Business Journey",
        icon: Building2,
        color: "blue",
        steps: [
          {
            title: "Connect & Register",
            description: "Set up your business account",
            details: [
              "Connect your crypto wallet",
              "Register as a business on AdsBazaar",
              "Specify your business type and monthly budget",
              "Complete business profile setup",
            ],
            tips: [
              "Have cUSD ready for campaigns & Celo for gas fees",
              "Choose realistic budget ranges",
            ],
            icon: Wallet,
          },
          {
            title: "Fund Your Wallet",
            description: "Ensure sufficient cUSD for campaign budgets",
            details: [
              "Acquire cUSD (Celo Dollar) cryptocurrency",
              "Transfer funds to your connected wallet",
              "Keep extra for platform fees (0.5%)",
              "Monitor wallet balance regularly",
            ],
            tips: [
              "Budget includes 0.5% platform fee",
              "Keep some extra celo for gas fees",
            ],
            icon: DollarSign,
          },
          {
            title: "Create Campaign",
            description: "Design your influencer marketing campaign",
            details: [
              "Define campaign name and clear description",
              "Set detailed content requirements",
              "Choose budget and maximum number of influencers",
              "Select promotion duration (1-14 days)",
              "Pick target audience category",
              
            ],
            tips: [
              "Be specific about requirements",
              "Higher budgets attract better influencers",
              "Once you select max influencers, campaign immediately starts after 1 day",
              "You can cancel the campaign only before assigning influencers & the funds will be refunded immediately",
            ],
            icon: Target,
          },
          {
            title: "Review Applications",
            description: "Select the best influencers for your campaign",
            details: [
              "Applications come in during the application period",
              "Review influencer profiles and application messages",
              "Check social media presence and audience fit",
              "Select influencers up to your maximum limit",
            ],
            tips: ["Look for audience alignment", "Check engagement rates"],
            icon: Users,
          },
          {
            title: "Monitor Campaign",
            description: "Track influencer activity during promotion",
            details: [
              "Campaign enters promotion phase after selection",
              "Monitor influencer content creation",
              "Track campaign progress via dashboard",
              "Provide support if influencers have questions",
            ],
            tips: ["Stay available for questions", "Monitor content quality"],
            icon: Eye,
          },
          {
            title: "Review Submissions",
            description: "Evaluate proof of work and approve content",
            details: [
              "Proof submission period opens after promotion",
              "Review all submitted content links",
              "Check content meets your requirements",
              "Raise disputes for non-compliant content",
            ],
            tips: ["Review objectively", "Dispute only legitimate issues"],
            icon: CheckCircle,
          },
          {
            title: "Complete Campaign",
            description: "Finalize payments and close campaign",
            details: [
              "Verification period allows final review",
              "Complete campaign to release payments",
              "Auto-approval triggers if no action taken",
              "Successful influencers receive payments automatically",
            ],
            tips: [
              "Complete campaigns promptly",
              "Auto-approval protects influencers",
            ],
            icon: Award,
          },
        ],
      },
    }),
    []
  );

  // Key features data
  const keyFeatures = [
    {
      title: "Self Protocol Verification",
      description: "Zero-knowledge identity verification for enhanced trust",
      icon: Shield,
      color: "emerald",
      benefits: [
        "Prove you're a real person without revealing personal data",
        "Access to premium campaigns with higher payouts",
        "30% higher earning potential for verified creators",
        "Priority consideration from brands",
      ],
      howItWorks: [
        "Visit the Self Verification page",
        "Scan QR code with Self mobile app",
        "Complete identity verification process with your passport",
        "Verification status appears on your profile",
      ],
    },
    {
      title: "Farcaster Integration",
      description: "Connect your Farcaster social presence",
      icon: MessageSquare,
      color: "purple",
      benefits: [
        "Showcase your follower count and engagement",
        "Import social proof from Farcaster",
        "Enhanced profile credibility",
        "Better campaign matching",
      ],
      howItWorks: [
        "Go to your influencer profile page",
        "Click 'Connect Farcaster'",
        "Scan QR code with Warpcast app",
        "Profile automatically updates with social data",
      ],
    },
    {
      title: "Smart Escrow System",
      description: "Automated payment protection for all parties",
      icon: Lock,
      color: "blue",
      benefits: [
        "Funds locked safely until campaign completion",
        "Automated payment distribution",
        "Protection against payment disputes",
        "Transparent payment timeline",
      ],
      howItWorks: [
        "Business funds are escrowed when campaign is created",
        "Payments released only after proof approval",
        "Auto-approval protects influencer interests",
        "Platform fee (0.5%) deducted automatically",
      ],
    },
    {
      title: "Dispute Resolution",
      description: "Fair resolution system for campaign conflicts",
      icon: Scale,
      color: "amber",
      benefits: [
        "Neutral third-party dispute resolution",
        "Transparent review process",
        "Protection for both businesses and influencers",
        "Clear dispute timeline (2-day resolution)",
      ],
      howItWorks: [
        "Either party can flag content that doesn't meet requirements",
        "Authorized resolvers review evidence objectively",
        "Decision made within 2-day period",
        "Payments distributed based on resolution",
      ],
    },
  ];

  // Common scenarios data
  const scenarios = [
    {
      title: "What if an influencer doesn't submit proof?",
      description: "Automatic refund system protects businesses",
      steps: [
        "Proof submission deadline passes without submission",
        "Campaign auto-completes during verification period",
        "Non-submitting influencers forfeit payment",
        "Business receives refund for undelivered work",
      ],
      icon: Clock,
      type: "protection",
    },
    {
      title: "What if submitted content doesn't meet requirements?",
      description: "Dispute system ensures quality standards",
      steps: [
        "Business reviews submitted content",
        "Raise dispute if content doesn't meet requirements",
        "Provide specific reasons for dispute",
        "Dispute resolver makes final decision within 2 days",
      ],
      icon: Flag,
      type: "quality",
    },
    {
      title: "What if business doesn't approve valid content?",
      description: "Auto-approval protects influencer interests",
      steps: [
        "Verification period has specific deadline",
        "If no action taken, campaign auto-approves",
        "Influencers receive payment automatically",
        "System prevents payment withholding",
      ],
      icon: Zap,
      type: "protection",
    },
    {
      title: "What if I want to update my submitted proof?",
      description: "Content can be updated during submission period",
      steps: [
        "Visit your dashboard and find the campaign",
        "Click 'Update Content' for the specific campaign",
        "Submit new proof link to replace previous one",
        "Updated content goes through same review process",
      ],
      icon: Upload,
      type: "flexibility",
    },
  ];

  const tabs = [
    { id: "overview", label: "Overview", icon: BookOpen },
    { id: "journeys", label: "User Journeys", icon: User },
    { id: "features", label: "Key Features", icon: Star },
    { id: "scenarios", label: "Common Scenarios", icon: HelpCircle },
  ];

  // Auto-play journey steps
  useEffect(() => {
    let interval: string | number | NodeJS.Timeout | undefined;
    if (isPlaying && activeTab === "journeys") {
      interval = setInterval(() => {
        setCurrentStep((prev) => {
          const maxSteps = userJourneys[selectedJourney].steps.length - 1;
          return prev >= maxSteps ? 0 : prev + 1;
        });
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, activeTab, selectedJourney, userJourneys]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20 sm:pt-28">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-800/50 backdrop-blur-xl sticky top-20 sm:top-28 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  AdsBazaar Guide
                </h1>
                <p className="text-sm text-slate-400">
                  Learn how to navigate the platform
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                  : "bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Welcome to AdsBazaar
              </h2>
              <p className="text-xl text-slate-300 leading-relaxed">
                The decentralized marketplace connecting brands with verified
                creators for transparent, secure influencer marketing campaigns
                powered by blockchain technology.
              </p>
            </div>

            {/* How AdsBazaar Works */}
            <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 mb-8">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">
                How AdsBazaar Works
              </h3>
              <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Campaign Lifecycle */}
                <div>
                  <h4 className="text-lg font-semibold text-emerald-400 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Campaign Lifecycle
                  </h4>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                      <div>
                        <p className="text-slate-300 font-medium">Campaign Creation</p>
                        <p className="text-slate-400 text-sm">Businesses create campaigns with requirements, budget, and timeline</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                      <div>
                        <p className="text-slate-300 font-medium">Application Period</p>
                        <p className="text-slate-400 text-sm">Influencers browse and apply to campaigns that match their audience</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                      <div>
                        <p className="text-slate-300 font-medium">Selection & Assignment</p>
                        <p className="text-slate-400 text-sm">Businesses review applications and select their preferred influencers</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">4</div>
                      <div>
                        <p className="text-slate-300 font-medium">Content Creation</p>
                        <p className="text-slate-400 text-sm">Selected influencers create and publish content according to guidelines</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">5</div>
                      <div>
                        <p className="text-slate-300 font-medium">Proof & Review</p>
                        <p className="text-slate-400 text-sm">Influencers submit proof links, businesses review and approve content</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">6</div>
                      <div>
                        <p className="text-slate-300 font-medium">Payment & Completion</p>
                        <p className="text-slate-400 text-sm">Approved influencers claim their cryptocurrency payments automatically</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Features */}
                <div>
                  <h4 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Key Features & Protections
                  </h4>
                  <div className="space-y-4">
                    <div className="border border-slate-700/50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-slate-300 font-medium">Smart Contract Security</p>
                          <p className="text-slate-400 text-sm">All payments and agreements are secured by blockchain smart contracts. No middleman can hold or steal funds.</p>
                        </div>
                      </div>
                    </div>
                    <div className="border border-slate-700/50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Scale className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-slate-300 font-medium">Fair Decision System</p>
                          <p className="text-slate-400 text-sm">Businesses must decide within deadlines: start campaigns with selected influencers or cancel with fair compensation.</p>
                        </div>
                      </div>
                    </div>
                    <div className="border border-slate-700/50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-slate-300 font-medium">Automatic Payments</p>
                          <p className="text-slate-400 text-sm">If businesses don't review submissions on time, payments are automatically released to influencers.</p>
                        </div>
                      </div>
                    </div>
                    <div className="border border-slate-700/50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Flag className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-slate-300 font-medium">Dispute Resolution</p>
                          <p className="text-slate-400 text-sm">Built-in dispute system with time limits ensures fair resolution of any conflicts between parties.</p>
                        </div>
                      </div>
                    </div>
                    <div className="border border-slate-700/50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Globe className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-slate-300 font-medium">Transparency</p>
                          <p className="text-slate-400 text-sm">All campaign progress, payments, and decisions are recorded on the blockchain for complete transparency.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Start Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/70 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      For Influencers
                    </h3>
                    <p className="text-slate-400">Monetize your audience</p>
                  </div>
                </div>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-slate-300">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Apply to relevant campaigns
                  </li>
                  <li className="flex items-center gap-2 text-slate-300">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Create authentic content
                  </li>
                  <li className="flex items-center gap-2 text-slate-300">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Get paid in cryptocurrency
                  </li>
                  <li className="flex items-center gap-2 text-slate-300">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Build long-term partnerships
                  </li>
                </ul>
                <button
                  onClick={() => {
                    setActiveTab("journeys");
                    setSelectedJourney("influencer");
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all font-medium"
                >
                  Learn Influencer Journey
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/70 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      For Businesses
                    </h3>
                    <p className="text-slate-400">Grow your brand reach</p>
                  </div>
                </div>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-slate-300">
                    <CheckCircle className="w-4 h-4 text-blue-400" />
                    Create targeted campaigns
                  </li>
                  <li className="flex items-center gap-2 text-slate-300">
                    <CheckCircle className="w-4 h-4 text-blue-400" />
                    Select verified influencers
                  </li>
                  <li className="flex items-center gap-2 text-slate-300">
                    <CheckCircle className="w-4 h-4 text-blue-400" />
                    Pay only for delivered results
                  </li>
                  <li className="flex items-center gap-2 text-slate-300">
                    <CheckCircle className="w-4 h-4 text-blue-400" />
                    Track campaign performance
                  </li>
                </ul>
                <button
                  onClick={() => {
                    setActiveTab("journeys");
                    setSelectedJourney("business");
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-medium"
                >
                  Learn Business Journey
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Platform Benefits */}
            <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">
                Why Choose AdsBazaar?
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">
                    Verified & Secure
                  </h4>
                  <p className="text-slate-400">
                    Self Protocol verification ensures real users and secure
                    transactions on blockchain
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">
                    Automated & Fair
                  </h4>
                  <p className="text-slate-400">
                    Smart contracts ensure automatic payments and fair dispute
                    resolution
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Globe className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">
                    Global & Transparent
                  </h4>
                  <p className="text-slate-400">
                    Borderless payments and transparent campaign tracking for
                    all participants
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Journeys Tab */}
        {activeTab === "journeys" && (
          <div className="space-y-8">
            {/* Journey Selection */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {Object.entries(userJourneys).map(([key, journey]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedJourney(key as JourneyKey);
                    setCurrentStep(0);
                  }}
                  className={`flex items-center gap-3 px-6 py-4 rounded-xl font-medium transition-all ${
                    selectedJourney === key
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg"
                      : "bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <journey.icon className="w-5 h-5" />
                  {journey.title}
                </button>
              ))}
            </div>

            {/* Journey Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-white rounded-lg transition-all"
              >
                {isPlaying ? (
                  <PauseCircle className="w-4 h-4" />
                ) : (
                  <PlayCircle className="w-4 h-4" />
                )}
                {isPlaying ? "Pause" : "Play"} Tour
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="p-2 bg-slate-800/50 hover:bg-slate-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    setCurrentStep(
                      Math.min(
                        userJourneys[selectedJourney].steps.length - 1,
                        currentStep + 1
                      )
                    )
                  }
                  disabled={
                    currentStep ===
                    userJourneys[selectedJourney].steps.length - 1
                  }
                  className="p-2 bg-slate-800/50 hover:bg-slate-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Step Progress */}
            <div className="flex justify-center">
              <div className="flex items-center gap-2">
                {userJourneys[selectedJourney].steps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentStep
                        ? "bg-emerald-500"
                        : index < currentStep
                        ? "bg-emerald-300"
                        : "bg-slate-600"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Current Step */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  {(() => {
                    const StepIcon =
                      userJourneys[selectedJourney].steps[currentStep].icon;
                    return <StepIcon className="w-8 h-8 text-white" />;
                  })()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-sm font-medium px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">
                      Step {currentStep + 1} of{" "}
                      {userJourneys[selectedJourney].steps.length}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {userJourneys[selectedJourney].steps[currentStep].title}
                  </h3>
                  <p className="text-slate-300 text-lg mb-6">
                    {
                      userJourneys[selectedJourney].steps[currentStep]
                        .description
                    }
                  </p>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-white mb-3">
                        What to do:
                      </h4>
                      <ul className="space-y-2">
                        {userJourneys[selectedJourney].steps[
                          currentStep
                        ].details.map((detail, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-slate-300"
                          >
                            <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-white mb-3">
                        💡 Pro Tips:
                      </h4>
                      <ul className="space-y-2">
                        {userJourneys[selectedJourney].steps[
                          currentStep
                        ].tips.map((tip, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-slate-300"
                          >
                            <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Key Features Tab */}
        {activeTab === "features" && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">
                Platform Features
              </h2>
              <p className="text-xl text-slate-300">
                Discover the powerful features that make AdsBazaar unique
              </p>
            </div>

            <div className="space-y-4">
              {keyFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedFeature(
                        expandedFeature === index ? null : index
                      )
                    }
                    className="w-full p-6 flex items-center justify-between text-left hover:bg-slate-800/30 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center">
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">
                          {feature.title}
                        </h3>
                        <p className="text-slate-400">{feature.description}</p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform ${
                        expandedFeature === index ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {expandedFeature === index && (
                    <div className="px-6 pb-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-white mb-3">
                            Benefits:
                          </h4>
                          <ul className="space-y-2">
                            {feature.benefits.map((benefit, benefitIndex) => (
                              <li
                                key={benefitIndex}
                                className="flex items-start gap-2 text-slate-300"
                              >
                                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-white mb-3">
                            How it works:
                          </h4>
                          <ol className="space-y-2">
                            {feature.howItWorks.map((step, stepIndex) => (
                              <li
                                key={stepIndex}
                                className="flex items-start gap-2 text-slate-300"
                              >
                                <span className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">
                                  {stepIndex + 1}
                                </span>
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Common Scenarios Tab */}
        {activeTab === "scenarios" && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">
                Common Scenarios
              </h2>
              <p className="text-xl text-slate-300">
                Learn how AdsBazaar handles various situations that may arise
              </p>
            </div>

            <div className="space-y-4">
              {scenarios.map((scenario, index) => (
                <div
                  key={index}
                  className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedScenario(
                        expandedScenario === index ? null : index
                      )
                    }
                    className="w-full p-6 flex items-center justify-between text-left hover:bg-slate-800/30 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          scenario.type === "protection"
                            ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
                            : scenario.type === "quality"
                            ? "bg-gradient-to-br from-amber-400 to-amber-600"
                            : scenario.type === "flexibility"
                            ? "bg-gradient-to-br from-blue-400 to-blue-600"
                            : "bg-gradient-to-br from-purple-400 to-purple-600"
                        }`}
                      >
                        <scenario.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">
                          {scenario.title}
                        </h3>
                        <p className="text-slate-400">{scenario.description}</p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform ${
                        expandedScenario === index ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {expandedScenario === index && (
                    <div className="px-6 pb-6">
                      <h4 className="font-semibold text-white mb-4">
                        How it&#39;s handled:
                      </h4>
                      <ol className="space-y-3">
                        {scenario.steps.map((step, stepIndex) => (
                          <li
                            key={stepIndex}
                            className="flex items-start gap-3"
                          >
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5 ${
                                scenario.type === "protection"
                                  ? "bg-emerald-500"
                                  : scenario.type === "quality"
                                  ? "bg-amber-500"
                                  : scenario.type === "flexibility"
                                  ? "bg-blue-500"
                                  : "bg-purple-500"
                              }`}
                            >
                              {stepIndex + 1}
                            </span>
                            <span className="text-slate-300">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Additional Help Section */}
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center">
                  <HelpCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Need More Help?
                  </h3>
                  <p className="text-slate-300 mb-4">
                    If you have questions not covered in this guide, you can:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-slate-300">
                      <CheckCircle className="w-4 h-4 text-blue-400" />
                      Visit the dispute resolution dashboard for conflict help
                    </li>
                    <li className="flex items-center gap-2 text-slate-300">
                      <CheckCircle className="w-4 h-4 text-blue-400" />
                      Check your dashboard for campaign-specific guidance
                    </li>
                    <li className="flex items-center gap-2 text-slate-300">
                      <CheckCircle className="w-4 h-4 text-blue-400" />
                      Connect with the community on X(Twitter) for tips and
                      advice
                    </li>
                    <span
                      className="text-blue-400 hover:underline cursor-pointer"
                      onClick={() =>
                        window.open("https://x.com/AdsBazaar5", "_blank")
                      }
                    >
                      <X className="inline w-4 h-4" />
                      Follow us on X(Twitter) for updates and support
                    </span>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="border-t border-slate-700/50 bg-slate-800/50 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
              Join thousands of creators and businesses using AdsBazaar for
              transparent, secure influencer marketing campaigns.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all font-medium shadow-lg shadow-emerald-500/20"
              >
                Start Your Journey
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={"/marketplace"}
                className="flex items-center gap-2 px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-600/50 transition-all font-medium"
              >
                <Eye className="w-4 h-4" />
                Browse Campaigns
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EducationPage;
