// frontend/microfrontends/participant/src/components/ParticipantDetailModal.tsx - Detailed Participant Drawer & Editor
import React, { useState, useEffect } from 'react';
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
  ExternalLink 
} from 'lucide-react';
import { AuthUser } from '../../../../shared/contracts';
import { getStoredAuthUser } from '../../../../shared/api-client';
import { requestConfirmation } from '../../../../shared/confirmation';
import { Modal } from '../../../../shared/design-system/components/Modal';
import { Tabs } from '../../../../shared/design-system/components/Tabs';
import { GlobalVariableDefinition, isContactForFutureStudies, ParticipantRecord, ParticipantVariable } from '../types/participant';
import { ParticipantContactLogs } from './ParticipantContactLogs';
import { ParticipantContactManagement } from './ParticipantContactManagement';
import { ParticipantComments } from './ParticipantComments';
import { ParticipantEmailSection } from './ParticipantEmailSection';
import { ParticipantSmsSection } from './ParticipantSmsSection';
import { ParticipantConsentSection } from './ParticipantConsentSection';
import { ParticipantFormsSection } from './ParticipantFormsSection';
import { ParticipantTagSelect } from './ParticipantTagSelect';
import { isValidDateTimeValue, ParticipantDateTimePicker } from './ParticipantDateTimePicker';
import { participantApi, ConsentItem, DemographicOptions } from '../../../../shared/api/participantApi';

const getParticipantLastContactDate = (participant?: ParticipantRecord | null): string => {
  const values = [participant?.globalDateOfLastContact, participant?.lastContact];
  return values.find((value) => isValidDateTimeValue(value)) || '';
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

  return (
    <section className="card record-detail__panel record-detail__study-info">
      <div className="card-header"><h3>Studies Info</h3></div>
      {error && <p className="record-detail__inline-error" role="status">{error}</p>}
      <div className="record-detail__study-table-wrap">
        <table className="record-detail__study-table">
          <thead><tr><th>Name</th><th>ID</th><th>Status</th><th>Date Consented</th></tr></thead>
          <tbody>
            {participant.studies?.map((study, index) => {
              const studyId = study.studyId || study.id || '';
              const consent = consents.find((item) => item.studyId === studyId);
              return (
                <tr key={studyId || `${study.name}-${index}`}>
                  <td>{study.name}</td>
                  <td>{study.participantStudyId || study.studyCode || '—'}</td>
                  <td>{consent?.status || study.status || 'Not Consented'}</td>
                  <td>{consent?.consentedAt ? new Date(consent.consentedAt).toLocaleDateString() : 'Not Consented'}</td>
                </tr>
              );
            })}
            {!isLoading && (!participant.studies || participant.studies.length === 0) && (
              <tr><td colSpan={4} className="record-detail__study-empty">No studies are linked to this participant.</td></tr>
            )}
            {isLoading && (!participant.studies || participant.studies.length === 0) && (
              <tr><td colSpan={4} className="record-detail__study-empty">Loading study information...</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export interface ParticipantDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: ParticipantRecord | null;
  onSave: (updatedParticipant: ParticipantRecord) => void;
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
  const [preferredMethod, setPreferredMethod] = useState(participant?.contactMethods?.preferredMethod || 'Email');

  // Demographics
  const [dob, setDob] = useState(participant?.demographics?.dob || '');
  const [gender, setGender] = useState(participant?.gender || participant?.demographics?.gender || 'Unspecified');
  const [ethnicity, setEthnicity] = useState(participant?.demographics?.ethnicity || '');
  const [race, setRace] = useState(participant?.demographics?.race || '');
  const [primaryLanguage, setPrimaryLanguage] = useState(participant?.demographics?.primaryLanguage || 'English');

  // Family
  const [familyRole, setFamilyRole] = useState(participant?.family?.familyRole || 'Proband');

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
      setPreferredMethod(participant.contactMethods?.preferredMethod || 'Email');

      setDob(participant.demographics?.dob || '');
      setGender(participant.gender || participant.demographics?.gender || 'Unspecified');
      setEthnicity(participant.demographics?.ethnicity || '');
      setRace(participant.demographics?.race || '');
      setPrimaryLanguage(participant.demographics?.primaryLanguage || 'English');

      setFamilyRole(participant.family?.familyRole || 'Proband');
      setVariables(Array.isArray(participant.variables) ? [...participant.variables] : []);
    }
  }, [participant]);

  // Always reset to the Overview tab whenever the modal opens or switches participant
  useEffect(() => {
    if (isOpen) {
      setActiveTopNav('details');
      setActiveTab('comments');
      setGlobalVariableSearch('');
      setIsAddingVariable(false);
    } else {
      setActiveTopNav('details');
      setActiveTab('comments');
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

  const handleSaveParticipant = () => {
    if (hasExistingTimezone && (!timezone || !timezone.trim())) {
      setTimezoneError('Timezone cannot be removed once set. Please select a valid timezone.');
      return;
    }
    if (hasExistingDate && (!dateLastContact || !dateLastContact.trim())) {
      setDateLastContactError('Global Date of Last Contact cannot be removed once set.');
      return;
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
        primaryLanguage,
      },
      family: {
        ...participant.family,
        familyRole,
      },
      variables,
    };

    onSave(updatedParticipant);
  };

  const ethnicityOptions = [...demographicOptions.ethnicity];
  if (ethnicity && !ethnicityOptions.includes(ethnicity)) ethnicityOptions.unshift(ethnicity);
  const raceOptions = [...demographicOptions.race];
  if (race && !raceOptions.includes(race)) raceOptions.unshift(race);

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
    if (preferredMethod !== (participant.contactMethods?.preferredMethod || 'Email')) return true;

    if (dob !== (participant.demographics?.dob || '')) return true;
    if (gender !== (participant.gender || participant.demographics?.gender || 'Unspecified')) return true;
    if (ethnicity !== (participant.demographics?.ethnicity || '')) return true;
    if (race !== (participant.demographics?.race || '')) return true;
    if (primaryLanguage !== (participant.demographics?.primaryLanguage || 'English')) return true;

    if (familyRole !== (participant.family?.familyRole || 'Proband')) return true;

    const origVars = Array.isArray(participant.variables) ? participant.variables : [];
    if (origVars.length !== variables.length) return true;
    for (let i = 0; i < variables.length; i++) {
      if (variables[i].id !== origVars[i]?.id || variables[i].value !== origVars[i]?.value) return true;
    }

    return false;
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

  const familyMembers = participant.family?.members || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCloseModal}
      title="Participant Details"
      size="wide"
      footer={(
        <>
          <button type="button" onClick={handleCloseModal} className="btn btn-secondary">Cancel</button>
          <button type="button" onClick={handleSaveParticipant} className="btn btn-primary">
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
            { id: 'family', label: `Family (${familyMembers.length || 1})`, icon: <Users size={16} /> },
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
                    onChange={(e) => setFirstName(e.target.value)}
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
                    onChange={(e) => setMiddleName(e.target.value)}
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
                    onChange={(e) => setLastName(e.target.value)}
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
                    type="text"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    placeholder="MM/DD/YYYY"
                    className="form-input"
                  />
                </div>
                <div className="record-detail__field">
                  <span className="form-label">Current Age</span>
                  <span className="record-detail__readonly">{participant.age || 'N/A'}</span>
                </div>
                <div className="record-detail__field">
                  <label className="form-label" htmlFor="participant-sex-gender">Sex / gender</label>
                  <select
                    id="participant-sex-gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="form-select"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Unspecified">Unspecified</option>
                  </select>
                </div>
                <div className="record-detail__field">
                  <label className="form-label" htmlFor="participant-ethnicity">Ethnicity</label>
                  <select
                    id="participant-ethnicity"
                    value={ethnicity}
                    onChange={(e) => setEthnicity(e.target.value)}
                    className="form-select"
                    disabled={demographicOptionsLoading && ethnicityOptions.length === 0}
                  >
                    <option value="">{demographicOptionsLoading ? 'Loading ethnicity options…' : 'Select ethnicity'}</option>
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
                    disabled={demographicOptionsLoading && raceOptions.length === 0}
                  >
                    <option value="">{demographicOptionsLoading ? 'Loading race options…' : 'Select race'}</option>
                    {raceOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
                <div className="record-detail__field">
                  <label className="form-label" htmlFor="participant-language">Primary Language</label>
                  <input
                    id="participant-language"
                    type="text"
                    value={primaryLanguage}
                    onChange={(e) => setPrimaryLanguage(e.target.value)}
                    placeholder="Primary Language"
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FAMILY MEMBERS */}
          {activeTopNav === 'family' && (
            <section className="card record-detail__panel">
              <div className="card-header">
                <h3>Family members</h3>
                <p>People linked to this participant under Family ID: {familyId || 'Not assigned'}</p>
              </div>
              <div className="record-detail__panel-content space-y-3">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="record-detail__field">
                    <label className="form-label" htmlFor="participant-family-role">Family Role</label>
                    <select
                      id="participant-family-role"
                      value={familyRole}
                      onChange={(e) => setFamilyRole(e.target.value)}
                      className="form-select"
                    >
                      <option value="Proband">Proband (Primary)</option>
                      <option value="Mother">Mother</option>
                      <option value="Father">Father</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Child">Child</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="record-detail__field">
                    <span className="form-label">Linked Family ID</span>
                    <span className="record-detail__readonly">{familyId || 'None'}</span>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="divide-y divide-gray-100">
                    {/* Current Participant */}
                    <div className="p-3 bg-blue-50/60 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="record-detail__avatar"><Users size={16} /></span>
                        <div>
                          <strong className="text-sm text-blue-900">{participant.name}</strong>
                          <div className="text-xs text-gray-500">
                            {familyRole} &bull; {gender} &bull; Age: {participant.age || 'N/A'}
                          </div>
                        </div>
                      </div>
                      <span className="badge badge-info">Current Record</span>
                    </div>

                    {/* Other Linked Family Members */}
                    {familyMembers
                      .filter((m) => m.id !== participant.id)
                      .map((member) => (
                        <div key={member.id} className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-2.5">
                            <span className="record-detail__avatar"><User size={16} /></span>
                            <div>
                              <strong className="text-sm text-gray-800">{member.name}</strong>
                              <div className="text-xs text-gray-500">
                                {member.sex || 'Unknown'} &bull; Age: {member.age || 'N/A'}
                                {member.studies && member.studies.length > 0 && ` &bull; Studies: ${member.studies.join(', ')}`}
                              </div>
                            </div>
                          </div>
                          {onSelectParticipantById && (
                            <button
                              type="button"
                              onClick={() => onSelectParticipantById(member.id)}
                              className="btn btn-sm btn-ghost text-blue-600 hover:bg-blue-50 flex items-center gap-1"
                              title="Switch to this participant"
                            >
                              <ExternalLink size={14} /> View
                            </button>
                          )}
                        </div>
                      ))}
                  </div>

                  {familyMembers.length <= 1 && (
                    <div className="p-4 text-center text-xs text-gray-500 bg-gray-50">
                      No additional family members found under family ID &ldquo;{familyId || 'None'}&rdquo;.
                    </div>
                  )}
                </div>
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
  );
};

export default ParticipantDetailModal;
