import { generateMetadata } from './metadata';
import CampaignShareClient from './client';

export { generateMetadata };

export default function CampaignSharePage({
  searchParams,
}: {
  searchParams: Promise<{ campaignId?: string }>;
}) {
  return <CampaignShareClient />;
}