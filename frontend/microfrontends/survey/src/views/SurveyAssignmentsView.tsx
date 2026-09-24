import React, { useState, useEffect } from 'react';
import { SurveyAssignment, SurveyListItem } from '../types/survey';
import { surveyApi } from '../api/surveyApi';
import { UserPlus, Search, CheckCircle, Clock, Copy, Check, Send } from 'lucide-react';

export const SurveyAssignmentsView: React.FC = () => {
  const [assignments, setAssignments] = useState<SurveyAssignment[]>([]);
  const [surveys, setSurveys] = useState<SurveyListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedSurveyId, setSelectedSurveyId] = useState<number | ''>('');
  const [userIdInput, setUserIdInput] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [surveysList, assignmentsList] = await Promise.all([
        surveyApi.getSurveys(),
        surveyApi.getSurveyAssignments(),
      ]);
      setSurveys(surveysList);
      setAssignments(assignmentsList);
    } catch (err) {
      console.error('Failed to load assignments or surveys:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSurveyId || !userIdInput.trim()) return;

    const uId = parseInt(userIdInput.trim(), 10);
    if (isNaN(uId)) {
      setErrorMsg('Please enter a valid numeric Participant User ID.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await surveyApi.assignSurvey(Number(selectedSurveyId), uId);
      setUserIdInput('');
      await loadData();
    } catch (err: any) {
      console.error('Failed to assign survey:', err);
      setErrorMsg(err?.response?.data?.message || 'Failed to create assignment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/survey/public/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch =
      a.surveyTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.surveyCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(a.userId).includes(searchQuery);
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Participant Survey Assignments</h1>
        <p className="text-xs text-slate-500">
          Assign protocol questionnaires directly to enrolled clinical trial participants and monitor compliance.
        </p>
      </div>

      {/* Assignment Creation Form */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
          <UserPlus size={18} className="text-blue-600" />
          <span>New Participant Assignment</span>
        </div>

        <form onSubmit={handleAssign} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Published Survey <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={selectedSurveyId}
              onChange={(e) => setSelectedSurveyId(e.target.value ? Number(e.target.value) : '')}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">-- Select Survey --</option>
              {surveys
                .filter((s) => s.status === 'PUBLISHED')
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.surveyCode})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Participant User ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              placeholder="e.g. 1001"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting || !selectedSurveyId || !userIdInput.trim()}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send size={14} />
              <span>{isSubmitting ? 'Assigning...' : 'Assign Questionnaire'}</span>
            </button>
          </div>
        </form>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Search and Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm font-bold text-slate-900">
            Active Assignments ({filteredAssignments.length})
          </div>
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by participant or title..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-xs text-slate-500">Loading assignments...</span>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No assignments found. Use the form above to assign a survey to a participant.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Participant</th>
                  <th className="py-2.5 px-3">Survey Title</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Assigned Date</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssignments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3">
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        User #{a.userId}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{a.surveyTitle}</div>
                      <div className="text-[10px] font-mono text-slate-400">{a.surveyCode}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      {a.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          <CheckCircle size={12} />
                          <span>COMPLETED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          <Clock size={12} />
                          <span>PENDING</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {new Date(a.assignedAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {a.publicToken && (
                        <button
                          type="button"
                          onClick={() => handleCopyLink(a.publicToken)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold transition"
                        >
                          {copiedToken === a.publicToken ? (
                            <Check size={12} className="text-emerald-600" />
                          ) : (
                            <Copy size={12} />
                          )}
                          <span>{copiedToken === a.publicToken ? 'Copied' : 'Direct Link'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
