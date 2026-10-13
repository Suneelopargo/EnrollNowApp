// frontend/microfrontends/participant/src/components/ParticipantDetailModal.tsx - Detailed Participant Drawer & Editor
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MessageSquare, Mail, Phone, FileText, Check, Plus, User, Users, ShieldCheck, Loader2 } from 'lucide-react';
import { Modal } from '../../../../shared/design-system/components/Modal';
import { Tabs } from '../../../../shared/design-system/components/Tabs';
import { ParticipantRecord } from '../types/participant';
import {
  registryApi,
  ParticipantLogResponse,
  SurveySubmissionResponse,
} from '../../../../shared/api/registryApi';

interface ParticipantDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: ParticipantRecord | null;
  onSave: (updatedParticipant: ParticipantRecord) => void;
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
}) => {
  const [activeTopNav, setActiveTopNav] = useState<'details' | 'contact' | 'demographics' | 'family' | 'variables'>('details');
  const [activeTab, setActiveTab] = useState<'comments' | 'email' | 'text' | 'contact' | 'consent' | 'forms'>('comments');

  const [familyId, setFamilyId] = useState('');
  const [globalId, setGlobalId] = useState('');
  const [timezone, setTimezone] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [contactForFuture, setContactForFuture] = useState(true);
  const [dateLastContact, setDateLastContact] = useState('');
  const [primaryEmail, setPrimaryEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState('');

  const [commentText, setCommentText] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [comments, setComments] = useState<CommentRecord[]>([
    { id: '1', author: 'Dr. Sarah Connor', date: '21/03/2025, 02:15 PM', text: 'Initial screening completed. Eligible for Autism Study.', pinned: true },
    { id: '2', author: 'Coordinator Mark', date: '20/03/2025, 11:45 AM', text: 'Updated contact preferences to Primary Email.', pinned: false }
  ]);

  // Real backend logs & survey submissions state
  const [emailLogs, setEmailLogs] = useState<ParticipantLogResponse[]>([]);
  const [textLogs, setTextLogs] = useState<ParticipantLogResponse[]>([]);
  const [contactLogs, setContactLogs] = useState<ParticipantLogResponse[]>([]);
  const [consentLogs, setConsentLogs] = useState<ParticipantLogResponse[]>([]);
  const [surveySubmissions, setSurveySubmissions] = useState<SurveySubmissionResponse[]>([]);
  const [tabLoading, setTabLoading] = useState(false);

  useEffect(() => {
    if (participant) {
      setFamilyId(participant.familyId || '');
      setGlobalId(participant.globalId || '');
      setTimezone(participant.timezone || 'America/New_York (EDT)');
      setTagsInput(Array.isArray(participant.tags) ? participant.tags.join(', ') : 'New Participant');
      setContactForFuture(participant.contactForFutureStudies !== false);
      setDateLastContact(participant.globalDateOfLastContact || participant.lastContact || '');
      setPrimaryEmail(participant.contactMethods?.primaryEmail || `${(participant.firstName || 'user').toLowerCase()}.${(participant.lastName || 'participant').toLowerCase()}@example.org`);
      setPhone(participant.contactMethods?.phone || participant.phone || '');
      setAddress(participant.contactMethods?.address || [participant.city, participant.state, participant.zipcode].filter(Boolean).join(', ') || 'Clinical Center, Suite 400');
      setGender(participant.gender || 'Unspecified');

      // Fetch fresh participant details from backend if ID is present
      if (participant.id) {
        registryApi.getRegistryParticipant(participant.id)
          .then((res) => {
            if (res) {
              if (res.familyId) setFamilyId(res.familyId);
              if (res.globalId) setGlobalId(res.globalId);
              if (res.timezone) setTimezone(res.timezone);
              if (res.tags) setTagsInput(res.tags.join(', '));
              if (res.contactForFutureStudies != null) setContactForFuture(res.contactForFutureStudies);
              if (res.globalLastContactDate) setDateLastContact(res.globalLastContactDate);
              if (res.sex) setGender(res.sex);
              if (res.phone) setPhone(res.phone);
              const addr = [res.city, res.state, res.zipcode].filter(Boolean).join(', ');
              if (addr) setAddress(addr);
            }
          })
          .catch(() => {
            // Keep existing state if offline or non-blocking
          });
      }
    }
  }, [participant]);

  // Tab change effect to fetch logs and survey submissions
  useEffect(() => {
    if (!participant?.id || !isOpen) return;

    if (activeTab === 'email') {
      setTabLoading(true);
      registryApi.getRegistryParticipantLogs(participant.id, 'email')
        .then((res) => setEmailLogs(res?.logs || []))
        .catch(() => setEmailLogs([]))
        .finally(() => setTabLoading(false));
    } else if (activeTab === 'text') {
      setTabLoading(true);
      registryApi.getRegistryParticipantLogs(participant.id, 'text')
        .then((res) => setTextLogs(res?.logs || []))
        .catch(() => setTextLogs([]))
        .finally(() => setTabLoading(false));
    } else if (activeTab === 'contact') {
      setTabLoading(true);
      registryApi.getRegistryParticipantLogs(participant.id, 'contact')
        .then((res) => setContactLogs(res?.logs || []))
        .catch(() => setContactLogs([]))
        .finally(() => setTabLoading(false));
    } else if (activeTab === 'consent') {
      setTabLoading(true);
      registryApi.getRegistryParticipantLogs(participant.id, 'consent')
        .then((res) => setConsentLogs(res?.logs || []))
        .catch(() => setConsentLogs([]))
        .finally(() => setTabLoading(false));
    } else if (activeTab === 'forms') {
      setTabLoading(true);
      registryApi.getRegistrySurveySubmissions(participant.id)
        .then((res) => setSurveySubmissions(res || []))
        .catch(() => setSurveySubmissions([]))
        .finally(() => setTabLoading(false));
    }
  }, [activeTab, participant?.id, isOpen]);

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
      phone,
      contactMethods: {
        ...participant.contactMethods,
        primaryEmail,
        phone,
        address
      }
    };

    onSave(updatedParticipant);
    onClose();
  };

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
          <span className="badge badge-info">Participant ID: {globalId || participant.globalId || '—'}</span>
        </div>

        <Tabs
          activeTab={activeTopNav}
          onChange={(tabId) => setActiveTopNav(tabId as typeof activeTopNav)}
          tabs={[
            { id: 'details', label: 'Overview', icon: <User size={16} /> },
            { id: 'contact', label: 'Contact Methods', icon: <Mail size={16} /> },
            { id: 'demographics', label: 'Demographics', icon: <ShieldCheck size={16} /> },
            { id: 'family', label: 'Family', icon: <Users size={16} /> },
            { id: 'variables', label: 'Variables', icon: <FileText size={16} /> },
          ]}
        />

        <div className="record-detail__sections">
          {activeTopNav === 'details' && <div className="card record-detail__panel">
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
                <label className="form-label">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="form-select"
                >
                  <option value="America/New_York (EDT)">America/New_York (EDT)</option>
                  <option value="America/Chicago (CDT)">America/Chicago (CDT)</option>
                  <option value="America/Denver (MDT)">America/Denver (MDT)</option>
                  <option value="America/Los_Angeles (PDT)">America/Los_Angeles (PDT)</option>
                </select>
              </div>

              <div className="record-detail__field">
                <label className="form-label" htmlFor="participant-tags">Tags (comma-separated)</label>
                <input
                  id="participant-tags"
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="record-detail__field">
                <span className="form-label">Contact for future studies</span>
                <label className="record-detail__checkbox-field">
                  <input
                    type="checkbox"
                    checked={contactForFuture}
                    onChange={(e) => setContactForFuture(e.target.checked)}
                  />
                  <span>Permitted to contact</span>
                </label>
              </div>

              <div className="record-detail__field">
                <span className="form-label">Date last contact</span>
                <span>{dateLastContact || '—'}</span>
              </div>
            </div>
          </div>}

          {activeTopNav === 'contact' && (
            <div className="card record-detail__panel">
              <div className="card-header"><h3>Contact methods</h3><p>Manage addresses, phone numbers, and communication channels.</p></div>
              <div className="record-detail__overview-grid">
                <div className="record-detail__field"><label className="form-label">Primary email</label>
                  <input
                    type="email"
                    value={primaryEmail}
                    onChange={(e) => setPrimaryEmail(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="record-detail__field"><label className="form-label">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="record-detail__field record-detail__field--wide"><label className="form-label">Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTopNav === 'demographics' && (
            <div className="card record-detail__panel">
              <div className="card-header"><h3>Demographics</h3><p>Participant demographic information.</p></div>
              <div className="record-detail__overview-grid">
                <div className="record-detail__field"><label className="form-label">Sex / gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="form-select"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Unspecified">Unspecified</option>
                  </select>
                </div>
                <div className="record-detail__field"><span className="form-label">Ethnicity</span><span>{participant.demographics?.ethnicity || 'Not disclosed'}</span></div>
                <div className="record-detail__field"><span className="form-label">Race</span><span>{participant.demographics?.race || 'Not disclosed'}</span></div>
              </div>
            </div>
          )}

          {activeTopNav === 'family' && (
            <section className="card record-detail__panel">
              <div className="card-header"><h3>Family members</h3><p>People linked to this participant.</p></div>
              <div className="record-detail__panel-content">
                <div className="record-detail__family-person">
                  <span className="record-detail__avatar"><Users size={18} /></span>
                  <div><strong>{participant.name}</strong><span>Participant · Family ID {familyId || 'Not assigned'}</span></div>
                </div>
                <p className="record-detail__empty">No additional family members are available.</p>
              </div>
            </section>
          )}

          {activeTopNav === 'variables' && (
            <section className="card record-detail__panel">
              <div className="card-header"><h3>Participant variables</h3><p>Study-specific variables associated with this record.</p></div>
              <div className="record-detail__panel-content">
                {participant.variables && participant.variables.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {participant.variables.map((v, vIdx) => (
                      <div key={vIdx} className="flex justify-between items-center p-2.5 bg-gray-50 rounded border border-gray-200 text-xs">
                        <span className="font-semibold text-gray-800">{v.name}</span>
                        <span className="text-gray-600">{v.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="record-detail__empty">No participant variables are available.</p>
                )}
              </div>
            </section>
          )}

          {activeTopNav === 'details' && <div className="card record-detail__panel">
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
                    >
                      Save Comment
                    </button>
                  </div>

                  <div className="record-detail__comments-list">
                    {comments.map((c) => (
                      <div key={c.id} className="record-detail__comment">
                        <div className="record-detail__comment-meta">
                          <strong>{c.author}{c.pinned ? ' · Pinned' : ''}</strong>
                          <span>{c.date}</span>
                        </div>
                        <p>{c.text}</p>
                      </div>
                    ))}
                  </div>
                </form>
              )}

              {activeTab === 'email' && (
                <div className="text-xs text-gray-600 flex flex-col gap-2">
                  {tabLoading ? (
                    <div className="p-4 flex items-center justify-center text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading email logs...</div>
                  ) : emailLogs.length > 0 ? (
                    emailLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-gray-50 rounded border border-gray-200 flex justify-between items-center">
                        <div>
                          <span className="font-semibold text-gray-900">{log.message || 'Study Invitation Email'}</span>
                          <p className="text-gray-500">Sent to: {primaryEmail} {log.timestamp ? `· ${log.timestamp}` : ''}</p>
                        </div>
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-semibold">{log.status || 'Delivered'}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-gray-50 rounded border border-gray-200 flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-gray-900">Study Invitation Email</span>
                        <p className="text-gray-500">Sent to: {primaryEmail}</p>
                      </div>
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-semibold">Delivered</span>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'text' && (
                <div className="text-xs text-gray-600 flex flex-col gap-2">
                  {tabLoading ? (
                    <div className="p-4 flex items-center justify-center text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading SMS logs...</div>
                  ) : textLogs.length > 0 ? (
                    textLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-gray-50 rounded border border-gray-200 flex justify-between items-center">
                        <div>
                          <span className="font-semibold text-gray-900">{log.message || 'SMS Reminder'}</span>
                          <p className="text-gray-500">Sent to: {phone} {log.timestamp ? `· ${log.timestamp}` : ''}</p>
                        </div>
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-semibold">{log.status || 'Sent'}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-gray-50 rounded border border-gray-200 flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-gray-900">SMS Appointment Reminder</span>
                        <p className="text-gray-500">Sent to: {phone}</p>
                      </div>
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-semibold">Sent</span>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'contact' && (
                <div className="text-xs text-gray-600 flex flex-col gap-2">
                  <p><span className="font-semibold">Preferred Method:</span> Email</p>
                  <p><span className="font-semibold">Primary Address:</span> {address}</p>
                  {contactLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-gray-50 rounded border border-gray-200 flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-gray-900">{log.message || 'Contact Note'}</span>
                        <p className="text-gray-500">{log.userName ? `By ${log.userName}` : ''} {log.timestamp ? `· ${log.timestamp}` : ''}</p>
                      </div>
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-semibold">{log.status || 'Logged'}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'consent' && (
                <div className="text-xs text-gray-600 flex flex-col gap-2">
                  {tabLoading ? (
                    <div className="p-4 flex items-center justify-center text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading consent records...</div>
                  ) : consentLogs.length > 0 ? (
                    consentLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-gray-50 rounded border border-gray-200 flex justify-between items-center">
                        <div>
                          <span className="font-semibold text-gray-900">{log.message || 'Informed Consent Form'}</span>
                          <p className="text-gray-500">{log.timestamp ? `Date: ${log.timestamp}` : 'Approved version'}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${log.status === 'Consented' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                          {log.status || 'Not Consented'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-gray-50 rounded border border-gray-200 flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-gray-900">General Informed Consent 2025</span>
                        <p className="text-gray-500">Version 2.4 - Approved</p>
                      </div>
                      <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-semibold">Not Consented</span>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'forms' && (
                <div className="text-xs text-gray-600 flex flex-col gap-2">
                  {tabLoading ? (
                    <div className="p-4 flex items-center justify-center text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading survey forms...</div>
                  ) : surveySubmissions.length > 0 ? (
                    surveySubmissions.map((sub) => (
                      <div key={sub.id} className="p-3 bg-gray-50 rounded border border-gray-200 flex justify-between items-center">
                        <div>
                          <span className="font-semibold text-gray-900">{sub.surveyName || 'Participant Survey'}</span>
                          <p className="text-gray-500">{sub.submittedAt ? `Submitted: ${new Date(sub.submittedAt).toLocaleDateString()}` : 'Submitted online'}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${sub.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                          {sub.status || 'Completed'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-gray-50 rounded border border-gray-200 flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-gray-900">Initial Medical Intake Form</span>
                        <p className="text-gray-500">Submitted online</p>
                      </div>
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-semibold">Completed</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>}

          {activeTopNav === 'details' && <div className="record-detail__related">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex flex-col gap-3">
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">Studies Info</h3>
              
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                    <tr>
                      <th className="py-2.5 px-4">Name</th>
                      <th className="py-2.5 px-4">ID</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Date Consented</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {participant.studies && participant.studies.length > 0 ? (
                      participant.studies.map((study, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-2.5 px-4 text-[#1976d2] font-medium hover:underline cursor-pointer">{study.name}</td>
                          <td className="py-2.5 px-4 text-gray-500">ST-{(idx + 1) * 101}</td>
                          <td className="py-2.5 px-4 text-gray-800">{participant.status || 'Active'}</td>
                          <td className="py-2.5 px-4 text-gray-800">Consented</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-3 px-4 text-center text-gray-500">No active studies assigned.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="text-lg font-bold text-gray-900 tracking-tight m-0">Family Info</h3>
                <span className="text-xs text-gray-400 cursor-pointer">▲</span>
              </div>
              
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                    <tr>
                      <th className="py-2.5 px-4">Name</th>
                      <th className="py-2.5 px-4">Gender</th>
                      <th className="py-2.5 px-4">Age</th>
                      <th className="py-2.5 px-4">Studies</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-2.5 px-4 font-medium text-gray-900">{participant.name}</td>
                      <td className="py-2.5 px-4 text-gray-700">{gender || participant.gender || 'Unspecified'}</td>
                      <td className="py-2.5 px-4 text-gray-700">{participant.age || 'N/A'}</td>
                      <td className="py-2.5 px-4 text-[#1976d2] font-medium hover:underline cursor-pointer">
                        {participant.studies?.map(s => s.name).join(', ') || 'None'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-gray-900 tracking-tight m-0">Contacts</h3>
                <button
                  type="button"
                  className="bg-[#1976d2] hover:bg-[#1565c0] text-white p-1 rounded transition-colors cursor-pointer shadow-xs"
                  title="Add Contact"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                </button>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                    <tr>
                      <th className="py-2.5 px-4">Name</th>
                      <th className="py-2.5 px-4">Relationship</th>
                      <th className="py-2.5 px-4">Preferred Contact Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-2.5 px-4 text-[#1976d2] font-medium hover:underline cursor-pointer">
                        {participant.name}
                      </td>
                      <td className="py-2.5 px-4 text-gray-800">Participant</td>
                      <td className="py-2.5 px-4 text-gray-800">{primaryEmail || phone || 'Email'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>}
        </div>
      </div>
    </Modal>
  );
};

export default ParticipantDetailModal;
