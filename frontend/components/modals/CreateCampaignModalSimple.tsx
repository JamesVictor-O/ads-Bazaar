"use client";

import React from "react";
import { X } from "lucide-react";

interface CreateCampaignModalProps {
  formData: any;
  setFormData: (data: any) => void;
  isCreatingBrief: boolean;
  isFormValid: boolean;
  onCreateCampaign: () => Promise<string>;
  onClose: () => void;
  isCreateSuccess?: boolean;
  isCreateError?: boolean;
  createError?: Error | null;
}

function CreateCampaignModalSimple({
  onClose,
}: CreateCampaignModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 md:p-4 overflow-y-auto">
      <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl w-full max-w-[95vw] sm:max-w-2xl mx-auto">
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-700/50">
          <h2 className="text-lg sm:text-2xl font-bold text-white">
            Create New Campaign
          </h2>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <p className="text-slate-300">Campaign creation temporarily unavailable. Please try again later.</p>
        </div>
        <div className="border-t border-slate-700/50 p-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateCampaignModalSimple;