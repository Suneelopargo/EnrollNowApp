// frontend/microfrontends/administration/src/test/ResetAllPasswordsModal.test.tsx
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ResetAllPasswordsModal } from '../components/ResetAllPasswordsModal';

describe('ResetAllPasswordsModal Component', () => {
  it('renders null when isOpen is false', () => {
    const html = renderToStaticMarkup(
      <ResetAllPasswordsModal
        isOpen={false}
        onForceReset={vi.fn()}
        onLeaveIntact={vi.fn()}
      />
    );
    expect(html).toBe('');
  });

  it('renders modal with exact legacy copy and accessible dialog role when isOpen is true', () => {
    const html = renderToStaticMarkup(
      <ResetAllPasswordsModal
        isOpen={true}
        onForceReset={vi.fn()}
        onLeaveIntact={vi.fn()}
      />
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('Reset Password for All Users in Team');
    expect(html).toContain('You just changed the password requirements for the team.');
    expect(html).toContain('Leave existing passwords intact');
    expect(html).toContain('Force reset all passwords');
    expect(html).toContain('sec-btn-force-reset');
    expect(html).toContain('sec-btn-leave-intact');
    expect(html).toContain('—');
  });

  it('renders resetting state when isResetting is true', () => {
    const html = renderToStaticMarkup(
      <ResetAllPasswordsModal
        isOpen={true}
        onForceReset={vi.fn()}
        onLeaveIntact={vi.fn()}
        isResetting={true}
      />
    );

    expect(html).toContain('Resetting All Passwords...');
    expect(html).toContain('disabled=""');
  });
});
