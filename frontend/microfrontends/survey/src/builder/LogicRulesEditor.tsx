// frontend/microfrontends/survey/src/builder/LogicRulesEditor.tsx
import React from 'react';
import { LogicRule, Question } from '../types/survey';
import { Plus, Trash2, GitBranch, ArrowRight } from 'lucide-react';

export interface LogicRulesEditorProps {
  questions: Question[];
  rules: LogicRule[];
  onChange: (rules: LogicRule[]) => void;
  onAiSuggest?: () => void;
  isSuggestingAi?: boolean;
}

export const LogicRulesEditor: React.FC<LogicRulesEditorProps> = ({
  questions,
  rules,
  onChange,
  onAiSuggest,
  isSuggestingAi = false,
}) => {
  const handleAddRule = () => {
    if (questions.length < 2) return;
    const newRule: LogicRule = {
      ifQuestionId: questions[0].id || 0,
      condition: 'is',
      value: questions[0].options?.[0] || 'Yes',
      thenAction: 'SHOW_QUESTION',
      thenQuestionId: questions[1].id || 1,
    };
    onChange([...rules, newRule]);
  };

  const handleUpdateRule = (index: number, updated: Partial<LogicRule>) => {
    const next = [...rules];
    next[index] = { ...next[index], ...updated };
    onChange(next);
  };

  const handleRemoveRule = (index: number) => {
    onChange(rules.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-sky-600 font-bold text-base">
            <GitBranch size={20} />
            <span>Conditional Display & Skip Logic Rules</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dynamically show or hide follow-up questions based on participant answers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onAiSuggest && (
            <button
              type="button"
              disabled={isSuggestingAi || questions.length < 2}
              onClick={onAiSuggest}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition disabled:opacity-50"
            >
              <span>{isSuggestingAi ? 'Analyzing...' : '✨ AI Suggest Logic'}</span>
            </button>
          )}

          <button
            type="button"
            disabled={questions.length < 2}
            onClick={handleAddRule}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold transition shadow-sm disabled:opacity-50"
          >
            <Plus size={16} />
            <span>Add Rule</span>
          </button>
        </div>
      </div>

      {rules.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <GitBranch size={24} />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No Conditional Logic Rules Configured</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            All questions will be displayed sequentially. Click &quot;Add Rule&quot; or use &quot;AI Suggest Logic&quot; to configure dynamic branching.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule, idx) => {
            const ifQ = questions.find((q) => (q.id ? q.id === rule.ifQuestionId : questions.indexOf(q) === rule.ifQuestionId)) || questions[0];

            return (
              <div
                key={idx}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center gap-3 justify-between"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">IF</span>

                  {/* Trigger Question Selector */}
                  <select
                    value={rule.ifQuestionId}
                    onChange={(e) => handleUpdateRule(idx, { ifQuestionId: Number(e.target.value) })}
                    className="p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-800"
                  >
                    {questions.map((q, i) => (
                      <option key={i} value={q.id ?? i}>
                        Q{i + 1}: {q.text.slice(0, 35)}...
                      </option>
                    ))}
                  </select>

                  {/* Condition Selector */}
                  <select
                    value={rule.condition}
                    onChange={(e) => handleUpdateRule(idx, { condition: e.target.value as 'is' | 'is_not' })}
                    className="p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-800"
                  >
                    <option value="is">IS EQUAL TO</option>
                    <option value="is_not">IS NOT EQUAL TO</option>
                  </select>

                  {/* Trigger Value Input / Choice */}
                  {ifQ?.options && ifQ.options.length > 0 ? (
                    <select
                      value={rule.value}
                      onChange={(e) => handleUpdateRule(idx, { value: e.target.value })}
                      className="p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-semibold text-sky-700"
                    >
                      {ifQ.options.map((opt, optIdx) => (
                        <option key={optIdx} value={opt}>
                          &quot;{opt}&quot;
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={rule.value}
                      onChange={(e) => handleUpdateRule(idx, { value: e.target.value })}
                      placeholder="Trigger value"
                      className="p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-semibold text-sky-700 w-28"
                    />
                  )}

                  <ArrowRight size={16} className="text-slate-400 hidden sm:inline" />
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">THEN SHOW</span>

                  {/* Target Question Selector */}
                  <select
                    value={rule.thenQuestionId}
                    onChange={(e) => handleUpdateRule(idx, { thenQuestionId: Number(e.target.value) })}
                    className="p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-800"
                  >
                    {questions.map((q, i) => (
                      <option key={i} value={q.id ?? i}>
                        Q{i + 1}: {q.text.slice(0, 35)}...
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveRule(idx)}
                  className="self-end md:self-auto p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                  title="Remove rule"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
