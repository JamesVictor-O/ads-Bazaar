// ApplicationsModal.tsx
"use client";
import {Brief, Application} from "@/types/index";

interface ApplicationsModalProps {
  selectedBrief: Brief | null;
  applications: Application[];
  isLoadingApplications: boolean;
  isSelectingInfluencer: boolean;
  onAssignInfluencer: (briefId: Hex, index: number) => void;
  onClose: () => void;
}

export const ApplicationsModal = ({
  selectedBrief,
  applications,
  isLoadingApplications,
  isSelectingInfluencer,
  onAssignInfluencer,
  onClose,
}: ApplicationsModalProps) => {
  if (!selectedBrief) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto max-h-[80vh] overflow-y-auto">
        <h2 className="text-lg text-gray-700 font-medium mb-4">
          Applications for {selectedBrief.name}
        </h2>
        {isLoadingApplications ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : applications && applications.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {applications.map((application, index) => (
              <li key={index} className="py-4">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        User #{index + 1}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {application.influencer}
                      </p>
                      <p className="text-xs text-gray-500">
                        Applied:{" "}
                        {new Date(
                          application.timestamp * 1000
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    {!application.isSelected &&
                      Number(selectedBrief.maxInfluencers) > 0 && (
                        <button
                          onClick={() =>
                            onAssignInfluencer(selectedBrief.briefId, index)
                          }
                          className="px-3 py-1 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-300"
                          disabled={isSelectingInfluencer}
                        >
                          {isSelectingInfluencer ? (
                            <svg
                              className="animate-spin h-4 w-4 mx-auto text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"
                              ></path>
                            </svg>
                          ) : (
                            "Assign"
                          )}
                        </button>
                      )}
                    {application.isSelected && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{application.message}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center py-4 text-gray-500">No applications yet.</p>
        )}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};