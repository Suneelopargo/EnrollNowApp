import React, { useState, useEffect } from 'react';
import { Survey } from '../types/survey';
import { surveyApi } from '../api/surveyApi';
import { Step1Metadata } from './Step1Metadata';
import { Step2AiTemplates } from './Step2AiTemplates';
import { Step3Design } from './Step3Design';
import { Step4Logic } from './Step4Logic';
import { Step5Publish } from './Step5Publish';
import { SurveyPreviewModal } from './SurveyPreviewModal';
import { ArrowLeft, ArrowRight, Eye, Save, Sparkles, FileText, Settings, GitBranch, Send } from 'lucide-react';

interface SurveyBuilderProps {
  surveyId?: number;
  onDone?: () => void;
  onCancel?: () => void;
}

const DEFAULT_SURVEY: Survey = {
  title: '',
  description: '',
  status: 'DRAFT',
  anonymousResponses: false,
  allowMultipleResponses: false,
  showProgressBar: true,
  thankYouMessage: 'Thank you for completing this survey.',
  globalSubmission: true,
  triggerEmailNotification: false,
  enableEconsentCountersign: false,
  requireRecaptcha: false,
  sections: [
    {
      id: 1,
      title: 'General Information',
      description: 'Primary baseline section',
      position: 1,
    },
  ],
  questions: [],
  logicRules: [],
};

export const SurveyBuilder: React.FC<SurveyBuilderProps> = ({
  surveyId,
  onDone,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [survey, setSurvey] = useState<Survey>(DEFAULT_SURVEY);
  const [isLoading, setIsLoading] = useState<boolean>(!!surveyId);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (surveyId) {
      setIsLoading(true);
      surveyApi
        .getSurvey(surveyId)
        .then((data: Survey) => {
          setSurvey({
            ...data,
            sections: data.sections || [],
            questions: data.questions || [],
            logicRules: data.logicRules || [],
          });
        })
        .catch((err: any) => {
          console.error('Failed to load survey', err);
          setErrorMessage('Failed to load existing survey data.');
        })
        .finally(() => setIsLoading(false));
    }
  }, [surveyId]);

  const handleUpdate = (updates: Partial<Survey>) => {
    setSurvey((prev) => ({ ...prev, ...updates }));
  };

  const handleApplyTemplate = (templateData: Partial<Survey>) => {
    setSurvey((prev) => ({
      ...prev,
      ...templateData,
    }));
    setSuccessMessage('Template/AI structure applied successfully!');
    setTimeout(() => setSuccessMessage(null), 3000);
    // Proceed to Step 3 (Design)
    setCurrentStep(3);
  };

  const handleSaveOrPublish = async (publishNow: boolean) => {
    if (!survey.title.trim()) {
      setErrorMessage('Survey title is required.');
      setCurrentStep(1);
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    try {
      let saved: Survey;
      if (survey.id) {
        saved = await surveyApi.updateSurvey(survey.id, {
          ...survey,
          status: publishNow ? 'PUBLISHED' : survey.status || 'DRAFT',
        });
      } else {
        saved = await surveyApi.createSurvey({
          ...survey,
          status: publishNow ? 'PUBLISHED' : 'DRAFT',
        });
      }

      if (publishNow && saved.id) {
        saved = await surveyApi.publishSurvey(saved.id);
      }

      setSurvey(saved);
      setSuccessMessage(
        publishNow
          ? 'Survey published successfully!'
          : 'Survey draft saved successfully!'
      );

      setTimeout(() => {
        if (onDone) onDone();
      }, 1500);
    } catch (err: any) {
      console.error('Failed to save survey', err);
      setErrorMessage(err?.response?.data?.message || 'Failed to save survey.');
    } finally {
      setIsSaving(false);
    }
  };

  const steps = [
    { num: 1, label: 'Overview', icon: Settings },
    { num: 2, label: 'AI & Templates', icon: Sparkles },
    { num: 3, label: 'Design Questions', icon: FileText },
    { num: 4, label: 'Conditional Logic', icon: GitBranch },
    { num: 5, label: 'Publish', icon: Send },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-sm text-gray-600">Loading Survey Builder...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {survey.id ? `Edit Survey: ${survey.title || 'Untitled'}` : 'New Clinical Survey Builder'}
            </h1>
            <p className="text-xs text-slate-500">
              {survey.surveyCode ? `Code: ${survey.surveyCode} • ` : ''}
              Protocol-compliant data collection & logic design
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            <Eye size={15} />
            <span>Interactive Preview</span>
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSaveOrPublish(false)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-sm disabled:opacity-50"
          >
            <Save size={15} />
            <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium">
          {successMessage}
        </div>
      )}

      {/* Stepper Wizard Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between min-w-[500px]">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStep === step.num;
            const isCompleted = currentStep > step.num;

            return (
              <React.Fragment key={step.num}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(step.num)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl transition text-xs font-semibold ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 shadow-sm'
                      : isCompleted
                      ? 'text-slate-800 hover:bg-slate-50'
                      : 'text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    <Icon size={12} />
                  </div>
                  <span>{step.label}</span>
                </button>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      currentStep > step.num ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Active Step Content */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        {currentStep === 1 && (
          <Step1Metadata survey={survey} onChange={handleUpdate} />
        )}
        {currentStep === 2 && (
          <Step2AiTemplates onApplyTemplate={handleApplyTemplate} />
        )}
        {currentStep === 3 && (
          <Step3Design
            sections={survey.sections}
            questions={survey.questions}
            onUpdateSections={(secs) => handleUpdate({ sections: secs })}
            onUpdateQuestions={(qs) => handleUpdate({ questions: qs })}
          />
        )}
        {currentStep === 4 && (
          <Step4Logic
            questions={survey.questions}
            rules={survey.logicRules}
            onChange={(rules) => handleUpdate({ logicRules: rules })}
          />
        )}
        {currentStep === 5 && (
          <Step5Publish
            survey={survey}
            onPreview={() => setIsPreviewOpen(true)}
            onPublish={handleSaveOrPublish}
            isSaving={isSaving}
          />
        )}
      </div>

      {/* Footer Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          disabled={currentStep === 1}
          onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition disabled:opacity-30 disabled:pointer-events-none"
        >
          <ArrowLeft size={14} />
          <span>Previous Step</span>
        </button>

        <button
          type="button"
          disabled={currentStep === 5}
          onClick={() => setCurrentStep((prev) => Math.min(5, prev + 1))}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition disabled:opacity-30 disabled:pointer-events-none"
        >
          <span>Next Step</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Preview Modal */}
      <SurveyPreviewModal
        survey={survey}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  );
};
