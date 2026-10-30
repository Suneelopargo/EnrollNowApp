// frontend/microfrontends/participant/src/types/participant.ts - TypeScript Contracts for Participant & Registry

export const isContactForFutureStudies = (value: unknown): boolean =>
  value === true || (typeof value === 'string' && value.trim().toLowerCase() === 'true');

export interface StudyItem {
  id?: string;
  studyId?: string;
  studyCode?: string;
  name: string;
  isLink?: boolean;
  status?: string;
  participantStudyId?: string;
  archived?: boolean;
}

export interface GlobalVariableOption {
  value: string;
  label: string;
}

export interface GlobalVariableDefinition {
  id: string;
  name: string;
  type: string;
  isBlind?: boolean;
  options?: GlobalVariableOption[];
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

export interface FamilyMember {
  id: string;
  name: string;
  sex?: string;
  age?: string;
  studies?: string[];
}

export interface FamilyInfo {
  familyRole?: string;
  membersCount?: number;
  pedigreeTreeId?: string;
  guardianName?: string;
  members?: FamilyMember[];
}

export interface ParticipantVariable {
  id?: string;
  name: string;
  type?: string;
  value: string;
  lastUpdated?: string;
}

export interface ParticipantRecord {
  id: string;
  name: string;
  firstName?: string;
  middleName?: string;
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

export type FilterFieldType = 'text' | 'number' | 'select' | 'multiselect' | 'date';

export interface FilterOptionItem {
  value: string;
  label: string;
}

export interface FilterFieldOption {
  id: string;
  label: string;
  placeholder: string;
  type: FilterFieldType;
  options?: FilterOptionItem[];
}

export interface CustomFilterRule {
  id: string;
  field: string;
  operator: string;
  value?: string;
  minValue?: string;
  maxValue?: string;
  values?: string[];
  placeholder?: string;
  [key: string]: any;
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

export type {
  ContactLogItem,
  CreateContactLogPayload,
  UpdateContactLogPayload,
  ContactOutcomeOption,
  ContactTypeOption,
  ContactMethodOption,
  ContactTeamMember,
  ParticipantCommentItem,
  CommunicationItem,
  CommunicationRecipientItem,
  ParticipantContactDetail,
  ParticipantAddressDetail,
  ConsentItem,
  ConsentOptionItem,
  SurveyAssignmentItem,
  SurveyOptionItem,
} from '../../../../shared/api/participantApi';
