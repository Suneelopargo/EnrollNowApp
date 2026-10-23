// frontend/microfrontends/participant/src/components/RegistryDashboard.tsx - Registry Dashboard with Real Backend Integration
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { MfeContext } from '../../../../shared/contracts';
import { toast } from '../../../../shared/toaster';
import { requestConfirmation } from '../../../../shared/confirmation';
import { participantApi, RegistrySearchParams, CreateParticipantPayload } from '../../../../shared/api/participantApi';
import LeftFilterPanel from './LeftFilterPanel';
import ParticipantGrid from './ParticipantGrid';
import AddParticipantModal from './AddParticipantModal';
import SaveFilterModal from './SaveFilterModal';
import ParticipantDetailModal from './ParticipantDetailModal';
import { ParticipantRecord, CustomFilterRule, SavedSearch } from '../types/participant';
import { validateFilterRule } from '../constants/filterMetadata';

export interface RegistryDashboardProps {
  context?: MfeContext;
}

export const RegistryDashboard: React.FC<RegistryDashboardProps> = ({ context }) => {
  const siteId = context?.user?.siteId ?? undefined;
  const tenantId = (context?.user as any)?.tenantId ?? undefined;

  const [participants, setParticipants] = useState<ParticipantRecord[]>([]);
  const [allParticipants, setAllParticipants] = useState<ParticipantRecord[]>([]);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [contactFilter, setContactFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [availableFilter, setAvailableFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [selectedStudies, setSelectedStudies] = useState<string[]>([]);
  const [customFilters, setCustomFilters] = useState<CustomFilterRule[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [detailModalState, setDetailModalState] = useState<{ isOpen: boolean; participant: ParticipantRecord | null }>({
    isOpen: false,
    participant: null,
  });

  const showNotification = (msg: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    toast[type](msg);
  };

  // Keep latest filter values in a ref so fetchParticipants does not recreate
  // on every filter input/addition, preventing unwanted background triggers.
  const filterStateRef = useRef({
    searchTerm,
    contactFilter,
    availableFilter,
    selectedStudies,
    customFilters,
  });

  useEffect(() => {
    filterStateRef.current = {
      searchTerm,
      contactFilter,
      availableFilter,
      selectedStudies,
      customFilters,
    };
  }, [searchTerm, contactFilter, availableFilter, selectedStudies, customFilters]);

  // Fetch Saved Searches from backend API
  const fetchSavedSearches = useCallback(async () => {
    try {
      const searches = await participantApi.getSavedSearches();
      if (Array.isArray(searches)) {
        const mapped: SavedSearch[] = searches.map((s: any) => ({
          id: String(s.id),
          name: s.name,
          contactFilter: s.contactFilter || 'all',
          availableFilter: s.availableFilter || 'all',
          searchTerm: s.searchTerm || '',
          selectedStudies: s.selectedStudies || [],
          customFilters: s.customFilters || [],
        }));
        setSavedSearches(mapped);
      }
    } catch {
      // Keep existing or empty
    }
  }, []);

  // Fetch Participants from backend API
  const fetchParticipants = useCallback(async (quiet = false, overrideFilters?: {
    contactFilter?: 'all' | 'yes' | 'no';
    availableFilter?: 'all' | 'yes' | 'no';
    searchTerm?: string;
    selectedStudies?: string[];
    customFilters?: CustomFilterRule[];
  }) => {
    if (!quiet) setIsLoading(true);
    try {
      const activeContact = overrideFilters?.contactFilter ?? filterStateRef.current.contactFilter;
      const activeAvailable = overrideFilters?.availableFilter ?? filterStateRef.current.availableFilter;
      const activeSearch = overrideFilters?.searchTerm ?? filterStateRef.current.searchTerm;
      const activeStudies = overrideFilters?.selectedStudies ?? filterStateRef.current.selectedStudies;
      const activeCustom = overrideFilters?.customFilters ?? filterStateRef.current.customFilters;

      const params: RegistrySearchParams = {
        tenantId,
        siteId,
        searchTerm: activeSearch.trim() || undefined,
        contactFilter: activeContact,
        availableFilter: activeAvailable,
        studies: activeStudies.length > 0 ? activeStudies : undefined,
        customFiltersJson: activeCustom.length > 0 ? JSON.stringify(activeCustom) : undefined,
        page: 0,
        pageSize: 500,
      };

      const res: any = await participantApi.getParticipants(params);
      const rawList = Array.isArray(res)
        ? res
        : Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res?.data)
        ? res.data
        : [];

      const mapped: ParticipantRecord[] = rawList.map((p: any) => ({
        id: String(p.id ?? p.participantId ?? ''),
        name: p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Unnamed Participant',
        firstName: p.firstName || '',
        lastName: p.lastName || '',
        status: p.status || 'Active',
        city: p.city || '',
        state: p.state || '',
        zipcode: p.zipcode || p.postalCode || '',
        phone: p.phone || '',
        gender: p.gender || 'Unspecified',
        age: p.age || 'N/A',
        ageNumeric: p.ageNumeric ?? (typeof p.age === 'number' ? p.age : undefined),
        lastContact: p.lastContact || 'Recent',
        familyId: p.familyId || 'FAM-10001',
        dateCreated: p.dateCreated || new Date().toLocaleDateString('en-GB'),
        globalId: p.globalId || String(p.id ?? '').substring(0, 8).toUpperCase(),
        timezone: p.timezone || 'America/New_York (EDT)',
        tags: Array.isArray(p.tags) ? p.tags : [],
        contactForFutureStudies: p.contactForFutureStudies ?? true,
        availableToAddStudy: p.availableToAddStudy ?? true,
        globalDateOfLastContact: p.globalDateOfLastContact || '',
        birthMonth: p.birthMonth || '',
        studies: Array.isArray(p.studies) ? p.studies : [],
        contactMethods: p.contactMethods || {
          primaryEmail: p.email || '',
          phone: p.phone || '',
          preferredMethod: 'Email',
        },
        demographics: p.demographics || {
          gender: p.gender || 'Unspecified',
          primaryLanguage: 'English',
        },
        family: {
          familyRole: p.family?.familyRole || 'Proband',
          membersCount: p.family?.membersCount ?? (p.family?.members?.length || 1),
          pedigreeTreeId: p.family?.pedigreeTreeId,
          guardianName: p.family?.guardianName,
          members: Array.isArray(p.family?.members) ? p.family.members : [],
        },
        variables: Array.isArray(p.variables) ? p.variables : [],
      }));

      setParticipants(mapped);
      setError(null);

      // Keep baseline for study list dropdown when unfiltered
      const isUnfiltered = !activeSearch && activeContact === 'all' && activeAvailable === 'all' && activeStudies.length === 0 && activeCustom.length === 0;
      setAllParticipants((prev) => (isUnfiltered || prev.length === 0 ? mapped : prev));
      setSelectedParticipantId((prev) => prev || (mapped.length > 0 ? mapped[0].id : ''));
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to retrieve participants from the server';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
      setParticipants([]);
    } finally {
      if (!quiet) setIsLoading(false);
    }
  }, [tenantId, siteId]);

  // Initial Load only on mount / tenant-site context change
  useEffect(() => {
    fetchParticipants();
    fetchSavedSearches();
  }, [fetchParticipants, fetchSavedSearches]);

  const selectedParticipant = useMemo(() => {
    return participants.find((p) => p.id === selectedParticipantId) || participants[0] || null;
  }, [participants, selectedParticipantId]);

  const handleSelectParticipant = (participant: ParticipantRecord) => {
    if (participant && participant.id) {
      setSelectedParticipantId(participant.id);
    }
  };

  const handleRefresh = () => {
    fetchParticipants(false);
    fetchSavedSearches();
    showNotification('Participant queue refreshed');
  };

  const handleAddParticipant = async (newParticipant: ParticipantRecord) => {
    try {
      const payload: CreateParticipantPayload = {
        firstName: newParticipant.firstName || newParticipant.name.split(' ')[0] || 'Unknown',
        lastName: newParticipant.lastName || newParticipant.name.split(' ').slice(1).join(' ') || 'Participant',
        status: newParticipant.status || 'ACTIVE',
        sexAtBirth: newParticipant.demographics?.gender || newParticipant.gender,
        primaryEmail: newParticipant.contactMethods?.primaryEmail,
        phone: newParticipant.phone || newParticipant.contactMethods?.phone,
        city: newParticipant.city,
        state: newParticipant.state,
        postalCode: newParticipant.zipcode,
        dateOfBirth: newParticipant.demographics?.dob,
        contactForFutureStudies: newParticipant.contactForFutureStudies,
        tags: newParticipant.tags,
      };

      const created: any = await participantApi.createParticipant(payload, {
        params: { tenantId, siteId },
      });
      showNotification(`Participant "${created?.name || newParticipant.name}" added successfully.`, 'success');
      await fetchParticipants(true);
      if (created?.id) setSelectedParticipantId(String(created.id));
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to create participant on server.';
      showNotification(errorMsg, 'error');
    }
  };

  const handleAddFilter = () => {
    const newFilter: CustomFilterRule = {
      id: String(Date.now()),
      field: 'age',
      operator: 'equal to',
      value: '',
      minValue: '',
      maxValue: '',
      values: [],
    };
    setCustomFilters((prev) => [...prev, newFilter]);
  };

  const handleAssignStudyToSelected = async (participantIds: string[], studyName: string) => {
    try {
      await participantApi.assignStudy({
        participantIds,
        studyName,
        status: 'REFERRED',
        notes: 'Bulk assigned from Participant Registry',
      });
      showNotification(`Assigned ${participantIds.length} participant(s) to ${studyName}.`, 'success');
      await fetchParticipants(true);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to assign study to selected participants.';
      showNotification(errorMsg, 'error');
    }
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
    fetchParticipants(false, {
      searchTerm: '',
      contactFilter: 'all',
      availableFilter: 'all',
      selectedStudies: [],
      customFilters: [],
    });
    showNotification('All filters have been reset.');
  };

  const handleOpenSaveModal = () => {
    setIsSaveModalOpen(true);
  };

  const handleSaveFilterSubmit = async (filterName: string) => {
    try {
      const created = await participantApi.createSavedSearch({
        name: filterName,
        contactFilter,
        availableFilter,
        searchTerm,
        selectedStudies,
        customFilters,
      });

      const newSaved: SavedSearch = {
        id: String(created.id ?? Date.now()),
        name: created.name,
        contactFilter: created.contactFilter,
        availableFilter: created.availableFilter,
        searchTerm: created.searchTerm,
        selectedStudies: created.selectedStudies,
        customFilters: created.customFilters,
      };

      setSavedSearches((prev) => [...prev, newSaved]);
      showNotification(`Saved filter "${filterName}" added to Saved Searches.`, 'success');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to save filter on server.';
      showNotification(errorMsg, 'error');
    }
  };

  const handleOpenDeleteModal = (searchItem: SavedSearch) => {
    void requestConfirmation({
      entityName: searchItem.name,
      intent: 'danger',
      confirmText: `Delete ${searchItem.name}`,
      loadingText: 'Deleting saved search...',
      title: 'Delete saved search',
      message: `Delete the saved search "${searchItem.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await participantApi.deleteSavedSearch(searchItem.id);
          setSavedSearches((prev) => prev.filter((item) => item.id !== searchItem.id));
          showNotification(`Saved search "${searchItem.name}" deleted.`, 'success');
        } catch (err: any) {
          const errorMsg = err?.response?.data?.message || err?.message || 'Failed to delete saved search.';
          showNotification(errorMsg, 'error');
        }
      },
    });
  };

  const handleSelectSavedSearch = (saved: SavedSearch) => {
    if (!saved) return;
    const nextContact = saved.contactFilter || 'all';
    const nextAvailable = saved.availableFilter || 'all';
    const nextSearch = saved.searchTerm || '';
    const nextStudies = saved.selectedStudies || [];
    const nextCustom = saved.customFilters || [];

    setContactFilter(nextContact);
    setAvailableFilter(nextAvailable);
    setSearchTerm(nextSearch);
    setSelectedStudies(nextStudies);
    setCustomFilters(nextCustom);

    fetchParticipants(false, {
      contactFilter: nextContact,
      availableFilter: nextAvailable,
      searchTerm: nextSearch,
      selectedStudies: nextStudies,
      customFilters: nextCustom,
    });
    showNotification(`Applied saved search "${saved.name}".`);
  };

  const handleSearch = () => {
    for (const filter of customFilters) {
      const valResult = validateFilterRule(filter);
      if (!valResult.isValid) {
        showNotification(valResult.error || 'Please provide valid filter criteria.', 'warning');
        return;
      }
    }
    fetchParticipants(false);
  };

  const handleOpenDetail = (participant: ParticipantRecord) => {
    setDetailModalState({ isOpen: true, participant });
  };

  const handleSaveDetail = async (updatedParticipant: ParticipantRecord) => {
    try {
      await participantApi.updateParticipant(
        updatedParticipant.id,
        {
          firstName: updatedParticipant.firstName,
          lastName: updatedParticipant.lastName,
          phone: updatedParticipant.contactMethods?.phone || updatedParticipant.phone,
          primaryEmail: updatedParticipant.contactMethods?.primaryEmail,
          city: updatedParticipant.city,
          state: updatedParticipant.state,
          postalCode: updatedParticipant.zipcode,
          status: updatedParticipant.status,
          sexAtBirth: updatedParticipant.gender,
          contactForFutureStudies: updatedParticipant.contactForFutureStudies,
          tags: updatedParticipant.tags,
          familyId: updatedParticipant.familyId,
          globalId: updatedParticipant.globalId,
          timezone: updatedParticipant.timezone,
          globalDateOfLastContact: updatedParticipant.globalDateOfLastContact,
          variables: updatedParticipant.variables,
        },
        {
          params: { tenantId, siteId },
        }
      );

      showNotification(`Participant "${updatedParticipant.name}" details updated successfully.`, 'success');
      setDetailModalState({ isOpen: false, participant: null });
      await fetchParticipants(true);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to update participant on server.';
      showNotification(errorMsg, 'error');
    }
  };

  const handleOpenDeleteParticipant = (participant: ParticipantRecord) => {
    void requestConfirmation({
      entityName: participant.name,
      intent: 'danger',
      confirmText: 'Delete participant',
      loadingText: 'Deleting participant...',
      title: 'Delete participant',
      message: `Delete participant "${participant.name}"? This action cannot be undone.`,
      confirmWord: 'DELETE',
      onConfirm: async () => {
        try {
          await participantApi.deleteParticipant(participant.id);
          showNotification(`Participant "${participant.name}" deleted.`, 'success');
          await fetchParticipants(true);
        } catch (err: any) {
          const errorMsg = err?.response?.data?.message || err?.message || 'Failed to delete participant.';
          showNotification(errorMsg, 'error');
        }
      },
    });
  };

  const handleExportServerCsv = async () => {
    try {
      const params: RegistrySearchParams = {
        tenantId,
        siteId,
        searchTerm: searchTerm.trim() || undefined,
        contactFilter,
        availableFilter,
        studies: selectedStudies.length > 0 ? selectedStudies : undefined,
        customFiltersJson: customFilters.length > 0 ? JSON.stringify(customFilters) : undefined,
      };
      const blob = await participantApi.exportRegistry(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `registry_export_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      showNotification('Registry exported successfully.', 'success');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to export registry.';
      showNotification(errorMsg, 'error');
    }
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
        {error && (
          <div
            className="alert alert-error"
            role="alert"
            style={{
              margin: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              border: '1px solid #f87171',
            }}
          >
            <span>{error}</span>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => fetchParticipants(false)}
              style={{
                cursor: 'pointer',
                padding: '0.25rem 0.75rem',
                backgroundColor: '#ffffff',
                border: '1px solid #b91c1c',
                color: '#b91c1c',
                borderRadius: '4px',
              }}
            >
              Retry
            </button>
          </div>
        )}

        <ParticipantGrid
          participants={participants}
          allParticipants={allParticipants}
          selectedParticipant={selectedParticipant}
          onSelectParticipant={handleSelectParticipant}
          onRefresh={handleRefresh}
          onAddParticipant={() => setIsAddModalOpen(true)}
          onOpenDetail={handleOpenDetail}
          onDeleteParticipant={handleOpenDeleteParticipant}
          onAssignStudyToSelected={handleAssignStudyToSelected}
          onExportServerCsv={handleExportServerCsv}
          isLoading={isLoading}
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
        onSelectParticipantById={(id) => {
          const found = participants.find((p) => p.id === id);
          if (found) {
            setDetailModalState({ isOpen: true, participant: found });
          }
        }}
      />
    </div>
  );
};

export default RegistryDashboard;
