import { generateMetadata } from './metadata';
import MiniAppCampaignClient from './client';

export { generateMetadata };

export default function MiniAppCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ campaignId?: string }>;
}) {
  return <MiniAppCampaignClient />;
}