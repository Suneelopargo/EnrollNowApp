import React, { useState } from 'react';
import { LogicRule, Question } from '../types/survey';
import { LogicRulesEditor } from './LogicRulesEditor';
import { surveyApi } from '../api/surveyApi';

interface Step4LogicProps {
  questions: Question[];
  rules: LogicRule[];
  onChange: (rules: LogicRule[]) => void;
}

export const Step4Logic: React.FC<Step4LogicProps> = ({ questions, rules, onChange }) => {
  const [isSuggestingAi, setIsSuggestingAi] = useState(false);

  const handleAiSuggest = async () => {
    if (questions.length < 2) return;
    setIsSuggestingAi(true);
    try {
      const suggested = await surveyApi.generateLogicWithAi(questions);
      if (suggested && suggested.length > 0) {
        onChange([...rules, ...suggested]);
      }
    } catch (err) {
      console.error('Failed to generate AI logic suggestions:', err);
    } finally {
      setIsSuggestingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-lg font-semibold text-gray-900">4. Conditional Logic & Branching Workflows</h2>
        <p className="text-sm text-gray-500">
          Configure rule-based skip logic to dynamically show or hide questions depending on respondent answers.
        </p>
      </div>

      <LogicRulesEditor
        questions={questions}
        rules={rules}
        onChange={onChange}
        onAiSuggest={handleAiSuggest}
        isSuggestingAi={isSuggestingAi}
      />
    </div>
  );
};
