// frontend/microfrontends/participant/src/components/DeleteParticipantModal.tsx - Delete Participant Modal Dialog
import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  participantName?: string;
}

export const DeleteParticipantModal: React.FC<DeleteParticipantModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  participantName,
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText.trim() !== 'DELETE') {
      setError('Please type DELETE in all caps');
      return;
    }
    onConfirm();
    handleClose();
  };

  const handleClose = () => {
    setConfirmText('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 flex flex-col transform transition-all">
        <div className="bg-[#d9534f] px-6 py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-black/15 text-black flex items-center justify-center shrink-0 shadow-2xs">
              <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h2 className="text-xl font-bold text-black tracking-tight m-0">Delete Participant</h2>
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

        <form onSubmit={handleSubmit} noValidate className="p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1 text-left">
            <h3 className="text-base font-bold text-gray-900 leading-snug">
              Are you sure you want to delete {participantName ? <span className="text-gray-900 font-extrabold">&quot;{participantName}&quot;</span> : 'this participant'}?
            </h3>
            <p className="text-xs text-gray-500 font-normal">
              You will <span className="font-semibold text-gray-700">NOT</span> be able to recover this participant once deleted.
            </p>
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <div className="relative flex items-center w-full">
              <input
                type="text"
                value={confirmText}
                onChange={(e) => {
                  setConfirmText(e.target.value);
                  if (error) setError('');
                }}
                placeholder={error ? error : "Type DELETE"}
                autoFocus
                className={`w-full border-2 rounded-lg px-3.5 py-2 text-sm outline-none transition-all ${
                  error
                    ? 'border-red-500 bg-red-50/20 text-red-600 placeholder-red-500 font-medium focus:border-red-600 focus:ring-4 focus:ring-red-500/10'
                    : 'border-gray-300 text-gray-800 placeholder-gray-400 focus:border-[#d9534f] focus:ring-4 focus:ring-red-500/10'
                }`}
              />
            </div>
            <span className="text-xs text-gray-400 font-normal">
              Type DELETE in all caps and press enter
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100 w-full">
            <button
              type="submit"
              className="bg-[#d9534f] hover:bg-[#c9302c] text-white px-5 py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-sm font-medium transition-all cursor-pointer shadow-xs hover:shadow-md active:scale-95"
            >
              <span>Yes, delete it</span>
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors cursor-pointer shadow-2xs"
            >
              No, cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeleteParticipantModal;
