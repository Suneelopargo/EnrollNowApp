import React, { useState, useEffect } from 'react';
import { SurveyAssignment, Survey } from '../types/survey';
import { surveyApi } from '../api/surveyApi';
import { SurveyRunner } from '../runner/SurveyRunner';
import { CheckCircle2, Clock, Play, ArrowLeft } from 'lucide-react';

export const MySurveysView: React.FC = () => {
  const [assignments, setAssignments] = useState<SurveyAssignment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);
  const [activeAssignment, setActiveAssignment] = useState<SurveyAssignment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);

  const loadMySurveys = async () => {
    setIsLoading(true);
    try {
      const data = await surveyApi.getMyAssignedSurveys();
      setAssignments(data);
    } catch (err) {
      console.error('Failed to load assigned surveys:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMySurveys();
  }, []);

  const handleStartSurvey = async (assignment: SurveyAssignment) => {
    try {
      const surveyData = await surveyApi.getSurvey(assignment.surveyId);
      setActiveSurvey(surveyData);
      setActiveAssignment(assignment);
      setSubmissionSuccess(false);
    } catch (err) {
      console.error('Failed to load survey data for runner:', err);
    }
  };

  const handleCompleteSurvey = async (answers: any[]) => {
    if (!activeSurvey) return;
    setIsSubmitting(true);
    try {
      await surveyApi.submitResponse(activeSurvey.id!, answers, activeAssignment?.userId);
      setSubmissionSuccess(true);
      await loadMySurveys();
    } catch (err) {
      console.error('Failed to submit response:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (activeSurvey && activeAssignment) {
    if (submissionSuccess) {
      return (
        <div className="max-w-xl mx-auto my-12 bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Survey Completed!</h2>
          <p className="text-xs text-slate-500">
            {activeSurvey.thankYouMessage || 'Thank you for completing this questionnaire. Your responses have been securely recorded.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveSurvey(null);
              setActiveAssignment(null);
            }}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition"
          >
            Back to My Surveys
          </button>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <button
          type="button"
          onClick={() => {
            setActiveSurvey(null);
            setActiveAssignment(null);
          }}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft size={16} />
          <span>Back to Assigned Surveys</span>
        </button>

        <SurveyRunner
          survey={activeSurvey}
          onSubmit={handleCompleteSurvey}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">My Clinical Questionnaires & e-PRO</h1>
        <p className="text-xs text-slate-500">
          Complete questionnaires assigned to you by your clinical trial investigator.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-xs text-slate-500">Loading your questionnaires...</span>
          </div>
        ) : assignments.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            You do not have any questionnaires assigned at this time.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.map((a) => (
              <div
                key={a.id}
                className="p-5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {a.surveyCode}
                    </span>
                    {a.status === 'COMPLETED' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        <CheckCircle2 size={12} />
                        <span>COMPLETED</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        <Clock size={12} />
                        <span>ACTION REQUIRED</span>
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{a.surveyTitle}</h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Assigned: {new Date(a.assignedAt).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  {a.status !== 'COMPLETED' ? (
                    <button
                      type="button"
                      onClick={() => handleStartSurvey(a)}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                    >
                      <Play size={14} />
                      <span>Start Questionnaire</span>
                    </button>
                  ) : (
                    <div className="text-center py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg">
                      Submitted
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
