// frontend/microfrontends/participant/src/components/SaveFilterModal.tsx - Save Filter Modal Dialog
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Modal } from '../../../../shared/design-system/components/Modal';

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
            <label className="form-label" htmlFor="saved-filter-name">Filter Name *</label>
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
                className="form-input"
                aria-invalid={!!error}
              />
          </div>
      </form>
    </Modal>
  );
};

export default SaveFilterModal;
