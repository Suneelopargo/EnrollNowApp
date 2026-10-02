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
  accentColor: string;
  bgColor: string;
}

export interface StatisticItem {
  id: string;
  value: string;
  label: string;
  iconName: 'users' | 'building' | 'chart';
}

export interface FloatingCardItem {
  id: string;
  title: string;
  iconName: 'users' | 'calendar' | 'chart';
  type: 'checklist' | 'skeleton';
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
      accentColor: '#0284c7',
      bgColor: '#e0f2fe',
    },
    {
      id: 'schedule',
      title: 'Schedule & Enroll',
      description: 'Simplify scheduling and enrollment workflows.',
      iconName: 'calendar',
      accentColor: '#10b981',
      bgColor: '#d1fae5',
    },
    {
      id: 'manage',
      title: 'Manage Studies',
      description: 'Keep your studies organized with real-time insights.',
      iconName: 'chart',
      accentColor: '#8b5cf6',
      bgColor: '#ede9fe',
    },
    {
      id: 'secure',
      title: 'Secure & Compliant',
      description: 'Built for research with industry standards.',
      iconName: 'shield',
      accentColor: '#f59e0b',
      bgColor: '#fef3c7',
    },
  ],
  statistics: [
    {
      id: 'participants',
      value: '50K+',
      label: 'Participants Enrolled',
      iconName: 'users',
    },
    {
      id: 'organizations',
      value: '200+',
      label: 'Organizations',
      iconName: 'building',
    },
    {
      id: 'uptime',
      value: '99.9%',
      label: 'Uptime',
      iconName: 'chart',
    },
  ],
  floatingCards: [
    {
      id: 'screening',
      title: 'Participant Screening',
      iconName: 'users',
      type: 'checklist',
      checkItems: ['Eligibility Check', 'Questionnaire', 'Pre-screen Results'],
    },
    {
      id: 'appointments',
      title: 'Schedule Appointments',
      iconName: 'calendar',
      type: 'skeleton',
    },
    {
      id: 'engage',
      title: 'Engage Participants',
      iconName: 'chart',
      type: 'skeleton',
    },
  ],
};

export const defaultStatistics: StatisticItem[] = loginContent.statistics;
