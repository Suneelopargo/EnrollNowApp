// frontend/microfrontends/participant/src/components/RegistryDashboard.tsx - Participant & Registry Dashboard Root
import React, { useState, useMemo } from 'react';
import { toast } from '../../../../shared/toaster';
import { requestConfirmation } from '../../../../shared/confirmation';
import LeftFilterPanel from './LeftFilterPanel';
import ParticipantGrid from './ParticipantGrid';
import AddParticipantModal from './AddParticipantModal';
import SaveFilterModal from './SaveFilterModal';
import ParticipantDetailModal from './ParticipantDetailModal';
import { initialParticipants } from '../mockData';
import { ParticipantRecord, CustomFilterRule, SavedSearch } from '../types/participant';

export const RegistryDashboard: React.FC = () => {
  const [participants, setParticipants] = useState<ParticipantRecord[]>(initialParticipants);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>(initialParticipants[0]?.id || '1');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [contactFilter, setContactFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [availableFilter, setAvailableFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [selectedStudies, setSelectedStudies] = useState<string[]>([]);
  const [customFilters, setCustomFilters] = useState<CustomFilterRule[]>([]);
  
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([
    {
      id: 'saved-asd',
      name: 'asd',
      contactFilter: 'all',
      availableFilter: 'all',
      searchTerm: '',
      selectedStudies: ['Autism Study'],
      customFilters: [],
    },
    {
      id: 'saved-sireesha',
      name: 'sireesha',
      contactFilter: 'no',
      availableFilter: 'all',
      searchTerm: '',
      selectedStudies: [],
      customFilters: [{ id: '1', field: 'gender', operator: 'equal to', value: 'Female' }],
    }
  ]);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [detailModalState, setDetailModalState] = useState<{ isOpen: boolean; participant: ParticipantRecord | null }>({
    isOpen: false,
    participant: null,
  });
  const showNotification = (msg: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    toast[type](msg);
  };

  const matchCustomFilter = (p: ParticipantRecord, f: CustomFilterRule): boolean => {
    if (!f.field || !f.value) return true;
    const val = (f.value || '').toString().toLowerCase().trim();
    if (!val) return true;
    const op = f.operator || 'equal to';
    
    let targetVal: any = (p as any)[f.field];

    let isGenderField = false;
    if (f.field === 'age') {
      targetVal = p.age || p.ageNumeric;
    } else if (f.field === 'gender' || f.field === 'sex') {
      isGenderField = true;
      targetVal = (p.gender && p.gender !== '...') ? p.gender : (p.demographics?.gender || '...');
    } else if (f.field === 'studies') {
      targetVal = p.studies?.map((s) => s.name).join(', ');
    } else if (f.field === 'tags') {
      targetVal = p.tags?.join(', ');
    } else if (f.field === 'ethnicity') {
      targetVal = p.demographics?.ethnicity;
    } else if (f.field === 'race') {
      targetVal = p.demographics?.race;
    } else if (f.field === 'firstName') {
      targetVal = p.firstName;
    } else if (f.field === 'lastName') {
      targetVal = p.lastName;
    } else if (f.field === 'birthMonth') {
      targetVal = p.birthMonth;
    }
    
    if (targetVal == null) return false;
    const targetStr = targetVal.toString().toLowerCase().trim();
    const targetNum = parseFloat(targetStr.replace(/[^0-9.]/g, '')) || p.ageNumeric || 0;
    const valNum = parseFloat(val.replace(/[^0-9.]/g, ''));

    if (isGenderField) {
      if (op === 'equal to') return targetStr === val;
      if (op === 'not equal to') return targetStr !== val;
      if (op === 'contains') {
        const regex = new RegExp('\\b' + val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
        return regex.test(targetStr);
      }
      if (op === 'does not contain') {
        const regex = new RegExp('\\b' + val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
        return !regex.test(targetStr);
      }
      if (op === 'starts with') return targetStr.startsWith(val);
      if (op === 'ends with') return targetStr === val || targetStr.endsWith(' ' + val);
    }

    switch (op) {
      case 'equal to':
        if (!isNaN(valNum) && f.field === 'age') {
          return Math.floor(targetNum) === Math.floor(valNum) || targetStr.includes(val);
        }
        return targetStr === val;

      case 'not equal to':
        if (!isNaN(valNum) && f.field === 'age') {
          return Math.floor(targetNum) !== Math.floor(valNum) && !targetStr.includes(val);
        }
        return targetStr !== val;

      case 'contains':
        return targetStr.includes(val);

      case 'does not contain':
        return !targetStr.includes(val);

      case 'starts with':
        return targetStr.startsWith(val);

      case 'ends with':
        return targetStr.endsWith(val);

      case 'greater than':
        return !isNaN(valNum) ? targetNum > valNum : targetStr > val;

      case 'less than':
        return !isNaN(valNum) ? targetNum < valNum : targetStr < val;

      case 'is empty':
        return !targetStr || targetStr === '...';

      case 'is Not empty':
      case 'is not empty':
        return !!targetStr && targetStr !== '...';

      default:
        return targetStr.includes(val);
    }
  };

  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      if (contactFilter === 'yes' && !p.contactForFutureStudies) return false;
      if (contactFilter === 'no' && p.contactForFutureStudies) return false;

      if (availableFilter === 'yes' && !p.availableToAddStudy) return false;
      if (availableFilter === 'no' && p.availableToAddStudy) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = p.name?.toLowerCase().includes(query);
        const matchesFamily = p.familyId?.toLowerCase().includes(query);
        const matchesGlobal = p.globalId?.toLowerCase().includes(query);
        const matchesCity = p.city?.toLowerCase().includes(query);
        const matchesGender = p.gender?.toLowerCase().includes(query);
        const matchesAge = p.age?.toLowerCase().includes(query);
        const matchesStudies = p.studies?.some((s) => s.name?.toLowerCase().includes(query));
        
        if (!matchesName && !matchesFamily && !matchesGlobal && !matchesCity && !matchesGender && !matchesAge && !matchesStudies) {
          return false;
        }
      }

      if (selectedStudies.length > 0) {
        const hasMatchingStudy = p.studies?.some((s) => selectedStudies.includes(s.name));
        if (!hasMatchingStudy) {
          return false;
        }
      }

      if (customFilters.length > 0) {
        const matchesAllCustom = customFilters.every((f) => matchCustomFilter(p, f));
        if (!matchesAllCustom) return false;
      }

      return true;
    });
  }, [participants, contactFilter, availableFilter, searchTerm, selectedStudies, customFilters]);

  const selectedParticipant = useMemo(() => {
    return participants.find((p) => p.id === selectedParticipantId) || filteredParticipants[0] || null;
  }, [participants, selectedParticipantId, filteredParticipants]);

  const handleSelectParticipant = (participant: ParticipantRecord) => {
    if (participant && participant.id) {
      setSelectedParticipantId(participant.id);
    }
  };

  const handleRefresh = () => {
    showNotification('Participant queue refreshed');
  };

  const handleAddParticipant = (newParticipant: ParticipantRecord) => {
    setParticipants((prev) => [newParticipant, ...prev]);
    setSelectedParticipantId(newParticipant.id);
    showNotification(`Participant "${newParticipant.name}" added successfully.`, 'success');
  };

  const handleAddFilter = () => {
    const newFilter: CustomFilterRule = {
      id: String(Date.now()),
      field: 'age',
      operator: 'equal to',
      value: '',
    };
    setCustomFilters((prev) => [...prev, newFilter]);
    showNotification('New filter criteria added.');
  };

  const handleUpdateFilter = (index: number, updatedFilter: CustomFilterRule) => {
    setCustomFilters((prev) => {
      const next = [...prev];
      next[index] = updatedFilter;
      return next;
    });
  };

  const handleRemoveFilter = (index: number) => {
    setCustomFilters((prev) => prev.filter((_, i) => i !== index));
    showNotification('Filter removed.');
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setContactFilter('all');
    setAvailableFilter('all');
    setSelectedStudies([]);
    setCustomFilters([]);
    showNotification('All filters have been reset.');
  };

  const handleOpenSaveModal = () => {
    setIsSaveModalOpen(true);
  };

  const handleSaveFilterSubmit = (filterName: string) => {
    const newSaved: SavedSearch = {
      id: String(Date.now()),
      name: filterName,
      contactFilter,
      availableFilter,
      searchTerm,
      selectedStudies,
      customFilters: [...customFilters],
    };

    setSavedSearches((prev) => [...prev, newSaved]);
    showNotification(`Saved filter "${filterName}" added to Saved Searches.`, 'success');
  };

  const handleOpenDeleteModal = (searchItem: SavedSearch) => {
    void requestConfirmation({
      entityName: searchItem.name,
      intent: 'danger',
      confirmText: `Delete ${searchItem.name}`,
      loadingText: 'Deleting saved search...',
      title: 'Delete saved search',
      message: `Delete the saved search “${searchItem.name}”? This action cannot be undone.`,
      onConfirm: () => {
        setSavedSearches((prev) => prev.filter((item) => item.id !== searchItem.id));
        showNotification(`Saved search "${searchItem.name}" deleted.`, 'success');
      },
    });
  };

  const handleSelectSavedSearch = (saved: SavedSearch) => {
    if (!saved) return;
    setContactFilter(saved.contactFilter || 'all');
    setAvailableFilter(saved.availableFilter || 'all');
    setSearchTerm(saved.searchTerm || '');
    setSelectedStudies(saved.selectedStudies || []);
    setCustomFilters(saved.customFilters || []);
    showNotification(`Applied saved search "${saved.name}".`);
  };

  const handleSearch = () => {
    showNotification(`Filtered registry: ${filteredParticipants.length} participant(s) found.`);
  };

  const handleOpenDetail = (participant: ParticipantRecord) => {
    setDetailModalState({ isOpen: true, participant });
  };

  const handleSaveDetail = (updatedParticipant: ParticipantRecord) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === updatedParticipant.id ? updatedParticipant : p))
    );
    showNotification(`Participant "${updatedParticipant.name}" details updated successfully.`, 'success');
    setDetailModalState({ isOpen: false, participant: null });
  };

  const handleOpenDeleteParticipant = (participant: ParticipantRecord) => {
    void requestConfirmation({
      entityName: participant.name,
      intent: 'danger',
      confirmText: 'Delete participant',
      loadingText: 'Deleting participant...',
      title: 'Delete participant',
      message: `Delete participant “${participant.name}”? This action cannot be undone.`,
      confirmWord: 'DELETE',
      onConfirm: () => {
        setParticipants((prev) => prev.filter((item) => item.id !== participant.id));
        showNotification(`Participant "${participant.name}" deleted.`, 'success');
      },
    });
  };

  return (
    <div className="workspace-split-layout">
        <div className="workspace-split-layout__sidebar">
          <LeftFilterPanel
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            contactFilter={contactFilter}
            setContactFilter={setContactFilter}
            availableFilter={availableFilter}
            setAvailableFilter={setAvailableFilter}
            customFilters={customFilters}
            onAddFilter={handleAddFilter}
            onUpdateFilter={handleUpdateFilter}
            onRemoveFilter={handleRemoveFilter}
            onAddParticipant={() => setIsAddModalOpen(true)}
            onClearFilters={handleClearFilters}
            onSaveFilter={handleOpenSaveModal}
            onSearch={handleSearch}
            savedSearches={savedSearches}
            onSelectSavedSearch={handleSelectSavedSearch}
            onDeleteRequest={handleOpenDeleteModal}
          />
        </div>

        <div className="workspace-split-layout__main">
          <ParticipantGrid
            participants={filteredParticipants}
            allParticipants={participants}
            selectedParticipant={selectedParticipant}
            onSelectParticipant={handleSelectParticipant}
            onRefresh={handleRefresh}
            onAddParticipant={() => setIsAddModalOpen(true)}
            onOpenDetail={handleOpenDetail}
            onDeleteParticipant={handleOpenDeleteParticipant}
            totalCount={participants.length}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedStudies={selectedStudies}
            setSelectedStudies={setSelectedStudies}
          />
        </div>

        <AddParticipantModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddParticipant}
        />

        <SaveFilterModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          onSave={handleSaveFilterSubmit}
        />

        <ParticipantDetailModal
          isOpen={detailModalState.isOpen}
          onClose={() => setDetailModalState({ isOpen: false, participant: null })}
          participant={detailModalState.participant}
          onSave={handleSaveDetail}
        />

    </div>
  );
};

export default RegistryDashboard;
