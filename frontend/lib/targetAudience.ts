// Enhanced Target Audience configuration with icons and descriptions
// Maps to the TargetAudience enum from types/index.ts and smart contract

import { TargetAudience, AUDIENCE_LABELS } from "@/types/index";

export interface TargetAudienceOption {
  value: TargetAudience;
  label: string;
  description: string;
  icon: string;
}

// Enhanced target audience configuration with blockchain enum values
export const TARGET_AUDIENCE_CONFIG: TargetAudienceOption[] = [
  {
    value: TargetAudience.GENERAL,
    label: AUDIENCE_LABELS[TargetAudience.GENERAL],
    description: "All demographics and interests",
    icon: "👥"
  },
  {
    value: TargetAudience.FASHION,
    label: AUDIENCE_LABELS[TargetAudience.FASHION],
    description: "Style, clothing, and fashion trends",
    icon: "👗"
  },
  {
    value: TargetAudience.TECH,
    label: AUDIENCE_LABELS[TargetAudience.TECH],
    description: "Technology, gadgets, and software",
    icon: "💻"
  },
  {
    value: TargetAudience.GAMING,
    label: AUDIENCE_LABELS[TargetAudience.GAMING],
    description: "Video games and gaming content",
    icon: "🎮"
  },
  {
    value: TargetAudience.FITNESS,
    label: AUDIENCE_LABELS[TargetAudience.FITNESS],
    description: "Health, workout, and wellness",
    icon: "💪"
  },
  {
    value: TargetAudience.BEAUTY,
    label: AUDIENCE_LABELS[TargetAudience.BEAUTY],
    description: "Makeup, skincare, and beauty",
    icon: "💄"
  },
  {
    value: TargetAudience.FOOD,
    label: AUDIENCE_LABELS[TargetAudience.FOOD],
    description: "Cooking, recipes, and food reviews",
    icon: "🍽️"
  },
  {
    value: TargetAudience.TRAVEL,
    label: AUDIENCE_LABELS[TargetAudience.TRAVEL],
    description: "Travel destinations and experiences",
    icon: "✈️"
  },
  {
    value: TargetAudience.BUSINESS,
    label: AUDIENCE_LABELS[TargetAudience.BUSINESS],
    description: "Entrepreneurship and business",
    icon: "💼"
  },
  {
    value: TargetAudience.EDUCATION,
    label: AUDIENCE_LABELS[TargetAudience.EDUCATION],
    description: "Learning and educational content",
    icon: "📚"
  },
  {
    value: TargetAudience.ENTERTAINMENT,
    label: AUDIENCE_LABELS[TargetAudience.ENTERTAINMENT],
    description: "Movies, music, and entertainment",
    icon: "🎬"
  },
  {
    value: TargetAudience.SPORTS,
    label: AUDIENCE_LABELS[TargetAudience.SPORTS],
    description: "Sports and athletic content",
    icon: "⚽"
  },
  {
    value: TargetAudience.LIFESTYLE,
    label: AUDIENCE_LABELS[TargetAudience.LIFESTYLE],
    description: "Daily life and lifestyle content",
    icon: "🌟"
  },
  {
    value: TargetAudience.OTHER,
    label: AUDIENCE_LABELS[TargetAudience.OTHER],
    description: "Other categories not listed",
    icon: "📦"
  }
];

// Helper function to get target audience configuration by enum value
export function getTargetAudienceConfig(value: TargetAudience): TargetAudienceOption | undefined {
  return TARGET_AUDIENCE_CONFIG.find(config => config.value === value);
}

// Helper function to get target audience label with icon
export function getTargetAudienceLabelWithIcon(value: TargetAudience): string {
  const config = getTargetAudienceConfig(value);
  return config ? `${config.icon} ${config.label}` : AUDIENCE_LABELS[value] || 'Unknown';
}