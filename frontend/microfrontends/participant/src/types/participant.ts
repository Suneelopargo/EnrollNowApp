// frontend/microfrontends/participant/src/types/participant.ts - TypeScript Contracts for Participant & Registry

export interface StudyItem {
  name: string;
  isLink?: boolean;
}

export interface ContactMethods {
  primaryEmail?: string;
  secondaryEmail?: string;
  phone?: string;
  address?: string;
  preferredMethod?: string;
}

export interface Demographics {
  dob?: string;
  gender?: string;
  ethnicity?: string;
  race?: string;
  primaryLanguage?: string;
}

export interface FamilyInfo {
  familyRole?: string;
  membersCount?: number;
  pedigreeTreeId?: string;
  guardianName?: string;
}

export interface ParticipantVariable {
  name: string;
  value: string;
  lastUpdated?: string;
}

export interface ParticipantRecord {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  studies?: StudyItem[];
  gender?: string;
  age?: string;
  ageNumeric?: number;
  lastContact?: string;
  status?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  phone?: string;
  familyId?: string;
  dateCreated?: string;
  globalId?: string;
  timezone?: string;
  tags?: string[];
  contactForFutureStudies?: boolean;
  availableToAddStudy?: boolean;
  globalDateOfLastContact?: string;
  birthMonth?: string;
  contactMethods?: ContactMethods;
  demographics?: Demographics;
  family?: FamilyInfo;
  variables?: ParticipantVariable[];
}

export interface FilterFieldOption {
  id: string;
  label: string;
  placeholder: string;
  type: 'text' | 'number' | 'select' | 'date';
}

export interface CustomFilterRule {
  id: string;
  field: string;
  operator: string;
  value: string;
  placeholder?: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  contactFilter?: 'all' | 'yes' | 'no';
  availableFilter?: 'all' | 'yes' | 'no';
  searchTerm?: string;
  selectedStudies?: string[];
  customFilters?: CustomFilterRule[];
}

export interface ToastNotification {
  message: string;
  type?: 'info' | 'success' | 'error' | 'warning';
}
