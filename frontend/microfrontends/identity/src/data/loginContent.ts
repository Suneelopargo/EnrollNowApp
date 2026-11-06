// frontend/microfrontends/identity/src/data/loginContent.ts
// Data-driven content configuration for the EnrollNow Login Page

export interface HeadlineConfig {
  line1: string;
  line2: string;
  emphasis: string;
}

export interface FeatureHighlight {
  id: string;
  title: string;
  description: string;
  iconName: 'users' | 'calendar' | 'chart' | 'shield';
}

export interface StatisticItem {
  id: string;
  value: string;
  label: string;
  iconName: 'users' | 'building' | 'chart';
}

export interface FloatingCardItem {
  id: string;
  stageNumber?: number;
  stageBadge?: string;
  title: string;
  iconName: 'users' | 'calendar' | 'chart';
  type: 'checklist';
  checkItems?: string[];
}

export interface LoginContentConfig {
  brand: {
    namePrefix: string;
    nameSuffix: string;
    tagline: string;
  };
  headline: HeadlineConfig;
  description: string;
  features: FeatureHighlight[];
  statistics: StatisticItem[];
  floatingCards: FloatingCardItem[];
}

export const loginContent: LoginContentConfig = {
  brand: {
    namePrefix: 'Enroll',
    nameSuffix: 'Now',
    tagline: 'Screen. Schedule. Engage.',
  },
  headline: {
    line1: 'Advancing',
    line2: 'Clinical Research',
    emphasis: 'Together',
  },
  description:
    'A unified platform to screen, schedule and engage participants across your studies.',
  features: [
    {
      id: 'recruit',
      title: 'Recruit & Prescreen',
      description: 'Find and engage the right participants faster.',
      iconName: 'users',
    },
    {
      id: 'schedule',
      title: 'Schedule & Enroll',
      description: 'Simplify scheduling and enrollment workflows.',
      iconName: 'calendar',
    },
    {
      id: 'manage',
      title: 'Manage Studies & Registries',
      description: 'Keep your studies organized with real-time insights.',
      iconName: 'chart',
    },
    {
      id: 'secure',
      title: 'Secure & Compliant',
      description: 'Built for research with industry standards.',
      iconName: 'shield',
    },
  ],
  statistics: [
   
  ],
  floatingCards: [
    {
      id: 'screening',
      stageNumber: 1,      
      title: 'Participant Screening',
      iconName: 'users',
      type: 'checklist',
      checkItems: ['Eligibility Check', 'Questionnaire', 'Pre-screen Results'],
    },
    {
      id: 'appointments',
      stageNumber: 2,      
      title: 'Schedule Appointments',
      iconName: 'calendar',
      type: 'checklist',
      checkItems: [
        'Schedule participant visits',
        'Track event outcomes',
        'Mark events as completed',
      ],
    },
    {
      id: 'engage',
      stageNumber: 3,    
      title: 'Engage Participants',
      iconName: 'chart',
      type: 'checklist',
      checkItems: [
        'Track email and text messages',
        'Log outreach attempts and outcomes',
        'Manage follow-up tasks',
      ],
    },
  ],
};

export const defaultStatistics: StatisticItem[] = loginContent.statistics;
