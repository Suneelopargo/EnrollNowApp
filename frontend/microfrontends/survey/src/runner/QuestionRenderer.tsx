// frontend/microfrontends/survey/src/runner/QuestionRenderer.tsx
import React from 'react';
import { Question } from '../types/survey';

export interface QuestionRendererProps {
  question: Question;
  index: number;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  index,
  value,
  onChange,
  disabled = false,
}) => {
  const renderControl = () => {
    switch (question.type) {
      case 'Single Choice':
        return (
          <div className="space-y-2 mt-2">
            {question.options?.map((opt, i) => (
              <label key={i} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name={`question_${question.id || index}`}
                  value={opt}
                  checked={value === opt}
                  onChange={(e) => onChange(e.target.value)}
                  disabled={disabled}
                  className="w-4 h-4 text-sky-600 focus:ring-sky-500"
                />
                <span className="text-sm font-medium text-slate-700">{opt}</span>
              </label>
            ))}
          </div>
        );

      case 'Multiple Choice': {
        const selectedList: string[] = Array.isArray(value) ? value : [];
        const handleToggle = (opt: string) => {
          if (selectedList.includes(opt)) {
            onChange(selectedList.filter((item) => item !== opt));
          } else {
            onChange([...selectedList, opt]);
          }
        };
        return (
          <div className="space-y-2 mt-2">
            {question.options?.map((opt, i) => (
              <label key={i} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={selectedList.includes(opt)}
                  onChange={() => handleToggle(opt)}
                  disabled={disabled}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                />
                <span className="text-sm font-medium text-slate-700">{opt}</span>
              </label>
            ))}
          </div>
        );
      }

      case 'Dropdown':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-full mt-2 p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            <option value="">-- Please select an option --</option>
            {question.options?.map((opt, i) => (
              <option key={i} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case 'Yes / No':
        return (
          <div className="flex gap-4 mt-2">
            {['Yes', 'No'].map((opt) => (
              <button
                key={opt}
                type="button"
                disabled={disabled}
                onClick={() => onChange(opt)}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm border transition-all ${
                  value === opt
                    ? 'bg-sky-600 border-sky-600 text-white shadow-sm'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        );

      case 'Rating':
      case 'Net Promoter Score': {
        const count = question.type === 'Net Promoter Score' ? 11 : 10;
        const start = question.type === 'Net Promoter Score' ? 0 : 1;
        const numbers = Array.from({ length: count }, (_, i) => String(start + i));

        return (
          <div className="mt-2">
            <div className="flex flex-wrap gap-2">
              {numbers.map((num) => (
                <button
                  key={num}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(num)}
                  className={`w-10 h-10 rounded-lg font-semibold text-sm border transition-all flex items-center justify-center ${
                    String(value) === num
                      ? 'bg-sky-600 border-sky-600 text-white shadow-sm'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-2 px-1">
              <span>{question.type === 'Net Promoter Score' ? '0 - Not at all likely' : '1 - Lowest / Poor'}</span>
              <span>{question.type === 'Net Promoter Score' ? '10 - Extremely likely' : '10 - Highest / Excellent'}</span>
            </div>
          </div>
        );
      }

      case 'Short Text':
      case 'Email':
      case 'Phone':
        return (
          <input
            type={question.type === 'Email' ? 'email' : question.type === 'Phone' ? 'tel' : 'text'}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={`Enter ${question.type.toLowerCase()}...`}
            className="w-full mt-2 p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        );

      case 'Paragraph':
        return (
          <textarea
            rows={4}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder="Type your response here..."
            className="w-full mt-2 p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:outline-none resize-y"
          />
        );

      case 'Number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder="Enter numeric value..."
            className="w-full mt-2 p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        );

      case 'Date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-full mt-2 p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        );

      case 'Date Time':
        return (
          <input
            type="datetime-local"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-full mt-2 p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        );

      case 'Matrix / Likert': {
        const options = question.options?.length ? question.options : ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];
        return (
          <div className="mt-2 overflow-x-auto border border-slate-200 rounded-lg">
            <div className="grid grid-cols-5 divide-x divide-slate-200 bg-slate-50 text-center p-2 text-xs font-semibold text-slate-600">
              {options.map((opt, i) => (
                <div key={i}>{opt}</div>
              ))}
            </div>
            <div className="grid grid-cols-5 divide-x divide-slate-200 bg-white p-3 text-center">
              {options.map((opt, i) => (
                <div key={i} className="flex justify-center">
                  <input
                    type="radio"
                    name={`matrix_${question.id || index}`}
                    value={opt}
                    checked={value === opt}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className="w-4 h-4 text-sky-600 focus:ring-sky-500"
                  />
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'File Upload':
        return (
          <div className="mt-2 border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-sky-500 transition-colors">
            <input
              type="file"
              disabled={disabled}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onChange(file.name);
              }}
              className="hidden"
              id={`file_${question.id || index}`}
            />
            <label htmlFor={`file_${question.id || index}`} className="cursor-pointer">
              <div className="text-sm font-medium text-sky-600 hover:text-sky-700">Click to upload file</div>
              <div className="text-xs text-slate-400 mt-1">{value ? `Selected: ${value}` : 'PDF, DOCX, PNG up to 10MB'}</div>
            </label>
          </div>
        );

      case 'Section / Page':
        return null;

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-full mt-2 p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800"
          />
        );
    }
  };

  if (question.type === 'Section / Page') {
    return (
      <div className="border-t-2 border-sky-500 pt-4 mt-6 mb-4">
        <h3 className="text-lg font-bold text-slate-900">{question.text}</h3>
        {question.description && <p className="text-sm text-slate-500 mt-1">{question.description}</p>}
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2 transition-all hover:border-slate-300">
      <div className="flex items-start justify-between gap-2">
        <label className="text-sm font-semibold text-slate-800 block">
          <span className="text-slate-400 font-mono mr-2">Q{index + 1}.</span>
          {question.text}
          {question.required && <span className="text-red-500 ml-1 font-bold">*</span>}
        </label>
        <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
          {question.type}
        </span>
      </div>

      {question.description && (
        <p className="text-xs text-slate-500 italic mb-2">{question.description}</p>
      )}

      {renderControl()}
    </div>
  );
};
