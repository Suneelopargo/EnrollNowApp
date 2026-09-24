import React from 'react';
import { Survey } from '../types/survey';

interface Step1MetadataProps {
  survey: Survey;
  onChange: (updated: Partial<Survey>) => void;
}

export const Step1Metadata: React.FC<Step1MetadataProps> = ({ survey, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-lg font-semibold text-gray-900">1. Survey Overview & Configuration</h2>
        <p className="text-sm text-gray-500">
          Provide basic details, protocol study binding, and participant settings for this questionnaire.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4 md:col-span-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Survey Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={survey.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="e.g. Baseline Sleep & Quality of Life Questionnaire"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description / Participant Instructions
            </label>
            <textarea
              rows={3}
              value={survey.description || ''}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Explain the purpose of this survey and instructions for respondents..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Clinical Study ID / Protocol Number (Optional)
          </label>
          <input
            type="number"
            value={survey.studyId || ''}
            onChange={(e) => onChange({ studyId: e.target.value ? parseInt(e.target.value, 10) : null })}
            placeholder="e.g. 101"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">Leave empty for independent or organization-wide surveys.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Custom Completion / Thank You Message
          </label>
          <input
            type="text"
            value={survey.thankYouMessage || ''}
            onChange={(e) => onChange({ thankYouMessage: e.target.value })}
            placeholder="Thank you for completing this survey. Your responses have been recorded."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-md font-medium text-gray-900 mb-3">Participant & Response Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={survey.showProgressBar}
              onChange={(e) => onChange({ showProgressBar: e.target.checked })}
              className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-800">Show Progress Bar</span>
              <p className="text-xs text-gray-500">Displays a step completion percentage indicator during survey flow.</p>
            </div>
          </label>

          <label className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={survey.anonymousResponses}
              onChange={(e) => onChange({ anonymousResponses: e.target.checked })}
              className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-800">Anonymous Submissions</span>
              <p className="text-xs text-gray-500">Do not store respondent user IDs or email identifiers with answers.</p>
            </div>
          </label>

          <label className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={survey.allowMultipleResponses}
              onChange={(e) => onChange({ allowMultipleResponses: e.target.checked })}
              className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-800">Allow Multiple Submissions</span>
              <p className="text-xs text-gray-500">Enable participants to submit repeated entries over time (e.g. Daily e-Diary).</p>
            </div>
          </label>

          <label className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={survey.globalSubmission}
              onChange={(e) => onChange({ globalSubmission: e.target.checked })}
              className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-800">Global Public Submission</span>
              <p className="text-xs text-gray-500">Allow submission via shareable public link without requiring user pre-assignment.</p>
            </div>
          </label>

          <label className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={survey.triggerEmailNotification}
              onChange={(e) => onChange({ triggerEmailNotification: e.target.checked })}
              className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-800">Clinical Investigator Email Alerts</span>
              <p className="text-xs text-gray-500">Send an alert to the research coordinator whenever a new submission is completed.</p>
            </div>
          </label>

          <label className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={survey.enableEconsentCountersign}
              onChange={(e) => onChange({ enableEconsentCountersign: e.target.checked })}
              className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-800">Require e-Consent Countersign</span>
              <p className="text-xs text-gray-500">Lock completed response for clinical investigator signoff / audit review.</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
