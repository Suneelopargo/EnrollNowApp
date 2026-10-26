// frontend/microfrontends/study/src/test/studySettingsEmailAndText.test.tsx
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  StudySettingsEmailAndText,
  checkMessageForBrokenMergeTags,
  MAX_SMS_LENGTH,
  STANDARD_MERGE_TAGS,
} from '../components/StudySettingsEmailAndText';
import { StudySettingsWorkspace } from '../components/StudySettingsWorkspace';
import { studyApi } from '../../../../shared/api/studyApi';

vi.mock('../../../../shared/api/studyApi', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    studyApi: {
      ...actual.studyApi,
      getStudyEmailTextSettings: vi.fn(),
      createEmailTemplate: vi.fn(),
      updateEmailTemplate: vi.fn(),
      copyEmailTemplate: vi.fn(),
      archiveEmailTemplate: vi.fn(),
      restoreEmailTemplate: vi.fn(),
      deleteEmailTemplate: vi.fn(),
      reorderEmailTemplates: vi.fn(),
      createTextTemplate: vi.fn(),
      updateTextTemplate: vi.fn(),
      copyTextTemplate: vi.fn(),
      archiveTextTemplate: vi.fn(),
      restoreTextTemplate: vi.fn(),
      deleteTextTemplate: vi.fn(),
      reorderTextTemplates: vi.fn(),
    },
  };
});

describe('Study Settings — Email and Text Remediation Tests', () => {
  describe('checkMessageForBrokenMergeTags', () => {
    it('returns null for empty or null message', () => {
      expect(checkMessageForBrokenMergeTags(null)).toBeNull();
      expect(checkMessageForBrokenMergeTags('')).toBeNull();
    });

    it('returns null for message with valid merge tags', () => {
      const msg = 'Hello {{firstName}} {{lastName}}, welcome to {{studyName}} on {{event_date}}!';
      expect(checkMessageForBrokenMergeTags(msg)).toBeNull();
    });

    it('detects unmatched opening braces', () => {
      const msg = 'Hello {{firstName, your appointment is tomorrow.';
      expect(checkMessageForBrokenMergeTags(msg)).toBe('Unmatched merge tag brackets');
    });

    it('detects unmatched closing braces', () => {
      const msg = 'Hello firstName}}, your appointment is tomorrow.';
      expect(checkMessageForBrokenMergeTags(msg)).toBe('Unmatched merge tag brackets');
    });

    it('detects empty merge tag', () => {
      const msg = 'Hello {{}}, your appointment is tomorrow.';
      expect(checkMessageForBrokenMergeTags(msg)).toBe('Empty merge tag detected');
    });

    it('detects invalid characters inside merge tags', () => {
      const msg = 'Hello {{first name with spaces}}!';
      expect(checkMessageForBrokenMergeTags(msg)).toContain('Invalid tag syntax');
    });
  });

  describe('Constants and Specifications', () => {
    it('enforces SMS max length of 1600 characters matching legacy Ripple', () => {
      expect(MAX_SMS_LENGTH).toBe(1600);
    });

    it('provides standard merge tags including participant, study, and appointment tags', () => {
      const tagStrings = STANDARD_MERGE_TAGS.map((t) => t.tag);
      expect(tagStrings).toContain('{{firstName}}');
      expect(tagStrings).toContain('{{lastName}}');
      expect(tagStrings).toContain('{{customId}}');
      expect(tagStrings).toContain('{{studyName}}');
      expect(tagStrings).toContain('{{event_date}}');
      expect(tagStrings).toContain('{{event_name}}');
    });
  });

  describe('Component Rendering', () => {
    it('renders initial loading state', () => {
      const html = renderToStaticMarkup(
        <StudySettingsEmailAndText studyId="study-100" />
      );
      expect(html).toContain('Loading Email and Text Settings...');
      expect(html).toContain('data-testid="email-text-loading"');
    });

    it('renders email and text workspace when activeSubmenu is email_and_text', () => {
      const html = renderToStaticMarkup(
        <StudySettingsWorkspace
          studyId="study-100"
          studyName="Diabetes Trial Phase II"
          initialSubmenu="email_and_text"
        />
      );
      expect(html).toContain('Email and Text');
      expect(html).toContain('data-testid="submenu-email-and-text"');
      expect(html).toContain('data-testid="email-text-loading"');
    });
  });
});
