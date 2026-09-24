// frontend/microfrontends/survey/src/constants/questionTypes.ts
import { QuestionType } from '../types/survey';

export interface QuestionTypeMeta {
  type: QuestionType;
  label: string;
  category: 'CHOICE' | 'TEXT' | 'NUMERIC' | 'DATETIME' | 'ADVANCED';
  description: string;
  defaultOptions: string[];
  hasOptions: boolean;
}

export const QUESTION_TYPES: QuestionTypeMeta[] = [
  {
    type: 'Single Choice',
    label: 'Single Choice (Radio)',
    category: 'CHOICE',
    description: 'Respondent selects exactly one option from a list',
    defaultOptions: ['Option 1', 'Option 2', 'Option 3'],
    hasOptions: true,
  },
  {
    type: 'Multiple Choice',
    label: 'Multiple Choice (Checkboxes)',
    category: 'CHOICE',
    description: 'Respondent can select one or more options',
    defaultOptions: ['Option 1', 'Option 2', 'Option 3'],
    hasOptions: true,
  },
  {
    type: 'Dropdown',
    label: 'Dropdown Menu',
    category: 'CHOICE',
    description: 'Compact dropdown selection menu',
    defaultOptions: ['Option 1', 'Option 2', 'Option 3'],
    hasOptions: true,
  },
  {
    type: 'Yes / No',
    label: 'Yes / No Toggle',
    category: 'CHOICE',
    description: 'Binary decision toggle',
    defaultOptions: ['Yes', 'No'],
    hasOptions: true,
  },
  {
    type: 'Rating',
    label: 'Rating Scale (1-10)',
    category: 'NUMERIC',
    description: 'Numeric rating or satisfaction scale',
    defaultOptions: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    hasOptions: true,
  },
  {
    type: 'Net Promoter Score',
    label: 'Net Promoter Score (NPS 0-10)',
    category: 'NUMERIC',
    description: 'Standard 0-10 likelihood recommendation scale',
    defaultOptions: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    hasOptions: true,
  },
  {
    type: 'Short Text',
    label: 'Short Text Input',
    category: 'TEXT',
    description: 'Single-line text entry for names, IDs, or brief terms',
    defaultOptions: [],
    hasOptions: false,
  },
  {
    type: 'Paragraph',
    label: 'Paragraph / Long Text',
    category: 'TEXT',
    description: 'Multi-line text area for detailed commentary or clinical notes',
    defaultOptions: [],
    hasOptions: false,
  },
  {
    type: 'Number',
    label: 'Numeric Value',
    category: 'NUMERIC',
    description: 'Discrete integer or decimal measure (e.g. vitals, lab values)',
    defaultOptions: [],
    hasOptions: false,
  },
  {
    type: 'Date',
    label: 'Date Picker',
    category: 'DATETIME',
    description: 'Calendar date selection (YYYY-MM-DD)',
    defaultOptions: [],
    hasOptions: false,
  },
  {
    type: 'Date Time',
    label: 'Date & Time Picker',
    category: 'DATETIME',
    description: 'Timestamp selector for exact symptom or event occurrence',
    defaultOptions: [],
    hasOptions: false,
  },
  {
    type: 'Email',
    label: 'Email Address',
    category: 'TEXT',
    description: 'Validated email format input',
    defaultOptions: [],
    hasOptions: false,
  },
  {
    type: 'Phone',
    label: 'Phone Number',
    category: 'TEXT',
    description: 'Telephone number format input',
    defaultOptions: [],
    hasOptions: false,
  },
  {
    type: 'Matrix / Likert',
    label: 'Matrix / Likert Scale',
    category: 'ADVANCED',
    description: 'Multi-statement agreement grid (Strongly Disagree to Strongly Agree)',
    defaultOptions: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
    hasOptions: true,
  },
  {
    type: 'File Upload',
    label: 'Document / File Attachment',
    category: 'ADVANCED',
    description: 'File uploader for signed consent scans or lab reports',
    defaultOptions: [],
    hasOptions: false,
  },
  {
    type: 'Section / Page',
    label: 'Section / Page Divider',
    category: 'ADVANCED',
    description: 'Informational header or page divider without response input',
    defaultOptions: [],
    hasOptions: false,
  },
];
