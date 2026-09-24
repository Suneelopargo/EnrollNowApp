import React, { useState } from 'react';
import { Survey } from '../types/survey';
import { SURVEY_TEMPLATES } from '../constants/templates';
import { surveyApi } from '../api/surveyApi';

interface Step2AiTemplatesProps {
  onApplyTemplate: (templateData: Partial<Survey>) => void;
}

export const Step2AiTemplates: React.FC<Step2AiTemplatesProps> = ({ onApplyTemplate }) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const generated = await surveyApi.generateWithAi(aiPrompt.trim());
      onApplyTemplate({
        title: generated.title,
        description: generated.description,
        sections: generated.sections,
        questions: generated.questions,
        logicRules: generated.logicRules || []
      });
    } catch (err: any) {
      console.error('Failed to generate survey with AI:', err);
      setError(err?.response?.data?.message || 'Failed to generate survey. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-lg font-semibold text-gray-900">2. AI Assistant & Pre-built Clinical Templates</h2>
        <p className="text-sm text-gray-500">
          Accelerate survey construction by generating a structured questionnaire using AI or selecting a validated clinical protocol template.
        </p>
      </div>

      {/* AI Generator Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-xl">✨</span>
          <h3 className="text-md font-semibold text-indigo-900">AI Clinical Survey Generator</h3>
        </div>
        <p className="text-xs text-indigo-700 mb-3">
          Describe the study therapeutic area, target endpoint, or clinical protocol in natural language.
        </p>
        
        <div className="space-y-3">
          <textarea
            rows={3}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="e.g. Create a 10-question oncology patient reported outcome survey evaluating treatment tolerability, nausea, fatigue Likert scale, and conditional questions for severe pain..."
            className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end">
            <button
              type="button"
              disabled={isGenerating || !aiPrompt.trim()}
              onClick={handleAiGenerate}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 flex items-center space-x-2 transition"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Synthesizing Protocol...</span>
                </>
              ) : (
                <>
                  <span>✨ Generate Survey Structure</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Validated Template Library */}
      <div>
        <h3 className="text-md font-semibold text-gray-900 mb-3">Or Select a Validated Clinical Template</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {SURVEY_TEMPLATES.map((tpl) => (
            <div
              key={tpl.id}
              className="border border-gray-200 rounded-xl p-4 flex flex-col justify-between hover:shadow-md transition bg-white"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {tpl.category}
                  </span>
                  <span className="text-xs text-gray-400">{tpl.questions.length} Questions</span>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm mb-1">{tpl.name}</h4>
                <p className="text-xs text-gray-500 line-clamp-3 mb-4">{tpl.description}</p>
              </div>

              <button
                type="button"
                onClick={() =>
                  onApplyTemplate({
                    title: tpl.name,
                    description: tpl.description,
                    sections: tpl.sections,
                    questions: tpl.questions,
                    logicRules: tpl.logicRules
                  })
                }
                className="w-full py-2 px-3 border border-gray-300 hover:border-blue-500 hover:text-blue-600 rounded-lg text-xs font-medium text-gray-700 transition text-center"
              >
                Apply This Template
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
