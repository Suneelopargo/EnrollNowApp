// frontend/microfrontends/participant/src/components/ComposeSmsModal.tsx - Add Participant Text Modal (matching legacy Ripple)
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, Loader2, AlertCircle } from 'lucide-react';
import { Modal } from '../../../../shared/design-system/components/Modal';
import { toast } from '../../../../shared/toaster';
import { getApiErrorMessage } from '../../../../shared/api-client';
import { participantApi, CommunicationItem } from '../../../../shared/api/participantApi';

export interface ComposeSmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantId: string;
  participantName: string;
  studyId?: string;
  tenantId?: string;
  siteId?: string;
  onSmsSent: (sms: CommunicationItem) => void;
}

export const ComposeSmsModal: React.FC<ComposeSmsModalProps> = ({
  isOpen,
  onClose,
  participantId,
  participantName,
  studyId,
  tenantId,
  siteId,
  onSmsSent,
}) => {
  const [selectedPhones, setSelectedPhones] = useState<string[]>([]);
  const [availablePhones, setAvailablePhones] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && participantId) {
      participantApi
        .getSmsRecipients(participantId, { tenantId, siteId })
        .then((phones) => {
          setAvailablePhones(phones || []);
          if (phones && phones.length > 0) {
            setSelectedPhones([phones[0]]);
          } else {
            setSelectedPhones([]);
          }
        })
        .catch((err) => {
          console.warn('Failed to load SMS phones:', err);
        });

      setMessage('');
      setIsPinned(false);
      setInputValue('');
      setBannerError(null);
      setPhoneError(null);
      setMessageError(null);
      setIsDropdownOpen(false);
    }
  }, [isOpen, participantId, tenantId, siteId]);

  // Click outside listener for creatable select dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleAddPhone = (phone: string) => {
    const trimmed = phone.trim();
    if (!trimmed) return;
    if (!selectedPhones.includes(trimmed)) {
      setSelectedPhones((prev) => [...prev, trimmed]);
    }
    setInputValue('');
    setPhoneError(null);
    setBannerError(null);
    setIsDropdownOpen(false);
  };

  const handleRemovePhone = (phoneToRemove: string) => {
    setSelectedPhones((prev) => prev.filter((p) => p !== phoneToRemove));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPhones([]);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        handleAddPhone(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && selectedPhones.length > 0) {
      setSelectedPhones((prev) => prev.slice(0, -1));
    }
  };

  const filteredAvailable = availablePhones.filter(
    (p) => !selectedPhones.includes(p) && p.toLowerCase().includes(inputValue.toLowerCase())
  );

  const canCreate =
    inputValue.trim().length > 0 &&
    !selectedPhones.includes(inputValue.trim()) &&
    !availablePhones.includes(inputValue.trim());

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerError(null);
    setPhoneError(null);
    setMessageError(null);

    // If there is still text typed in input that wasn't committed, add it
    let currentPhones = [...selectedPhones];
    if (inputValue.trim() && !currentPhones.includes(inputValue.trim())) {
      currentPhones.push(inputValue.trim());
      setSelectedPhones(currentPhones);
      setInputValue('');
    }

    let hasError = false;
    if (currentPhones.length === 0) {
      setPhoneError('required');
      hasError = true;
    }

    if (!message.trim()) {
      setMessageError('required');
      hasError = true;
    } else if (message.length > 1600) {
      setMessageError('Message needs to be 1600 characters or less');
      hasError = true;
    }

    if (hasError) return;

    setIsSending(true);
    try {
      const sent = await participantApi.sendSms(
        participantId,
        {
          toPhone: currentPhones.join(', '),
          toPhones: currentPhones,
          body: message.trim(),
          pinned: isPinned,
          studyId: studyId?.trim() || undefined,
        },
        { tenantId, siteId }
      );

      toast.success(sent.status === 'QUEUED' ? 'Success! Text Message log added.' : 'Success! Text Message sent.');
      onSmsSent(sent);
      onClose();
    } catch (err: any) {
      const msg = getApiErrorMessage(err, 'Phone number is not valid for region. Try changing the phone number.');
      setBannerError(msg);
      // Also highlight field error if relevant
      if (msg.toLowerCase().includes('phone') || msg.toLowerCase().includes('region')) {
        setPhoneError('Phone number is not valid');
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Top of screen error banner matching legacy Bert alert (Image 8) */}
      {bannerError && typeof document !== 'undefined' && createPortal(
        <div
          id="bert-alert-top-banner"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            width: '100%',
            zIndex: 999999,
            backgroundColor: '#d9534f',
            color: '#ffffff',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '13px',
            fontWeight: 500,
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.25)',
          }}
          role="alert"
        >
          <button
            type="button"
            onClick={() => setBannerError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              padding: '0 4px',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Dismiss alert"
          >
            ✕
          </button>
          <span>{bannerError}</span>
        </div>,
        document.body
      )}

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Add Participant Text"
        className="compose-text-modal"
      >
        <div className="compose-text-message-container relative">
          <form onSubmit={handleSend} className="compose-text-form space-y-4">
          {/* TO FIELD */}
          <div className="form-group compose-text-row">
            <label className="compose-text-label text-sm text-gray-700 font-normal" htmlFor="text-to-phone">
              To
            </label>
            <div className="compose-text-control">
              <div
                ref={containerRef}
                className={`relative min-h-[38px] border rounded bg-white flex items-center flex-wrap gap-1 px-2 py-1 transition-colors cursor-text ${
                  phoneError ? 'border-red-500' : 'border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500'
                }`}
                onClick={() => {
                  inputRef.current?.focus();
                  setIsDropdownOpen(true);
                }}
              >
                {/* Selected phone chips */}
                {selectedPhones.map((ph) => (
                  <span
                    key={ph}
                    className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded border border-gray-200"
                  >
                    <span>{ph}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePhone(ph);
                      }}
                      className="text-gray-400 hover:text-gray-700 font-bold ml-0.5"
                      aria-label={`Remove ${ph}`}
                    >
                      ×
                    </button>
                  </span>
                ))}

                {/* Input text */}
                <input
                  ref={inputRef}
                  id="text-to-phone"
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  onKeyDown={handleKeyDown}
                  placeholder={selectedPhones.length === 0 ? 'To' : ''}
                  className="flex-1 min-w-[120px] outline-none border-none text-xs text-gray-800 p-0 bg-transparent"
                  disabled={isSending}
                />

                {/* Clear all (X) and Chevron */}
                <div className="flex items-center gap-1 ml-auto text-gray-400">
                  {selectedPhones.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="hover:text-gray-600 p-0.5"
                      aria-label="Clear all recipients"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <ChevronDown
                    size={16}
                    className="cursor-pointer hover:text-gray-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDropdownOpen((prev) => !prev);
                    }}
                  />
                </div>

                {/* Creatable dropdown menu */}
                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-52 overflow-y-auto z-50 py-1 text-xs">
                    {filteredAvailable.map((ph) => (
                      <div
                        key={ph}
                        onClick={() => handleAddPhone(ph)}
                        className="px-3 py-1.5 hover:bg-blue-50 hover:text-blue-700 cursor-pointer text-gray-700"
                      >
                        {ph}
                      </div>
                    ))}

                    {canCreate && (
                      <div
                        onClick={() => handleAddPhone(inputValue)}
                        className="px-3 py-2 bg-blue-50 text-blue-700 font-medium hover:bg-blue-100 cursor-pointer border-t border-blue-100 flex items-center justify-between"
                      >
                        <span>Create "{inputValue.trim()}"</span>
                        <span className="text-[10px] text-blue-500 bg-white px-1.5 py-0.5 rounded border border-blue-200">↵ Enter</span>
                      </div>
                    )}

                    {filteredAvailable.length === 0 && !canCreate && (
                      <div className="px-3 py-2 text-gray-400 italic text-center">
                        {availablePhones.length === 0 ? 'Type a phone number and press Enter' : 'No matching numbers'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Validation helper text */}
              <div className="mt-1">
                {phoneError ? (
                  <i className="text-red-500 text-xs italic block">*{phoneError}</i>
                ) : (
                  <i className="text-gray-400 text-xs italic block">*required</i>
                )}
              </div>
            </div>
          </div>

          {/* MESSAGE FIELD */}
          <div className="form-group compose-text-row">
            <label className="compose-text-label text-sm text-gray-700 font-normal" htmlFor="text-msg-input">
              Message
            </label>
            <div className="compose-text-control">
              <textarea
                id="text-msg-input"
                rows={8}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (messageError) setMessageError(null);
                }}
                className={`w-full text-xs rounded border p-2.5 outline-none transition-colors ${
                  messageError ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                }`}
                disabled={isSending}
              />
              <div className="mt-1 flex items-center justify-between">
                {messageError ? (
                  <i className="text-red-500 text-xs italic block">*{messageError}</i>
                ) : (
                  <i className="text-gray-400 text-xs italic block">*required</i>
                )}
                {message.length > 0 && (
                  <span className={`text-[11px] ${message.length > 1600 ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
                    {message.length} / 1600
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* MARK TEXT AS */}
          <div className="form-group compose-text-row compose-text-options pt-1">
            <span className="compose-text-label text-sm text-gray-700 font-normal">
              Mark Text As
            </span>
            <label className="compose-text-control inline-flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isSending}
              />
              <span>Pin Text</span>
            </label>
          </div>

          {/* FOOTER BUTTON */}
          <div className="compose-text-submit">
            <button
              type="submit"
              disabled={isSending}
              className="btn btn-primary"
              style={{
                backgroundColor: '#1d4ed8',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '13px',
                padding: '8px 24px',
                borderRadius: '4px',
                border: 'none',
              }}
            >
              {isSending ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Sending...
                </span>
              ) : (
                'Send Text'
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  </>
);
};

export default ComposeSmsModal;
