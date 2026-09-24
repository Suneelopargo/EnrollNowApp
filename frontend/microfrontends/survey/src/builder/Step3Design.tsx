import React from 'react';
import { Question, Section } from '../types/survey';
import { QuestionEditorItem } from './QuestionEditorItem';
import { Plus, FolderPlus, Layers } from 'lucide-react';

interface Step3DesignProps {
  sections: Section[];
  questions: Question[];
  onUpdateSections: (sections: Section[]) => void;
  onUpdateQuestions: (questions: Question[]) => void;
}

export const Step3Design: React.FC<Step3DesignProps> = ({
  sections,
  questions,
  onUpdateSections,
  onUpdateQuestions,
}) => {
  const handleAddQuestion = (sectionId?: number | null) => {
    const newQuestion: Question = {
      position: questions.length + 1,
      sectionId: sectionId ?? (sections.length > 0 ? (sections[0].id ?? 0) : null),
      type: 'Single Choice',
      text: '',
      description: '',
      required: true,
      options: ['Option 1', 'Option 2', 'Option 3'],
    };
    onUpdateQuestions([...questions, newQuestion]);
  };

  const handleUpdateQuestion = (idx: number, updated: Question) => {
    const newQuestions = [...questions];
    newQuestions[idx] = updated;
    onUpdateQuestions(newQuestions);
  };

  const handleDeleteQuestion = (idx: number) => {
    const newQuestions = questions
      .filter((_, i) => i !== idx)
      .map((q, i) => ({ ...q, position: i + 1 }));
    onUpdateQuestions(newQuestions);
  };

  const handleAddSection = () => {
    const nextPos = sections.length + 1;
    const newSection: Section = {
      id: nextPos,
      title: `Section ${nextPos}`,
      description: '',
      position: nextPos,
    };
    onUpdateSections([...sections, newSection]);
  };

  const handleUpdateSection = (idx: number, title: string, description: string) => {
    const newSecs = [...sections];
    newSecs[idx] = { ...newSecs[idx], title, description };
    onUpdateSections(newSecs);
  };

  const handleDeleteSection = (secIdx: number) => {
    const secToRemove = sections[secIdx];
    const newSecs = sections.filter((_, i) => i !== secIdx);
    // Unassign questions that belonged to this section
    const newQuestions = questions.map((q) =>
      q.sectionId === secToRemove.id ? { ...q, sectionId: null } : q
    );
    onUpdateSections(newSecs);
    onUpdateQuestions(newQuestions);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">3. Form Builder & Question Designer</h2>
          <p className="text-sm text-gray-500">
            Structure your survey sections, clinical questions, input controls, and mandatory constraints.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddSection}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-sm"
          >
            <FolderPlus size={15} />
            <span>Add Section</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddQuestion()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm"
          >
            <Plus size={15} />
            <span>Add Question</span>
          </button>
        </div>
      </div>

      {/* Sections Toolbar if sections exist */}
      {sections.length > 0 && (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Layers size={15} className="text-blue-600" />
            <span>Survey Sections ({sections.length})</span>
          </div>
          <div className="space-y-2">
            {sections.map((sec, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-xs font-bold text-slate-500 w-16">Sec {idx + 1}:</span>
                <input
                  type="text"
                  value={sec.title}
                  onChange={(e) => handleUpdateSection(idx, e.target.value, sec.description || '')}
                  placeholder="Section title"
                  className="flex-1 text-xs font-medium text-slate-800 border-none focus:ring-0 focus:outline-none p-1"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteSection(idx)}
                  className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Questions list */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
            <p className="text-sm font-medium text-gray-600 mb-1">No questions added yet</p>
            <p className="text-xs text-gray-400 mb-4">
              Get started by adding questions or using a pre-configured template.
            </p>
            <button
              type="button"
              onClick={() => handleAddQuestion()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 shadow-sm"
            >
              <Plus size={16} />
              <span>Add Your First Question</span>
            </button>
          </div>
        ) : (
          questions.map((q, idx) => (
            <QuestionEditorItem
              key={idx}
              question={q}
              index={idx}
              sections={sections}
              onChange={(updated) => handleUpdateQuestion(idx, updated)}
              onDelete={() => handleDeleteQuestion(idx)}
            />
          ))
        )}
      </div>

      {questions.length > 0 && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => handleAddQuestion()}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition"
          >
            <Plus size={16} />
            <span>Add Another Question</span>
          </button>
        </div>
      )}
    </div>
  );
};
