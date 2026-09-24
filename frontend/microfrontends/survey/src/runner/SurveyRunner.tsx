// frontend/microfrontends/survey/src/runner/SurveyRunner.tsx
import React, { useState, useMemo } from 'react';
import { Survey } from '../types/survey';
import { QuestionRenderer } from './QuestionRenderer';
import { CheckCircle2, ChevronRight, ChevronLeft, Send, Sparkles, ShieldCheck } from 'lucide-react';

export interface SurveyRunnerProps {
  survey: Survey;
  onSubmit: (answers: { questionId: number; value: any }[], userEmail?: string) => Promise<void>;
  onClose?: () => void;
  isPublic?: boolean;
}

export const SurveyRunner: React.FC<SurveyRunnerProps> = ({
  survey,
  onSubmit,
  onClose,
  isPublic = false,
}) => {
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [userEmail, setUserEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Group questions by section if sections exist
  const sections = useMemo(() => {
    if (!survey.sections || survey.sections.length === 0) {
      return [{ id: undefined, title: survey.title, description: survey.description, position: 0 }];
    }
    return survey.sections;
  }, [survey]);

  // Compute hidden questions dynamically based on logic rules
  const hiddenQuestionIds = useMemo(() => {
    const hidden = new Set<number>();
    if (!survey.logicRules || survey.logicRules.length === 0) return hidden;

    for (let pass = 0; pass < survey.logicRules.length + 1; pass++) {
      let changed = false;
      for (const rule of survey.logicRules) {
        const triggerValue = String(answers[rule.ifQuestionId] || '').trim();
        const targetVisible =
          rule.condition === 'is'
            ? triggerValue.toLowerCase() === rule.value.trim().toLowerCase()
            : triggerValue.toLowerCase() !== rule.value.trim().toLowerCase();

        if (!targetVisible && !hidden.has(rule.thenQuestionId)) {
          hidden.add(rule.thenQuestionId);
          changed = true;
        }
      }
      if (!changed) break;
    }
    return hidden;
  }, [survey.logicRules, answers]);

  // Visible questions in current active section
  const currentSection = sections[currentSectionIndex];
  const sectionQuestions = useMemo(() => {
    return (survey.questions || []).filter((q) => {
      if (hiddenQuestionIds.has(q.id || 0)) return false;
      if (sections.length > 1 && currentSection?.id !== undefined) {
        return q.sectionId === currentSection.id;
      }
      return true;
    });
  }, [survey.questions, sections, currentSection, hiddenQuestionIds]);

  const allVisibleQuestions = useMemo(() => {
    return (survey.questions || []).filter((q) => !hiddenQuestionIds.has(q.id || 0));
  }, [survey.questions, hiddenQuestionIds]);

  // Calculate Progress
  const answeredCount = allVisibleQuestions.filter((q) => {
    const val = answers[q.id || 0];
    return val !== undefined && val !== null && val !== '' && (!Array.isArray(val) || val.length > 0);
  }).length;

  const progressPercentage = allVisibleQuestions.length > 0
    ? Math.round((answeredCount / allVisibleQuestions.length) * 100)
    : 0;

  const handleAnswerChange = (questionId: number, value: any) => {
    setErrorMessage(null);
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const validateCurrentSection = () => {
    for (const q of sectionQuestions) {
      if (q.required) {
        const val = answers[q.id || 0];
        const isMissing =
          val === undefined ||
          val === null ||
          val === '' ||
          (Array.isArray(val) && val.length === 0);
        if (isMissing) {
          setErrorMessage(`Question "${q.text}" is required.`);
          return false;
        }
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentSection()) return;
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setErrorMessage(null);
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentSection()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = Object.entries(answers).map(([qId, val]) => ({
      questionId: Number(qId),
      value: val,
    }));

    try {
      await onSubmit(payload, userEmail || undefined);
      setIsCompleted(true);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err.message || 'Failed to submit survey.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCompleted) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 size={36} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Submission Completed!</h2>
          <p className="text-slate-600 mt-2 text-base leading-relaxed">
            {survey.thankYouMessage || 'Thank you for your valuable feedback!'}
          </p>
        </div>
        <div className="pt-4 border-t border-slate-100 flex justify-center gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition"
            >
              Close Survey
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm mb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-sky-600 uppercase tracking-wider mb-2">
          <ShieldCheck size={16} />
          <span>Electronic Clinical Outcome Assessment (eCOA)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{survey.title}</h1>
        {survey.description && (
          <p className="text-slate-600 mt-2 text-sm leading-relaxed">{survey.description}</p>
        )}

        {/* Progress Bar */}
        {survey.showProgressBar && (
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
              <span>Survey Progress</span>
              <span>{progressPercentage}% Completed</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Section Header */}
      {sections.length > 1 && (
        <div className="mb-4 flex items-center justify-between bg-sky-50 border border-sky-100 px-4 py-2.5 rounded-xl text-sky-900">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
              Section {currentSectionIndex + 1} of {sections.length}:
            </span>
            <h2 className="text-sm font-semibold">{currentSection?.title}</h2>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
          <span>⚠️ {errorMessage}</span>
        </div>
      )}

      {/* Questions Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {sectionQuestions.map((q, idx) => (
          <QuestionRenderer
            key={q.id || idx}
            question={q}
            index={idx}
            value={answers[q.id || 0]}
            onChange={(val) => handleAnswerChange(q.id || 0, val)}
            disabled={isSubmitting}
          />
        ))}

        {sectionQuestions.length === 0 && (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-sm">
            No questions to answer in this section.
          </div>
        )}

        {/* Respondent Email (if public & anonymous not enforced) */}
        {isPublic && !survey.anonymousResponses && currentSectionIndex === sections.length - 1 && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 mt-4">
            <label className="block text-sm font-semibold text-slate-800 mb-1">
              Your Email Address <span className="text-slate-400 text-xs">(optional for notifications)</span>
            </label>
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="participant@domain.com"
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        )}

        {/* Navigation & Submission Controls */}
        <div className="flex items-center justify-between pt-6">
          {currentSectionIndex > 0 ? (
            <button
              type="button"
              onClick={handlePrev}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-medium text-sm text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition"
            >
              <ChevronLeft size={16} />
              <span>Previous Section</span>
            </button>
          ) : (
            <div />
          )}

          {currentSectionIndex < sections.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-sky-600 hover:bg-sky-700 shadow-md transition"
            >
              <span>Next Section</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg transition disabled:opacity-50"
            >
              <Send size={16} />
              <span>{isSubmitting ? 'Submitting Responses...' : 'Submit Completed Survey'}</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
