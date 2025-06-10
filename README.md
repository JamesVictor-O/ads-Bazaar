# AdsBazaar: Decentralized Influencer Marketing Platform

> **Connecting verified influencers with businesses through trustless smart contracts and zero-knowledge identity verification**

AdsBazaar is a decentralized advertising platform connecting businesses with influencers, featuring escrow payments, dispute resolution, and identity verification through Self protocol.

## What We Do

**For Businesses:** Create targeted marketing campaigns, select from verified influencers, and pay only when promotion is completed - all with guaranteed execution and transparent pricing.

**For Influencers:** Discover relevant campaigns, get verified once with zero-knowledge proofs, and receive guaranteed payments directly to your wallet without platform hold-ups.

**For Everyone:** Experience influencer marketing without trust issues, payment delays, or high platform fees.

## Live Demo & Links

### Website

- **Mini App in Farcaster**: [https://farcaster.xyz/miniapps/rjMsBh5zjPSl/ads-bazaar](https://farcaster.xyz/miniapps/rjMsBh5zjPSl/ads-bazaar)
- **Live Platform**: [https://ads-bazaar.vercel.app](https://ads-bazaar.vercel.app/)
- **Pitch Deck**: [https://adsbazaar-lwrzii4.gamma.site/](https://adsbazaar-lwrzii4.gamma.site/)

### Video Demo

- **Quick Overview**: [https://www.loom.com/share/2ef728b6756d4c9b80e48f5ed0d0bf0a](https://www.loom.com/share/2ef728b6756d4c9b80e48f5ed0d0bf0a)

### Smart Contract

- **Celo Mainnet**: `[view on celo mainnet](https://celo.blockscout.com/address/0x106702795D0bd411B178e96Ad1f64cCB5971fCD7)
- - **Celo Alfajores Testnet**: [view on Celo Alfajores blockscout explorer](https://celo-alfajores.blockscout.com/address/0xCC1281626e5616530B609f141eda1BE257940E13)

## Table of Contents

- [Live Demo & Links](#live-demo--links)
- [Problem Statement](#problem-statement)
- [Solution Overview](#solution-overview)
- [Competitive Analysis](#competitive-analysis)
- [Architecture](#architecture)
- [Key Features](#key-features)
- [User Stories & Flow](#user-stories--flow)
- [Smart Contract Details](#smart-contract-details)
- [Technology Stack](#technology-stack)
- [Security Features](#security-features)
- [Economic Model](#economic-model)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Future Roadmap](#future-roadmap)
- [Contributing](#contributing)

---

## Problem Statement

The current influencer marketing industry faces several critical challenges:

### Core Issues

1. **Trust & Verification Crisis**: No reliable way to verify influencer authenticity and prevent fake accounts
2. **Payment Disputes**: 67% of influencers report payment delays or non-payment from brands
3. **Lack of Transparency**: Opaque processes for campaign selection and performance evaluation
4. **High Platform Fees**: Traditional platforms charge 15-30% in fees
5. **Geographic Limitations**: Centralized platforms often exclude creators from developing regions
6. **Proof of Work Verification**: Difficulty in verifying actual promotional work completion

### Market Impact

- **$16.4B** influencer marketing industry size (2023)
- **38%** of brands report difficulty finding authentic influencers
- **$1.3B** lost annually due to fake influencer fraud
- **71%** of marketers struggle with campaign measurement

---

## Solution Overview

**AdsBazaar** is a revolutionary decentralized influencer marketing platform that eliminates intermediaries while ensuring trust through blockchain technology and zero-knowledge identity verification.

### Our Unique Value Proposition

**"Trustless influencer marketing with verifiable identity and guaranteed payments"**

We solve the industry's core problems through:

- **Self Protocol Integration**: Zero-knowledge identity verification without compromising privacy
- **Smart Contract Escrow**: Automated, trustless payment distribution
- **Transparent Marketplace**: Open, auditable campaign processes
- **Low Platform Fees**: Only 0.5 to 1% platform fee vs industry standard 15-30%
- **Global Accessibility**: Borderless platform accessible to anyone with crypto wallet

---

## Competitive Analysis

| Platform                  | AdsBazaar                | Instagram Creator       | Upfluence          | AspireIQ           |
| ------------------------- | ------------------------ | ----------------------- | ------------------ | ------------------ |
| **Decentralization**      | Fully Decentralized      | Centralized             | Centralized        | Centralized        |
| **Platform Fees**         | 0.5%                     | 15-30%                  | 20-25%             | 15-20%             |
| **Identity Verification** | ZK-Proof (Self Protocol) | Basic KYC               | Manual             | Basic              |
| **Payment Guarantee**     | Smart Contract Escrow    | Platform Dependent      | Platform Dependent | Platform Dependent |
| **Transparency**          | Fully Transparent        | Black Box               | Limited            | Limited            |
| **Global Access**         | Permissionless           | Geographic Restrictions | Limited Regions    | Limited Regions    |
| **Dispute Resolution**    | Code-Based               | Manual Process          | Manual Process     | Manual Process     |

### What Makes Us Different

1. **Zero-Knowledge Identity**: Usage of Self Protocol for privacy-preserving identity verification
2. **True Decentralization**: No central authority can freeze funds or manipulate outcomes
3. **Programmable Campaigns**: Smart contracts automate entire campaign lifecycle
4. **Crypto-Native**: Built for the Web3 economy with native token payments(cUSD)

---

## Architecture

### Data Flow Architecture

```
Business/Individuals → Create Campaign → Smart Contract Escrow → Influencer Applications
    ↓                                                          ↓
Platform Fee Collection ← Payment Distribution ← Proof Verification ← Selected Influencers
```

---

## Key Features

### Core Functionality

#### For Businesses

- **Campaign Creation**: Define target audience, budget, and requirements
- **Influencer Selection**: Choose from applicants
- **Automated Payments**: Smart contract handles all transactions
- **Performance Tracking**: Monitor campaign progress in real-time
- **Dispute Protection**: Code-based resolution system

#### For Influencers

- **Identity Verification**: One-time ZK-proof verification with Self Protocol
- **Campaign Discovery**: Browse relevant opportunities
- **Guaranteed Payments**: Funds held in escrow until completion
- **Profile Management**: Decentralized profile storage
- **Performance Analytics**: Track earnings and campaign success

#### Platform Features

- **Multi-Target Audiences**: 14 different audience categories
- **Flexible Campaign Types**: Various duration and budget options
- **Automated Workflows**: Smart contract handles entire lifecycle
- **Low Fees**: Only 0.5 to 1% platform fee
- **Global Access**: Available worldwide with crypto wallet

---

## User Stories & Flow

### Business User Journey

#### Story 1: Campaign Creation

_"As a business owner, I want to create a marketing campaign so that I can reach my target audience through verified influencers."_

**Flow:**

1. Business connects Web3 wallet to platform
2. Registers as business user with basic profile
3. Creates new campaign with specifications:
   - Campaign name and description
   - Budget allocation (in cUSD)
   - Target audience selection
   - Maximum number of influencers
   - Application deadline
   - Campaign duration
4. Smart contract escrows the budget automatically
5. Campaign goes live for influencer applications

![ Getting Started](https://ads-bazaar.vercel.app/adsBazaar-GettingStarted.png)
![ Market view for business](https://ads-bazaar.vercel.app/adsBazaar-Marketbusiness.png)
![ Market view for influencer](https://ads-bazaar.vercel.app/adsBazaar-marketInfluencer.png)

#### Story 2: Influencer Selection

_"As a business owner, I want to select the best influencers from applicants so that my campaign achieves maximum impact."_

**Flow:**

1. Business reviews influencer applications
2. Evaluates applicant profiles and messages
3. Selects desired number of influencers
4. Smart contract automatically starts promotion period
5. Verification deadline is set (2 days post-campaign)

![Applications](https://ads-bazaar.vercel.app/adsBazaar-Applications.png)

### Influencer User Journey

#### Story 3: Identity Verification

_"As an influencer, I want to verify my identity privately so that I can access premium campaigns and claim payments."_

**Flow:**

1. Influencer connects wallet and registers
2. Navigates through campaign marketplace and applies to make promotions
3. Initiates Self Protocol verification process
4. Generates zero-knowledge proof of identity
5. Submits proof to smart contract
6. Receives verified status (one-time process)
7. Can now claim payments

![self](https://ads-bazaar.vercel.app/adsBazaar-self)
![Influencer page](https://ads-bazaar.vercel.app/adsBazaar-InfluencerPage.png)
![Influencer page Verification](https://ads-bazaar.vercel.app/ads-Bazaar-SelfVerification.png)

#### Story 4: Campaign Participation

_"As a verified influencer, I want to participate in campaigns so that I can earn income from my content."_

**Flow:**

1. Browses available campaigns by target audience
2. Reviews campaign requirements and budget
3. Submits application with personalized message
4. Waits for business selection
5. If selected, creates promotional content
6. Submits proof of work (links to posts/content)
7. Receives payment automatically after verification

![Influencer page submission](https://ads-bazaar.vercel.app/adsBazaar-SubmitProof.png)

### Payment & Completion Flow

#### Story 5: Payment Distribution

_"As a platform user, I want payments to be handled automatically so that there are no disputes or delays."_

**Flow:**

1. Campaign completion triggers smart contract
2. Budget is divided equally among selected influencers
3. Platform fee (0.5%) is deducted automatically
4. Remaining amount goes to influencer pending payments
5. Verified influencers can claim all pending payments
6. Funds transfer directly to influencer wallets

![Complete flow](https://ads-bazaar.vercel.app/adsBazaar-Submissions.png)

---

## Smart Contract Details

### Contract Structure

```solidity
contract AdsBazaar is SelfVerificationRoot {
    // Core state variables
    IERC20 public cUSD;                           // Payment token
    uint256 public platformFeePercentage = 5;    // 0.5% fee
    mapping(address => bool) public verifiedInfluencers;

    // Campaign management
    mapping(bytes32 => AdBrief) public briefs;
    mapping(bytes32 => InfluencerApplication[]) public applications;

    // User profiles and payments
    mapping(address => UserProfile) public users;
    mapping(address => PendingPayment[]) public influencerPendingPayments;
}
```

### Key Functions

| Function             | Purpose                            | Access               |
| -------------------- | ---------------------------------- | -------------------- |
| `registerUser()`     | Register as business or influencer | Public               |
| `createAdBrief()`    | Create new campaign                | Business Only        |
| `applyToBrief()`     | Apply to campaign                  | Influencer Only      |
| `selectInfluencer()` | Choose campaign participants       | Business Only        |
| `submitProof()`      | Submit work completion proof       | Selected Influencers |
| `completeCampaign()` | Finalize and distribute payments   | Business Only        |
| `verifySelfProof()`  | Verify identity with ZK-proof      | Public               |
| `claimPayments()`    | Withdraw earned payments           | Verified Influencers |

### Security Features

- **Reentrancy Protection**: OpenZeppelin security patterns
- **Access Control**: Role-based function restrictions
- **Nullifier Prevention**: Prevents proof replay attacks
- **Escrow System**: Funds locked until campaign completion
- **Automated Distribution**: Eliminates manual payment errors

---

## Technology Stack

### Blockchain & Smart Contracts

- **Solidity ^0.8.18**: Smart contract development
- **OpenZeppelin**: Security and standard implementations
- **Celo**: Deployment networks
- **Foundry**: Development and testing framework

### Identity & Privacy

- **Self Protocol**: Zero-knowledge identity verification
- **ZK-SNARKs**: Privacy-preserving proofs
- **Nullifier System**: Replay attack prevention

### Payment Infrastructure

- **cUSD Token**: Stable payment currency
- **ERC-20 Standard**: Token compatibility
- **Automated Escrow**: Smart contract-based payments

### Frontend & Integration

- **Next.js**: Modern web interface
- **Wagmi**: Blockchain interaction
- **Farcaster Wallet and Rainbowkit**: Wallet integration

---

## Economic Model

### Fee Structure

| Transaction Type      | Fee                     | Recipient |
| --------------------- | ----------------------- | --------- |
| Campaign Creation     | Gas fees only           | Network   |
| Platform Service      | 0.5% of campaign budget | Platform  |
| Payment Claims        | Gas fees only           | Network   |
| Identity Verification | Gas fees only           | Network   |

### Revenue Distribution

```
Campaign Budget (100%)
├── Influencer Payments (99.5%)
└── Platform Fee (0.5%)
    ├── Development (40%)
    ├── Marketing (30%)
    ├── Operations (20%)
    └── Community Rewards (10%)
```

### Value Alignment

- **Businesses**: Low fees, guaranteed delivery, verified influencers
- **Influencers**: Guaranteed payments, global access, privacy protection
- **Platform**: Sustainable revenue, network effects, community growth

---

## Getting Started

### Quick Start

1. **Connect Wallet**: Use MetaMask or compatible Web3 wallet
2. **Get cUSD**: Acquire cUSD tokens for payments
3. **Register Profile**: Choose business or influencer registration
4. **Verify Identity** (Influencers): Complete one-time ZK-proof verification
5. **Start Using**: Create campaigns or apply to existing ones

### Development Setup

```bash
# Clone repository
git clone git@github.com:JamesVictor-O/ads-Bazaar.git

#For Contract
cd contract

# Install dependencies
forge install
npm install

# Compile contracts
forge b

# Deploy to testnet
forge script --chain celo script/AdsBazaar.s.sol:DeployAdsBazaar --rpc-url $RPC_URL --broadcast --verify -vvvv --interactives 1

#For Frontend
cd frontend

#Install dependencies
npm install

#Run project locally
npm run dev
```

---

## API Reference

### Core Functions

#### Campaign Management

```solidity
function createAdBrief(
    string calldata _name,
    string calldata _description,
    uint256 _budget,
    uint256 _applicationDeadline,
    uint256 _promotionDuration,
    uint256 _maxInfluencers,
    uint8 _targetAudience,
    uint256 _verificationPeriod
) external onlyBusiness
```

#### Application Process

```solidity
function applyToBrief(
    bytes32 _briefId,
    string calldata _message
) external onlyInfluencer

function selectInfluencer(
    bytes32 _briefId,
    uint256 _applicationIndex
) external onlyBusiness
```

#### Payment System

```solidity
function claimPayments() external onlyInfluencer

function getPendingPayments(address _influencer)
    external view returns (
        bytes32[] memory briefIds,
        uint256[] memory amounts,
        bool[] memory approved
    )
```

### View Functions

```solidity
// Get campaign details
function getAdBrief(bytes32 _briefId) external view returns (BriefData memory)

// Get all campaigns
function getAllBriefs() external view returns (bytes32[] memory)

// Check verification status
function isInfluencerVerified(address _influencer) external view returns (bool)
```

---

## Security Features

### Smart Contract Security

- **Access Control**: Role-based permissions for all functions
- **Reentrancy Guards**: Protection against recursive calls
- **Integer Overflow**: SafeMath implementation via Solidity ^0.8.18
- **Input Validation**: Comprehensive parameter checking
- **Emergency Stops**: Owner-controlled pause functionality(coming soon)

### Identity Protection

- **Zero-Knowledge Proofs**: Identity verification without data exposure
- **Nullifier System**: Prevents proof reuse and replay attacks
- **Privacy Preservation**: No personal data stored on-chain
- **Selective Disclosure**: Users control what information to share

### Financial Security

- **Escrow System**: Funds locked until campaign completion
- **Automated Distribution**: Eliminates manual intervention risks
- **Multi-Signature Support**: Additional security for large campaigns(Coming Soon)
- **Audit Trail**: All transactions publicly verifiable

---

## Future Roadmap

### Phase 1: Foundation (Proof of ship season 4)

- Smart contract development
- Self Protocol integration
- Frontend interface integration
- Testnet deployment

### Phase 2: Enhancement

- Advanced analytics dashboard(For both Influencers and Business)
- Security Audit on the application
- Multi-token support
- Reputation system or Ranking system for Influencers

### Phase 3: Scaling

- Cross-chain deployment
- AI-powered matching
- Advanced campaign types
- DAO governance
- Deploy to **Mainnet**

### Phase 4: Ecosystem

- Marketing
- Third-party integrations
- Plugin marketplace
- Enterprise solutions
- Global expansion

---

## Contributing

We welcome contributions from the community! Here's how you can help:

### Ways to Contribute

- **Code**: Submit pull requests for bug fixes or features
- **Documentation**: Improve guides and documentation
- **Testing**: Help test on different networks and scenarios
- **Community**: Share feedback and participate in discussions

### Development Guidelines

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## License & Legal

**License:** MIT

**Important Notes:**

- This is proprietary software developed for hackathon submission
- Commercial use requires explicit permission
- Code is provided for evaluation purposes
- All rights reserved by the development team

---

---

## Acknowledgments

Special thanks to:

- **Celo** for making this possible. Enough motivation to keep building based on milestones
- **Self Protocol** for identity verification infrastructure

---

_Built with love for the decentralized future of influencer marketing_

**AdsBazaar** - Where Trust Meets Transparency
