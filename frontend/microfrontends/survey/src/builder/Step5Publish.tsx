import React, { useState } from 'react';
import { Survey } from '../types/survey';
import { CheckCircle2, Copy, Check, Eye, Globe } from 'lucide-react';

interface Step5PublishProps {
  survey: Survey;
  onPreview: () => void;
  onPublish: (publishNow: boolean) => void;
  isSaving: boolean;
}

export const Step5Publish: React.FC<Step5PublishProps> = ({
  survey,
  onPreview,
  onPublish,
  isSaving,
}) => {
  const [copied, setCopied] = useState(false);
  const publicUrl = survey.publicToken
    ? `${window.location.origin}/survey/public/${survey.publicToken}`
    : `${window.location.origin}/survey/public/generated-upon-publish`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-lg font-semibold text-gray-900">5. Review & Publish Survey</h2>
        <p className="text-sm text-gray-500">
          Verify your questionnaire protocol configuration, test respondent workflow, and publish to activate participant submissions.
        </p>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Structure Summary
          </span>
          <div className="text-2xl font-bold text-slate-900">{survey.questions.length} Questions</div>
          <p className="text-xs text-slate-500">
            Organized across {survey.sections.length || 1} section(s) with {survey.logicRules.length} skip logic rule(s).
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Status
          </span>
          <div>
            <span
              className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full ${
                survey.status === 'PUBLISHED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {survey.status || 'DRAFT'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {survey.status === 'PUBLISHED'
              ? 'Active and accepting participant submissions.'
              : 'Draft mode - Only visible to study administrators.'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Security & Compliance
          </span>
          <div className="text-xs font-medium text-slate-700 space-y-1">
            <div>• Anonymous: {survey.anonymousResponses ? 'Enabled' : 'Disabled'}</div>
            <div>• Multiple Submissions: {survey.allowMultipleResponses ? 'Allowed' : 'Single entry'}</div>
            <div>• Study Link: {survey.studyId ? `Study #${survey.studyId}` : 'Independent'}</div>
          </div>
        </div>
      </div>

      {/* Shareable Link Box */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
          <Globe size={18} className="text-sky-600" />
          <span>Participant Direct Link</span>
        </div>
        <p className="text-xs text-slate-500">
          Share this URL with clinical trial participants or embed it into patient engagement portals.
        </p>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={publicUrl}
            className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg transition"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy Link'}</span>
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onPreview}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-sm font-semibold transition"
        >
          <Eye size={16} />
          <span>Interactive Preview</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => onPublish(false)}
            className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold transition disabled:opacity-50"
          >
            Save as Draft
          </button>

          <button
            type="button"
            disabled={isSaving || survey.questions.length === 0}
            onClick={() => onPublish(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition shadow-sm disabled:opacity-50"
          >
            <CheckCircle2 size={16} />
            <span>{isSaving ? 'Publishing...' : 'Publish Survey'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
