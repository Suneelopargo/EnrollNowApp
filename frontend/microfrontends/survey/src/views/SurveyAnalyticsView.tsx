import React, { useState, useEffect } from 'react';
import { SurveyAnalyticsData, Survey } from '../types/survey';
import { surveyApi } from '../api/surveyApi';
import { BarChart3, Users, CheckCircle, Star, ArrowLeft } from 'lucide-react';

interface SurveyAnalyticsViewProps {
  surveyId: number;
  onBack?: () => void;
}

export const SurveyAnalyticsView: React.FC<SurveyAnalyticsViewProps> = ({ surveyId, onBack }) => {
  const [analytics, setAnalytics] = useState<SurveyAnalyticsData | null>(null);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([surveyApi.getSurveyAnalytics(surveyId), surveyApi.getSurvey(surveyId)])
      .then(([analyticsData, surveyData]) => {
        setAnalytics(analyticsData);
        setSurvey(surveyData);
      })
      .catch((err) => console.error('Failed to load analytics:', err))
      .finally(() => setIsLoading(false));
  }, [surveyId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-sm text-gray-600">Loading survey analytics...</span>
      </div>
    );
  }

  if (!analytics || !survey) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
        Unable to load analytics for this survey.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Analytics: {analytics.surveyTitle}
            </h1>
            <p className="text-xs text-slate-500">
              Real-time response completion rates and participant metrics
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Submissions
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{analytics.totalResponses}</div>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Completed
            </span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">
              {analytics.completedResponses}
            </div>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Completion Rate
            </span>
            <div className="text-2xl font-bold text-indigo-600 mt-1">
              {analytics.completionRate}%
            </div>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <BarChart3 size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Average Rating
            </span>
            <div className="text-2xl font-bold text-amber-600 mt-1">
              {analytics.averageRating != null ? analytics.averageRating.toFixed(1) : 'N/A'}
            </div>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Star size={24} />
          </div>
        </div>
      </div>

      {/* Response timeline */}
      {analytics.responsesByDay && analytics.responsesByDay.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Submissions Over Time</h3>
          <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 pt-2">
            {analytics.responsesByDay.map((d, i) => (
              <div key={i} className="flex flex-col items-center bg-slate-50 p-2 rounded-lg text-center">
                <span className="text-[10px] font-semibold text-slate-400">{d.date.slice(5)}</span>
                <span className="text-xs font-bold text-blue-700 mt-1">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Questionnaire Item Breakdown */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          Instrument Questions Structure ({survey.questions?.length || 0} Questions)
        </h3>
        <div className="space-y-3">
          {survey.questions?.map((q, idx) => (
            <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
                  Q{idx + 1} • {q.type}
                </span>
                {q.required && (
                  <span className="text-[10px] font-bold text-red-500 uppercase">Required</span>
                )}
              </div>
              <div className="text-xs font-semibold text-slate-800">{q.text}</div>
              {q.options && q.options.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {q.options.map((opt, oIdx) => (
                    <span
                      key={oIdx}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-[11px] text-slate-600 font-medium"
                    >
                      {opt}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
