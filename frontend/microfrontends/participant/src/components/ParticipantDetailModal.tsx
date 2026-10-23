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
import { Modal } from '../../../../shared/design-system/components/Modal';
import { Tabs } from '../../../../shared/design-system/components/Tabs';
import { ParticipantRecord, ParticipantVariable } from '../types/participant';

export interface ParticipantDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: ParticipantRecord | null;
  onSave: (updatedParticipant: ParticipantRecord) => void;
  onSelectParticipantById?: (participantId: string) => void;
}

interface CommentRecord {
  id: string;
  author: string;
  date: string;
  text: string;
  pinned: boolean;
}

export const ParticipantDetailModal: React.FC<ParticipantDetailModalProps> = ({
  isOpen,
  onClose,
  participant,
  onSave,
  onSelectParticipantById,
}) => {
  const [activeTopNav, setActiveTopNav] = useState<'details' | 'contact' | 'demographics' | 'family' | 'variables'>('details');
  const [activeTab, setActiveTab] = useState<'comments' | 'email' | 'text' | 'contact' | 'consent' | 'forms'>('comments');

  // Overview / General
  const [familyId, setFamilyId] = useState(participant?.familyId || '');
  const [globalId, setGlobalId] = useState(participant?.globalId || '');
  const [timezone, setTimezone] = useState(participant?.timezone || 'America/New_York (EDT)');
  const [tagsInput, setTagsInput] = useState(Array.isArray(participant?.tags) ? participant.tags.join(', ') : '');
  const [contactForFuture, setContactForFuture] = useState(participant?.contactForFutureStudies !== false);
  const [dateLastContact, setDateLastContact] = useState(participant?.globalDateOfLastContact || participant?.lastContact || '');

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

  // Comments
  const [commentText, setCommentText] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [comments, setComments] = useState<CommentRecord[]>([
    { id: '1', author: 'Dr. Sarah Connor', date: '21/03/2025, 02:15 PM', text: 'Initial screening completed. Eligible for Autism Study.', pinned: true },
    { id: '2', author: 'Coordinator Mark', date: '20/03/2025, 11:45 AM', text: 'Updated contact preferences to Primary Email.', pinned: false }
  ]);

  useEffect(() => {
    if (participant) {
      setFamilyId(participant.familyId || '');
      setGlobalId(participant.globalId || '');
      setTimezone(participant.timezone || 'America/New_York (EDT)');
      setTagsInput(Array.isArray(participant.tags) ? participant.tags.join(', ') : '');
      setContactForFuture(participant.contactForFutureStudies !== false);
      setDateLastContact(participant.globalDateOfLastContact || participant.lastContact || '');
      
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
      setIsAddingVariable(false);
    }
  }, [participant]);

  if (!isOpen || !participant) return null;

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const newC: CommentRecord = {
      id: String(Date.now()),
      author: 'Current User (Coordinator)',
      date: new Date().toLocaleDateString('en-GB') + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      text: commentText.trim(),
      pinned: isPinned
    };
    setComments([newC, ...comments]);
    setCommentText('');
    setIsPinned(false);
  };

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

  const handleSaveParticipant = () => {
    const updatedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const updatedParticipant: ParticipantRecord = {
      ...participant,
      familyId,
      globalId,
      timezone,
      tags: updatedTags.length > 0 ? updatedTags : ['New Participant'],
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
    onClose();
  };

  const familyMembers = participant.family?.members || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Participant Details"
      size="wide"
      footer={(
        <>
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
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
            { id: 'variables', label: `Variables (${variables.length})`, icon: <FileText size={16} /> },
          ]}
        />

        <div className="record-detail__sections">
          {/* TAB 1: OVERVIEW */}
          {activeTopNav === 'details' && (
            <div className="card record-detail__panel">
              <div className="card-header"><h3>Participant overview</h3></div>
              <div className="record-detail__overview-grid">
                <div className="record-detail__field">
                  <label className="form-label" htmlFor="participant-family-id">Family ID</label>
                  <input
                    id="participant-family-id"
                    type="text"
                    value={familyId}
                    onChange={(e) => setFamilyId(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="record-detail__field">
                  <span className="form-label">Date Created</span>
                  <span className="record-detail__readonly">
                    {participant.dateCreated || 'Recent'}
                  </span>
                </div>

                <div className="record-detail__field">
                  <label className="form-label" htmlFor="participant-global-id">Global ID</label>
                  <input
                    id="participant-global-id"
                    type="text"
                    value={globalId}
                    onChange={(e) => setGlobalId(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="record-detail__field">
                  <label className="form-label" htmlFor="participant-timezone">Timezone</label>
                  <select
                    id="participant-timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="form-select"
                  >
                    <option value="America/New_York (EDT)">America/New_York (EDT)</option>
                    <option value="America/Chicago (CDT)">America/Chicago (CDT)</option>
                    <option value="America/Denver (MDT)">America/Denver (MDT)</option>
                    <option value="America/Los_Angeles (PDT)">America/Los_Angeles (PDT)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>

                <div className="record-detail__field record-detail__field--wide">
                  <label className="form-label" htmlFor="participant-tags">Tags</label>
                  <input
                    id="participant-tags"
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Enter tags separated by commas..."
                    className="form-input"
                  />
                </div>

                <div className="record-detail__field--wide record-detail__checkbox-field">
                  <input
                    type="checkbox"
                    id="futureContactCheckModal"
                    checked={contactForFuture}
                    onChange={(e) => setContactForFuture(e.target.checked)}
                  />
                  <label htmlFor="futureContactCheckModal" className="form-label">
                    Contact For Future Studies?
                  </label>
                </div>

                <div className="record-detail__field record-detail__field--wide">
                  <label className="form-label" htmlFor="participant-last-contact">Global Date of Last Contact</label>
                  <div className="record-detail__date-field">
                    <input
                      id="participant-last-contact"
                      type="text"
                      value={dateLastContact}
                      onChange={(e) => setDateLastContact(e.target.value)}
                      className="form-input"
                    />
                    <div className="record-detail__date-icons" aria-hidden="true">
                      <Calendar size={16} />
                      <Clock size={16} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTACT METHODS */}
          {activeTopNav === 'contact' && (
            <div className="card record-detail__panel">
              <div className="card-header">
                <h3>Contact methods</h3>
                <p>How this participant prefers to be reached.</p>
              </div>
              <div className="record-detail__panel-content record-detail__overview-grid">
                <div className="record-detail__field">
                  <label className="form-label" htmlFor="participant-primary-email">Primary email</label>
                  <input
                    id="participant-primary-email"
                    type="email"
                    value={primaryEmail}
                    onChange={(e) => setPrimaryEmail(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="record-detail__field">
                  <label className="form-label" htmlFor="participant-secondary-email">Secondary email</label>
                  <input
                    id="participant-secondary-email"
                    type="email"
                    value={secondaryEmail}
                    onChange={(e) => setSecondaryEmail(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="record-detail__field">
                  <label className="form-label" htmlFor="participant-phone-number">Phone number</label>
                  <input
                    id="participant-phone-number"
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="record-detail__field">
                  <label className="form-label" htmlFor="participant-preferred-method">Preferred method</label>
                  <select
                    id="participant-preferred-method"
                    value={preferredMethod}
                    onChange={(e) => setPreferredMethod(e.target.value)}
                    className="form-select"
                  >
                    <option value="Email">Email</option>
                    <option value="Phone">Phone</option>
                    <option value="Mail">Mail</option>
                    <option value="SMS">SMS / Text</option>
                  </select>
                </div>
                <div className="record-detail__field record-detail__field--wide">
                  <label className="form-label" htmlFor="participant-address">Address</label>
                  <input
                    id="participant-address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            </div>
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
                  <input
                    id="participant-ethnicity"
                    type="text"
                    value={ethnicity}
                    onChange={(e) => setEthnicity(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="record-detail__field">
                  <label className="form-label" htmlFor="participant-race">Race</label>
                  <input
                    id="participant-race"
                    type="text"
                    value={race}
                    onChange={(e) => setRace(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="record-detail__field">
                  <label className="form-label" htmlFor="participant-language">Primary Language</label>
                  <input
                    id="participant-language"
                    type="text"
                    value={primaryLanguage}
                    onChange={(e) => setPrimaryLanguage(e.target.value)}
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
              <div className="card-header flex items-center justify-between">
                <div>
                  <h3>Participant variables</h3>
                  <p>Study-specific variables associated with this record.</p>
                </div>
                {!isAddingVariable && (
                  <button
                    type="button"
                    onClick={() => setIsAddingVariable(true)}
                    className="btn btn-sm btn-primary flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Variable
                  </button>
                )}
              </div>
              <div className="record-detail__panel-content space-y-3">
                {isAddingVariable && (
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg space-y-2 mb-3">
                    <strong className="text-xs text-blue-900 block">Add New Variable</strong>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={newVarName}
                        onChange={(e) => setNewVarName(e.target.value)}
                        placeholder="Variable Name"
                        className="form-input text-xs"
                      />
                      <select
                        value={newVarType}
                        onChange={(e) => setNewVarType(e.target.value)}
                        className="form-select text-xs"
                      >
                        <option value="Text">Text</option>
                        <option value="Number">Number</option>
                        <option value="Date">Date</option>
                        <option value="Boolean">Boolean</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      value={newVarValue}
                      onChange={(e) => setNewVarValue(e.target.value)}
                      placeholder="Variable Value"
                      className="form-input text-xs"
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingVariable(false)}
                        className="btn btn-sm btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddVariable}
                        disabled={!newVarName.trim()}
                        className="btn btn-sm btn-primary"
                      >
                        Save Variable
                      </button>
                    </div>
                  </div>
                )}

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {variables.length > 0 ? (
                    <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                      {variables.map((variable, idx) => (
                        <div key={variable.id || idx} className="p-3 flex items-center justify-between hover:bg-gray-50">
                          <div>
                            <strong className="text-sm text-gray-800 block">{variable.name}</strong>
                            <div className="text-xs text-gray-600">
                              Value: <strong>{variable.value}</strong> &bull; Type: {variable.type || 'Text'}
                              {variable.lastUpdated && ` &bull; Updated: ${variable.lastUpdated}`}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveVariable(idx)}
                            className="btn btn-ghost btn-sm text-red-500 hover:bg-red-50 p-1.5"
                            title="Remove variable"
                            aria-label={`Remove variable ${variable.name}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-5 text-center text-xs text-gray-500 bg-gray-50">
                      No custom variables attached to this participant. Click &ldquo;Add Variable&rdquo; to define study parameters.
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* LOWER SECTION ON OVERVIEW: COMMENTS & SUB-TABS */}
          {activeTopNav === 'details' && (
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

              <div className="record-detail__panel-content">
                {activeTab === 'comments' && (
                  <form onSubmit={handleAddComment} className="record-detail__comment-form">
                    <textarea
                      rows={3}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add comment..."
                      aria-label="Add comment"
                      className="form-textarea"
                    />
                    
                    <div className="record-detail__comment-options">
                      <div className="record-detail__checkbox-field">
                        <span className="form-label">Mark comment as</span>
                        <label className="record-detail__checkbox-field">
                          <input
                            type="checkbox"
                            checked={isPinned}
                            onChange={(e) => setIsPinned(e.target.checked)}
                          />
                          <span>Pin Comment</span>
                        </label>
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={!commentText.trim()}
                      >
                        <Plus size={16} /> Add Comment
                      </button>
                    </div>

                    <div className="record-detail__comments-list">
                      {comments.map((comment) => (
                        <div key={comment.id} className={`record-detail__comment-item ${comment.pinned ? 'record-detail__comment-item--pinned' : ''}`}>
                          <div className="record-detail__comment-header">
                            <div>
                              <strong className="record-detail__comment-author">{comment.author}</strong>
                              <span className="record-detail__comment-date">{comment.date}</span>
                            </div>
                            {comment.pinned && (
                              <span className="badge badge-warning">Pinned</span>
                            )}
                          </div>
                          <p className="record-detail__comment-body">{comment.text}</p>
                        </div>
                      ))}
                    </div>
                  </form>
                )}

                {activeTab === 'email' && (
                  <div className="record-detail__tab-placeholder">
                    <Mail size={32} />
                    <h4>Direct Email Channel</h4>
                    <p>Send secure updates directly to {primaryEmail || participant.name}.</p>
                  </div>
                )}

                {activeTab === 'text' && (
                  <div className="record-detail__tab-placeholder">
                    <Phone size={32} />
                    <h4>SMS Gateway</h4>
                    <p>Twilio SMS gateway integration for participant mobile {phone || 'N/A'}.</p>
                  </div>
                )}

                {activeTab === 'contact' && (
                  <div className="record-detail__tab-placeholder">
                    <User size={32} />
                    <h4>Contact Logs</h4>
                    <p>Outreach logs and phone screen history.</p>
                  </div>
                )}

                {activeTab === 'consent' && (
                  <div className="record-detail__tab-placeholder">
                    <ShieldCheck size={32} />
                    <h4>Consent Records</h4>
                    <p>E-Consent status: Verified by IRB.</p>
                  </div>
                )}

                {activeTab === 'forms' && (
                  <div className="record-detail__tab-placeholder">
                    <FileText size={32} />
                    <h4>Case Report Forms</h4>
                    <p>Standard intake CRF forms attached to participant.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ParticipantDetailModal;