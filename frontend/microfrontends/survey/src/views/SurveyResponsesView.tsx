import React, { useState, useEffect } from 'react';
import { SurveyResponse, AiAssessment } from '../types/survey';
import { surveyApi } from '../api/surveyApi';
import { Eye, Sparkles, X, AlertTriangle, CheckCircle2, User, Clock, Download } from 'lucide-react';

interface SurveyResponsesViewProps {
  surveyId?: number;
  onBack?: () => void;
}

export const SurveyResponsesView: React.FC<SurveyResponsesViewProps> = ({ surveyId, onBack }) => {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);
  const [aiAssessment, setAiAssessment] = useState<AiAssessment | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);

  const loadResponses = async () => {
    setIsLoading(true);
    try {
      if (surveyId) {
        const data = await surveyApi.getSurveyResponses(surveyId);
        setResponses(data);
      }
    } catch (err) {
      console.error('Failed to load survey responses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (surveyId) {
      loadResponses();
    }
  }, [surveyId]);

  const handleOpenDetails = (resp: SurveyResponse) => {
    setSelectedResponse(resp);
    setAiAssessment(null);
  };

  const handleAssessAi = async (responseId: number) => {
    setIsLoadingAi(true);
    try {
      const assessment = await surveyApi.assessResponseWithAi(responseId);
      setAiAssessment(assessment);
    } catch (err) {
      console.error('Failed to get AI assessment for response:', err);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleExportCsv = async () => {
    if (!surveyId) return;
    try {
      const blob = await surveyApi.exportResponsesCsv(surveyId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `survey_${surveyId}_responses.csv`;
      a.click();
    } catch (err) {
      console.error('Failed to export CSV:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                ← Back
              </button>
            )}
            <h1 className="text-xl font-bold text-slate-900">
              Survey Submissions & Clinical Answers
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review individual participant answer records and run automated AI clinical safety assessments.
          </p>
        </div>

        {surveyId && responses.length > 0 && (
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition self-start sm:self-auto"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        )}
      </div>

      {/* Responses List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-sm text-gray-600">Loading submissions...</span>
          </div>
        ) : responses.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No responses recorded for this survey yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Response ID</th>
                  <th className="py-3 px-3">Participant</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Answer Points</th>
                  <th className="py-3 px-3">Submitted At</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {responses.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      #{r.id}
                    </td>
                    <td className="py-3 px-3">
                      {r.userId ? (
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <User size={13} className="text-blue-500" />
                          <span>Participant #{r.userId}</span>
                          {r.userEmail && <span className="text-slate-400 font-normal">({r.userEmail})</span>}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Anonymous Participant</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700">
                      {r.answers?.length || 0} questions answered
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {r.completedAt ? new Date(r.completedAt).toLocaleString() : 'In Progress'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenDetails(r)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-xs transition"
                      >
                        <Eye size={13} />
                        <span>Inspect Answers</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Response Detail Modal */}
      {selectedResponse && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Submission Detail #{selectedResponse.id}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedResponse.surveyTitle} •{' '}
                  {selectedResponse.completedAt
                    ? new Date(selectedResponse.completedAt).toLocaleString()
                    : 'N/A'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedResponse(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* AI Assessment Trigger */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                      AI Clinical Sentiment & Safety Assessment
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={isLoadingAi}
                    onClick={() => handleAssessAi(selectedResponse.id)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                  >
                    {isLoadingAi ? 'Analyzing Answers...' : 'Run AI Assessment'}
                  </button>
                </div>

                {aiAssessment && (
                  <div className="space-y-3 mt-3 pt-3 border-t border-indigo-200 text-xs">
                    <div>
                      <span className="font-bold text-slate-700">Summary: </span>
                      <span className="text-slate-600">{aiAssessment.summary}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-700">Overall Sentiment: </span>
                      <span className="font-semibold text-indigo-700">{aiAssessment.sentiment}</span>
                    </div>
                    {aiAssessment.clinicalFlags && aiAssessment.clinicalFlags.length > 0 && (
                      <div>
                        <span className="font-bold text-red-600 flex items-center gap-1 mb-1">
                          <AlertTriangle size={13} />
                          <span>Clinical Safety Alerts:</span>
                        </span>
                        <ul className="list-disc pl-5 text-red-700 space-y-0.5">
                          {aiAssessment.clinicalFlags.map((flag, idx) => (
                            <li key={idx}>{flag}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {aiAssessment.recommendations && aiAssessment.recommendations.length > 0 && (
                      <div>
                        <span className="font-bold text-slate-700 mb-1 block">Recommendations:</span>
                        <ul className="list-disc pl-5 text-slate-600 space-y-0.5">
                          {aiAssessment.recommendations.map((rec, idx) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Answers Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Recorded Participant Answers ({selectedResponse.answers?.length || 0})
                </h4>
                <div className="space-y-2">
                  {selectedResponse.answers?.map((ans, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1"
                    >
                      <div className="text-xs font-bold text-slate-800">
                        {ans.questionText || `Question #${ans.questionId}`}
                      </div>
                      <div className="text-xs font-semibold text-blue-700 bg-white p-2 rounded-lg border border-slate-200 inline-block">
                        {typeof ans.value === 'object'
                          ? JSON.stringify(ans.value)
                          : String(ans.value ?? 'No response')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
