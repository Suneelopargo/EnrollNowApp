// frontend/shared/design-system.test.ts - Unit Tests for Design System SCSS Components
import { describe, it, expect } from 'vitest';
import React from 'react';
import { LoadingSpinner } from './design-system/components/LoadingSpinner';
import { Skeleton } from './design-system/components/Skeleton';

describe('Design System SCSS Components', () => {
  describe('LoadingSpinner Component (Clinical OS Card & Inline Variants)', () => {
    it('creates high-tech card loader structure with default page props', () => {
      const element = LoadingSpinner({
        message: 'Processing Request & Syncing Data...',
      }) as React.ReactElement<any>;

      expect(element).toBeDefined();
      expect(element.props.className).toContain('enl-loader-backdrop');
      expect(element.props.className).toContain('enl-loader-backdrop--page');
      expect(element.props.role).toBe('status');
      expect(element.props['aria-live']).toBe('assertive');

      const card = element.props.children as React.ReactElement<any>;
      expect(card.props.className).toContain('enl-loader-card');
      expect(card.props.className).toContain('enl-loader-card--md');
    });

    it('creates overlay variant with correct modifier class', () => {
      const overlaySpinner = LoadingSpinner({
        variant: 'overlay',
        size: 'lg',
        message: 'Syncing clinical data...',
      }) as React.ReactElement<any>;

      expect(overlaySpinner.props.className).toContain('enl-loader-backdrop');
      expect(overlaySpinner.props.className).toContain('enl-loader-backdrop--overlay');

      const card = overlaySpinner.props.children as React.ReactElement<any>;
      expect(card.props.className).toContain('enl-loader-card--lg');
    });

    it('creates compact inline variant for buttons or inline rows', () => {
      const inlineSpinner = LoadingSpinner({
        variant: 'inline',
        size: 'sm',
        message: 'Saving...',
      }) as React.ReactElement<any>;

      expect(inlineSpinner.props.className).toContain('loading-spinner');
      expect(inlineSpinner.props.className).toContain('loading-spinner--inline');
      expect(inlineSpinner.props.className).toContain('loading-spinner--sm');
      expect(inlineSpinner.props.className).toContain('spinner-container');
    });
  });

  describe('Skeleton Component', () => {
    it('renders single text skeleton with correct BEM classes', () => {
      const skeleton = Skeleton({ variant: 'text' }) as React.ReactElement<any>;
      expect(skeleton.props.className).toContain('skeleton');
      expect(skeleton.props.className).toContain('skeleton--text');
      expect(skeleton.props.role).toBe('status');
    });

    it('renders circular and rectangular skeleton variants', () => {
      const circular = Skeleton({ variant: 'circular' }) as React.ReactElement<any>;
      expect(circular.props.className).toContain('skeleton--circular');

      const rectangular = Skeleton({ variant: 'rectangular' }) as React.ReactElement<any>;
      expect(rectangular.props.className).toContain('skeleton--rectangular');

      const card = Skeleton({ variant: 'card' }) as React.ReactElement<any>;
      expect(card.props.className).toContain('skeleton--card');
    });

    it('renders multi-line text skeleton group', () => {
      const multiline = Skeleton({ variant: 'text', lines: 3 }) as React.ReactElement<any>;
      expect(multiline.props.className).toContain('skeleton-group');
      expect(multiline.props.children).toHaveLength(3);
    });
  });
});
