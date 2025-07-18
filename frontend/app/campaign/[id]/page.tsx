import { generateMetadata } from './metadata';
import CampaignDetailClient from './client';

export { generateMetadata };

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <CampaignDetailClient />;
}