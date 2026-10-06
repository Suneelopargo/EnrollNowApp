// frontend/microfrontends/participant/src/components/ParticipantDetailModal.tsx - Detailed Participant Drawer & Editor
import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Plus, MessageSquare, Mail, Phone, FileText, Check, ChevronDown, User, ShieldCheck } from 'lucide-react';
import DeleteParticipantModal from './DeleteParticipantModal';
import { ParticipantRecord } from '../types/participant';

interface ParticipantDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: ParticipantRecord | null;
  onSave: (updatedParticipant: ParticipantRecord) => void;
  onDelete: (participant: ParticipantRecord) => void;
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
  onDelete,
}) => {
  const [activeTopNav, setActiveTopNav] = useState<'details' | 'contact' | 'demographics' | 'family' | 'variables'>('details');
  const [activeTab, setActiveTab] = useState<'comments' | 'email' | 'text' | 'contact' | 'consent' | 'forms'>('comments');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

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

  useEffect(() => {
    if (participant) {
      setFamilyId(participant.familyId || 'FAM-10294');
      setGlobalId(participant.globalId || 'pxjfO-0vf3bgq5V9o');
      setTimezone(participant.timezone || 'America/New_York (EDT)');
      setTagsInput(Array.isArray(participant.tags) ? participant.tags.join(', ') : 'New Participant');
      setContactForFuture(participant.contactForFutureStudies !== false);
      setDateLastContact(participant.globalDateOfLastContact || '03/20/2025 11:45 PM');
      setPrimaryEmail(participant.contactMethods?.primaryEmail || `${participant.firstName?.toLowerCase() || 'user'}.${participant.lastName?.toLowerCase() || 'demo'}@example.org`);
      setPhone(participant.contactMethods?.phone || '+1 (555) 019-2831');
      setAddress(participant.contactMethods?.address || 'Clinical Center, Suite 400');
      setGender(participant.gender || 'Unspecified');
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
        phone,
        address
      }
    };

    onSave(updatedParticipant);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div className="bg-[#f8fafc] rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-gray-200 flex flex-col my-6 max-h-[90vh] transition-all">
        <div className="bg-white px-6 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-4 text-xs font-medium text-[#1976d2] overflow-x-auto py-1">
            <button
              type="button"
              onClick={() => setActiveTopNav('details')}
              className={`hover:underline cursor-pointer ${activeTopNav === 'details' ? 'font-bold text-[#1565c0] underline' : ''}`}
            >
              Main Overview
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={() => setActiveTopNav('contact')}
              className={`hover:underline cursor-pointer ${activeTopNav === 'contact' ? 'font-bold text-[#1565c0] underline' : ''}`}
            >
              Contact Methods
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={() => setActiveTopNav('demographics')}
              className={`hover:underline cursor-pointer ${activeTopNav === 'demographics' ? 'font-bold text-[#1565c0] underline' : ''}`}
            >
              Demographics
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={() => setActiveTopNav('family')}
              className={`hover:underline cursor-pointer ${activeTopNav === 'family' ? 'font-bold text-[#1565c0] underline' : ''}`}
            >
              Family
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={() => setActiveTopNav('variables')}
              className={`hover:underline cursor-pointer ${activeTopNav === 'variables' ? 'font-bold text-[#1565c0] underline' : ''}`}
            >
              Variables
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex flex-col gap-6 text-sm flex-1">
          <div className="border-b border-gray-200 pb-3 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{participant.name}</h1>
            <span className="bg-blue-100 text-[#1976d2] px-3 py-1 rounded-full text-xs font-semibold">
              ID: {participant.globalId || 'pxjfO-0vf3bgq5V9o'}
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-semibold text-gray-700 min-w-[70px]">Family ID:</label>
                <input
                  type="text"
                  value={familyId}
                  onChange={(e) => setFamilyId(e.target.value)}
                  className="flex-1 max-w-[200px] border border-gray-300 focus:border-[#1976d2] rounded px-2.5 py-1.5 text-xs text-gray-800 bg-white"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-semibold text-gray-700 min-w-[90px]">Date Created:</label>
                <span className="text-xs text-gray-800 font-medium">
                  {participant.dateCreated || '20/03/2025, 11:45 pm'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-semibold text-gray-700 min-w-[70px]">Global ID:</label>
                <input
                  type="text"
                  value={globalId}
                  onChange={(e) => setGlobalId(e.target.value)}
                  className="flex-1 max-w-[200px] border border-gray-300 focus:border-[#1976d2] rounded px-2.5 py-1.5 text-xs text-gray-800 bg-white"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-semibold text-gray-700 min-w-[90px]">Timezone:</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="flex-1 max-w-[220px] border border-gray-300 focus:border-[#1976d2] rounded px-2.5 py-1.5 text-xs text-gray-800 bg-white cursor-pointer"
                >
                  <option value="America/New_York (EDT)">America/New_York (EDT)</option>
                  <option value="America/Chicago (CDT)">America/Chicago (CDT)</option>
                  <option value="America/Los_Angeles (PDT)">America/Los_Angeles (PDT)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>

              <div className="flex items-center justify-between gap-2 md:col-span-2">
                <label className="text-xs font-semibold text-gray-700 min-w-[70px]">Tags:</label>
                <div className="flex-1 flex items-center gap-2 border border-gray-300 rounded px-2.5 py-1.5 bg-white">
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Enter tags separated by commas..."
                    className="flex-1 outline-none text-xs text-gray-800 bg-transparent"
                  />
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div className="flex items-center gap-2.5 md:col-span-2 pt-1">
                <input
                  type="checkbox"
                  id="futureContactCheckModal"
                  checked={contactForFuture}
                  onChange={(e) => setContactForFuture(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer accent-[#1976d2]"
                />
                <label htmlFor="futureContactCheckModal" className="text-xs font-medium text-gray-800 cursor-pointer">
                  Contact For Future Studies?
                </label>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:col-span-2 pt-1">
                <label className="text-xs font-semibold text-gray-700">Global Date of Last Contact:</label>
                <div className="flex items-center gap-2 border border-gray-300 rounded px-3 py-1.5 bg-white w-full sm:w-auto min-w-[260px]">
                  <input
                    type="text"
                    value={dateLastContact}
                    onChange={(e) => setDateLastContact(e.target.value)}
                    className="text-xs text-gray-800 font-mono flex-1 outline-none"
                  />
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {activeTopNav === 'contact' && (
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 flex flex-col gap-3">
              <h3 className="font-semibold text-xs text-blue-900 uppercase tracking-wider">Contact Methods Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-medium text-gray-700 block mb-1">Primary Email:</label>
                  <input
                    type="email"
                    value={primaryEmail}
                    onChange={(e) => setPrimaryEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="font-medium text-gray-700 block mb-1">Phone Number:</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 bg-white text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-medium text-gray-700 block mb-1">Address:</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 bg-white text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTopNav === 'demographics' && (
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 flex flex-col gap-3">
              <h3 className="font-semibold text-xs text-blue-900 uppercase tracking-wider">Demographics Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="font-medium text-gray-700 block mb-1">Sex/Gender:</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 bg-white text-xs"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Unspecified">Unspecified</option>
                  </select>
                </div>
                <div><span className="font-medium text-gray-900">Ethnicity:</span> {participant.demographics?.ethnicity || 'Not Disclosed'}</div>
                <div><span className="font-medium text-gray-900">Race:</span> {participant.demographics?.race || 'Not Disclosed'}</div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden flex flex-col">
            <div className="bg-gray-50 border-b border-gray-200 flex items-center gap-1 px-2 pt-2 overflow-x-auto">
              {[
                { id: 'comments', label: 'Comments', icon: MessageSquare },
                { id: 'email', label: 'Email', icon: Mail },
                { id: 'text', label: 'Text', icon: Phone },
                { id: 'contact', label: 'Contact', icon: User },
                { id: 'consent', label: 'Consent', icon: ShieldCheck },
                { id: 'forms', label: 'Forms', icon: FileText },
              ].map((t) => {
                const IconComp = t.icon;
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id as any)}
                    className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap border-t border-x ${
                      isActive
                        ? 'bg-white text-gray-900 border-gray-200 border-b-white -mb-px'
                        : 'bg-transparent text-gray-600 hover:text-gray-900 border-transparent'
                    }`}
                  >
                    <IconComp className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-5 flex flex-col gap-4">
              {activeTab === 'comments' && (
                <form onSubmit={handleAddComment} className="flex flex-col gap-3">
                  <textarea
                    rows={3}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add comment..."
                    className="w-full border border-gray-300 rounded-lg p-3 text-xs text-gray-800 outline-none focus:border-[#1976d2] focus:ring-2 focus:ring-blue-500/10 placeholder-gray-400"
                  />
                  
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-600 font-medium">Mark Comment As:</span>
                      <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isPinned}
                          onChange={(e) => setIsPinned(e.target.checked)}
                          className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300"
                        />
                        <span>Pin Comment</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="bg-[#1976d2] hover:bg-[#1565c0] text-white px-5 py-1.5 rounded-md text-xs font-medium cursor-pointer shadow-xs transition-all"
                    >
                      Save Comment
                    </button>
                  </div>

                  <div className="mt-3 flex flex-col gap-2.5 border-t border-gray-100 pt-3">
                    {comments.map((c) => (
                      <div key={c.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
                          <span className="text-gray-900 font-semibold">{c.author}</span>
                          <span>{c.date}</span>
                        </div>
                        <p className="text-xs text-gray-800">{c.text}</p>
                      </div>
                    ))}
                  </div>
                </form>
              )}

              {activeTab === 'email' && (
                <div className="text-xs text-gray-600 flex flex-col gap-2">
                  <div className="p-3 bg-gray-50 rounded border border-gray-200 flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-gray-900">Study Invitation Email</span>
                      <p className="text-gray-500">Sent to: {primaryEmail}</p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-semibold">Delivered</span>
                  </div>
                </div>
              )}

              {activeTab === 'text' && (
                <div className="text-xs text-gray-600 flex flex-col gap-2">
                  <div className="p-3 bg-gray-50 rounded border border-gray-200 flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-gray-900">SMS Appointment Reminder</span>
                      <p className="text-gray-500">Sent to: {phone}</p>
                    </div>
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-semibold">Sent</span>
                  </div>
                </div>
              )}

              {activeTab === 'contact' && (
                <div className="text-xs text-gray-600 flex flex-col gap-2">
                  <p><span className="font-semibold">Preferred Method:</span> Email</p>
                  <p><span className="font-semibold">Primary Address:</span> {address}</p>
                </div>
              )}

              {activeTab === 'consent' && (
                <div className="text-xs text-gray-600 flex flex-col gap-2">
                  <div className="p-3 bg-gray-50 rounded border border-gray-200 flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-gray-900">General Informed Consent 2025</span>
                      <p className="text-gray-500">Version 2.4 - Approved</p>
                    </div>
                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-semibold">Not Consented</span>
                  </div>
                </div>
              )}

              {activeTab === 'forms' && (
                <div className="text-xs text-gray-600 flex flex-col gap-2">
                  <div className="p-3 bg-gray-50 rounded border border-gray-200 flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-gray-900">Initial Medical Intake Form</span>
                      <p className="text-gray-500">Submitted online</p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-semibold">Completed</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
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
                    <tr className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-2.5 px-4 text-[#1976d2] font-medium hover:underline cursor-pointer">ADRC Comm Hour</td>
                      <td className="py-2.5 px-4 text-gray-500">ST-101</td>
                      <td className="py-2.5 px-4 text-gray-800">Potential Participants</td>
                      <td className="py-2.5 px-4 text-gray-800">Not Consented</td>
                    </tr>
                    <tr className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-2.5 px-4 text-[#1976d2] font-medium hover:underline cursor-pointer">Autism Study</td>
                      <td className="py-2.5 px-4 text-gray-500">ST-204</td>
                      <td className="py-2.5 px-4 text-gray-800">Potential Participants</td>
                      <td className="py-2.5 px-4 text-gray-800">Not Consented</td>
                    </tr>
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
                      <td className="py-2.5 px-4 text-gray-700">{gender || 'Unspecified'}</td>
                      <td className="py-2.5 px-4 text-gray-700">{participant.age || 'N/A'}</td>
                      <td className="py-2.5 px-4 text-[#1976d2] font-medium hover:underline cursor-pointer">
                        {participant.studies?.map(s => s.name).join(', ') || 'Autism Study'}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-2.5 px-4 font-medium text-gray-800">Proband Relative (Sibling)</td>
                      <td className="py-2.5 px-4 text-gray-700">Female</td>
                      <td className="py-2.5 px-4 text-gray-700">28</td>
                      <td className="py-2.5 px-4 text-[#1976d2] font-medium hover:underline cursor-pointer">ADRC Comm Hour</td>
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
                      <td className="py-2.5 px-4 text-gray-800">{primaryEmail}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleSaveParticipant}
            className="bg-[#1976d2] hover:bg-[#1565c0] text-white px-5 py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-sm font-medium transition-all cursor-pointer shadow-xs hover:shadow-md active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Save Changes</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors cursor-pointer shadow-2xs"
          >
            Cancel
          </button>
        </div>
      </div>

      <DeleteParticipantModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        participantName={participant.name}
        onConfirm={() => {
          onDelete?.(participant);
          setIsDeleteConfirmOpen(false);
        }}
      />
    </div>
  );
};

export default ParticipantDetailModal;
