import { createPublicClient, http } from 'viem';
import { adsBazaarNotifications } from './notification-service';
import { getCurrentNetworkConfig } from './networks';
import { getFidFromAddress, supabase } from './database';
const ABI = require('./AdsBazaar.json');

import { CONTRACT_ADDRESS } from './contracts';

// Create public client
const currentNetwork = getCurrentNetworkConfig();
const publicClient = createPublicClient({
  chain: currentNetwork.chain,
  transport: http(currentNetwork.rpcUrl),
});

interface EventMonitorConfig {
  startBlock?: bigint;
  pollInterval?: number;
  maxBlockRange?: bigint;
}

export class ContractEventMonitor {
  private isMonitoring = false;
  private pollInterval: number;
  private maxBlockRange: bigint;
  private lastProcessedBlock: bigint;

  constructor(config: EventMonitorConfig = {}) {
    this.pollInterval = config.pollInterval || 10000; // 10 seconds
    this.maxBlockRange = config.maxBlockRange || BigInt(1000); // 1000 blocks
    this.lastProcessedBlock = config.startBlock || BigInt(0);
  }

  async startMonitoring() {
    if (this.isMonitoring) {
      console.log('Event monitoring already running');
      return;
    }

    this.isMonitoring = true;
    console.log('Starting contract event monitoring...');

    // Get current block if no start block specified
    if (this.lastProcessedBlock === BigInt(0)) {
      try {
        this.lastProcessedBlock = await publicClient.getBlockNumber();
      } catch (error) {
        console.error('Error getting current block number:', error);
        this.lastProcessedBlock = BigInt(0);
      }
    }

    this.pollEvents();
  }

  stopMonitoring() {
    this.isMonitoring = false;
    console.log('Stopped contract event monitoring');
  }

  private async pollEvents() {
    while (this.isMonitoring) {
      try {
        await this.processNewEvents();
        await new Promise(resolve => setTimeout(resolve, this.pollInterval));
      } catch (error) {
        console.error('Error in event polling:', error);
        await new Promise(resolve => setTimeout(resolve, this.pollInterval * 2)); // Wait longer on error
      }
    }
  }

  private async processNewEvents() {
    try {
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = this.lastProcessedBlock + BigInt(1);
      
      if (fromBlock > currentBlock) {
        return; // No new blocks
      }

      // Process blocks in chunks to avoid RPC limits
      const toBlock = fromBlock + this.maxBlockRange > currentBlock 
        ? currentBlock 
        : fromBlock + this.maxBlockRange;

      console.log(`Processing events from block ${fromBlock} to ${toBlock}`);

      // Get logs for all events we're interested in
      const logs = await publicClient.getLogs({
        address: CONTRACT_ADDRESS,
        fromBlock,
        toBlock,
        events: [
          // Existing events
          {
            type: 'event',
            name: 'BriefCreated',
            inputs: [
              { name: 'briefId', type: 'bytes32', indexed: true },
              { name: 'business', type: 'address', indexed: true },
              { name: 'budget', type: 'uint256', indexed: false },
              { name: 'targetAudience', type: 'uint8', indexed: false }
            ]
          },
          {
            type: 'event',
            name: 'ApplicationSubmitted',
            inputs: [
              { name: 'briefId', type: 'bytes32', indexed: true },
              { name: 'influencer', type: 'address', indexed: true }
            ]
          },
          {
            type: 'event',
            name: 'InfluencerSelected',
            inputs: [
              { name: 'briefId', type: 'bytes32', indexed: true },
              { name: 'influencer', type: 'address', indexed: true }
            ]
          },
          {
            type: 'event',
            name: 'PaymentReleased',
            inputs: [
              { name: 'briefId', type: 'bytes32', indexed: true },
              { name: 'influencer', type: 'address', indexed: true },
              { name: 'amount', type: 'uint256', indexed: false }
            ]
          },
          {
            type: 'event',
            name: 'SubmissionFlagged',
            inputs: [
              { name: 'briefId', type: 'bytes32', indexed: true },
              { name: 'influencer', type: 'address', indexed: true }
            ]
          },
          // New events for enhanced notifications
          {
            type: 'event',
            name: 'ProofSubmitted',
            inputs: [
              { name: 'briefId', type: 'bytes32', indexed: true },
              { name: 'influencer', type: 'address', indexed: true },
              { name: 'proofLink', type: 'string', indexed: false }
            ]
          },
          {
            type: 'event',
            name: 'ProofApproved',
            inputs: [
              { name: 'briefId', type: 'bytes32', indexed: true },
              { name: 'influencer', type: 'address', indexed: true }
            ]
          },
          {
            type: 'event',
            name: 'ProofRejected',
            inputs: [
              { name: 'briefId', type: 'bytes32', indexed: true },
              { name: 'influencer', type: 'address', indexed: true },
              { name: 'reason', type: 'string', indexed: false }
            ]
          },
          {
            type: 'event',
            name: 'BriefCancelled',
            inputs: [
              { name: 'briefId', type: 'bytes32', indexed: true },
              { name: 'business', type: 'address', indexed: true },
              { name: 'reason', type: 'string', indexed: false }
            ]
          }
        ]
      });

      // Process each event
      for (const log of logs) {
        await this.processEvent(log);
      }

      this.lastProcessedBlock = toBlock;
    } catch (error) {
      console.error('Error processing events:', error);
    }
  }

  private async processEvent(log: any) {
    try {
      const eventName = log.eventName;
      const args = log.args;

      console.log(`Processing event: ${eventName}`, args);

      switch (eventName) {
        case 'BriefCreated':
          await this.handleBriefCreated(args);
          break;
        case 'ApplicationSubmitted':
          await this.handleApplicationSubmitted(args);
          break;
        case 'InfluencerSelected':
          await this.handleInfluencerSelected(args);
          break;
        case 'PaymentReleased':
          await this.handlePaymentReleased(args);
          break;
        case 'SubmissionFlagged':
          await this.handleSubmissionFlagged(args);
          break;
        case 'ProofSubmitted':
          await this.handleProofSubmitted(args);
          break;
        case 'ProofApproved':
          await this.handleProofApproved(args);
          break;
        case 'ProofRejected':
          await this.handleProofRejected(args);
          break;
        case 'BriefCancelled':
          await this.handleBriefCancelled(args);
          break;
        default:
          console.log(`Unhandled event: ${eventName}`);
      }
    } catch (error) {
      console.error('Error processing event:', error);
    }
  }

  // Event handlers
  private async handleBriefCreated(args: any) {
    // Get campaign details and notify matching influencers
    const campaignDetails = {
      briefId: args.briefId,
      business: args.business,
      budget: args.budget,
      targetAudience: args.targetAudience
    };

    // TODO: Get matching influencer FIDs from database
    const matchingInfluencerFids = await this.getMatchingInfluencers(campaignDetails);
    
    await adsBazaarNotifications.notifyCampaignOpportunity(
      matchingInfluencerFids,
      campaignDetails
    );
  }

  private async handleApplicationSubmitted(args: any) {
    // Get business FID from the brief details
    const businessFid = await this.getBusinessFidFromBriefId(args.briefId);
    if (!businessFid) {
      console.log(`No business FID found for brief ${args.briefId}`);
      return;
    }

    // Get brief details for campaign info
    const briefDetails = await this.getBriefDetails(args.briefId);
    const applicantDetails = {
      address: args.influencer,
      username: 'Influencer' // TODO: Could enhance to get actual username from FID mapping
    };

    const campaignDetails = {
      briefId: args.briefId,
      title: briefDetails?.name || 'Campaign'
    };

    await adsBazaarNotifications.notifyApplicationReceived(
      businessFid,
      applicantDetails,
      campaignDetails
    );
  }

  private async handleInfluencerSelected(args: any) {
    const influencerFid = await this.getFidFromAddress(args.influencer);
    if (!influencerFid) {
      console.log(`No influencer FID found for address ${args.influencer}`);
      return;
    }

    const briefDetails = await this.getBriefDetails(args.briefId);
    const campaignDetails = {
      briefId: args.briefId,
      title: briefDetails?.name || 'Campaign'
    };

    await adsBazaarNotifications.notifyInfluencerSelected(
      influencerFid,
      campaignDetails
    );
  }

  private async handlePaymentReleased(args: any) {
    const influencerFid = await this.getFidFromAddress(args.influencer);
    if (!influencerFid) return;

    const paymentDetails = {
      briefId: args.briefId,
      amount: args.amount,
      influencer: args.influencer
    };

    await adsBazaarNotifications.notifyPaymentAvailable(
      influencerFid,
      paymentDetails
    );
  }

  private async handleSubmissionFlagged(args: any) {
    // Notify both influencer and dispute resolvers
    const influencerFid = await this.getFidFromAddress(args.influencer);
    const disputeResolverFids = await this.getDisputeResolverFids();

    const disputeDetails = {
      briefId: args.briefId,
      influencer: args.influencer,
      campaignTitle: 'Campaign' // TODO: Get actual campaign title
    };

    if (influencerFid) {
      await adsBazaarNotifications.notifyDisputeAlert(influencerFid, disputeDetails);
    }

    for (const resolverFid of disputeResolverFids) {
      await adsBazaarNotifications.notifyDisputeAlert(resolverFid, disputeDetails);
    }
  }

  private async handleProofSubmitted(args: any) {
    // Notify brand about new proof submission
    const businessFid = await this.getBusinessFidFromBriefId(args.briefId);
    if (!businessFid) {
      console.log(`No business FID found for brief ${args.briefId}`);
      return;
    }

    const briefDetails = await this.getBriefDetails(args.briefId);
    const submissionDetails = {
      briefId: args.briefId,
      influencer: args.influencer,
      influencerName: 'Influencer', // TODO: Get actual name from FID mapping
      campaignTitle: briefDetails?.name || 'Campaign',
      proofLink: args.proofLink
    };

    await adsBazaarNotifications.notifyProofSubmitted(businessFid, submissionDetails);
  }

  private async handleProofApproved(args: any) {
    // Notify influencer about proof approval
    const influencerFid = await this.getFidFromAddress(args.influencer);
    if (!influencerFid) return;

    const proofDetails = {
      briefId: args.briefId,
      campaignTitle: 'Campaign', // TODO: Get actual campaign title
      isApproved: true
    };

    await adsBazaarNotifications.notifyProofStatusUpdate(influencerFid, proofDetails);
  }

  private async handleProofRejected(args: any) {
    // Notify influencer about proof rejection
    const influencerFid = await this.getFidFromAddress(args.influencer);
    if (!influencerFid) return;

    const proofDetails = {
      briefId: args.briefId,
      campaignTitle: 'Campaign', // TODO: Get actual campaign title
      isApproved: false,
      reason: args.reason
    };

    await adsBazaarNotifications.notifyProofStatusUpdate(influencerFid, proofDetails);
  }

  private async handleBriefCancelled(args: any) {
    // Notify all applied influencers about campaign cancellation
    const appliedInfluencerFids = await this.getAppliedInfluencerFids(args.briefId);
    
    const cancellationDetails = {
      briefId: args.briefId,
      campaignTitle: 'Campaign', // TODO: Get actual campaign title
      reason: args.reason
    };

    await adsBazaarNotifications.notifyCampaignCancelled(
      appliedInfluencerFids,
      cancellationDetails
    );
  }

  // Helper methods - implemented for FID lookups and user matching
  private async getFidFromAddress(address: string): Promise<number | null> {
    try {
      return await getFidFromAddress(address);
    } catch (error) {
      console.error('Error getting FID from address:', error);
      return null;
    }
  }

  private async getMatchingInfluencers(campaignDetails: any): Promise<number[]> {
    try {
      // Get all registered influencers with notification tokens enabled
      const { data: influencers, error } = await supabase
        .from('user_fid_mappings')
        .select(`
          fid,
          notification_tokens!inner(enabled)
        `)
        .eq('notification_tokens.enabled', true);

      if (error) {
        console.error('Error fetching matching influencers:', error);
        return [];
      }

      // For now, return all influencers with notifications enabled
      // In the future, you could add audience matching logic here
      return influencers?.map(i => i.fid) || [];
    } catch (error) {
      console.error('Error getting matching influencers:', error);
      return [];
    }
  }

  private async getDisputeResolverFids(): Promise<number[]> {
    try {
      // Get all users who are registered as dispute resolvers
      // For now, return empty array - you can implement dispute resolver registration later
      const { data: resolvers, error } = await supabase
        .from('dispute_resolvers')
        .select('fid')
        .eq('active', true);

      if (error) {
        console.log('No dispute resolvers table found, returning empty array');
        return [];
      }

      return resolvers?.map(r => r.fid) || [];
    } catch (error) {
      console.error('Error getting dispute resolver FIDs:', error);
      return [];
    }
  }

  private async getAppliedInfluencerFids(briefId: string): Promise<number[]> {
    try {
      // Get all influencers who applied to this campaign by querying the blockchain
      const applicationData = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: 'getBriefApplications',
        args: [briefId],
      }) as any;

      if (!applicationData?.influencers || !Array.isArray(applicationData.influencers)) {
        return [];
      }

      // Convert addresses to FIDs
      const fids: number[] = [];
      for (const address of applicationData.influencers) {
        const fid = await this.getFidFromAddress(address);
        if (fid) {
          fids.push(fid);
        }
      }

      return fids;
    } catch (error) {
      console.error('Error getting applied influencer FIDs:', error);
      return [];
    }
  }

  private async getBriefDetails(briefId: string): Promise<any> {
    try {
      const briefData = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: 'getAdBrief',
        args: [briefId],
      });

      return briefData;
    } catch (error) {
      console.error('Error getting brief details:', error);
      return null;
    }
  }

  private async getBusinessFidFromBriefId(briefId: string): Promise<number | null> {
    try {
      const briefDetails = await this.getBriefDetails(briefId);
      if (!briefDetails?.business) {
        return null;
      }
      
      return await this.getFidFromAddress(briefDetails.business);
    } catch (error) {
      console.error('Error getting business FID from brief ID:', error);
      return null;
    }
  }
}

// Export singleton instance
export const contractEventMonitor = new ContractEventMonitor();

// Auto-start monitoring in all environments (for testing notifications)
// You can disable this in development if it causes issues
if (typeof window === 'undefined') { // Only run on server side
  // Start monitoring with a delay to ensure database is ready
  setTimeout(() => {
    contractEventMonitor.startMonitoring();
  }, 5000);
}