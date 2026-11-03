// frontend/microfrontends/participant/src/components/ParticipantDetailModal.tsx - Detailed Participant Drawer & Editor
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  MessageSquare, 
  Mail, 
  Phone, 
  FileText, 
  Check, 
  Plus, 
  User, 
  Users, 
  ShieldCheck, 
  Trash2, 
  Search,
  X,
} from 'lucide-react';
import { AuthUser } from '../../../../shared/contracts';
import { getApiErrorMessage, getStoredAuthUser } from '../../../../shared/api-client';
import { requestConfirmation } from '../../../../shared/confirmation';
import { Modal } from '../../../../shared/design-system/components/Modal';
import { Tabs } from '../../../../shared/design-system/components/Tabs';
import { DataGrid, type ColDef, type ICellRendererParams } from '../../../../shared/design-system/components/DataGrid';
import {
  participantApi,
  ConsentItem,
  DemographicOptions,
  ParticipantContactDetail,
} from '../../../../shared/api/participantApi';
import {
  FamilyMember,
  GlobalVariableDefinition,
  isContactForFutureStudies,
  ParticipantRecord,
  ParticipantVariable,
  StudyItem,
} from '../types/participant';
import { ParticipantContactLogs } from './ParticipantContactLogs';
import { ParticipantContactManagement } from './ParticipantContactManagement';
import { ParticipantComments } from './ParticipantComments';
import { ParticipantEmailSection } from './ParticipantEmailSection';
import { ParticipantSmsSection } from './ParticipantSmsSection';
import { ParticipantConsentSection } from './ParticipantConsentSection';
import { ParticipantFormsSection } from './ParticipantFormsSection';
import { ParticipantTagSelect } from './ParticipantTagSelect';
import { isValidDateTimeValue, ParticipantDateTimePicker } from './ParticipantDateTimePicker';
import { toast } from '../../../../shared/toaster';
import { calculateCurrentAge, formatDobForDateInput } from '../utils/participantDateUtils';

export { calculateCurrentAge, formatDobForDateInput } from '../utils/participantDateUtils';

const getParticipantLastContactDate = (participant?: ParticipantRecord | null): string => {
  const values = [participant?.globalDateOfLastContact, participant?.lastContact];
  return values.find((value) => isValidDateTimeValue(value)) || '';
};

const getContactImportKey = (contact: ParticipantContactDetail): string => {
  const contactType = contact.contactType?.trim().toLocaleLowerCase() ?? '';
  const contactValue = contact.contactValue?.trim().toLocaleLowerCase() ?? '';
  return contactType && contactValue ? `${contactType}\u0000${contactValue}` : '';
};

export const importFamilyContactMethods = async (
  participantId: string,
  sourceParticipantIds: string[],
  options?: { tenantId?: string; siteId?: string },
): Promise<number> => {
  const [existingContacts, ...sourceContactGroups] = await Promise.all([
    participantApi.getContacts(participantId, options),
    ...sourceParticipantIds.map((sourceId) => participantApi.getContacts(sourceId, options)),
  ]);
  const importedKeys = new Set(existingContacts.map(getContactImportKey).filter(Boolean));
  let importedCount = 0;

  for (const sourceContacts of sourceContactGroups) {
    for (const contact of sourceContacts) {
      const key = getContactImportKey(contact);
      if (!key || importedKeys.has(key)) continue;

      await participantApi.createContact(participantId, {
        contactType: contact.contactType,
        contactValue: contact.contactValue,
        label: contact.label,
        contactName: contact.contactName,
        relationship: contact.relationship,
        canLeaveMessage: contact.canLeaveMessage,
        notes: contact.notes,
        primaryContact: false,
        isPreferred: false,
        active: contact.active,
      }, options);
      importedKeys.add(key);
      importedCount += 1;
    }
  }

  return importedCount;
};

interface FamilyGridRow {
  id: string;
  name: string;
  gender: string;
  age: string;
  studies: string;
  isCurrent: boolean;
}

export const buildFamilyGridRows = (
  participant: ParticipantRecord | null | undefined,
  familyMembers: FamilyMember[],
  dob: string,
  gender: string,
): FamilyGridRow[] => {
  if (!participant?.familyId?.trim()) return [];

  const currentAge = calculateCurrentAge(dob, participant.age);
  const currentStudies = (participant.studies || [])
    .map((study) => study.name)
    .filter(Boolean)
    .join(', ');

  return [
    {
      id: participant.id,
      name: participant.name || '...',
      gender: gender || '...',
      age: currentAge === '--' ? '...' : currentAge,
      studies: currentStudies,
      isCurrent: true,
    },
    ...familyMembers
      .filter((member) => member.id !== participant.id)
      .map((member) => ({
        id: member.id,
        name: member.name || '...',
        gender: member.sex || '...',
        age: member.age || '...',
        studies: member.studies?.join(', ') || '',
        isCurrent: false,
      })),
  ];
};

const GlobalVariableField: React.FC<{
  variable: GlobalVariableDefinition;
  value: string;
  onChange: (value: string) => void;
}> = ({ variable, value, onChange }) => {
  const type = variable.type.toLowerCase();
  const options = variable.options || [];
  const fieldId = `global-variable-${variable.id}`;

  let input: React.ReactNode;
  if (variable.isBlind) {
    input = <input className="form-input" value="####################" disabled aria-label={`${variable.name} is blinded`} />;
  } else if (type === 'single') {
    input = (
      <select id={fieldId} className="form-select" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select an option...</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    );
  } else if (type === 'multi') {
    const selected = value ? value.split(',').map((part) => part.trim()).filter(Boolean) : [];
    input = (
      <select
        id={fieldId}
        className="form-select"
        multiple
        value={selected}
        onChange={(event) => onChange(Array.from(event.target.selectedOptions, (option) => option.value).join(', '))}
      >
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    );
  } else if (type === 'datetime') {
    input = <ParticipantDateTimePicker id={fieldId} value={value} onChange={onChange} />;
  } else if (type === 'date') {
    const dateValue = /^\d{2}\/\d{2}\/\d{4}$/.test(value)
      ? `${value.slice(6)}-${value.slice(0, 2)}-${value.slice(3, 5)}`
      : /^\d{4}-\d{2}-\d{2}/.exec(value)?.[0] || '';
    input = <input id={fieldId} type="date" className="form-input" value={dateValue} onChange={(event) => onChange(event.target.value)} />;
  } else if (type === 'long') {
    input = <textarea id={fieldId} className="form-textarea" rows={3} value={value} onChange={(event) => onChange(event.target.value)} />;
  } else {
    input = <input id={fieldId} type={type === 'number' ? 'number' : 'text'} className="form-input" value={value} onChange={(event) => onChange(event.target.value)} placeholder={variable.name || 'Enter value...'} />;
  }

  return (
    <div className="global-variable-field">
      <div className="global-variable-field__label-row">
        <label className="form-label" htmlFor={fieldId}>{variable.name}</label>
        <span className="badge badge-info">Global</span>
      </div>
      {input}
    </div>
  );
};

const ParticipantStudiesInfo: React.FC<{
  participant: ParticipantRecord;
  tenantId?: string;
  siteId?: string;
}> = ({ participant, tenantId, siteId }) => {
  const [consents, setConsents] = useState<ConsentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let active = true;
    setConsents([]);
    setError('');
    setIsLoading(true);
    participantApi.getConsents(participant.id, { tenantId, siteId })
      .then((items) => { if (active) setConsents(items); })
      .catch(() => { if (active) setError('Unable to load study consent details.'); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [participant.id, tenantId, siteId]);

  const studyRows = useMemo(() => (participant.studies || []).map((study: StudyItem) => {
    const studyId = study.studyId || study.id || '';
    const consent = consents.find((item) => item.studyId === studyId);
    return {
      id: studyId || study.name,
      name: study.name,
      participantStudyId: study.participantStudyId || study.studyCode || '—',
      status: consent?.status || study.status || 'Not Consented',
      consentedAt: consent?.consentedAt,
    };
  }), [participant.studies, consents]);

  const studyColumns = useMemo<ColDef<(typeof studyRows)[number]>[]>(() => [
    { field: 'name', headerName: 'Name', minWidth: 180, flex: 1.15 },
    { field: 'participantStudyId', headerName: 'ID', minWidth: 150, flex: 1 },
    { field: 'status', headerName: 'Status', minWidth: 150, flex: 1 },
    {
      field: 'consentedAt',
      headerName: 'Date Consented',
      minWidth: 160,
      flex: 1,
      valueFormatter: (params) => params.value
        ? new Date(params.value).toLocaleDateString()
        : 'Not Consented',
    },
  ], []);

  return (
    <section className="card record-detail__panel record-detail__study-info">
      <div className="card-header"><h3>Studies Info</h3></div>
      {error && <p className="record-detail__inline-error" role="status">{error}</p>}
      <label className="record-detail__study-search">
        <Search size={15} aria-hidden="true" />
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search studies..."
          aria-label="Search studies"
        />
        {searchTerm && (
          <button type="button" onClick={() => setSearchTerm('')} aria-label="Clear studies search">
            <X size={14} />
          </button>
        )}
      </label>
      <DataGrid
        wrapperClassName="record-detail__study-grid"
        rowData={studyRows}
        columnDefs={studyColumns}
        defaultColDef={{ sortable: true, resizable: true, filter: true, floatingFilter: true }}
        quickFilterText={searchTerm}
        loading={isLoading}
        pagination
        paginationPageSize={10}
        paginationPageSizeSelector={[5, 10, 20, 50]}
        rowHeight={42}
        headerHeight={42}
        suppressCellFocus
        overlayNoRowsTemplate="<span class='text-slate-500'>No studies are linked to this participant.</span>"
      />
    </section>
  );
};

export interface ParticipantDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: ParticipantRecord | null;
  onSave: (
    updatedParticipant: ParticipantRecord,
    options?: { keepOpen?: boolean },
  ) => void | boolean | Promise<void | boolean>;
  onSelectParticipantById?: (participantId: string) => void;
  onParticipantUpdated?: () => void;
  tenantId?: string;
  siteId?: string;
  globalVariables?: GlobalVariableDefinition[];
  demographicOptions?: DemographicOptions;
  demographicOptionsLoading?: boolean;
  currentUser?: AuthUser | null;
}

export const ParticipantDetailModal: React.FC<ParticipantDetailModalProps> = ({
  isOpen,
  onClose,
  participant,
  onSave,
  onSelectParticipantById,
  onParticipantUpdated,
  tenantId,
  siteId,
  globalVariables = [],
  demographicOptions = { ethnicity: [], race: [] },
  demographicOptionsLoading = false,
  currentUser = null,
}) => {
  const [activeTopNav, setActiveTopNav] = useState<'details' | 'contact' | 'demographics' | 'family' | 'variables'>('details');
  const [activeTab, setActiveTab] = useState<'comments' | 'email' | 'text' | 'contact' | 'consent' | 'forms'>('comments');
  const [firstName, setFirstName] = useState(participant?.firstName || '');
  const [middleName, setMiddleName] = useState(participant?.middleName || '');
  const [lastName, setLastName] = useState(participant?.lastName || '');

  // Overview / General
  const [familyId, setFamilyId] = useState(participant?.familyId || '');
  const [globalId, setGlobalId] = useState(participant?.globalId || '');
  const [timezone, setTimezone] = useState(participant?.timezone || '');
  const [timezoneOptions, setTimezoneOptions] = useState<string[]>([]);
  const [isLoadingTimezones, setIsLoadingTimezones] = useState(false);
  const [timezoneError, setTimezoneError] = useState<string | null>(null);
  const hasExistingTimezone = Boolean(participant?.timezone && participant.timezone.trim());
  const initialLastContactDate = getParticipantLastContactDate(participant);
  const hasExistingDate = Boolean(initialLastContactDate);

  const handleTimezoneChange = (newTz: string) => {
    if (hasExistingTimezone && (!newTz || !newTz.trim())) {
      setTimezoneError('Timezone cannot be removed once set. Please select a valid timezone.');
      return;
    }
    setTimezone(newTz);
    setTimezoneError(null);
  };
  const [selectedTags, setSelectedTags] = useState<string[]>(Array.isArray(participant?.tags) ? participant.tags : []);
  const [contactForFuture, setContactForFuture] = useState(isContactForFutureStudies(participant?.contactForFutureStudies));
  const [dateLastContact, setDateLastContact] = useState(initialLastContactDate);
  const [dateLastContactError, setDateLastContactError] = useState<string | null>(null);

  // Contact Methods
  const [primaryEmail, setPrimaryEmail] = useState(participant?.contactMethods?.primaryEmail || '');
  const [secondaryEmail, setSecondaryEmail] = useState(participant?.contactMethods?.secondaryEmail || '');
  const [phone, setPhone] = useState(participant?.contactMethods?.phone || participant?.phone || '');
  const [address, setAddress] = useState(participant?.contactMethods?.address || '');
  const [preferredMethod, setPreferredMethod] = useState(participant?.contactMethods?.preferredMethod || '');

  // Demographics
  const [dob, setDob] = useState(participant?.demographics?.dob || '');
  const [gender, setGender] = useState(participant?.gender || participant?.demographics?.gender || '');
  const [ethnicity, setEthnicity] = useState(participant?.demographics?.ethnicity || '');
  const [race, setRace] = useState(participant?.demographics?.race || '');
  const [internalDemographicOptions, setInternalDemographicOptions] = useState<DemographicOptions | null>(null);
  const [internalDemographicLoading, setInternalDemographicLoading] = useState(false);

  // Family
  const [familyRole, setFamilyRole] = useState(participant?.family?.familyRole || '');
  const [familySearchTerm, setFamilySearchTerm] = useState('');
  const [isImportFamilyContactsOpen, setIsImportFamilyContactsOpen] = useState(false);
  const [selectedFamilyMemberIds, setSelectedFamilyMemberIds] = useState<string[]>([]);
  const [isImportingFamilyContacts, setIsImportingFamilyContacts] = useState(false);

  // Variables
  const [variables, setVariables] = useState<ParticipantVariable[]>(
    Array.isArray(participant?.variables) ? [...participant.variables] : []
  );
  const [newVarName, setNewVarName] = useState('');
  const [newVarValue, setNewVarValue] = useState('');
  const [newVarType, setNewVarType] = useState('Text');
  const [isAddingVariable, setIsAddingVariable] = useState(false);
  const [globalVariableSearch, setGlobalVariableSearch] = useState('');

  useEffect(() => {
    if (participant) {
      setFirstName(participant.firstName || '');
      setMiddleName(participant.middleName || '');
      setLastName(participant.lastName || '');
      setFamilyId(participant.familyId || '');
      setGlobalId(participant.globalId || '');
      setTimezone(participant.timezone || '');
      setSelectedTags(Array.isArray(participant.tags) ? participant.tags : []);
      setContactForFuture(isContactForFutureStudies(participant.contactForFutureStudies));
      setDateLastContact(getParticipantLastContactDate(participant));
      setDateLastContactError(null);
      
      setPrimaryEmail(participant.contactMethods?.primaryEmail || '');
      setSecondaryEmail(participant.contactMethods?.secondaryEmail || '');
      setPhone(participant.contactMethods?.phone || participant.phone || '');
      setAddress(participant.contactMethods?.address || '');
      setPreferredMethod(participant.contactMethods?.preferredMethod || '');

      setDob(participant.demographics?.dob || '');
      setGender(participant.gender || participant.demographics?.gender || '');
      setEthnicity(participant.demographics?.ethnicity || '');
      setRace(participant.demographics?.race || '');

      setFamilyRole(participant.family?.familyRole || '');
      setVariables(Array.isArray(participant.variables) ? [...participant.variables] : []);
      setSelectedFamilyMemberIds([]);
      setIsImportFamilyContactsOpen(false);
    }
  }, [participant]);

  useEffect(() => {
    if (!isOpen) return;
    const hasPropsOptions = (demographicOptions.ethnicity && demographicOptions.ethnicity.length > 0) ||
      (demographicOptions.race && demographicOptions.race.length > 0);
    if (!hasPropsOptions && !internalDemographicOptions && !internalDemographicLoading) {
      let isMounted = true;
      setInternalDemographicLoading(true);
      participantApi.getDemographicOptions({ params: { tenantId, siteId } })
        .then((opts) => {
          if (isMounted) {
            setInternalDemographicOptions(opts);
          }
        })
        .catch((err) => {
          console.warn('Could not load demographic options in detail modal:', err);
        })
        .finally(() => {
          if (isMounted) {
            setInternalDemographicLoading(false);
          }
        });
      return () => {
        isMounted = false;
      };
    }
  }, [isOpen, tenantId, siteId, demographicOptions, internalDemographicOptions, internalDemographicLoading]);

  // Always reset to the Overview tab whenever the modal opens or switches participant
  useEffect(() => {
    if (isOpen) {
      setActiveTopNav('details');
      setActiveTab('comments');
      setGlobalVariableSearch('');
      setFamilySearchTerm('');
      setIsAddingVariable(false);
    } else {
      setActiveTopNav('details');
      setActiveTab('comments');
      setFamilySearchTerm('');
    }
  }, [isOpen, participant?.id]);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingTimezones(true);
    setTimezoneError(null);
    participantApi.getTimezones({ tenantId, siteId })
      .then((options) => {
        if (isMounted) {
          setTimezoneOptions(Array.isArray(options) ? options : []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setTimezoneError('Unable to load timezone options');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingTimezones(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [tenantId, siteId]);

  const effectiveUser = currentUser || getStoredAuthUser<AuthUser>();
  const canEditGlobalId = Boolean(
    effectiveUser?.canAccessSiteAdmin ||
    effectiveUser?.canManageSiteAdmins ||
    effectiveUser?.siteRole === 'SITE_ADMIN' ||
    effectiveUser?.siteRole === 'SITE_MANAGER' ||
    effectiveUser?.roles?.some((r: string) => {
      const u = String(r).toUpperCase();
      return u === 'SITE_ADMIN' || u === 'ROLE_SITE_ADMIN' || u === 'SITE_MANAGER' || u === 'ROLE_SITE_MANAGER';
    })
  );

  const familyMembers = participant?.family?.members || [];
  const familyGridRows = useMemo(
    () => buildFamilyGridRows(participant, familyMembers, dob, gender),
    [dob, familyMembers, gender, participant],
  );
  const familyGridColumns = useMemo<ColDef<FamilyGridRow>[]>(() => [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 160,
      tooltipValueGetter: (params) => params.value,
      cellRenderer: (params: ICellRendererParams<FamilyGridRow>) => {
        if (!params.data || params.data.isCurrent || !onSelectParticipantById) {
          return <span>{params.value}</span>;
        }
        const memberId = params.data.id;
        return (
          <button
            type="button"
            className="text-blue-600 hover:underline cursor-pointer"
            onClick={() => onSelectParticipantById(memberId)}
          >
            {params.value}
          </button>
        );
      },
    },
    { field: 'gender', headerName: 'Gender', flex: 0.8, minWidth: 110, tooltipValueGetter: (params) => params.value },
    { field: 'age', headerName: 'Age', flex: 0.6, minWidth: 90, tooltipValueGetter: (params) => params.value },
    { field: 'studies', headerName: 'Studies', flex: 1.4, minWidth: 160, tooltipValueGetter: (params) => params.value },
  ], [onSelectParticipantById]);

  if (!isOpen || !participant) return null;

  const handleAddVariable = () => {
    if (!newVarName.trim()) return;
    const newVar: ParticipantVariable = {
      id: String(Date.now()),
      name: newVarName.trim(),
      type: newVarType,
      value: newVarValue.trim(),
      lastUpdated: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
    };
    setVariables((prev) => [...prev, newVar]);
    setNewVarName('');
    setNewVarValue('');
    setNewVarType('Text');
    setIsAddingVariable(false);
  };

  const handleRemoveVariable = (index: number) => {
    setVariables((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGlobalVariableChange = (definition: GlobalVariableDefinition, value: string) => {
    const canonicalId = definition.id.replace(/^custom_/, '');
    setVariables((previous) => {
      const existingIndex = previous.findIndex((item) =>
        item.id === canonicalId || item.id === definition.id || item.name.toLowerCase() === definition.name.toLowerCase()
      );
      const nextVariable: ParticipantVariable = {
        ...(existingIndex >= 0 ? previous[existingIndex] : {}),
        id: canonicalId,
        name: definition.name,
        type: definition.type,
        value,
        lastUpdated: new Date().toLocaleDateString(),
      };
      if (existingIndex < 0) return [...previous, nextVariable];
      return previous.map((item, index) => index === existingIndex ? nextVariable : item);
    });
  };

  const handleSaveParticipant = async (keepOpen = false): Promise<boolean> => {
    if (hasExistingTimezone && (!timezone || !timezone.trim())) {
      setTimezoneError('Timezone cannot be removed once set. Please select a valid timezone.');
      return false;
    }
    if (hasExistingDate && (!dateLastContact || !dateLastContact.trim())) {
      setDateLastContactError('Global Date of Last Contact cannot be removed once set.');
      return false;
    }

    if (dob && dob.trim()) {
      const ageStr = calculateCurrentAge(dob);
      if (ageStr === 'Invalid (Future Date)') {
        toast.error('Birthday cannot be in the future');
        return false;
      }
      if (ageStr === 'Invalid Date') {
        toast.error('Birthday is not valid');
        return false;
      }
    }

    const updatedParticipant: ParticipantRecord = {
      ...participant,
      firstName: firstName.trim(),
      middleName: middleName.trim(),
      lastName: lastName.trim(),
      name: [firstName, middleName, lastName].map((part) => part.trim()).filter(Boolean).join(' ') || participant.name,
      familyId,
      globalId,
      timezone,
      tags: selectedTags,
      contactForFutureStudies: contactForFuture,
      globalDateOfLastContact: dateLastContact,
      gender,
      contactMethods: {
        ...participant.contactMethods,
        primaryEmail,
        secondaryEmail,
        phone,
        address,
        preferredMethod,
      },
      demographics: {
        ...participant.demographics,
        dob,
        gender,
        ethnicity,
        race,
      },
      family: {
        ...participant.family,
        familyRole,
      },
      variables,
    };

    try {
      return (await onSave(updatedParticipant, { keepOpen })) !== false;
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to save participant.'));
      return false;
    }
  };

  const effectiveDemographicOptions = (demographicOptions.ethnicity && demographicOptions.ethnicity.length > 0) ||
    (demographicOptions.race && demographicOptions.race.length > 0)
    ? demographicOptions
    : (internalDemographicOptions || { ethnicity: [], race: [], sex: [] });

  const effectiveDemographicLoading = demographicOptionsLoading || internalDemographicLoading;

  const ethnicityOptions = [...(effectiveDemographicOptions.ethnicity || [])];
  if (ethnicity && !ethnicityOptions.includes(ethnicity)) ethnicityOptions.unshift(ethnicity);
  const raceOptions = [...(effectiveDemographicOptions.race || [])];
  if (race && !raceOptions.includes(race)) raceOptions.unshift(race);

  const serverGenders = effectiveDemographicOptions.sex || effectiveDemographicOptions.gender || [];
  const genderOptions = serverGenders.length > 0 ? [...serverGenders] : ['Female', 'Male', 'Other', 'Unspecified'];
  if (gender && !genderOptions.some((g) => g.toLowerCase() === gender.toLowerCase())) {
    genderOptions.unshift(gender);
  }

  const isFormDirty = () => {
    if (!participant) return false;
    if (firstName !== (participant.firstName || '')) return true;
    if (middleName !== (participant.middleName || '')) return true;
    if (lastName !== (participant.lastName || '')) return true;
    if (familyId !== (participant.familyId || '')) return true;
    if (globalId !== (participant.globalId || '')) return true;
    if (timezone !== (participant.timezone || '')) return true;
    if (contactForFuture !== isContactForFutureStudies(participant.contactForFutureStudies)) return true;
    const initialDate = getParticipantLastContactDate(participant);
    if (dateLastContact !== initialDate) return true;

    const origTags = Array.isArray(participant.tags) ? participant.tags : [];
    if (origTags.length !== selectedTags.length || origTags.some((t, i) => t !== selectedTags[i])) return true;

    if (primaryEmail !== (participant.contactMethods?.primaryEmail || '')) return true;
    if (secondaryEmail !== (participant.contactMethods?.secondaryEmail || '')) return true;
    if (phone !== (participant.contactMethods?.phone || participant.phone || '')) return true;
    if (address !== (participant.contactMethods?.address || '')) return true;
    if (preferredMethod !== (participant.contactMethods?.preferredMethod || '')) return true;

    if (dob !== (participant.demographics?.dob || '')) return true;
    if (gender !== (participant.gender || participant.demographics?.gender || '')) return true;
    if (ethnicity !== (participant.demographics?.ethnicity || '')) return true;
    if (race !== (participant.demographics?.race || '')) return true;

    if (familyRole !== (participant.family?.familyRole || '')) return true;

    const origVars = Array.isArray(participant.variables) ? participant.variables : [];
    if (origVars.length !== variables.length) return true;
    for (let i = 0; i < variables.length; i++) {
      if (variables[i].id !== origVars[i]?.id || variables[i].value !== origVars[i]?.value) return true;
    }

    return false;
  };

  const familyImportMembers = familyMembers.filter(
    (member) => member.id && member.id !== participant?.id,
  );
  const hasSavedFamilyId = Boolean(participant?.familyId?.trim());
  const canImportFamilyContacts = hasSavedFamilyId
    && familyId.trim() === participant?.familyId?.trim()
    && familyImportMembers.length > 0;

  const handleOpenFamilyContactsImport = async () => {
    if (isFormDirty() && !(await handleSaveParticipant(true))) return;
    setSelectedFamilyMemberIds([]);
    setIsImportFamilyContactsOpen(true);
  };

  const handleImportFamilyContacts = async () => {
    if (!participant || selectedFamilyMemberIds.length === 0 || isImportingFamilyContacts) return;

    setIsImportingFamilyContacts(true);
    const selectedMembers = familyImportMembers.filter((member) => selectedFamilyMemberIds.includes(member.id));

    try {
      const importedCount = await importFamilyContactMethods(
        participant.id,
        selectedMembers.map((member) => member.id),
        { tenantId, siteId },
      );

      setIsImportFamilyContactsOpen(false);
      setSelectedFamilyMemberIds([]);
      if (importedCount > 0) {
        toast.success(`Imported ${importedCount} contact method${importedCount === 1 ? '' : 's'}.`);
        onParticipantUpdated?.();
      } else {
        toast.info('All selected contact methods are already on this participant.');
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to import family contacts.'));
    } finally {
      setIsImportingFamilyContacts(false);
    }
  };

  const handleCloseModal = async () => {
    if (isFormDirty()) {
      const confirmed = await requestConfirmation({
        title: 'Are you sure you wish to discard your changes?',
        message: '',
        intent: 'warning',
        confirmText: 'Yes, discard changes.',
        cancelText: 'No, cancel!',
      });
      if (!confirmed) {
        return;
      }
    }
    setActiveTopNav('details');
    setActiveTab('comments');
    onClose();
  };

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={handleCloseModal}
      title="Participant Details"
      size="wide"
      footer={(
        <>
          <button type="button" onClick={handleCloseModal} className="btn btn-secondary">Cancel</button>
          <button type="button" onClick={() => { void handleSaveParticipant(); }} className="btn btn-primary">
            <Check size={16} /> Save Changes
          </button>
        </>
      )}
    >
      <div className="record-detail">
        <div className="record-detail__identity">
          <h1>{participant.name}</h1>
          <div className="flex items-center gap-2">
            <span className="badge badge-info">Participant ID: {participant.globalId || participant.id || '—'}</span>
            {familyId && <span className="badge badge-neutral">Family ID: {familyId}</span>}
          </div>
        </div>

        <Tabs
          activeTab={activeTopNav}
          onChange={(tabId) => setActiveTopNav(tabId as typeof activeTopNav)}
          tabs={[
            { id: 'details', label: 'Overview', icon: <User size={16} /> },
            { id: 'contact', label: 'Contact Methods', icon: <Mail size={16} /> },
            { id: 'demographics', label: 'Demographics', icon: <ShieldCheck size={16} /> },
            {
              id: 'family',
              label: hasSavedFamilyId ? `Family (${familyGridRows.length})` : 'Family',
              icon: <Users size={16} />,
            },
            { id: 'variables', label: `Variables (${globalVariables.length})`, icon: <FileText size={16} /> },
          ]}
        />

        <div className="record-detail__sections">
          {/* TAB 1: OVERVIEW */}
          {activeTopNav === 'details' && (
            <>
            <div className="card record-detail__panel">
              <div className="card-header"><h3>Participant overview</h3></div>
              <div className="record-detail__overview-grid">
                <div className="record-detail__field">
                  <label className="form-label" htmlFor="participant-first-name">First Name</label>
                  <input
                    id="participant-first-name"
                    type="text"
                    value={firstName}
                    readOnly
                    placeholder="First Name"
                    className="form-input"
                  />
                </div>
                <div className="record-detail__field">
                  <label className="form-label" htmlFor="participant-middle-name">Middle Name</label>
                  <input
                    id="participant-middle-name"
                    type="text"
                    value={middleName}
                    readOnly
                    placeholder="Middle Name"
                    className="form-input"
                  />
                </div>
                <div className="record-detail__field">
                  <label className="form-label" htmlFor="participant-last-name">Last Name</label>
                  <input
                    id="participant-last-name"
                    type="text"
                    value={lastName}
                    readOnly
                    placeholder="Last Name"
                    className="form-input"
                  />
                </div>
                <div className="record-detail__field">
                  <label className="form-label" htmlFor="participant-family-id">Family ID</label>
                  <input
                    id="participant-family-id"
                    type="text"
                    value={familyId}
                    onChange={(e) => setFamilyId(e.target.value)}
                    placeholder="Family ID"
                    className="form-input"
                  />
                </div>

                <div className="record-detail__field">
                  <span className="form-label">Date Created</span>
                  <span className="record-detail__readonly">
                    {participant.dateCreated || '—'}
                  </span>
                </div>

                <div className="record-detail__field">
                  {canEditGlobalId ? (
                    <>
                      <label className="form-label" htmlFor="participant-global-id">Global ID</label>
                      <input
                        id="participant-global-id"
                        type="text"
                        value={globalId}
                        onChange={(e) => setGlobalId(e.target.value)}
                        placeholder="Global ID"
                        className="form-input"
                      />
                    </>
                  ) : (
                    <>
                      <span className="form-label">Global ID</span>
                      <span className="record-detail__readonly" data-testid="participant-global-id-readonly">
                        {globalId || '—'}
                      </span>
                    </>
                  )}
                </div>

                <div className="record-detail__field">
                  <label className="form-label" htmlFor="participant-timezone">Timezone</label>
                  <div className="record-detail__input-wrap">
                    <select
                      id="participant-timezone"
                      value={timezone}
                      onChange={(e) => handleTimezoneChange(e.target.value)}
                      className="form-select"
                      disabled={isLoadingTimezones}
                      aria-label="Select timezone"
                    >
                      <option value="" disabled={hasExistingTimezone}>{isLoadingTimezones ? 'Loading timezones...' : 'Select timezone...'}</option>
                      {timezone && !timezoneOptions.includes(timezone) && (
                        <option key={timezone} value={timezone}>{timezone}</option>
                      )}
                      {timezoneOptions.map((tz) => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                    {timezoneError && (
                      <span className="record-detail__inline-error" role="status">
                        {timezoneError}
                      </span>
                    )}
                  </div>
                </div>

                <div className="record-detail__field">
                  <label className="form-label" htmlFor="participant-tags">Tags</label>
                  <ParticipantTagSelect
                    id="participant-tags"
                    placeholder="Select tags"
                    selectedTags={selectedTags}
                    onChange={setSelectedTags}
                    tenantId={tenantId}
                    siteId={siteId}
                  />
                </div>

                <div className="record-detail__field">
                  <label className="form-label" htmlFor="participant-last-contact">
                    Global Date of Last Contact
                  </label>
                  <ParticipantDateTimePicker
                    id="participant-last-contact"
                    value={dateLastContact}
                    onChange={(val) => {
                      setDateLastContact(val);
                      if (val && val.trim()) {
                        setDateLastContactError(null);
                      }
                    }}
                    allowClear={!hasExistingDate}
                    error={dateLastContactError}
                  />
                </div>

                <div className="record-detail__field record-detail__field--checkbox record-detail__checkbox-field">
                  <label htmlFor="futureContactCheckModal" className="record-detail__checkbox-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      id="futureContactCheckModal"
                      checked={contactForFuture}
                      onChange={(e) => setContactForFuture(e.target.checked)}
                      style={{ width: '16px', height: '16px', margin: 0, marginRight: '8px', cursor: 'pointer', accentColor: '#0284c7', flexShrink: 0 }}
                    />
                    <span>Contact For Future Studies?</span>
                  </label>
                </div>
              </div>
            </div>
            </>
          )}

          {/* TAB 2: CONTACT METHODS & PERSONS */}
          {activeTopNav === 'contact' && (
            <ParticipantContactManagement
              participantId={participant.id}
              participantName={participant.name}
              tenantId={tenantId}
              siteId={siteId}
            />
          )}

          {/* TAB 3: DEMOGRAPHICS */}
          {activeTopNav === 'demographics' && (
            <div className="card record-detail__panel">
              <div className="card-header">
                <h3>Demographics</h3>
                <p>Participant demographic information.</p>
              </div>
              <div className="record-detail__overview-grid">
                <div className="record-detail__field">
                  <label className="form-label" htmlFor="participant-dob">Date of Birth</label>
                  <input
                    id="participant-dob"
                    type="date"
                    value={formatDobForDateInput(dob)}
                    onChange={(e) => setDob(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="record-detail__field">
                  <span className="form-label">Current Age</span>
                  <span className="record-detail__readonly">{calculateCurrentAge(dob, participant.age)}</span>
                </div>
                <div className="record-detail__field">
                  <label className="form-label" htmlFor="participant-sex-gender">Sex / gender</label>
                  <select
                    id="participant-sex-gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="form-select"
                    disabled={effectiveDemographicLoading && genderOptions.length === 0}
                  >
                    <option value="">{effectiveDemographicLoading ? 'Loading sex/gender options…' : 'Select sex/gender'}</option>
                    {genderOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div className="record-detail__field">
                  <label className="form-label" htmlFor="participant-ethnicity">Ethnicity</label>
                  <select
                    id="participant-ethnicity"
                    value={ethnicity}
                    onChange={(e) => setEthnicity(e.target.value)}
                    className="form-select"
                    disabled={effectiveDemographicLoading && ethnicityOptions.length === 0}
                  >
                    <option value="">{effectiveDemographicLoading ? 'Loading ethnicity options…' : 'Select ethnicity'}</option>
                    {ethnicityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
                <div className="record-detail__field">
                  <label className="form-label" htmlFor="participant-race">Race</label>
                  <select
                    id="participant-race"
                    value={race}
                    onChange={(e) => setRace(e.target.value)}
                    className="form-select"
                    disabled={effectiveDemographicLoading && raceOptions.length === 0}
                  >
                    <option value="">{effectiveDemographicLoading ? 'Loading race options…' : 'Select race'}</option>
                    {raceOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FAMILY MEMBERS */}
          {activeTopNav === 'family' && (
            <section className="card record-detail__panel">
              <div className="card-header record-detail__family-header">
                <div>
                  <h3>Family Info</h3>
                 
                </div>
              </div>
              <div className="record-detail__panel-content space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <label className="relative block min-w-0 flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      value={familySearchTerm}
                      onChange={(event) => setFamilySearchTerm(event.target.value)}
                      placeholder="Search family members..."
                      aria-label="Search family members"
                      className="w-full min-h-[46px] rounded-md border border-slate-300 bg-white py-2 pl-9 pr-9 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    {familySearchTerm && (
                      <button
                        type="button"
                        onClick={() => setFamilySearchTerm('')}
                        aria-label="Clear family search"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </label>
                  {canImportFamilyContacts && (
                    <button
                      type="button"
                      className="btn btn-primary flex min-h-[46px] shrink-0 items-center gap-1.5 px-4 text-sm"
                      onClick={() => { void handleOpenFamilyContactsImport(); }}
                    >
                      <Plus size={14} /> Import Family Contacts
                    </button>
                  )}
                </div>
                <DataGrid<FamilyGridRow>
                  rowData={familyGridRows}
                  columnDefs={familyGridColumns}
                  quickFilterText={familySearchTerm}
                  defaultColDef={{ sortable: false, filter: false, floatingFilter: false, resizable: false }}
                  getRowId={(params) => params.data.id}
                  rowHeight={44}
                  headerHeight={42}
                  pagination
                  paginationPageSize={10}
                  paginationPageSizeSelector={[5, 10, 20, 50]}
                  onFilterChanged={(event) => event.api.paginationGoToFirstPage()}
                  tooltipShowDelay={500}
                  domLayout="autoHeight"
                  suppressMovableColumns
                  suppressCellFocus
                  wrapperClassName="record-detail__family-grid"
                />
              </div>
            </section>
          )}

          {/* TAB 5: CUSTOM VARIABLES */}
          {activeTopNav === 'variables' && (
            <section className="card record-detail__panel">
              <div className="card-header record-detail__variables-header">
                <div><h3>Custom Variables</h3><p>Global participant variables from study configuration.</p></div>
                <input
                  type="search"
                  value={globalVariableSearch}
                  onChange={(event) => setGlobalVariableSearch(event.target.value)}
                  placeholder="Search by name..."
                  aria-label="Search global variables by name"
                  className="form-input record-detail__variables-search"
                />
              </div>
              <div className="record-detail__panel-content space-y-3">
                <div className="record-detail__global-variable-grid">
                  {globalVariables
                    .filter((variable) => variable.name.toLowerCase().includes(globalVariableSearch.trim().toLowerCase()))
                    .map((variable) => {
                      const canonicalId = variable.id.replace(/^custom_/, '');
                      const assigned = variables.find((item) =>
                        item.id === canonicalId || item.id === variable.id || item.name.toLowerCase() === variable.name.toLowerCase()
                      );
                      return (
                        <GlobalVariableField
                          key={variable.id}
                          variable={variable}
                          value={assigned?.value || ''}
                          onChange={(value) => handleGlobalVariableChange(variable, value)}
                        />
                      );
                    })}
                  {globalVariables.length === 0 && <p className="record-detail__study-empty">No global variables are configured for this registry.</p>}
                </div>
              </div>
            </section>
          )}

          {/* LOWER SECTION ON OVERVIEW: COMMENTS & SUB-TABS */}
          {activeTopNav === 'details' && (
            <>
            <div className="card record-detail__panel">
              <Tabs
                activeTab={activeTab}
                onChange={(tabId) => setActiveTab(tabId as typeof activeTab)}
                tabs={[
                  { id: 'comments', label: 'Comments', icon: <MessageSquare size={16} /> },
                  { id: 'email', label: 'Email', icon: <Mail size={16} /> },
                  { id: 'text', label: 'Text', icon: <Phone size={16} /> },
                  { id: 'contact', label: 'Contact', icon: <User size={16} /> },
                  { id: 'consent', label: 'Consent', icon: <ShieldCheck size={16} /> },
                  { id: 'forms', label: 'Forms', icon: <FileText size={16} /> },
                ]}
              />

              <div className="record-detail__panel-content p-0">
                {activeTab === 'comments' && (
                  <ParticipantComments
                    participantId={participant.id}
                    participantName={participant.name}
                    studyId={undefined}
                    tenantId={tenantId}
                    siteId={siteId}
                    currentUser={effectiveUser}
                  />
                )}

                {activeTab === 'email' && (
                  <ParticipantEmailSection
                    participantId={participant.id}
                    participantName={participant.name}
                    tenantId={tenantId}
                    siteId={siteId}
                  />
                )}

                {activeTab === 'text' && (
                  <ParticipantSmsSection
                    participantId={participant.id}
                    participantName={participant.name}
                    tenantId={tenantId}
                    siteId={siteId}
                    currentUser={effectiveUser}
                  />
                )}

                {activeTab === 'contact' && (
                  <ParticipantContactLogs
                    participantId={participant.id}
                    participantName={participant.name}
                    tenantId={tenantId}
                    siteId={siteId}
                    onParticipantUpdated={onParticipantUpdated}
                  />
                )}

                {activeTab === 'consent' && (
                  <ParticipantConsentSection
                    participantId={participant.id}
                    participantName={participant.name}
                    studyId={undefined}
                    tenantId={tenantId}
                    siteId={siteId}
                  />
                )}

                {activeTab === 'forms' && (
                  <ParticipantFormsSection
                    participantId={participant.id}
                    participantName={participant.name}
                    studyId={undefined}
                    tenantId={tenantId}
                    siteId={siteId}
                  />
                )}
              </div>
            </div>

            {/* Studies Info Table placed below Comments and Sub-tabs */}
            <ParticipantStudiesInfo participant={participant} tenantId={tenantId} siteId={siteId} />
            </>
          )}
        </div>
      </div>
    </Modal>
    <Modal
      isOpen={isImportFamilyContactsOpen}
      onClose={() => {
        if (isImportingFamilyContacts) return;
        setIsImportFamilyContactsOpen(false);
        setSelectedFamilyMemberIds([]);
      }}
      title="Select Family Contacts For Import"
      className="family-contact-import-modal"
      footer={selectedFamilyMemberIds.length > 0 && (
          <button
            type="button"
            className="btn btn-primary"
            disabled={isImportingFamilyContacts}
            onClick={() => { void handleImportFamilyContacts(); }}
          >
            {isImportingFamilyContacts
              ? 'Importing...'
              : `Import ${selectedFamilyMemberIds.length} Contact${selectedFamilyMemberIds.length === 1 ? '' : 's'}`}
          </button>
      )}
    >
      <div className="family-contact-import__list">
        {familyImportMembers.map((member) => (
          <label key={member.id} className="family-contact-import__member">
            <input
              type="checkbox"
              checked={selectedFamilyMemberIds.includes(member.id)}
              disabled={isImportingFamilyContacts}
              className="family-contact-import__checkbox"
              onChange={(event) => {
                setSelectedFamilyMemberIds((selected) => (
                  event.target.checked
                    ? [...selected, member.id]
                    : selected.filter((id) => id !== member.id)
                ));
              }}
            />
            <span>{member.name || member.id}</span>
          </label>
        ))}
      </div>
    </Modal>
    </>
  );
};

export default ParticipantDetailModal;
