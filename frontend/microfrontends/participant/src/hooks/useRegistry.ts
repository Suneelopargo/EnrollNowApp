// frontend/microfrontends/participant/src/hooks/useRegistry.ts - Registry State & API Coordination
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '../../../../shared/toaster';
import {
  registryApi,
  RegistrySearchRequest,
  RegistryFilterRequest,
  RegistryParticipantResponse,
  RegistryFilterOptionsResponse,
  SavedRegistrySearchResponse,
  CreateRegistryParticipantRequest,
  UpdateRegistryParticipantRequest,
} from '../../../../shared/api/registryApi';
import {
  ParticipantRecord,
  CustomFilterRule,
  StudyItem,
} from '../types/participant';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function mapParticipantResponseToRecord(item: RegistryParticipantResponse): ParticipantRecord {
  const name = item.name || [item.firstName, item.middleName, item.lastName].filter(Boolean).join(' ');
  const birthdayDate = item.birthday ? new Date(item.birthday) : null;
  const birthMonth = birthdayDate && !isNaN(birthdayDate.getTime())
    ? MONTH_NAMES[birthdayDate.getMonth()]
    : undefined;

  const formatDate = (isoString?: string) => {
    if (!isoString) return '...';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return (
        d.toLocaleDateString('en-GB') +
        ', ' +
        d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }).toLowerCase()
      );
    } catch {
      return isoString;
    }
  };

  const studies: StudyItem[] = (item.studies || []).map((s) => ({
    name: s.studyName,
    isLink: true,
  }));

  const primaryEmail = `${(item.firstName || 'user').toLowerCase()}.${(item.lastName || 'participant').toLowerCase()}@example.org`;

  return {
    id: String(item.id),
    name,
    firstName: item.firstName || '',
    lastName: item.lastName || '',
    studies,
    gender: item.sex || '...',
    age: item.age != null ? `${item.age}` : '...',
    ageNumeric: item.age ?? undefined,
    lastContact: item.globalLastContactDate ? formatDate(item.globalLastContactDate) : '...',
    status: studies.length > 0 ? 'Active' : 'Screening',
    city: item.city || '',
    state: item.state || '',
    zipcode: item.zipcode || '',
    phone: item.phone || '',
    familyId: item.familyId || '',
    dateCreated: item.insertedAt ? formatDate(item.insertedAt) : '...',
    globalId: item.globalId || '',
    timezone: item.timezone || 'America/New_York (EDT)',
    tags: item.tags || [],
    contactForFutureStudies: item.contactForFutureStudies ?? true,
    availableToAddStudy: item.availableToAddStudy ?? true,
    globalDateOfLastContact: item.globalLastContactDate || '',
    birthMonth,
    contactMethods: {
      primaryEmail,
      phone: item.phone || '',
      address: [item.city, item.state, item.zipcode].filter(Boolean).join(', ') || 'Clinical Center',
      preferredMethod: 'Email',
    },
    demographics: {
      dob: item.birthday || '',
      gender: item.sex || 'Unspecified',
      ethnicity: item.ethnicity || 'Not Disclosed',
      race: item.race || 'Not Disclosed',
      primaryLanguage: 'English',
    },
    family: {
      familyRole: 'Proband',
      membersCount: 1,
      pedigreeTreeId: item.familyId || '',
      guardianName: 'N/A',
    },
    variables: (item.variables || []).map((v) => ({
      name: v.name,
      value: v.value,
      lastUpdated: v.lastUpdated,
    })),
  };
}

export function useRegistry() {
  const [participants, setParticipants] = useState<ParticipantRecord[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state (UI 1-indexed: 1, 2, 3...)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [contactFilter, setContactFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [availableFilter, setAvailableFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [selectedStudies, setSelectedStudies] = useState<string[]>([]);
  const [customFilters, setCustomFilters] = useState<CustomFilterRule[]>([]);
  const [duplicatesOnly, setDuplicatesOnly] = useState<boolean>(false);

  // Sorting state
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('ASC');

  // Metadata state
  const [filterOptions, setFilterOptions] = useState<RegistryFilterOptionsResponse | null>(null);
  const [savedSearches, setSavedSearches] = useState<SavedRegistrySearchResponse[]>([]);

  // Prevent race conditions with request tracking
  const searchRequestIdRef = useRef<number>(0);

  const buildBackendSearchRequest = useCallback(
    (overrides?: Partial<RegistrySearchRequest>): RegistrySearchRequest => {
      const filters: RegistryFilterRequest[] = [];

      // Study header checkbox filter
      const activeStudies = overrides?.filters?.find(f => f.field === 'studies')?.values ?? selectedStudies;
      if (activeStudies && activeStudies.length > 0) {
        filters.push({
          field: 'studies',
          operator: 'equal',
          values: activeStudies,
        });
      }

      // Dynamic custom filter rules
      const activeCustomFilters = customFilters.filter(cf => cf.field && cf.value && cf.value.trim().length > 0);
      for (const cf of activeCustomFilters) {
        filters.push({
          field: cf.field,
          operator: cf.operator || 'equal',
          value: cf.value.trim(),
          values: [cf.value.trim()],
        });
      }

      const activeSearchText = overrides?.searchText !== undefined ? overrides.searchText : searchTerm;
      const activeContact = overrides?.contactForFutureStudies !== undefined
        ? overrides.contactForFutureStudies
        : contactFilter.toUpperCase();
      const activeAvailability = overrides?.participantAvailability !== undefined
        ? overrides.participantAvailability
        : availableFilter.toUpperCase();
      const activeDuplicates = overrides?.duplicatesOnly !== undefined ? overrides.duplicatesOnly : duplicatesOnly;
      const activePage = overrides?.page !== undefined ? overrides.page : currentPage - 1;
      const activeSize = overrides?.size !== undefined ? overrides.size : pageSize;
      const activeSortField = overrides?.sortField !== undefined ? overrides.sortField : sortField;
      const activeSortDirection = overrides?.sortDirection !== undefined ? overrides.sortDirection : sortDirection;

      return {
        searchText: activeSearchText.trim() || undefined,
        filters,
        contactForFutureStudies: activeContact,
        participantAvailability: activeAvailability,
        duplicatesOnly: activeDuplicates,
        page: activePage,
        size: activeSize,
        sortField: activeSortField,
        sortDirection: activeSortDirection,
      };
    },
    [
      searchTerm,
      selectedStudies,
      customFilters,
      contactFilter,
      availableFilter,
      duplicatesOnly,
      currentPage,
      pageSize,
      sortField,
      sortDirection,
    ]
  );

  const executeSearch = useCallback(
    async (request: RegistrySearchRequest) => {
      const requestId = ++searchRequestIdRef.current;
      setLoading(true);
      setError(null);

      try {
        const response = await registryApi.searchRegistryParticipants(request);

        if (requestId !== searchRequestIdRef.current) return;

        const records = (response?.content || []).map(mapParticipantResponseToRecord);
        setParticipants(records);
        setTotalElements(response?.totalElements ?? records.length);
        setTotalPages(response?.totalPages ?? (records.length > 0 ? 1 : 0));
        setSelectedParticipant((prev) => {
          if (!prev) return records[0] || null;
          return records.find((r) => r.id === prev.id) || records[0] || null;
        });
      } catch (err: any) {
        if (requestId !== searchRequestIdRef.current) return;
        setError(err.message || 'Failed to load registry participants');
        setParticipants([]);
        setTotalElements(0);
        setTotalPages(1);
      } finally {
        if (requestId === searchRequestIdRef.current) {
          setLoading(false);
        }
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    const init = async () => {
      try {
        const [options, saved] = await Promise.allSettled([
          registryApi.getRegistryFilterOptions(),
          registryApi.getSavedRegistrySearches(),
        ]);
        if (options.status === 'fulfilled') setFilterOptions(options.value);
        if (saved.status === 'fulfilled') setSavedSearches(saved.value);
      } catch {
        // filter-options / saved-searches non-blocking
      }

      const initialRequest = buildBackendSearchRequest({ page: 0, size: pageSize });
      await executeSearch(initialRequest);
    };

    init();
  }, []); // Run once on mount

  // Trigger search when user clicks Search or changes criteria
  const handleSearch = useCallback(
    (overrides?: Partial<RegistrySearchRequest>) => {
      setCurrentPage(1);
      const req = buildBackendSearchRequest({ page: 0, ...overrides });
      return executeSearch(req);
    },
    [buildBackendSearchRequest, executeSearch]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      const clampedPage = Math.max(1, Math.min(newPage, totalPages || 1));
      setCurrentPage(clampedPage);
      const req = buildBackendSearchRequest({ page: clampedPage - 1 });
      return executeSearch(req);
    },
    [totalPages, buildBackendSearchRequest, executeSearch]
  );

  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      setPageSize(newSize);
      setCurrentPage(1);
      const req = buildBackendSearchRequest({ page: 0, size: newSize });
      return executeSearch(req);
    },
    [buildBackendSearchRequest, executeSearch]
  );

  const handleSortChange = useCallback(
    (field: string, direction: 'ASC' | 'DESC') => {
      setSortField(field);
      setSortDirection(direction);
      setCurrentPage(1);
      const req = buildBackendSearchRequest({ page: 0, sortField: field, sortDirection: direction });
      return executeSearch(req);
    },
    [buildBackendSearchRequest, executeSearch]
  );

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setContactFilter('all');
    setAvailableFilter('all');
    setSelectedStudies([]);
    setCustomFilters([]);
    setDuplicatesOnly(false);
    setCurrentPage(1);

    const clearedRequest: RegistrySearchRequest = {
      searchText: undefined,
      filters: [],
      contactForFutureStudies: 'ALL',
      participantAvailability: 'ALL',
      duplicatesOnly: false,
      page: 0,
      size: pageSize,
      sortField,
      sortDirection,
    };
    return executeSearch(clearedRequest);
  }, [pageSize, sortField, sortDirection, executeSearch]);

  const handleRefresh = useCallback(() => {
    const req = buildBackendSearchRequest();
    return executeSearch(req);
  }, [buildBackendSearchRequest, executeSearch]);

  const handleSelectParticipant = useCallback((participant: ParticipantRecord) => {
    setSelectedParticipant(participant);
  }, []);

  const handleAddParticipant = useCallback(
    async (request: CreateRegistryParticipantRequest) => {
      const res = await registryApi.createRegistryParticipant(request);
      // Refresh grid preserving active page
      await handleRefresh();
      return res;
    },
    [handleRefresh]
  );

  const handleUpdateParticipant = useCallback(
    async (participantId: string, request: UpdateRegistryParticipantRequest) => {
      const res = await registryApi.updateRegistryParticipant(participantId, request);
      const updatedRecord = mapParticipantResponseToRecord(res);
      setParticipants((prev) => prev.map((p) => (p.id === participantId ? updatedRecord : p)));
      setSelectedParticipant((prev) => (prev?.id === participantId ? updatedRecord : prev));
      return updatedRecord;
    },
    []
  );

  const handleDeleteParticipant = useCallback(
    async (participantId: string) => {
      await registryApi.deleteRegistryParticipant(participantId);
      await handleRefresh();
    },
    [handleRefresh]
  );

  const handleAssignStudyToSelected = useCallback(
    async (participantIds: string[], studyNameOrId: string) => {
      // Resolve study UUID if studyNameOrId is name
      let resolvedStudyId = studyNameOrId;
      if (filterOptions?.studies) {
        const found = filterOptions.studies.find(
          (s) => s.id === studyNameOrId || s.name.toLowerCase() === studyNameOrId.toLowerCase()
        );
        if (found) resolvedStudyId = found.id;
      }

      await Promise.all(
        participantIds.map((pid) =>
          registryApi.addRegistryParticipantToStudy(pid, {
            studyId: resolvedStudyId,
            statusName: 'Active',
          })
        )
      );

      await handleRefresh();
    },
    [filterOptions, handleRefresh]
  );

  const handleSaveSearch = useCallback(
    async (name: string) => {
      const search = buildBackendSearchRequest({ page: 0 });
      const created = await registryApi.saveRegistrySearch({ name, search });
      setSavedSearches((prev) => [...prev, created]);
      return created;
    },
    [buildBackendSearchRequest]
  );

  const handleDeleteSavedSearch = useCallback(
    async (searchId: string) => {
      await registryApi.deleteSavedSearch(searchId);
      setSavedSearches((prev) => prev.filter((s) => s.id !== searchId));
    },
    []
  );

  const handleApplySavedSearch = useCallback(
    async (saved: SavedRegistrySearchResponse) => {
      const search = saved.search || {};
      const newSearchTerm = search.searchText || '';
      const newContact = (search.contactForFutureStudies?.toLowerCase() as any) || 'all';
      const newAvailability = (search.participantAvailability?.toLowerCase() as any) || 'all';
      const newDuplicates = search.duplicatesOnly || false;

      const studiesFilter = (search.filters || []).find((f) => f.field === 'studies');
      const newSelectedStudies = studiesFilter ? studiesFilter.values || [studiesFilter.value || ''] : [];

      const newCustomFilters: CustomFilterRule[] = (search.filters || [])
        .filter((f) => f.field !== 'studies')
        .map((f, idx) => ({
          id: String(idx + 1),
          field: f.field,
          operator: f.operator || 'equal to',
          value: f.value || f.values?.[0] || '',
        }));

      setSearchTerm(newSearchTerm);
      setContactFilter(newContact);
      setAvailableFilter(newAvailability);
      setSelectedStudies(newSelectedStudies);
      setCustomFilters(newCustomFilters);
      setDuplicatesOnly(newDuplicates);
      setCurrentPage(1);

      const request: RegistrySearchRequest = {
        searchText: newSearchTerm.trim() || undefined,
        filters: search.filters || [],
        contactForFutureStudies: newContact.toUpperCase(),
        participantAvailability: newAvailability.toUpperCase(),
        duplicatesOnly: newDuplicates,
        page: 0,
        size: pageSize,
        sortField: search.sortField || sortField,
        sortDirection: search.sortDirection || sortDirection,
      };

      return executeSearch(request);
    },
    [pageSize, sortField, sortDirection, executeSearch]
  );

  const handleExport = useCallback(
    async (format: string = 'CSV') => {
      const search = buildBackendSearchRequest({ page: 0, size: totalElements || 100 });
      const response = await registryApi.exportRegistryParticipants({
        search,
        format: format.toUpperCase(),
        fields: ['name', 'studies', 'gender', 'age', 'lastContact'],
      });
      return response;
    },
    [buildBackendSearchRequest, totalElements]
  );

  return {
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
    handleAddParticipant,
    handleUpdateParticipant,
    handleDeleteParticipant,
    handleAssignStudyToSelected,
    handleSaveSearch,
    handleDeleteSavedSearch,
    handleApplySavedSearch,
    handleExport,
  };
}

export default useRegistry;
