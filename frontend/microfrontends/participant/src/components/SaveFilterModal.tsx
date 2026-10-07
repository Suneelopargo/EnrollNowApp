// frontend/microfrontends/participant/src/components/SaveFilterModal.tsx - Save Filter Modal Dialog
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Modal } from '../../../../shared/design-system/components/Modal';
import { validateField, validators } from '../../../../shared/design-system/validation';

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
    const validationError = validateField(filterName, [
      validators.required('Filter Name'),
      validators.text('Filter Name'),
    ]);
    if (validationError) {
      setError(validationError);
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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Save Filter"
      footer={(
        <>
          <button type="submit" form="save-filter-form" className="btn btn-primary"><Plus size={16} /> Submit</button>
          <button type="button" onClick={handleClose} className="btn btn-secondary">Cancel</button>
        </>
      )}
    >
      <form id="save-filter-form" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="saved-filter-name">
            Filter Name <span className="form-required-marker" aria-hidden="true">*</span>
          </label>
          <input
            id="saved-filter-name"
            type="text"
            value={filterName}
            onChange={(e) => {
              setFilterName(e.target.value);
              if (error) setError('');
            }}
            placeholder={error || 'Enter Filter Name'}
            autoFocus
            required
            className="form-input"
            aria-invalid={!!error}
          />
        </div>
      </form>
    </Modal>
  );
};

export default SaveFilterModal;
