import React, { useEffect, useState } from 'react';
import { SurveyDashboardData } from '../types/survey';
import { surveyApi } from '../api/surveyApi';
import { ClipboardList, CheckCircle, FileEdit, TrendingUp, Plus, ArrowRight, BarChart3 } from 'lucide-react';

interface SurveyDashboardViewProps {
  onCreateSurvey: () => void;
  onSelectSurvey: (surveyId: number) => void;
  onViewAllSurveys: () => void;
  onViewAnalytics: (surveyId: number) => void;
}

export const SurveyDashboardView: React.FC<SurveyDashboardViewProps> = ({
  onCreateSurvey,
  onSelectSurvey,
  onViewAllSurveys,
  onViewAnalytics,
}) => {
  const [data, setData] = useState<SurveyDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    surveyApi
      .getDashboardData()
      .then((res: SurveyDashboardData) => setData(res))
      .catch((err: any) => {
        console.error('Failed to load survey dashboard data:', err);
        setError('Unable to load dashboard metrics.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-sm text-gray-600">Loading Survey Dashboard...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
        {error || 'No dashboard data available.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-700 to-indigo-800 p-6 rounded-2xl text-white shadow-md">
        <div>
          <h1 className="text-2xl font-bold">Clinical Survey & ePRO Center</h1>
          <p className="text-blue-100 text-xs sm:text-sm mt-1">
            Design protocol questionnaires, assign validated instruments, and track participant outcomes in real-time.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateSurvey}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 rounded-xl font-semibold text-xs sm:text-sm transition shadow-sm self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>New Survey</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Surveys</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{data.totalSurveys}</div>
            <span className="text-xs text-slate-400">All protocol instruments</span>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <ClipboardList size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Published & Active</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{data.publishedSurveys}</div>
            <span className="text-xs text-slate-400">Accepting responses</span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Draft Surveys</span>
            <div className="text-2xl font-bold text-amber-600 mt-1">{data.draftSurveys}</div>
            <span className="text-xs text-slate-400">Under authoring</span>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <FileEdit size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Responses & Rate</span>
            <div className="text-2xl font-bold text-indigo-600 mt-1">{data.totalResponses}</div>
            <span className="text-xs text-indigo-500 font-semibold">{data.completionRate}% Completion</span>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* Response Activity Chart & Trends */}
      {data.responsesByDay && data.responsesByDay.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
              <BarChart3 size={18} className="text-blue-600" />
              <span>Response Volume Trend (Last 14 Days)</span>
            </div>
          </div>
          <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 pt-2">
            {data.responsesByDay.slice(-14).map((d, i) => (
              <div key={i} className="flex flex-col items-center bg-slate-50 p-2 rounded-lg text-center">
                <span className="text-[10px] font-semibold text-slate-400">{d.date.slice(5)}</span>
                <span className="text-xs font-bold text-blue-700 mt-1">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Surveys Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Questionnaires</h2>
            <p className="text-xs text-slate-500">Recently authored or modified protocol surveys</p>
          </div>
          <button
            type="button"
            onClick={onViewAllSurveys}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            <span>View All</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-y border-slate-200">
              <tr>
                <th className="py-3 px-3">Title & Code</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Questions</th>
                <th className="py-3 px-3">Responses</th>
                <th className="py-3 px-3">Last Modified</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recentSurveys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-400">
                    No questionnaires found. Click &quot;New Survey&quot; to build one.
                  </td>
                </tr>
              ) : (
                data.recentSurveys.map((survey) => (
                  <tr key={survey.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{survey.title}</div>
                      <div className="text-[10px] font-mono text-slate-400">{survey.surveyCode}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          survey.status === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {survey.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium">{survey.questionsCount}</td>
                    <td className="py-3 px-3 font-semibold text-blue-600">{survey.totalResponses}</td>
                    <td className="py-3 px-3 text-slate-400">
                      {survey.updatedAt ? new Date(survey.updatedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => onViewAnalytics(survey.id)}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs"
                      >
                        Analytics
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectSurvey(survey.id)}
                        className="text-blue-600 hover:text-blue-800 font-semibold text-xs"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
