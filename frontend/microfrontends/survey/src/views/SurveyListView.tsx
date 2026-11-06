import React, { useState, useEffect } from 'react';
import { SurveyListItem } from '../types/survey';
import { surveyApi } from '../api/surveyApi';
import { requestConfirmation } from '../../../../shared/confirmation';
import { AddEditSurveyModal } from '../components/AddEditSurveyModal';
import {
  Search,
  Plus,
  Edit2,
  Copy,
  Archive,
  Download,
  Trash2,
  Check,
  Globe,
  BarChart2,
} from 'lucide-react';

interface SurveyListViewProps {
  onCreateSurvey: () => void;
  onEditSurvey: (surveyId: number) => void;
  onViewAnalytics: (surveyId: number) => void;
  onViewResponses: (surveyId: number) => void;
}

export const SurveyListView: React.FC<SurveyListViewProps> = ({
  onCreateSurvey,
  onEditSurvey,
  onViewAnalytics,
  onViewResponses,
}) => {
  const [surveys, setSurveys] = useState<SurveyListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [surveyToEdit, setSurveyToEdit] = useState<SurveyListItem | null>(null);

  const loadSurveys = () => {
    setIsLoading(true);
    surveyApi
      .getSurveys()
      .then((data: SurveyListItem[]) => setSurveys(data))
      .catch((err: any) => console.error('Failed to load surveys:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadSurveys();
  }, []);

  const handleDuplicate = async (id: number) => {
    try {
      await surveyApi.duplicateSurvey(id);
      loadSurveys();
    } catch (err) {
      console.error('Failed to duplicate survey:', err);
    }
  };

  const handleArchive = async (id: number) => {
    const confirmed = await requestConfirmation({
      title: 'Archive Survey',
      message: 'Are you sure you want to archive this survey?',
      intent: 'warning',
      confirmText: 'Archive Survey',
    });
    if (!confirmed) return;
    try {
      await surveyApi.archiveSurvey(id);
      loadSurveys();
    } catch (err) {
      console.error('Failed to archive survey:', err);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await requestConfirmation({
      title: 'Delete Survey',
      message: 'Are you sure you want to permanently delete this survey?',
      intent: 'danger',
      confirmText: 'Delete Survey',
    });
    if (!confirmed) return;
    try {
      await surveyApi.deleteSurvey(id);
      loadSurveys();
    } catch (err) {
      console.error('Failed to delete survey:', err);
    }
  };

  const handleExportCsv = async (id: number) => {
    try {
      const blob = await surveyApi.exportResponsesCsv(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `survey_${id}_responses.csv`;
      a.click();
    } catch (err) {
      console.error('Failed to export responses CSV:', err);
    }
  };

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/survey/public/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const filteredSurveys = surveys.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.surveyCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Survey Management</h1>
          <p className="text-xs text-slate-500">
            View, author, publish, and configure all clinical protocol questionnaires.
          </p>
        </div>

        <button
          type="button"
          onClick={() => { setSurveyToEdit(null); setIsSurveyModalOpen(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
        >
          <Plus size={16} />
          <span>Create Questionnaire</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or survey code..."
            aria-label="Search surveys by title or survey code"
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto" role="group" aria-label="Filter surveys by status">
          {['ALL', 'PUBLISHED', 'DRAFT', 'ARCHIVED'].map((st) => (
            <button
              key={st}
              type="button"
              aria-pressed={statusFilter === st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Surveys List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-sm text-gray-600">Loading surveys...</span>
          </div>
        ) : filteredSurveys.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No surveys matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Title & Code</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Questions</th>
                  <th className="py-3 px-3">Responses</th>
                  <th className="py-3 px-3">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSurveys.map((survey) => (
                  <tr key={survey.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{survey.title}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        Code: {survey.surveyCode} {survey.studyId ? `• Study #${survey.studyId}` : ''}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          survey.status === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : survey.status === 'DRAFT'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {survey.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium">{survey.questionsCount} Qs</td>
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => onViewResponses(survey.id)}
                        className="text-blue-600 hover:text-blue-800 font-bold"
                      >
                        {survey.totalResponses} submissions
                      </button>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(survey.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {survey.publicToken && (
                          <button
                            type="button"
                            onClick={() => handleCopyLink(survey.publicToken)}
                            title="Copy Public Link"
                            aria-label={`Copy public link for ${survey.title}`}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition"
                          >
                            {copiedToken === survey.publicToken ? (
                              <Check size={15} className="text-emerald-600" aria-hidden="true" />
                            ) : (
                              <Globe size={15} aria-hidden="true" />
                            )}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onViewAnalytics(survey.id)}
                          title="Analytics"
                          aria-label={`View analytics for ${survey.title}`}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition"
                        >
                          <BarChart2 size={15} aria-hidden="true" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleExportCsv(survey.id)}
                          title="Export CSV Responses"
                          aria-label={`Export CSV responses for ${survey.title}`}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100 transition"
                        >
                          <Download size={15} aria-hidden="true" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDuplicate(survey.id)}
                          title="Duplicate Survey"
                          aria-label={`Duplicate ${survey.title}`}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                        >
                          <Copy size={15} aria-hidden="true" />
                        </button>

                        <button
                          type="button"
                          onClick={() => { setSurveyToEdit(survey); setIsSurveyModalOpen(true); }}
                          title="Edit Survey"
                          aria-label={`Edit ${survey.title}`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition"
                        >
                          <Edit2 size={15} aria-hidden="true" />
                        </button>

                        {survey.status !== 'ARCHIVED' && (
                          <button
                            type="button"
                            onClick={() => handleArchive(survey.id)}
                            title="Archive Survey"
                            aria-label={`Archive ${survey.title}`}
                            className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100 transition"
                          >
                            <Archive size={15} aria-hidden="true" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(survey.id)}
                          title="Delete Survey"
                          aria-label={`Delete ${survey.title}`}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition"
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Survey Modal */}
      <AddEditSurveyModal
        isOpen={isSurveyModalOpen}
        onClose={() => {
          setIsSurveyModalOpen(false);
          setSurveyToEdit(null);
        }}
        surveyToEdit={surveyToEdit}
        onSurveySaved={() => {
          loadSurveys();
        }}
      />
    </div>
  );
};
