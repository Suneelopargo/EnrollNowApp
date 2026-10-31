// frontend/microfrontends/participant/src/components/RegistryDashboard.tsx - Registry Dashboard with Real Backend Integration
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { MfeContext } from '../../../../shared/contracts';
import { toast } from '../../../../shared/toaster';
import { getApiErrorMessage } from '../../../../shared/api-client';
import { requestConfirmation } from '../../../../shared/confirmation';
import { participantApi, RegistrySearchParams, CreateParticipantPayload, DemographicOptions } from '../../../../shared/api/participantApi';
import { studyApi, Study } from '../../../../shared/api/studyApi';
import { administrationApi } from '../../../../shared/api/administrationApi';
import LeftFilterPanel from './LeftFilterPanel';
import ParticipantGrid from './ParticipantGrid';
import AddParticipantModal from './AddParticipantModal';
import SaveFilterModal from './SaveFilterModal';
import ParticipantDetailModal from './ParticipantDetailModal';
import { ParticipantRecord, CustomFilterRule, SavedSearch, FilterFieldOption, FilterOptionItem, GlobalVariableDefinition, isContactForFutureStudies, StudyItem } from '../types/participant';
import {
  validateFilterRule,
  registerDynamicFilterFields,
  registerDemographicFilterOptions,
  registerRegistryFilterOptions,
  registerStudyFilterOptions,
  DEFAULT_STUDY_FILTER_OPTIONS,
  isRangeOperator,
  isNoValueOperator,
} from '../constants/filterMetadata';

const hasFilterCriteria = (rule: CustomFilterRule): boolean => {
  if (isNoValueOperator(rule.operator || '')) return true;
  if (isRangeOperator(rule.operator || '')) {
    return Boolean(rule.minValue?.trim() || rule.maxValue?.trim());
  }
  return Boolean(rule.values?.some((value) => value.trim()) || rule.value?.trim());
};

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
  const [globalVariables, setGlobalVariables] = useState<GlobalVariableDefinition[]>([]);
  const [demographicOptions, setDemographicOptions] = useState<DemographicOptions>({ ethnicity: [], race: [] });
  const [isLoadingDemographicOptions, setIsLoadingDemographicOptions] = useState<boolean>(true);
  const [, setRegistryFilterOptionsVersion] = useState(0);
  const [availableStudies, setAvailableStudies] = useState<Study[]>([]);
  const [userStudyIds, setUserStudyIds] = useState<Set<string>>(() => new Set());
  const [duplicatesOnly, setDuplicatesOnly] = useState<boolean>(false);
  const [serverTotalCount, setServerTotalCount] = useState<number>(0);

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
    duplicatesOnly,
  });

  useEffect(() => {
    filterStateRef.current = {
      searchTerm,
      contactFilter,
      availableFilter,
      selectedStudies,
      customFilters,
      duplicatesOnly,
    };
  }, [searchTerm, contactFilter, availableFilter, selectedStudies, customFilters, duplicatesOnly]);

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
    selectedStudies?: string[];
    customFilters?: CustomFilterRule[];
    duplicatesOnly?: boolean;
  }) => {
    if (!quiet) setIsLoading(true);
    try {
      const activeContact = overrideFilters?.contactFilter ?? filterStateRef.current.contactFilter;
      const activeAvailable = overrideFilters?.availableFilter ?? filterStateRef.current.availableFilter;
      const activeStudies = overrideFilters?.selectedStudies ?? filterStateRef.current.selectedStudies;
      const activeCustom = (overrideFilters?.customFilters ?? filterStateRef.current.customFilters)
        .filter(hasFilterCriteria);
      const activeDuplicatesOnly = overrideFilters?.duplicatesOnly !== undefined
        ? overrideFilters.duplicatesOnly
        : filterStateRef.current.duplicatesOnly;

      const params: RegistrySearchParams = {
        tenantId,
        siteId,
        contactFilter: activeContact,
        availableFilter: activeAvailable,
        studies: activeStudies.length > 0 ? activeStudies : undefined,
        customFiltersJson: activeCustom.length > 0 ? JSON.stringify(activeCustom) : undefined,
        duplicatesOnly: activeDuplicatesOnly ? true : undefined,
        page: 0,
        pageSize: 500,
        sortBy: 'dateCreated',
        sortDirection: 'desc',
      };

      const getPageItems = (response: any): any[] => Array.isArray(response)
        ? response
        : Array.isArray(response?.items)
        ? response.items
        : Array.isArray(response?.data)
        ? response.data
        : [];
      const firstPage: any = await participantApi.getParticipants(params);
      const rawList = getPageItems(firstPage);
      const totalPages = Array.isArray(firstPage)
        ? 1
        : typeof firstPage?.totalPages === 'number'
        ? firstPage.totalPages
        : typeof firstPage?.totalCount === 'number'
        ? Math.ceil(firstPage.totalCount / params.pageSize!)
        : 1;

      for (let page = 1; page < totalPages; page += 1) {
        const nextPage: any = await participantApi.getParticipants({ ...params, page });
        const nextItems = getPageItems(nextPage);
        if (nextItems.length === 0) break;
        rawList.push(...nextItems);
      }

      const mapped: ParticipantRecord[] = rawList.map((p: any) => ({
        id: String(p.id ?? p.participantId ?? ''),
        name: p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Unnamed Participant',
        firstName: p.firstName || '',
        middleName: p.middleName || '',
        lastName: p.lastName || '',
        status: p.status || 'Active',
        city: p.city || '',
        state: p.state || '',
        zipcode: p.zipcode || p.postalCode || '',
        phone: p.phone || '',
        gender: p.gender && p.gender.toLowerCase() !== 'unspecified' ? p.gender : '',
        age: p.age && p.age !== 'N/A' && p.age !== 'NA' ? String(p.age) : '',
        ageNumeric: p.ageNumeric ?? (typeof p.age === 'number' ? p.age : undefined),
        lastContact: p.lastContact || p.globalDateOfLastContact || '',
        familyId: p.familyId || '',
        dateCreated: p.dateCreated || '',
        globalId: p.globalId || '',
        timezone: p.timezone || '',
        tags: Array.isArray(p.tags) ? p.tags : [],
        contactForFutureStudies: isContactForFutureStudies(p.contactForFutureStudies),
        availableToAddStudy: p.availableToAddStudy ?? true,
        globalDateOfLastContact: p.globalDateOfLastContact || '',
        birthMonth: p.birthMonth || '',
        studies: Array.isArray(p.studies) ? p.studies.map((study: StudyItem) => ({
          ...study,
          isLink: Boolean(userStudyIds.has(String(study.studyId || study.id || '').trim())),
        })) : [],
        contactMethods: p.contactMethods || {
          primaryEmail: p.email || '',
          phone: p.phone || '',
          preferredMethod: 'Email',
        },
        demographics: p.demographics || {
          gender: p.gender && p.gender.toLowerCase() !== 'unspecified' ? p.gender : '',
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
        searchableText: [
          p.name, p.firstName, p.middleName, p.lastName, p.status,
          p.gender, p.sexAtBirth, p.genderIdentity, p.age, p.dateOfBirth,
          p.lastContact, p.globalDateOfLastContact, p.dateCreated, p.birthMonth,
          p.phone, p.email, p.city, p.state, p.zipcode, p.postalCode,
          p.address, p.addressLine1, p.globalId, p.familyId,
          p.contactMethods?.primaryEmail, p.contactMethods?.secondaryEmail,
          p.contactMethods?.phone, p.contactMethods?.address,
          ...(Array.isArray(p.identifiers)
            ? p.identifiers.flatMap((identifier: any) => [identifier?.identifierValue, identifier?.value])
            : []),
          ...(Array.isArray(p.tags) ? p.tags : []),
          ...(Array.isArray(p.studies) ? p.studies.map((study: any) => study?.name) : []),
          ...(Array.isArray(p.variables)
            ? p.variables.flatMap((variable: any) => [variable?.name, variable?.value])
            : []),
          p.customAttributes == null
            ? ''
            : typeof p.customAttributes === 'string'
            ? p.customAttributes
            : JSON.stringify(p.customAttributes),
        ].filter((value) => value !== null && value !== undefined).map(String).join(' '),
      }));

      setParticipants(mapped);
      const rawCount = typeof firstPage?.totalCount === 'number'
        ? firstPage.totalCount
        : typeof firstPage?.totalElements === 'number'
        ? firstPage.totalElements
        : mapped.length;
      setServerTotalCount(rawCount);
      setError(null);

      // Keep baseline for study list dropdown when unfiltered
      const isUnfiltered = activeContact === 'all' && activeAvailable === 'all' && activeStudies.length === 0 && activeCustom.length === 0;
      setAllParticipants((prev) => (isUnfiltered || prev.length === 0 ? mapped : prev));
      setSelectedParticipantId((prev) => prev || (mapped.length > 0 ? mapped[0].id : ''));
      setDetailModalState((prev) => {
        if (!prev.isOpen || !prev.participant) return prev;
        const refreshed = mapped.find((m) => m.id === prev.participant?.id);
        return refreshed ? { isOpen: true, participant: refreshed } : prev;
      });
      return true;
    } catch (err: any) {
      const errorMsg = getApiErrorMessage(err, 'Failed to retrieve participants from the server');
      setError(errorMsg);
      setParticipants([]);
      return false;
    } finally {
      if (!quiet) setIsLoading(false);
    }
  }, [tenantId, siteId, userStudyIds]);

  const fetchDemographicOptions = useCallback(async () => {
    setIsLoadingDemographicOptions(true);
    registerDemographicFilterOptions({});
    setRegistryFilterOptionsVersion((version) => version + 1);
    try {
      const options = await participantApi.getDemographicOptions({ params: { tenantId, siteId } });
      registerDemographicFilterOptions(options);
      setDemographicOptions({
        ethnicity: options.ethnicity || [],
        race: options.race || [],
        sex: options.sex || options.gender || [],
        gender: options.gender || options.sex || [],
      });
    } catch (err) {
      console.warn('Failed to load demographic options:', err);
      toast.error(getApiErrorMessage(err, 'Failed to load race and ethnicity options.'));
      setDemographicOptions({ ethnicity: [], race: [], sex: [], gender: [] });
    } finally {
      setIsLoadingDemographicOptions(false);
    }
  }, [tenantId, siteId]);

  const fetchRegistryFilterOptions = useCallback(async () => {
    registerRegistryFilterOptions({});
    setRegistryFilterOptionsVersion((version) => version + 1);
    try {
      const options = await participantApi.getRegistryFilterOptions({ tenantId, siteId });
      registerRegistryFilterOptions(options);
      setRegistryFilterOptionsVersion((version) => version + 1);
    } catch (err) {
      console.warn('Failed to load registry filter options:', err);
      toast.error(getApiErrorMessage(err, 'Failed to load registry filter options.'));
    }
  }, [tenantId, siteId]);

  // Fetch dynamic custom variable filter metadata from backend
  const fetchFilterMetadata = useCallback(async () => {
    try {
      const meta = await participantApi.getFilterMetadata();
      if (Array.isArray(meta)) {
        const globalOnlyMeta = meta.filter((m: any) => m?.global === true || m?.isGlobal === true || String(m?.global).toLowerCase() === 'true' || String(m?.isGlobal).toLowerCase() === 'true');
        setGlobalVariables(globalOnlyMeta

          .map((m: any) => ({
            id: String(m.id || ''),
            name: String(m.label || m.name || m.id || 'Unnamed variable'),
            type: String(m.type || 'short'),
            isBlind: m.isBlind === true,
            options: Array.isArray(m.options) ? m.options.map((option: any) => ({
              value: String(option.value ?? option.optionId ?? option.label ?? ''),
              label: String(option.label ?? option.name ?? option.value ?? ''),
            })) : [],
          }))
          .filter((m: GlobalVariableDefinition) => m.id && m.name));
        const dynamicFields: FilterFieldOption[] = globalOnlyMeta.map((m: any) => {
          const variableLabel = String(m.label || m.name || m.id || 'Unnamed variable').trim();
          const customFieldLabel = /^custom\s*[-:]/i.test(variableLabel)
            ? variableLabel
            : `Custom - ${variableLabel}`;
          const variableType = String(m.type || 'short').toLowerCase();
          let fieldType: FilterFieldOption['type'] = 'text';
          if (variableType === 'number') fieldType = 'number';
          else if (variableType === 'date') fieldType = 'date';
          else if (variableType === 'datetime') fieldType = 'datetime';
          else if (variableType === 'single') fieldType = 'select';
          else if (variableType === 'multi') fieldType = 'multiselect';
          else if (variableType === 'long') fieldType = 'textarea';

          const options: FilterOptionItem[] = Array.isArray(m.options)
            ? m.options.map((opt: any) => ({
                label: opt.label || opt.value,
                value: opt.value || opt.label,
              }))
            : [];

          return {
            id: m.id,
            label: customFieldLabel,
            placeholder: `Filter by ${variableLabel}...`,
            type: fieldType,
            options: options.length > 0 ? options : undefined,
          };
        });
        registerDynamicFilterFields(dynamicFields);
      }
    } catch (err) {
      console.warn('Failed to load dynamic custom filter metadata:', err);
    }
  }, []);

  // Fetch the current user's study memberships to control Registry study links
  useEffect(() => {
    const userId = context?.user?.id;
    if (userId === undefined || userId === null || !tenantId) {
      setUserStudyIds(new Set());
      return;
    }

    let cancelled = false;
    administrationApi.getUserStudies(userId, tenantId)
      .then((studies) => {
        if (cancelled) return;
        setUserStudyIds(new Set(studies.map((study: any) => String(study.id ?? study.studyId ?? '').trim()).filter(Boolean)));
      })
      .catch((err) => {
        console.warn('Failed to load user study memberships for registry:', err);
        if (!cancelled) setUserStudyIds(new Set());
      });

    return () => { cancelled = true; };
  }, [context?.user?.id, tenantId]);

  // Fetch visible studies from Study Service for filter dropdowns & bulk assignment
  const fetchStudies = useCallback(async () => {
    try {
      const studies = await studyApi.getStudies({ includeArchived: true });
      if (Array.isArray(studies)) {
        setAvailableStudies(studies);
        const opts: FilterOptionItem[] = [
          ...DEFAULT_STUDY_FILTER_OPTIONS,
          ...studies
            .map((s) => {
              const label = String(s.name || s.shortName || s.title || '').trim();
              const value = String(s.id ?? s.studyId ?? label).trim();
              return { value, label };
            })
            .filter((o) => Boolean(o.value && o.label)),
        ];
        registerStudyFilterOptions(opts);
      }
    } catch (err) {
      console.warn('Failed to load studies for registry:', err);
    }
  }, []);

  const studyFilterOptions = useMemo<FilterOptionItem[]>(() => {
    const seen = new Set<string>(['NONE']);
    const opts: FilterOptionItem[] = [...DEFAULT_STUDY_FILTER_OPTIONS];
    availableStudies.forEach((s) => {
      const label = String(s.name || s.shortName || s.title || '').trim();
      const value = String(s.id ?? s.studyId ?? label).trim();
      if (value && label && !seen.has(value)) {
        seen.add(value);
        opts.push({ value, label });
      }
    });
    return opts;
  }, [availableStudies]);

  // Initial Load only on mount / tenant-site context change
  useEffect(() => {
    fetchParticipants();
    fetchSavedSearches();
    fetchFilterMetadata();
    fetchDemographicOptions();
    fetchRegistryFilterOptions();
    fetchStudies();
  }, [fetchParticipants, fetchSavedSearches, fetchFilterMetadata, fetchDemographicOptions, fetchRegistryFilterOptions, fetchStudies]);

  const selectedParticipant = useMemo(() => {
    return participants.find((p) => p.id === selectedParticipantId) || participants[0] || null;
  }, [participants, selectedParticipantId]);

  const handleSelectParticipant = (participant: ParticipantRecord) => {
    if (participant && participant.id) {
      setSelectedParticipantId(participant.id);
    }
  };

  const handleRefresh = async () => {
    const refreshed = await fetchParticipants(false);
    fetchSavedSearches();
    fetchFilterMetadata();
    fetchDemographicOptions();
    fetchStudies();
    if (refreshed) showNotification('Participant queue refreshed');
  };

  const handleToggleDuplicates = () => {
    const next = !duplicatesOnly;
    setDuplicatesOnly(next);
    fetchParticipants(false, { duplicatesOnly: next });
  };

  const handleParticipantCreated = async (created: any) => {
    showNotification('Success! Participant added to registry.', 'success');
    await fetchParticipants(true);
    if (created?.id) setSelectedParticipantId(String(created.id));
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

  const handleSelectedStudiesChange: React.Dispatch<React.SetStateAction<string[]>> = useCallback((updater) => {
    const current = filterStateRef.current.selectedStudies;
    const next = typeof updater === 'function' ? updater(current) : updater;
    filterStateRef.current = { ...filterStateRef.current, selectedStudies: next };
    setSelectedStudies(next);
    void fetchParticipants(false, { selectedStudies: next });
  }, [fetchParticipants]);

  const handleNavigateToStudy = useCallback((study: StudyItem) => {
    const targetStudyId = String(study.studyId || study.id || '').trim();
    if (!targetStudyId || !context?.navigate) return;
    const targetTab = String(study.status || '').toUpperCase() === 'ENROLLED'
      ? 'enrolled_participants'
      : 'potential_participants';
    context.navigate(`/studies?studyId=${encodeURIComponent(targetStudyId)}&tab=${targetTab}`);
  }, [context]);

  const handleAssignStudyToSelected = async (participantIds: string[], studyName: string) => {
    const matchedStudy = availableStudies.find((s) => {
      const id = String(s.id ?? s.studyId ?? '').trim();
      const label = String(s.name || s.shortName || s.title || '').trim();
      return (id && id === studyName) || (label && label.toLowerCase() === studyName.trim().toLowerCase());
    });
    const resolvedStudyId = matchedStudy ? String(matchedStudy.id ?? matchedStudy.studyId ?? '').trim() : undefined;
    const resolvedStudyName = matchedStudy
      ? String(matchedStudy.name || matchedStudy.shortName || matchedStudy.title || studyName).trim()
      : studyName;
    try {
      await participantApi.assignStudy({
        participantIds,
        ...(resolvedStudyId ? { studyId: resolvedStudyId } : {}),
        studyName: resolvedStudyName,
        status: 'REFERRED',
        notes: 'Bulk assigned from Participant Registry',
      });
      showNotification(`Assigned ${participantIds.length} participant(s) to ${resolvedStudyName}.`, 'success');
      await fetchParticipants(true);
    } catch (err: any) {
      const errorMsg = getApiErrorMessage(err, 'Failed to assign study to selected participants.');
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
        customFilters: customFilters.filter(hasFilterCriteria),
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
      const errorMsg = getApiErrorMessage(err, 'Failed to save filter on server.');
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
          const errorMsg = getApiErrorMessage(err, 'Failed to delete saved search.');
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
      selectedStudies: nextStudies,
      customFilters: nextCustom.filter(hasFilterCriteria),
    });
    showNotification(`Applied saved search "${saved.name}".`);
  };

  const handleSearch = () => {
    const applicableFilters = customFilters.filter(hasFilterCriteria);
    for (const filter of applicableFilters) {
      const valResult = validateFilterRule(filter);
      if (!valResult.isValid) {
        showNotification(valResult.error || 'Please provide valid filter criteria.', 'warning');
        return;
      }
    }
    fetchParticipants(false, {
      customFilters: applicableFilters,
    });
  };

  const handleContactFilterChange = (value: 'all' | 'yes' | 'no') => {
    setContactFilter(value);
    fetchParticipants(false, { contactFilter: value });
  };

  const handleAvailableFilterChange = (value: 'all' | 'yes' | 'no') => {
    setAvailableFilter(value);
    fetchParticipants(false, { availableFilter: value });
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
          middleName: updatedParticipant.middleName,
          lastName: updatedParticipant.lastName,
          phone: updatedParticipant.contactMethods?.phone || updatedParticipant.phone,
          primaryEmail: updatedParticipant.contactMethods?.primaryEmail,
          city: updatedParticipant.city,
          state: updatedParticipant.state,
          postalCode: updatedParticipant.zipcode,
          status: updatedParticipant.status,
          sexAtBirth: updatedParticipant.gender,
          dateOfBirth: updatedParticipant.demographics?.dob,
          ethnicity: updatedParticipant.demographics?.ethnicity,
          race: updatedParticipant.demographics?.race,
          primaryLanguage: updatedParticipant.demographics?.primaryLanguage,
          familyRole: updatedParticipant.family?.familyRole,
          guardianName: updatedParticipant.family?.guardianName,
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
      const errorMsg = getApiErrorMessage(err, 'Failed to update participant on server.');
      showNotification(errorMsg, 'error');
    }
  };

  const handleOpenDeleteParticipant = (participant: ParticipantRecord) => {
    void requestConfirmation({
      entityName: participant.name,
      intent: 'danger',
      confirmText: 'Delete participant',
      loadingText: 'Deleting participant...',
      title: `Are you sure you want to delete ${participant.name}?`,
      message: 'You will NOT be able to recover this participant.',
      confirmWord: 'DELETE',
      confirmInputLabel: '',
      confirmInputPlaceholder: '',
      confirmInputSubtext: 'Type DELETE in all caps and press enter',
      onConfirm: async () => {
        try {
          await participantApi.deleteParticipant(participant.id);
          showNotification(`Participant "${participant.name}" deleted.`, 'success');
          await fetchParticipants(true);
        } catch (err: any) {
          const errorMsg = getApiErrorMessage(err, 'Failed to delete participant.');
          showNotification(errorMsg, 'error');
        }
      },
    });
  };

  const handleDeleteSelected = (participantIds: string[]) => {
    if (participantIds.length === 0) return;
    void requestConfirmation({
      title: `Delete ${participantIds.length} participants?`,
      message: `You will not be able to recover these ${participantIds.length} participants.`,
      intent: 'danger',
      confirmText: `Delete ${participantIds.length} participants`,
      loadingText: 'Deleting participants...',
      confirmWord: 'DELETE',
      confirmInputSubtext: 'Type DELETE in all caps and press enter',
      onConfirm: async () => {
        const results = await Promise.allSettled(
          participantIds.map((id) => participantApi.deleteParticipant(id))
        );
        const deletedCount = results.filter((result) => result.status === 'fulfilled').length;
        const failedCount = results.length - deletedCount;
        await fetchParticipants(true);
        if (failedCount > 0) {
          showNotification(
            `${deletedCount} participant(s) deleted; ${failedCount} could not be deleted.`,
            'warning'
          );
          throw new Error(`${failedCount} participant deletion(s) failed. Refresh the registry and try again.`);
        }
        showNotification(`${deletedCount} participant(s) deleted.`, 'success');
      },
    });
  };

  const handleExportServerCsv = async (exportFields: string[], timezone: string) => {
    try {
      const applicableFilters = customFilters.filter(hasFilterCriteria);
      const params: RegistrySearchParams = {
        tenantId,
        siteId,
        searchTerm: searchTerm.trim() || undefined,
        contactFilter,
        availableFilter,
        studies: selectedStudies.length > 0 ? selectedStudies : undefined,
        customFiltersJson: applicableFilters.length > 0 ? JSON.stringify(applicableFilters) : undefined,
        duplicatesOnly: duplicatesOnly ? true : undefined,
        exportFields,
        timezone,
      };
      const blob = await participantApi.exportRegistry(params);
      return blob;
    } catch (err: any) {
      const errorMsg = getApiErrorMessage(err, 'Failed to export registry.');
      showNotification(errorMsg, 'error');
      return null;
    }
  };

  return (
    <div className="workspace-split-layout">
      <div className="workspace-split-layout__sidebar">
        <LeftFilterPanel
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          contactFilter={contactFilter}
          setContactFilter={handleContactFilterChange}
          availableFilter={availableFilter}
          setAvailableFilter={handleAvailableFilterChange}
          customFilters={customFilters}
          onAddFilter={handleAddFilter}
          onUpdateFilter={handleUpdateFilter}
          onRemoveFilter={handleRemoveFilter}
          onAddParticipant={() => setIsAddModalOpen(true)}
          onClearFilters={handleClearFilters}
          onSaveFilter={handleOpenSaveModal}
          onSearch={() => handleSearch()}
          savedSearches={savedSearches}
          onSelectSavedSearch={handleSelectSavedSearch}
          onDeleteRequest={handleOpenDeleteModal}
          studyOptions={studyFilterOptions}
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
          onDeleteSelected={handleDeleteSelected}
          onAssignStudyToSelected={handleAssignStudyToSelected}
          onExportServerCsv={handleExportServerCsv}
          globalVariables={globalVariables}
          isLoading={isLoading}
          totalCount={serverTotalCount}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedStudies={selectedStudies}
          setSelectedStudies={handleSelectedStudiesChange}
          studies={availableStudies}
          onNavigateToStudy={handleNavigateToStudy}
          duplicatesOnly={duplicatesOnly}
          onToggleDuplicates={handleToggleDuplicates}
        />
      </div>

      <AddParticipantModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleParticipantCreated}
        onAdd={handleParticipantCreated}
        tenantId={tenantId}
        siteId={siteId}
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
        tenantId={tenantId}
        siteId={siteId}
        currentUser={context?.user}
        globalVariables={globalVariables}
        demographicOptions={demographicOptions}
        demographicOptionsLoading={isLoadingDemographicOptions}
        onParticipantUpdated={async () => {
          await fetchParticipants(true);
        }}
      />
    </div>
  );
};

export default RegistryDashboard;
