// frontend/microfrontends/participant/src/test/emailCommunication.test.tsx - Unit tests for Email Communication History & Compose
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { getEmailPreviewDocument, ParticipantEmailSection } from '../components/ParticipantEmailSection';
import {
  ComposeEmailModal,
  formatEmailRecipientOption,
  isEmailDesignEmpty,
  mapEmailRecipientOptions,
} from '../components/ComposeEmailModal';

describe('Email Communication History & Compose Modal', () => {
  it('detects an empty email design and a design containing content', () => {
    expect(isEmailDesignEmpty({ body: { rows: [{ columns: [{ contents: [] }] }] } })).toBe(true);
    expect(isEmailDesignEmpty({ body: { rows: [{ columns: [{ contents: [{ type: 'text' }] }] }] } })).toBe(false);
  });

  it('renders email HTML as a preview and escapes plain-text messages', () => {
    expect(getEmailPreviewDocument('<p>Welcome</p>', true)).toBe('<p>Welcome</p>');
    expect(getEmailPreviewDocument('<script>alert(1)</script>', false)).toContain(
      '&lt;script&gt;alert(1)&lt;/script&gt;'
    );
  });

  it('renders the email search and Add Email button without a history heading', () => {
    const html = renderToString(
      <ParticipantEmailSection
        participantId="part-1"
        participantName="John Doe"
      />
    );

    expect(html).not.toContain('Email Communication History');
    expect(html).toContain('Add Email');
    expect(html).toContain('Search emails...');
    expect(html).toMatch(/class="flex items-center justify-between gap-3"><label class="relative block min-w-0 flex-1">[\s\S]*Search emails\.\.\.[\s\S]*<\/label><button/s);
    expect(html).not.toContain('Compose Email');
  });

  it('renders the legacy email fields and message designer without attachment controls', () => {
    const html = renderToString(
      <ComposeEmailModal
        isOpen={true}
        onClose={vi.fn()}
        participantId="part-1"
        participantName="John Doe"
        onEmailSent={vi.fn()}
      />
    );

    expect(html).toContain('Add Participant Email');
    expect(html).not.toContain('Add Participant Email — John Doe');
    expect(html).toContain('compose-email-form');
    expect(html).toContain('compose-email-row');
    expect(html).toContain('To');
    expect(html).toContain('CC');
    expect(html).toContain('BCC');
    expect(html).toContain('Reply To Address');
    expect(html).toContain('Sender Name');
    expect(html).toContain('Subject');
    expect(html).toContain('Message');
    expect(html).toContain('email-design-editor');
    expect(html).not.toContain('Attachments');
    expect(html).not.toContain('Attach Files');
    expect(html).toContain('Mark Email As:');
    expect(html).toContain('Pin Email');
    expect(html).not.toContain('>Contact</span>');
    expect(html).not.toContain('>Global</span>');
    expect(html).not.toContain('>Notify</span>');
    expect(html).toContain('title="Pin current email to top of list."');
    expect(html).toContain('role="combobox"');
    expect(html).toContain('aria-label="To recipient"');
    expect(html).toContain('aria-label="CC recipient"');
    expect(html).toContain('aria-label="BCC recipient"');
    expect(html).toContain('aria-label="Choose another email for To recipient"');
    expect(html).toContain('aria-label="Choose another email for CC recipient"');
    expect(html).toContain('aria-label="Choose another email for BCC recipient"');
  });

  it('builds unique recipient options from active email contacts and direct email addresses', () => {
    const options = mapEmailRecipientOptions(
      [
        {
          contactType: 'EMAIL',
          contactValue: '  jane@example.com ',
          contactName: 'Jane Doe',
          active: true,
          isPreferred: true,
        },
        {
          contactType: 'EMAIL',
          contactValue: 'inactive@example.com',
          contactName: 'Inactive Contact',
          active: false,
          isPreferred: false,
        },
        {
          contactType: 'PHONE',
          contactValue: '5551234567',
          contactName: 'Phone Contact',
          active: true,
          isPreferred: false,
        },
      ],
      ['JANE@example.com', 'team@example.com']
    );

    expect(options).toEqual([
      { email: 'jane@example.com', contactName: 'Jane Doe', isPreferred: true },
      { email: 'team@example.com' },
    ]);
    expect(formatEmailRecipientOption(options[0])).toBe('jane@example.com (Jane Doe)');
    expect(formatEmailRecipientOption(options[1])).toBe('team@example.com');
  });
});
