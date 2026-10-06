// frontend/microfrontends/participant/src/components/DeleteFilterModal.tsx - Delete Filter Confirmation Modal Dialog
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  filterName?: string;
}

export const DeleteFilterModal: React.FC<DeleteFilterModalProps> = ({ isOpen, onClose, onConfirm, filterName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 flex flex-col transform transition-all">
        <div className="bg-[#d9534f] px-6 py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-black/15 text-black flex items-center justify-center shrink-0 shadow-2xs">
              <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h2 className="text-xl font-bold text-black tracking-tight m-0">Are you sure?</h2>
          </div>
          
          <button
            type="button"
            onClick={onClose}
            className="text-black/80 hover:text-black hover:bg-black/15 rounded-full p-1.5 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <p className="text-sm text-gray-600 leading-relaxed">
            You will <span className="font-semibold text-gray-800">NOT</span> be able to recover {filterName ? <span className="font-semibold text-gray-900">&quot;{filterName}&quot;</span> : 'this filter'} once deleted.
          </p>

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100 w-full">
            <button
              type="button"
              onClick={onConfirm}
              className="bg-[#d9534f] hover:bg-[#c9302c] text-white px-5 py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-sm font-medium transition-all cursor-pointer shadow-xs hover:shadow-md active:scale-95"
            >
              <span>Yes, delete it</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors cursor-pointer shadow-2xs"
            >
              No, cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteFilterModal;
