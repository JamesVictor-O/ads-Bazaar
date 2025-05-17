export const AppliedCampaignsTable = ({ campaigns }) => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        {/* Table headers */}
        <tbody>
          {campaigns.map(campaign => (
            <tr key={campaign.id}>
              {/* Table cells */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )