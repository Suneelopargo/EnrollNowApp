// frontend/microfrontends/survey/src/builder/QuestionEditorItem.tsx
import React from 'react';
import { Question, QuestionType, Section } from '../types/survey';
import { QUESTION_TYPES } from '../constants/questionTypes';
import { Trash2, GripVertical, Plus, X } from 'lucide-react';

export interface QuestionEditorItemProps {
  question: Question;
  index: number;
  sections: Section[];
  onChange: (updated: Question) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export const QuestionEditorItem: React.FC<QuestionEditorItemProps> = ({
  question,
  index,
  sections,
  onChange,
  onDelete,
}) => {
  const currentMeta = QUESTION_TYPES.find((t) => t.type === question.type) || QUESTION_TYPES[0];

  const handleTypeChange = (newType: QuestionType) => {
    const meta = QUESTION_TYPES.find((t) => t.type === newType);
    let newOptions = [...question.options];
    if (meta?.hasOptions && newOptions.length === 0) {
      newOptions = [...meta.defaultOptions];
    }
    onChange({ ...question, type: newType, options: newOptions });
  };

  const handleAddOption = () => {
    const newOpt = `Option ${question.options.length + 1}`;
    onChange({ ...question, options: [...question.options, newOpt] });
  };

  const handleOptionChange = (optIdx: number, val: string) => {
    const updated = [...question.options];
    updated[optIdx] = val;
    onChange({ ...question, options: updated });
  };

  const handleRemoveOption = (optIdx: number) => {
    const updated = question.options.filter((_, i) => i !== optIdx);
    onChange({ ...question, options: updated });
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <GripVertical size={18} className="text-slate-400 cursor-grab" />
          <span className="font-mono text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
            Q{index + 1}
          </span>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {question.type}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {sections.length > 1 && (
            <select
              value={question.sectionId ?? ''}
              onChange={(e) => onChange({ ...question, sectionId: e.target.value ? Number(e.target.value) : null })}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 bg-slate-50 text-slate-700"
            >
              <option value="">No Section</option>
              {sections.map((s, i) => (
                <option key={i} value={s.id ?? i}>
                  Section {i + 1}: {s.title}
                </option>
              ))}
            </select>
          )}

          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={question.required}
              onChange={(e) => onChange({ ...question, required: e.target.checked })}
              className="w-3.5 h-3.5 text-sky-600 rounded"
            />
            <span>Required</span>
          </label>

          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Delete question"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Main inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Question Prompt / Text <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={question.text}
            onChange={(e) => onChange({ ...question, text: e.target.value })}
            placeholder="e.g., What is your primary cardiovascular symptom?"
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Question Type</label>
          <select
            value={question.type}
            onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            {QUESTION_TYPES.map((t) => (
              <option key={t.type} value={t.type}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Description / Clinical Instructions <span className="text-slate-400 font-normal">(Optional)</span>
        </label>
        <input
          type="text"
          value={question.description || ''}
          onChange={(e) => onChange({ ...question, description: e.target.value })}
          placeholder="e.g. Include symptoms experienced over the past 30 days only"
          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
        />
      </div>

      {/* Choice Options Manager (if applicable) */}
      {currentMeta.hasOptions && (
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 mt-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
            <span>Answer Choices & Options ({question.options.length})</span>
            <button
              type="button"
              onClick={handleAddOption}
              className="flex items-center gap-1 text-sky-600 hover:text-sky-700 font-bold"
            >
              <Plus size={14} />
              <span>Add Option</span>
            </button>
          </div>

          <div className="space-y-2">
            {question.options.map((opt, optIdx) => (
              <div key={optIdx} className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400 w-5">{optIdx + 1}.</span>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionChange(optIdx, e.target.value)}
                  placeholder={`Option ${optIdx + 1}`}
                  className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveOption(optIdx)}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
