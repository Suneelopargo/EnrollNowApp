// frontend/microfrontends/participant/src/components/RegistryDashboard.tsx - Participant & Registry Dashboard Root
import React, { useState, useMemo } from 'react';
import { toast } from '../../../../shared/toaster';
import { requestConfirmation } from '../../../../shared/confirmation';
import LeftFilterPanel from './LeftFilterPanel';
import ParticipantGrid from './ParticipantGrid';
import AddParticipantModal from './AddParticipantModal';
import SaveFilterModal from './SaveFilterModal';
import ParticipantDetailModal from './ParticipantDetailModal';
import { useRegistry } from '../hooks/useRegistry';
import { ParticipantRecord, CustomFilterRule } from '../types/participant';
import { SavedRegistrySearchResponse } from '../../../../shared/api/registryApi';

export const RegistryDashboard: React.FC = () => {
  const {
    participants,
    selectedParticipant,
    loading,
    error,
    currentPage,
    pageSize,
    totalElements,
    totalPages,
    searchTerm,
    setSearchTerm,
    contactFilter,
    setContactFilter,
    availableFilter,
    setAvailableFilter,
    selectedStudies,
    setSelectedStudies,
    customFilters,
    setCustomFilters,
    duplicatesOnly,
    setDuplicatesOnly,
    sortField,
    sortDirection,
    savedSearches,
    filterOptions,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    handleSortChange,
    handleClearFilters,
    handleRefresh,
    handleSelectParticipant,
    handleAddParticipant: apiAddParticipant,
    handleUpdateParticipant: apiUpdateParticipant,
    handleDeleteParticipant: apiDeleteParticipant,
    handleAssignStudyToSelected: apiAssignStudyToSelected,
    handleSaveSearch: apiSaveSearch,
    handleDeleteSavedSearch: apiDeleteSavedSearch,
    handleApplySavedSearch,
    handleExport,
  } = useRegistry();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [detailModalState, setDetailModalState] = useState<{ isOpen: boolean; participant: ParticipantRecord | null }>({
    isOpen: false,
    participant: null,
  });

  const showNotification = (msg: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    toast[type](msg);
  };

  const handleAddFilter = () => {
    const newFilter: CustomFilterRule = {
      id: String(Date.now()),
      field: 'age',
      operator: 'equal to',
      value: '',
    };
    setCustomFilters((prev) => [...prev, newFilter]);
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

  const onClearFilters = async () => {
    await handleClearFilters();
    showNotification('All filters have been reset.');
  };

  const handleOpenSaveModal = () => {
    setIsSaveModalOpen(true);
  };

  const handleSaveFilterSubmit = async (filterName: string) => {
    try {
      await apiSaveSearch(filterName);
      showNotification(`Saved filter "${filterName}" added to Saved Searches.`, 'success');
      setIsSaveModalOpen(false);
    } catch (err: any) {
      showNotification(err?.message || 'Failed to save filter', 'error');
    }
  };

  const handleOpenDeleteModal = (searchItem: SavedRegistrySearchResponse | any) => {
    void requestConfirmation({
      entityName: searchItem.name,
      intent: 'danger',
      confirmText: `Delete ${searchItem.name}`,
      loadingText: 'Deleting saved search...',
      title: 'Delete saved search',
      message: `Delete the saved search “${searchItem.name}”? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await apiDeleteSavedSearch(searchItem.id);
          showNotification(`Saved search "${searchItem.name}" deleted.`, 'success');
        } catch (err: any) {
          showNotification(err?.message || 'Failed to delete saved search', 'error');
        }
      },
    });
  };

  const handleSelectSavedSearch = async (saved: SavedRegistrySearchResponse | any) => {
    if (!saved) return;
    try {
      await handleApplySavedSearch(saved);
      showNotification(`Applied saved search "${saved.name}".`);
    } catch (err: any) {
      showNotification(err?.message || 'Failed to apply saved search', 'error');
    }
  };

  const onSearchClick = async () => {
    try {
      await handleSearch();
      showNotification(`Registry search executed: ${totalElements} participant(s) found.`);
    } catch (err: any) {
      showNotification(err?.message || 'Search failed', 'error');
    }
  };

  const handleAddParticipant = async (newParticipant: any) => {
    try {
      await apiAddParticipant({
        firstName: newParticipant.firstName || newParticipant.name?.split(' ')[0] || 'Unknown',
        middleName: newParticipant.middleName || undefined,
        lastName: newParticipant.lastName || newParticipant.name?.split(' ').slice(1).join(' ') || 'Participant',
      });
      showNotification(`Participant "${newParticipant.name || newParticipant.firstName}" added successfully.`, 'success');
      setIsAddModalOpen(false);
    } catch (err: any) {
      showNotification(err?.message || 'Failed to add participant', 'error');
    }
  };

  const handleAssignStudyToSelected = async (participantIds: string[], studyName: string) => {
    try {
      await apiAssignStudyToSelected(participantIds, studyName);
      showNotification(`Added ${participantIds.length} participant(s) to ${studyName}.`, 'success');
    } catch (err: any) {
      showNotification(err?.message || 'Failed to assign study to participants', 'error');
    }
  };

  const handleOpenDetail = (participant: ParticipantRecord) => {
    setDetailModalState({ isOpen: true, participant });
  };

  const handleSaveDetail = async (updatedParticipant: ParticipantRecord) => {
    try {
      const names = (updatedParticipant.name || '').trim().split(' ');
      const firstName = updatedParticipant.firstName || names[0] || '';
      const lastName = updatedParticipant.lastName || names.slice(1).join(' ') || '';

      await apiUpdateParticipant(updatedParticipant.id, {
        firstName,
        lastName,
        globalId: updatedParticipant.globalId,
        sex: updatedParticipant.gender !== '...' ? updatedParticipant.gender : undefined,
        familyId: updatedParticipant.familyId,
        timezone: updatedParticipant.timezone,
        contactForFutureStudies: updatedParticipant.contactForFutureStudies,
        tags: updatedParticipant.tags,
        city: updatedParticipant.city,
        state: updatedParticipant.state,
        zipcode: updatedParticipant.zipcode,
        phone: updatedParticipant.phone || updatedParticipant.contactMethods?.phone,
      });
      showNotification(`Participant "${updatedParticipant.name}" details updated successfully.`, 'success');
      setDetailModalState({ isOpen: false, participant: null });
    } catch (err: any) {
      showNotification(err?.message || 'Failed to update participant details', 'error');
    }
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
      onConfirm: async () => {
        try {
          await apiDeleteParticipant(participant.id);
          showNotification(`Participant "${participant.name}" deleted.`, 'success');
        } catch (err: any) {
          showNotification(err?.message || 'Failed to delete participant', 'error');
        }
      },
    });
  };

  const availableStudyOptions = useMemo(() => {
    return filterOptions?.studies?.map((s) => s.name) || [];
  }, [filterOptions]);

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
          onClearFilters={onClearFilters}
          onSaveFilter={handleOpenSaveModal}
          onSearch={onSearchClick}
          savedSearches={savedSearches}
          onSelectSavedSearch={handleSelectSavedSearch}
          onDeleteRequest={handleOpenDeleteModal}
        />
      </div>

      <div className="workspace-split-layout__main">
        <ParticipantGrid
          participants={participants}
          allParticipants={participants}
          selectedParticipant={selectedParticipant}
          onSelectParticipant={handleSelectParticipant}
          onRefresh={handleRefresh}
          onAddParticipant={() => setIsAddModalOpen(true)}
          onOpenDetail={handleOpenDetail}
          onDeleteParticipant={handleOpenDeleteParticipant}
          onAssignStudyToSelected={handleAssignStudyToSelected}
          totalCount={totalElements}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedStudies={selectedStudies}
          setSelectedStudies={setSelectedStudies}
          loading={loading}
          currentPage={currentPage}
          pageSize={pageSize}
          totalElements={totalElements}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onSortChange={handleSortChange}
          onExport={handleExport}
          availableStudyOptions={availableStudyOptions}
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
