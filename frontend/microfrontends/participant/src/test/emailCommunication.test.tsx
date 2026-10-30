// frontend/microfrontends/participant/src/test/emailCommunication.test.tsx - Unit tests for Email Communication History & Compose
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ParticipantEmailSection } from '../components/ParticipantEmailSection';
import { ComposeEmailModal, isEmailDesignEmpty } from '../components/ComposeEmailModal';

describe('Email Communication History & Compose Modal', () => {
  it('detects an empty email design and a design containing content', () => {
    expect(isEmailDesignEmpty({ body: { rows: [{ columns: [{ contents: [] }] }] } })).toBe(true);
    expect(isEmailDesignEmpty({ body: { rows: [{ columns: [{ contents: [{ type: 'text' }] }] }] } })).toBe(false);
  });

  it('renders ParticipantEmailSection with dark blue table header and compose button', () => {
    const html = renderToString(
      <ParticipantEmailSection
        participantId="part-1"
        participantName="John Doe"
      />
    );

    expect(html).toContain('Email Communication History');
    expect(html).toContain('Compose Email');
  });

  it('renders the legacy email fields and drag-and-drop message designer', () => {
    const html = renderToString(
      <ComposeEmailModal
        isOpen={true}
        onClose={vi.fn()}
        participantId="part-1"
        participantName="John Doe"
        onEmailSent={vi.fn()}
      />
    );

    expect(html).toContain('Add Participant Email — John Doe');
    expect(html).toContain('To');
    expect(html).toContain('CC');
    expect(html).toContain('BCC');
    expect(html).toContain('Reply To Address');
    expect(html).toContain('Sender Name');
    expect(html).toContain('Subject');
    expect(html).toContain('Message');
    expect(html).toContain('email-design-editor');
    expect(html).toContain('Attachments');
    expect(html).toContain('Mark Email As:');
    expect(html).toContain('Contact');
    expect(html).toContain('Pin Email');
    expect(html).toContain('Global');
    expect(html).toContain('Notify');
  });
});
