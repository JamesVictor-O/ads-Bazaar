'use client';

import { Brief } from '@/types';
import { motion } from 'framer-motion';
import { Clock, Users, DollarSign, Target, Calendar, ArrowRight } from 'lucide-react';
import { formatCurrency, formatTimeRemaining, getPhaseColor, getTargetAudienceLabel } from '@/utils/campaignUtils';
import { computeCampaignStatusInfo, computeCampaignTimingInfo } from '@/utils/campaignUtils';
import UserDisplay from './UserDisplay';

interface CampaignCardProps {
  brief: Brief;
  onApply?: () => void;
  showFullDetails?: boolean;
  className?: string;
}

export default function CampaignCard({ 
  brief, 
  onApply, 
  showFullDetails = false,
  className = '' 
}: CampaignCardProps) {
  const statusInfo = computeCampaignStatusInfo(brief);
  const timingInfo = computeCampaignTimingInfo(brief);
  const paymentPerInfluencer = brief.budget / BigInt(brief.maxInfluencers);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 ${className}`}
    >
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{brief.name}</h3>
            <UserDisplay address={brief.business} showAddress={false} />
          </div>
          <div className="flex flex-col gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPhaseColor(statusInfo.phase)}`}>
              {statusInfo.phase}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {getTargetAudienceLabel(brief.targetAudience)}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 mb-4 leading-relaxed">
          {showFullDetails ? brief.description : 
           brief.description.length > 150 ? 
           `${brief.description.slice(0, 150)}...` : 
           brief.description
          }
        </p>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            <div>
              <p className="text-xs text-gray-500">Budget</p>
              <p className="font-semibold text-gray-900">{formatCurrency(brief.budget)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-xs text-gray-500">Per Influencer</p>
              <p className="font-semibold text-gray-900">{formatCurrency(paymentPerInfluencer)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-purple-600" />
            <div>
              <p className="text-xs text-gray-500">Spots</p>
              <p className="font-semibold text-gray-900">
                {Number(brief.currentApplicants)}/{brief.maxInfluencers}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-600" />
            <div>
              <p className="text-xs text-gray-500">Deadline</p>
              <p className="font-semibold text-gray-900">{formatTimeRemaining(brief.applicationDeadline)}</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Applications Progress</span>
            <span>{Number(brief.currentApplicants)}/{brief.maxInfluencers} filled</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.min((Number(brief.currentApplicants) / brief.maxInfluencers) * 100, 100)}%` 
              }}
            />
          </div>
        </div>

        {/* Requirements (if full details) */}
        {showFullDetails && brief.requirements && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Requirements
            </h4>
            <p className="text-gray-600 text-sm">{brief.requirements}</p>
          </div>
        )}

        {/* Timing Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <span className="text-gray-500">Promotion Duration:</span>
            <span className="ml-2 font-medium">{Number(brief.promotionDuration)} days</span>
          </div>
          <div>
            <span className="text-gray-500">Created:</span>
            <span className="ml-2 font-medium">
              {new Date(Number(brief.createdAt) * 1000).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Status Banner */}
        {statusInfo.isUrgent && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-orange-800 text-sm font-medium">
              ⏰ {statusInfo.urgencyMessage}
            </p>
          </div>
        )}
      </div>

      {/* Action Button */}
      {onApply && (
        <div className="px-6 pb-6">
          <button
            onClick={onApply}
            disabled={!brief.isActive || Number(brief.currentApplicants) >= brief.maxInfluencers}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              brief.isActive && Number(brief.currentApplicants) < brief.maxInfluencers
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {Number(brief.currentApplicants) >= brief.maxInfluencers ? (
              'Campaign Full'
            ) : !brief.isActive ? (
              'Campaign Inactive'
            ) : (
              <>
                Apply Now
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
}