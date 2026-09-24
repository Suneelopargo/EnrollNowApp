// frontend/microfrontends/survey/src/constants/templates.ts
import { Section, Question, LogicRule } from '../types/survey';

export interface SurveyTemplate {
  id: string;
  name: string;
  title: string;
  category: string;
  description: string;
  sections: Section[];
  questions: Question[];
  logicRules: LogicRule[];
}

export const CLINICAL_SURVEY_TEMPLATES: SurveyTemplate[] = [
  {
    id: 'psqi-sleep-quality',
    name: 'Pittsburgh Sleep Quality Index (PSQI)',
    title: 'Pittsburgh Sleep Quality Index (PSQI)',
    category: 'Sleep & Neurology',
    description: 'Validated 18-item instrument assessing sleep quality, duration, and nighttime disruptions over a 1-month interval.',
    sections: [
      { title: 'Sleep Schedule & Duration', description: 'Bedtime and sleep duration', position: 0 },
      { title: 'Nighttime Disturbances', description: 'Sleep disruption causes', position: 1 },
    ],
    questions: [
      { position: 0, sectionId: 0, type: 'Number', text: 'During the past month, how many hours of actual sleep did you get per night on average?', required: true, options: [] },
      { position: 1, sectionId: 0, type: 'Dropdown', text: 'How long did it usually take you to fall asleep each night?', required: true, options: ['< 15 minutes', '16-30 minutes', '31-60 minutes', '> 60 minutes'] },
      { position: 2, sectionId: 1, type: 'Multiple Choice', text: 'During the past month, what caused you to wake up in the middle of the night?', required: false, options: ['Cannot breathe comfortably', 'Cough or snore loudly', 'Feel too cold', 'Feel too hot', 'Had bad dreams', 'Have pain'] },
      { position: 3, sectionId: 1, type: 'Rating', text: 'During the past month, how would you rate your sleep quality overall? (1=Very Bad, 10=Very Good)', required: true, options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
    ],
    logicRules: [],
  },
  {
    id: 'cardio-baseline-assessment',
    name: 'Cardiovascular Health Screening',
    title: 'Cardiovascular Health Screening',
    category: 'Cardiology',
    description: 'Protocol questionnaire for evaluating cardiovascular risk factors, medical history, and baseline vitals.',
    sections: [
      { title: 'Medical History', description: 'Diagnosed cardiovascular conditions', position: 0 },
      { title: 'Recent Symptoms', description: 'Acute symptom occurrence', position: 1 },
    ],
    questions: [
      { position: 0, sectionId: 0, type: 'Multiple Choice', text: 'Have you ever been diagnosed with any of the following conditions?', required: true, options: ['Hypertension', 'Coronary Artery Disease', 'Heart Failure', 'Hyperlipidemia', 'Type 2 Diabetes', 'None of the above'] },
      { position: 1, sectionId: 0, type: 'Rating', text: 'Rate your typical daily physical stamina on a scale of 1 to 10:', required: true, options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
      { position: 2, sectionId: 1, type: 'Yes / No', text: 'Have you experienced unexpected shortness of breath or chest discomfort in the past 14 days?', required: true, options: ['Yes', 'No'] },
      { position: 3, sectionId: 1, type: 'Paragraph', text: 'Please describe the duration, severity, and triggers of any chest discomfort:', required: false, options: [] },
    ],
    logicRules: [
      { ifQuestionId: 2, condition: 'is', value: 'Yes', thenAction: 'SHOW_QUESTION', thenQuestionId: 3 },
    ],
  },
  {
    id: 'adverse-event-diary',
    name: 'Adverse Event (AE) Daily Diary',
    title: 'Adverse Event (AE) Daily Diary',
    category: 'Safety & Pharmacovigilance',
    description: 'Daily symptom tracking log to capture potential adverse drug reactions, severity, and concomitant medication use.',
    sections: [
      { title: 'Dose Confirmation', description: 'Investigational product intake', position: 0 },
      { title: 'Symptom Tracking', description: 'Emergent side effects', position: 1 },
    ],
    questions: [
      { position: 0, sectionId: 0, type: 'Yes / No', text: 'Did you take your scheduled study medication dose today?', required: true, options: ['Yes', 'No'] },
      { position: 1, sectionId: 1, type: 'Yes / No', text: 'Did you experience any new symptoms or adverse health events today?', required: true, options: ['Yes', 'No'] },
      { position: 2, sectionId: 1, type: 'Dropdown', text: 'What was the peak severity level of the symptom?', required: true, options: ['Mild (Noticeable, easily tolerated)', 'Moderate (Interferes with normal daily activity)', 'Severe (Incapacitating, inability to work)'] },
      { position: 3, sectionId: 1, type: 'Paragraph', text: 'List any rescue medications or treatment taken to alleviate the symptom:', required: false, options: [] },
    ],
    logicRules: [
      { ifQuestionId: 1, condition: 'is', value: 'Yes', thenAction: 'SHOW_QUESTION', thenQuestionId: 2 },
      { ifQuestionId: 1, condition: 'is', value: 'Yes', thenAction: 'SHOW_QUESTION', thenQuestionId: 3 },
    ],
  },
];

export const SURVEY_TEMPLATES = CLINICAL_SURVEY_TEMPLATES;
