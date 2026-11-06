// frontend/microfrontends/participant/src/components/ComposeSmsModal.tsx - Add Participant Text Modal (matching legacy Ripple)
import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Loader2 } from 'lucide-react';
import { Modal } from '../../../../shared/design-system/components/Modal';
import { TooltipButton } from '../../../../shared/design-system/components/TooltipButton';
import { toast } from '../../../../shared/toaster';
import { getApiErrorMessage } from '../../../../shared/api-client';
import {
  participantApi,
  CommunicationItem,
  ParticipantContactDetail,
  SmsRecipientItem,
} from '../../../../shared/api/participantApi';

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

export const mapSmsRecipientOptions = (
  contacts: Array<Pick<ParticipantContactDetail, 'contactType' | 'contactValue' | 'contactName' | 'active'>>,
  directRecipients: Array<SmsRecipientItem | string>,
): SmsRecipientItem[] => {
  const recipients = new Map<string, SmsRecipientItem>();

  contacts.forEach((contact) => {
    const phoneNumber = contact.contactValue.trim();
    const contactType = contact.contactType.toUpperCase();
    if (!contact.active || (contactType !== 'PHONE' && contactType !== 'SMS') || !phoneNumber) return;

    const existing = recipients.get(phoneNumber);
    recipients.set(phoneNumber, {
      phoneNumber,
      contactName: contact.contactName?.trim() || existing?.contactName,
    });
  });

  directRecipients.forEach((recipient) => {
    const phoneNumber = typeof recipient === 'string' ? recipient.trim() : recipient.phoneNumber.trim();
    if (!phoneNumber) return;

    if (!recipients.has(phoneNumber)) recipients.set(phoneNumber, { phoneNumber });
  });

  return Array.from(recipients.values());
};

export const ComposeSmsModal: React.FC<ComposeSmsModalProps> = ({
  isOpen,
  onClose,
  participantId,
  studyId,
  tenantId,
  siteId,
  onSmsSent,
}) => {
  const [selectedPhone, setSelectedPhone] = useState('');
  const [availablePhones, setAvailablePhones] = useState<SmsRecipientItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && participantId) {
      setSelectedPhone('');
      setAvailablePhones([]);
      setInputValue('');
      Promise.all([
        participantApi.getSmsRecipients(participantId, { tenantId, siteId }),
        participantApi.getContacts(participantId, { tenantId, siteId }),
      ])
        .then(([phones, contacts]) => {
          setAvailablePhones(mapSmsRecipientOptions(contacts, phones || []));
        })
        .catch((err) => {
          toast.error(getApiErrorMessage(err, 'Failed to load participant phone numbers.'));
        });

      setMessage('');
      setIsPinned(false);
      setInputValue('');
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
    setSelectedPhone(trimmed);
    setInputValue('');
    setPhoneError(null);
    setIsDropdownOpen(false);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPhone('');
    setInputValue('');
    setPhoneError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        handleAddPhone(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && selectedPhone) {
      setSelectedPhone('');
    }
  };

  const filteredAvailable = availablePhones.filter(
    (recipient) => recipient.phoneNumber.toLowerCase().includes(inputValue.toLowerCase())
  );

  const canCreate =
    inputValue.trim().length > 0 &&
    selectedPhone !== inputValue.trim() &&
    !availablePhones.some((recipient) => recipient.phoneNumber === inputValue.trim());

  const getPhoneDisplay = (phoneNumber: string) => {
    const recipient = availablePhones.find((item) => item.phoneNumber === phoneNumber);
    if (!recipient) return phoneNumber;
    const contactName = recipient.contactName?.trim();
    return contactName ? `${phoneNumber} (${contactName})` : phoneNumber;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError(null);
    setMessageError(null);

    const currentPhone = inputValue.trim() || selectedPhone;

    let hasError = false;
    if (!currentPhone) {
      setPhoneError('required');
      hasError = true;
    } else if (currentPhone.includes(',') || currentPhone.includes(';')) {
      setPhoneError('Enter only one phone number');
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
          toPhone: currentPhone,
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
      toast.error(msg);
    } finally {
      setIsSending(false);
    }
  };

  return (
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
                style={{ position: 'relative', width: '100%' }}
              >
                <input
                  ref={inputRef}
                  id="text-to-phone"
                  type="tel"
                  value={inputValue || selectedPhone}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setSelectedPhone('');
                    setPhoneError(null);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  onKeyDown={handleKeyDown}
                  placeholder="To"
                  className={`form-input ${phoneError ? 'border-red-500 placeholder:text-red-500' : ''}`}
                  style={{ paddingRight: selectedPhone ? 76 : 40 }}
                  aria-label="Recipient phone number"
                  aria-invalid={Boolean(phoneError)}
                  aria-autocomplete="list"
                  aria-expanded={isDropdownOpen}
                  aria-controls="text-to-phone-options"
                  role="combobox"
                  autoComplete="off"
                  disabled={isSending}
                />

                {selectedPhone && (
                  <TooltipButton
                    label="Clear recipient"
                    onClick={handleClearAll}
                    style={{
                      position: 'absolute',
                      right: 36,
                      top: 0,
                      bottom: 0,
                      width: 36,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={14} aria-hidden="true" />
                  </TooltipButton>
                )}
                <TooltipButton
                  label="Choose a phone number"
                  onClick={() => setIsDropdownOpen((open) => !open)}
                  disabled={isSending}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                  className="text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-haspopup="listbox"
                  aria-expanded={isDropdownOpen}
                >
                  <ChevronDown size={16} aria-hidden="true" />
                </TooltipButton>
                {isDropdownOpen && (
                  <div
                    id="text-to-phone-options"
                    role="listbox"
                    aria-label="Phone number options"
                    className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
                    style={{ position: 'absolute', zIndex: 50, top: '100%', left: 0, right: 0, marginTop: 4 }}
                  >
                    {filteredAvailable.map((recipient) => (
                      <button
                        key={recipient.phoneNumber}
                        type="button"
                        role="option"
                        aria-selected={selectedPhone === recipient.phoneNumber}
                        onClick={() => handleAddPhone(recipient.phoneNumber)}
                        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs text-gray-700 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                      >
                        {getPhoneDisplay(recipient.phoneNumber)}
                      </button>
                    ))}

                    {canCreate && (
                      <button
                        type="button"
                        role="option"
                        aria-selected={false}
                        onClick={() => handleAddPhone(inputValue)}
                        className="flex w-full items-center justify-between gap-3 border-t border-blue-100 bg-blue-50 px-3 py-2 text-left text-xs font-medium text-blue-700 hover:bg-blue-100"
                      >
                        <span>Use {inputValue.trim()}</span>
                      </button>
                    )}

                    {filteredAvailable.length === 0 && !canCreate && (
                      <div className="px-3 py-2 text-center text-xs italic text-gray-400">
                        {availablePhones.length === 0 ? 'Type a phone number and press Enter' : 'No matching numbers'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {phoneError && phoneError !== 'required' && (
                <i className="mt-1 block text-xs italic text-red-500" role="alert">{phoneError}</i>
              )}
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
                placeholder="Message"
                aria-invalid={Boolean(messageError)}
                className={`w-full text-xs rounded border p-2.5 outline-none transition-colors ${
                  messageError ? 'border-red-500 placeholder:text-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                }`}
                disabled={isSending}
              />
              <div className="mt-1 flex items-center justify-between">
                {messageError && messageError !== 'required' ? (
                  <i className="text-red-500 text-xs italic block" role="alert">*{messageError}</i>
                ) : (
                  <span />
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
);
};

export default ComposeSmsModal;
