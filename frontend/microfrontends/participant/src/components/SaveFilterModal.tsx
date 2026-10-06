// frontend/microfrontends/participant/src/components/SaveFilterModal.tsx - Save Filter Modal Dialog
import React, { useState } from 'react';
import { X, Plus, Bookmark } from 'lucide-react';

interface SaveFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (filterName: string) => void;
}

export const SaveFilterModal: React.FC<SaveFilterModalProps> = ({ isOpen, onClose, onSave }) => {
  const [filterName, setFilterName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!filterName.trim()) {
      setError('Filter Name is required');
      return;
    }
    onSave(filterName.trim());
    setFilterName('');
    setError('');
    onClose();
  };

  const handleClose = () => {
    setFilterName('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 flex flex-col transform transition-all">
        <div className="bg-[#1976d2] px-6 py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-black/15 text-black flex items-center justify-center shrink-0 shadow-2xs">
              <Bookmark className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h2 className="text-xl font-bold text-black tracking-tight m-0">Save Filter</h2>
          </div>
          
          <button
            type="button"
            onClick={handleClose}
            className="text-black/80 hover:text-black hover:bg-black/15 rounded-full p-1.5 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5" noValidate>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap min-w-[95px] flex items-center gap-1">
              Filter Name <span className="text-red-500 font-bold">*</span>
            </label>

            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                value={filterName}
                onChange={(e) => {
                  setFilterName(e.target.value);
                  if (error) setError('');
                }}
                placeholder={error ? error : "Enter Filter Name"}
                autoFocus
                className={`w-full border-2 rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all ${
                  error
                    ? 'border-red-500 bg-red-50/20 text-red-600 placeholder-red-500 font-medium pr-10 focus:border-red-600 focus:ring-4 focus:ring-red-500/10'
                    : 'border-gray-300 text-gray-800 placeholder-gray-400 focus:border-[#1976d2] focus:ring-4 focus:ring-blue-500/10'
                }`}
              />

              {error && (
                <div className="absolute right-3 pointer-events-none flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0 shadow-xs animate-fade-in">
                    <X className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100 w-full">
            <button
              type="submit"
              className="bg-[#1976d2] hover:bg-[#1565c0] text-white px-5 py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-sm font-medium transition-all cursor-pointer shadow-xs hover:shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Submit</span>
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors cursor-pointer shadow-2xs"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaveFilterModal;
