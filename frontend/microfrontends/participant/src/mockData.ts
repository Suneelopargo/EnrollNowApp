// frontend/microfrontends/participant/src/mockData.ts - UI Configuration Options for Participant MFE
import { FilterFieldOption } from './types/participant';

export const filterFieldOptions: FilterFieldOption[] = [
  { id: 'age', label: 'Age', placeholder: 'e.g. 1y6m or 18mo or 1.5 or 34', type: 'number' },
  { id: 'gender', label: 'Sex/Gender', placeholder: 'e.g. Male, Female, Other', type: 'select' },
  { id: 'studies', label: 'Studies', placeholder: 'e.g. ADRC Comm Hour, Autism Study', type: 'text' },
  { id: 'tags', label: 'Tags', placeholder: 'e.g. Pediatric, Cohort Alpha', type: 'text' },
  { id: 'ethnicity', label: 'Ethnicity', placeholder: 'e.g. Hispanic, Not Hispanic', type: 'text' },
  { id: 'race', label: 'Race', placeholder: 'e.g. White, Asian, Black', type: 'text' },
  { id: 'city', label: 'City', placeholder: 'e.g. Philadelphia, Chicago', type: 'text' },
  { id: 'state', label: 'State', placeholder: 'e.g. PA, IL, WA', type: 'text' },
  { id: 'zipcode', label: 'Zipcode', placeholder: 'e.g. 19104, 60603', type: 'text' },
  { id: 'phone', label: 'Phone Number', placeholder: 'e.g. 215, 312', type: 'text' },
  { id: 'status', label: 'Participant Status', placeholder: 'e.g. Active, Enrolled, Screening', type: 'text' },
  { id: 'lastContact', label: 'Last Contact', placeholder: 'DD/MM/YYYY or 24/09/2026', type: 'date' },
  { id: 'dateCreated', label: 'Date Created', placeholder: 'DD/MM/YYYY', type: 'date' },
  { id: 'birthMonth', label: 'Birth Month', placeholder: 'e.g. January, March, May', type: 'text' },
  { id: 'firstName', label: 'First Name', placeholder: 'e.g. Drexel, Alli, Jackson', type: 'text' },
  { id: 'lastName', label: 'Last Name', placeholder: 'e.g. Adams, Vance', type: 'text' },
];

export const operatorOptions: string[] = [
  'equal to',
  'not equal to',
  'contains',
  'does not contain',
  'starts with',
  'ends with',
  'greater than',
  'less than',
  'is empty',
  'is not empty',
];

export const timezoneOptions: string[] = [
  'America/New_York (EDT)',
  'America/Chicago (CDT)',
  'America/Denver (MDT)',
  'America/Los_Angeles (PDT)',
  'Europe/London (BST/GMT)',
  'Europe/Paris (CEST)',
  'Asia/Kolkata (IST)',
  'Asia/Tokyo (JST)',
  'Australia/Sydney (AEST)',
];
