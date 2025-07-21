'use client';

import { Brief, CampaignStatus } from '@/types';
import { motion } from 'framer-motion';
import { Clock, Users, DollarSign, Target, Calendar, ArrowRight } from 'lucide-react';
import { formatCurrency, formatTimeRemaining, getPhaseColor } from '@/utils/format';
import { getAudienceLabel } from '@/utils/format';
import { computeCampaignTimingInfo } from '@/utils/campaignUtils';
import { UserDisplay } from '@/components/ui/UserDisplay';
import { useRouter } from 'next/navigation';

interface CampaignCardProps {
  brief: Brief;
  onApply?: () => void;
  showFullDetails?: boolean;
  className?: string;
  onClick?: () => void;
  clickable?: boolean;
  theme?: 'light' | 'dark';
}

export default function CampaignCard({ 
  brief, 
  onApply, 
  showFullDetails = false,
  className = '',
  onClick,
  clickable = false,
  theme = 'light'
}: CampaignCardProps) {
  const router = useRouter();
  const timingInfo = computeCampaignTimingInfo(brief);
  const paymentPerInfluencer = brief.budget / brief.maxInfluencers;

  // Theme-aware styling
  const themeStyles = {
    card: theme === 'dark' 
      ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 text-white' 
      : 'bg-white border-gray-200 hover:shadow-xl text-gray-900',
    title: theme === 'dark' ? 'text-white' : 'text-gray-900',
    description: theme === 'dark' ? 'text-slate-300' : 'text-gray-600',
    label: theme === 'dark' ? 'text-slate-400' : 'text-gray-500',
    value: theme === 'dark' ? 'text-white' : 'text-gray-900',
    progressBg: theme === 'dark' ? 'bg-slate-700' : 'bg-gray-200',
    requirementsBg: theme === 'dark' ? 'bg-slate-900/50' : 'bg-gray-50',
    urgentBg: theme === 'dark' ? 'bg-orange-500/20 border-orange-500/30' : 'bg-orange-50 border-orange-200',
    urgentText: theme === 'dark' ? 'text-orange-300' : 'text-orange-800',
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on the apply button
    if ((e.target as HTMLElement).closest('button[data-campaign-action]')) {
      return;
    }
    
    if (onClick) {
      onClick();
    } else if (clickable) {
      router.push(`/campaign/${brief.id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleCardClick}
      className={`rounded-xl shadow-lg border overflow-hidden transition-all duration-300 ${themeStyles.card} ${
        clickable || onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className={`text-xl font-bold mb-2 ${themeStyles.title}`}>{brief.name}</h3>
            <UserDisplay address={brief.business} showFullAddress={false} />
          </div>
          <div className="flex flex-col gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPhaseColor(timingInfo.phase)}`}>
              {timingInfo.phase}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {getAudienceLabel(brief.targetAudience)}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className={`mb-4 leading-relaxed ${themeStyles.description}`}>
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
              <p className={`text-xs ${themeStyles.label}`}>Budget</p>
              <p className={`font-semibold ${themeStyles.value}`}>{formatCurrency(brief.budget, brief.currency)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            <div>
              <p className={`text-xs ${themeStyles.label}`}>Per Influencer</p>
              <p className={`font-semibold ${themeStyles.value}`}>{formatCurrency(paymentPerInfluencer, brief.currency)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-purple-600" />
            <div>
              <p className={`text-xs ${themeStyles.label}`}>Spots</p>
              <p className={`font-semibold ${themeStyles.value}`}>
                {Number(brief.applicationCount)}/{brief.maxInfluencers}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-600" />
            <div>
              <p className={`text-xs ${themeStyles.label}`}>Deadline</p>
              <p className={`font-semibold ${themeStyles.value}`}>{timingInfo.timeRemaining ? formatTimeRemaining(timingInfo.timeRemaining) : 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className={`flex justify-between text-xs mb-1 ${themeStyles.label}`}>
            <span>Applications Progress</span>
            <span>{Number(brief.applicationCount)}/{brief.maxInfluencers} filled</span>
          </div>
          <div className={`w-full rounded-full h-2 ${themeStyles.progressBg}`}>
            <div 
              className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.min((Number(brief.applicationCount) / brief.maxInfluencers) * 100, 100)}%` 
              }}
            />
          </div>
        </div>

        {/* Requirements (if full details) */}
        {showFullDetails && brief.requirements && (
          <div className={`mb-4 p-4 rounded-lg ${themeStyles.requirementsBg}`}>
            <h4 className={`font-semibold mb-2 flex items-center gap-2 ${themeStyles.title}`}>
              <Calendar className="h-4 w-4" />
              Requirements
            </h4>
            <p className={`text-sm ${themeStyles.description}`}>{brief.requirements}</p>
          </div>
        )}

        {/* Timing Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <span className={themeStyles.label}>Promotion Duration:</span>
            <span className={`ml-2 font-medium ${themeStyles.value}`}>{Number(brief.promotionDuration)} days</span>
          </div>
          <div>
            <span className={themeStyles.label}>Created:</span>
            <span className={`ml-2 font-medium ${themeStyles.value}`}>
              {new Date(Number(brief.creationTime) * 1000).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Status Banner */}
        {timingInfo.isUrgent && (
          <div className={`mb-4 p-3 rounded-lg border ${themeStyles.urgentBg}`}>
            <p className={`text-sm font-medium ${themeStyles.urgentText}`}>
              ⏰ Urgent: Deadline approaching
            </p>
          </div>
        )}
      </div>

      {/* Action Button */}
      {onApply && (
        <div className="px-6 pb-6">
          <button
            onClick={onApply}
            data-campaign-action="apply"
            disabled={brief.status !== CampaignStatus.OPEN || Number(brief.applicationCount) >= brief.maxInfluencers}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              brief.status === CampaignStatus.OPEN && Number(brief.applicationCount) < brief.maxInfluencers
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {Number(brief.applicationCount) >= brief.maxInfluencers ? (
              'Campaign Full'
            ) : brief.status !== CampaignStatus.OPEN ? (
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