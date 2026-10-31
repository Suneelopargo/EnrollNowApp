// frontend/shared/design-system.test.ts - Unit Tests for Design System SCSS Components
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { LoadingSpinner } from './design-system/components/LoadingSpinner';
import { Skeleton } from './design-system/components/Skeleton';
import { ComingSoon } from './design-system/components/ComingSoon';
import { Card } from './design-system/components/Card';
import { Footer } from './design-system/components/Footer';

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

  describe('ComingSoon Component', () => {
    it('renders accessible region with feature title and target release', () => {
      const element = ComingSoon({
        title: 'Batch Import & Intake',
        subtitle: 'CSV participant onboarding',
        targetRelease: 'Sprint 3 Delivery',
      }) as React.ReactElement<any>;

      expect(element).toBeDefined();
      expect(element.props.role).toBe('region');
      expect(element.props['aria-label']).toContain('Batch Import & Intake');
      expect(element.props.className).toContain('coming-soon-container');
    });
  });

  describe('Card Component Accessibility & Keyboard Support', () => {
    it('omits button role and tabIndex when onClick is not provided', () => {
      const element = Card({
        title: 'Static Card',
        children: 'Body content',
      }) as React.ReactElement<any>;

      expect(element.props.role).toBeUndefined();
      expect(element.props.tabIndex).toBeUndefined();
      expect(element.props.onKeyDown).toBeUndefined();
    });

    it('adds role="button", tabIndex=0, and Enter/Space keyboard activation when onClick is provided', () => {
      const onClick = vi.fn();
      const element = Card({
        title: 'Interactive Card',
        children: 'Clickable content',
        onClick,
      }) as React.ReactElement<any>;

      expect(element.props.role).toBe('button');
      expect(element.props.tabIndex).toBe(0);
      expect(typeof element.props.onKeyDown).toBe('function');

      const preventDefault = vi.fn();
      element.props.onKeyDown({ key: 'Enter', preventDefault });
      expect(preventDefault).toHaveBeenCalledTimes(1);
      expect(onClick).toHaveBeenCalledTimes(1);

      element.props.onKeyDown({ key: ' ', preventDefault });
      expect(onClick).toHaveBeenCalledTimes(2);
    });

    it('ignores bubbled Enter/Space keydown events from nested child elements (target !== currentTarget)', () => {
      const onClick = vi.fn();
      const element = Card({
        title: 'Interactive Card with Child Action',
        children: 'Clickable content',
        onClick,
      }) as React.ReactElement<any>;

      const preventDefault = vi.fn();
      const cardNode = {};
      const childButtonNode = {};

      element.props.onKeyDown({
        key: 'Enter',
        target: childButtonNode,
        currentTarget: cardNode,
        preventDefault,
      });
      element.props.onKeyDown({
        key: ' ',
        target: childButtonNode,
        currentTarget: cardNode,
        preventDefault,
      });

      expect(preventDefault).not.toHaveBeenCalled();
      expect(onClick).not.toHaveBeenCalled();

      // Direct keydown on the card itself still fires
      element.props.onKeyDown({
        key: 'Enter',
        target: cardNode,
        currentTarget: cardNode,
        preventDefault,
      });
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('triggers card onClick on ordinary non-interactive card content clicks and ignores clicks from nested buttons, controls, or header actions', () => {
      const onCardClick = vi.fn();
      const onNestedButtonClick = vi.fn();
      const element = Card({
        title: 'Protocol Card',
        subtitle: 'Phase II Trial',
        actions: React.createElement(
          'button',
          { type: 'button', onClick: onNestedButtonClick },
          'View All'
        ),
        children: React.createElement('p', null, 'Non-interactive body copy'),
        onClick: onCardClick,
      }) as React.ReactElement<any>;

      const cardNode = { tagName: 'DIV', role: 'button' };
      const titleNode = { tagName: 'H3', parentElement: cardNode };
      const bodyParagraphNode = {
        tagName: 'P',
        parentElement: { tagName: 'DIV', className: 'card-body', parentElement: cardNode },
      };

      // 1. Ordinary clicks on card container, title, and body copy trigger onCardClick once each
      element.props.onClick({ target: cardNode, currentTarget: cardNode });
      expect(onCardClick).toHaveBeenCalledTimes(1);

      element.props.onClick({ target: titleNode, currentTarget: cardNode });
      expect(onCardClick).toHaveBeenCalledTimes(2);

      element.props.onClick({ target: bodyParagraphNode, currentTarget: cardNode });
      expect(onCardClick).toHaveBeenCalledTimes(3);

      // 2. Click on a nested button or an icon/span inside a nested button does NOT trigger onCardClick
      const nestedButtonNode = { tagName: 'BUTTON', parentElement: cardNode };
      const nestedButtonIconSpan = { tagName: 'SPAN', parentElement: nestedButtonNode };

      onNestedButtonClick();
      element.props.onClick({ target: nestedButtonNode, currentTarget: cardNode });
      element.props.onClick({ target: nestedButtonIconSpan, currentTarget: cardNode });
      expect(onNestedButtonClick).toHaveBeenCalledTimes(1);
      expect(onCardClick).toHaveBeenCalledTimes(3);

      // 3. Click on nested link, input, role="button" child, or header actions wrapper does NOT trigger onCardClick
      const nestedLinkNode = { tagName: 'A', parentElement: cardNode };
      const nestedInputNode = { tagName: 'INPUT', parentElement: cardNode };
      const nestedRoleButtonNode = { tagName: 'DIV', role: 'button', parentElement: cardNode };
      const headerActionsChildNode = {
        tagName: 'SPAN',
        parentElement: {
          tagName: 'DIV',
          dataset: { cardActions: 'true' },
          parentElement: cardNode,
        },
      };

      element.props.onClick({ target: nestedLinkNode, currentTarget: cardNode });
      element.props.onClick({ target: nestedInputNode, currentTarget: cardNode });
      element.props.onClick({ target: nestedRoleButtonNode, currentTarget: cardNode });
      element.props.onClick({ target: headerActionsChildNode, currentTarget: cardNode });
      expect(onCardClick).toHaveBeenCalledTimes(3);

      // 4. Keyboard activation on nested button (keydown + synthesized click bubbling) runs only nested button action
      const preventDefault = vi.fn();
      element.props.onKeyDown({
        key: 'Enter',
        target: nestedButtonNode,
        currentTarget: cardNode,
        preventDefault,
      });
      onNestedButtonClick();
      element.props.onClick({ target: nestedButtonNode, currentTarget: cardNode });
      expect(onNestedButtonClick).toHaveBeenCalledTimes(2);
      expect(onCardClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('Footer Component Variants (App Shell, Auth, Auth Card)', () => {
    it('renders app-shell, auth, and auth-card variants with contentinfo landmark', () => {
      const shellFooterFragment = Footer({ variant: 'app-shell' }) as React.ReactElement<any>;
      const shellChildren = React.Children.toArray(shellFooterFragment.props.children);
      const shellFooter = shellChildren.find(
        (child): child is React.ReactElement<any> =>
          React.isValidElement(child) && child.type === 'footer'
      );
      const shellWave = shellChildren.find(
        (child): child is React.ReactElement<{ className?: string }> =>
          React.isValidElement<{ className?: string }>(child) &&
          child.props.className === 'app-shell-footer-wave'
      );
      expect(shellWave).toBeDefined();
      expect(shellFooter).toBeDefined();
      if (!shellFooter) {
        throw new Error('App-shell footer was not rendered.');
      }
      expect(shellFooter.props.role).toBe('contentinfo');
      expect(shellFooter.props.className).toContain('app-footer');
      expect(shellFooter.props.className).toContain('enl-login-strong-footer');
      expect(shellFooter.props.className).toContain('app-shell-footer');

      const authFooter = Footer({ variant: 'auth' }) as React.ReactElement<any>;
      expect(authFooter.props.role).toBe('contentinfo');
      expect(authFooter.props.className).toContain('enl-login-strong-footer');

      const authCardFooter = Footer({ variant: 'auth-card' }) as React.ReactElement<any>;
      expect(authCardFooter.props.role).toBe('contentinfo');
      expect(authCardFooter.props.className).toContain('enl-activation-footer');
    });
  });
});
