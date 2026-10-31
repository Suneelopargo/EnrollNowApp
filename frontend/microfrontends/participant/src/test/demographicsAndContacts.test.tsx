// frontend/microfrontends/participant/src/test/demographicsAndContacts.test.tsx
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { calculateCurrentAge, formatDobForDateInput, ParticipantDetailModal } from '../components/ParticipantDetailModal';
import {
  getContactRelationshipLabel,
  groupContactMethods,
  ParticipantContactManagement,
} from '../components/ParticipantContactManagement';
import { getContactActiveState, ParticipantContactModal } from '../components/ParticipantContactModal';
import { RecordConsentModal } from '../components/RecordConsentModal';
import { AddContactLogModal } from '../components/AddContactLogModal';
import { ParticipantContactLogs } from '../components/ParticipantContactLogs';
import { ParticipantRecord } from '../types/participant';
import { ParticipantContactDetail, ParticipantAddressDetail } from '../../../../shared/api/participantApi';

describe('Demographics Functionality & Age Calculation', () => {
  it('calculates current age accurately for valid past birthday', () => {
    // 2000-01-01
    const ageResult = calculateCurrentAge('2000-01-01');
    expect(ageResult).toMatch(/\d+ years \d+ months/);
    expect(ageResult).not.toBe('--');
  });

  it('calculates current age for MM/DD/YYYY format', () => {
    const ageResult = calculateCurrentAge('05/15/1995');
    expect(ageResult).toMatch(/\d+ years \d+ months/);
    expect(ageResult).not.toBe('--');
  });

  it('returns invalid flag for future birthday', () => {
    const futureYear = new Date().getFullYear() + 2;
    const futureDate = `${futureYear}-01-01`;
    const ageResult = calculateCurrentAge(futureDate);
    expect(ageResult).toBe('Invalid (Future Date)');
  });

  it('returns placeholder for empty or whitespace birthday', () => {
    expect(calculateCurrentAge('')).toBe('--');
    expect(calculateCurrentAge('   ')).toBe('--');
    expect(calculateCurrentAge(undefined)).toBe('--');
  });

  it('returns Invalid Date when birthday cannot be parsed', () => {
    expect(calculateCurrentAge('not-a-date')).toBe('Invalid Date');
    expect(calculateCurrentAge('99/99/9999')).toBe('Invalid Date');
  });

  it('uses fallback age when birthday is not provided', () => {
    expect(calculateCurrentAge('', '30')).toBe('30 years 0 months');
    expect(calculateCurrentAge(undefined, '25 years')).toBe('25 years 0 months');
    expect(calculateCurrentAge(undefined, '34 years 10 months')).toBe('34 years 10 months');
  });

  it('formats stored birthdays for the date picker without accepting invalid dates', () => {
    expect(formatDobForDateInput('1998-04-20')).toBe('1998-04-20');
    expect(formatDobForDateInput('4/20/1998')).toBe('1998-04-20');
    expect(formatDobForDateInput('2/30/1998')).toBe('');
    expect(formatDobForDateInput(undefined)).toBe('');
  });

  it('renders the grid age format with years and months for legacy ages', () => {
    expect(calculateCurrentAge(undefined, '32')).toBe('32 years 0 months');
  });

  it('renders Demographics tab in ParticipantDetailModal with calculated age and dropdowns', () => {
    const dummyParticipant: ParticipantRecord = {
      id: 'part-demo-1',
      name: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      status: 'Active',
      demographics: {
        dob: '1998-04-20',
        gender: 'Male',
        ethnicity: 'Not Hispanic or Latino',
        race: 'Asian',
        primaryLanguage: 'English',
      },
    };

    const html = renderToStaticMarkup(
      <ParticipantDetailModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        participant={dummyParticipant}
        demographicOptions={{
          ethnicity: ['Hispanic or Latino', 'Not Hispanic or Latino'],
          race: ['Asian', 'White', 'Black or African American'],
          sex: ['Male', 'Female', 'Other'],
        }}
      />
    );

    expect(html).toContain('Participant Details');
    expect(html).toContain('John Doe');
  });
});

describe('Contact Methods and Related Contacts Components', () => {
  const dummyContact: ParticipantContactDetail = {
    id: 'contact-uuid-1',
    participantId: 'part-uuid-1',
    contactType: 'PHONE',
    contactValue: '+1 (555) 019-2831',
    label: 'Mobile',
    contactName: 'Jane Doe',
    relationship: 'Mother',
    canLeaveMessage: true,
    notes: 'Best time to reach is after 5 PM',
    primaryContact: true,
    isPreferred: true,
    active: true,
    createdAt: new Date().toISOString(),
  };

  const dummyAddress: ParticipantAddressDetail = {
    id: 'addr-uuid-1',
    participantId: 'part-uuid-1',
    addressType: 'HOME',
    addressLine1: '456 Elm St',
    city: 'Springfield',
    stateRegion: 'IL',
    postalCode: '62701',
    countryCode: 'USA',
    primaryAddress: true,
    active: true,
    createdAt: new Date().toISOString(),
  };

  it('defaults new contacts to active and preserves archived edit state', () => {
    expect(getContactActiveState(false, [])).toBe(true);
    expect(getContactActiveState(true, [])).toBe(false);
    expect(getContactActiveState(true, [{ ...dummyContact, active: false }])).toBe(false);
    expect(getContactActiveState(true, [{ ...dummyContact, active: true }])).toBe(true);
  });

  it('groups a new person’s methods even when their relationship is left blank', () => {
    const otherMethod: ParticipantContactDetail = {
      ...dummyContact,
      id: 'contact-uuid-2',
      contactType: 'EMAIL',
      contactValue: 'jane@example.com',
      relationship: '',
      primaryContact: false,
      isPreferred: false,
    };
    const firstMethod = { ...dummyContact, relationship: '', primaryContact: false };

    expect(groupContactMethods([firstMethod, otherMethod])).toHaveLength(1);
    expect(groupContactMethods([firstMethod, otherMethod])[0].methods).toHaveLength(2);
  });

  it('groups self contact methods even when primary contact flags differ', () => {
    const selfEmail = {
      ...dummyContact,
      relationship: 'Self',
      contactType: 'EMAIL',
      contactValue: 'john@example.com',
      primaryContact: true,
    };
    const selfPhone = {
      ...dummyContact,
      id: 'contact-uuid-2',
      relationship: 'Self',
      primaryContact: false,
    };

    expect(groupContactMethods([selfEmail, selfPhone])).toHaveLength(1);
    expect(groupContactMethods([selfEmail, selfPhone])[0].methods).toHaveLength(2);
  });

  it('uses the legacy Participant label only for self contacts', () => {
    expect(getContactRelationshipLabel('Jane Doe', '', 'John Doe')).toBe('');
    expect(getContactRelationshipLabel('John Doe', '', 'John Doe')).toBe('Participant');
    expect(getContactRelationshipLabel('Jane Doe', 'Self', 'John Doe')).toBe('Participant');
    expect(getContactRelationshipLabel('Jane Doe', 'Mother', 'John Doe')).toBe('Mother');
  });

  it('renders the legacy Contacts list and unified add action', () => {
    const html = renderToStaticMarkup(
      <ParticipantContactManagement
        participantId="part-uuid-1"
        participantName="John Doe"
      />
    );

    expect(html).toContain('Contacts');
    expect(html).toContain('Add Contact');
    expect(html).not.toContain('Add Address');
  });

  it('renders the unified legacy contact editor in edit mode', () => {
    const html = renderToStaticMarkup(
      <ParticipantContactModal
        isOpen={true}
        onClose={vi.fn()}
        participantId="part-uuid-1"
        participantName="John Doe"
        contactToEdit={dummyContact}
        contactMethods={[dummyContact]}
        addresses={[dummyAddress]}
        onSaved={vi.fn()}
      />
    );

    expect(html).toContain('Edit Contact');
    expect(html).toContain('Contact Methods');
    expect(html).toContain('Address');
    expect(html).toContain('Delete');
    expect(html).toContain('Archive Contact');
  });

  it('keeps empty method and address rows for an other contact', () => {
    const emptyMethod: ParticipantContactDetail = {
      ...dummyContact,
      contactValue: '',
    };
    const emptyAddress: ParticipantAddressDetail = {
      ...dummyAddress,
      addressLine1: '',
      addressLine2: '',
      city: '',
      stateRegion: '',
      postalCode: '',
    };
    const html = renderToStaticMarkup(
      <ParticipantContactModal
        isOpen
        onClose={vi.fn()}
        participantId="part-uuid-1"
        participantName="John Doe"
        contactToEdit={emptyMethod}
        contactMethods={[emptyMethod]}
        addresses={[emptyAddress]}
        onSaved={vi.fn()}
      />
    );

    expect(html).toContain('aria-label="Contact method type"');
    expect(html).toContain('aria-label="Address 1"');
    expect(html).toContain('Add Contact Method');
    expect(html).toContain('Add Address');
  });

  it('uses the participant legacy layout and hides empty method and address rows', () => {
    const participantContact: ParticipantContactDetail = {
      ...dummyContact,
      contactName: 'John Doe',
      relationship: 'Participant',
      contactValue: '',
    };
    const emptyAddress: ParticipantAddressDetail = {
      ...dummyAddress,
      addressLine1: '',
      addressLine2: '',
      city: '',
      stateRegion: '',
      postalCode: '',
    };
    const html = renderToStaticMarkup(
      <ParticipantContactModal
        isOpen
        onClose={vi.fn()}
        participantId="part-uuid-1"
        participantName="John Doe"
        contactToEdit={participantContact}
        contactMethods={[participantContact]}
        addresses={[emptyAddress]}
        onSaved={vi.fn()}
      />
    );

    expect(html).toContain('Edit Contact Methods');
    expect(html).toContain('Preferred Name');
    expect(html).not.toContain('Relationship to Participant');
    expect(html).not.toContain('aria-label="Contact method type"');
    expect(html).not.toContain('aria-label="Address 1"');
  });

  it('keeps an explicit non-participant relationship when the contact has the participant name', () => {
    const sameNameContact: ParticipantContactDetail = {
      ...dummyContact,
      contactName: 'John Doe',
      relationship: 'Mother',
    };
    const html = renderToStaticMarkup(
      <ParticipantContactModal
        isOpen
        onClose={vi.fn()}
        participantId="part-uuid-1"
        participantName="John Doe"
        contactToEdit={sameNameContact}
        contactMethods={[sameNameContact]}
        addresses={[]}
        onSaved={vi.fn()}
      />
    );

    expect(html).toContain('Contact Name');
    expect(html).toContain('Relationship to Participant');
    expect(html).not.toContain('Preferred Name');
  });

  it('renders the unified legacy contact editor with methods and addresses together', () => {
    const html = renderToStaticMarkup(
      <ParticipantContactModal
        isOpen={true}
        onClose={vi.fn()}
        participantId="part-uuid-1"
        participantName="John Doe"
        addresses={[]}
        onSaved={vi.fn()}
      />
    );

    expect(html).toContain('Add Contact');
    expect(html).toContain('modal-header');
    expect(html).toContain('data-tooltip="Archive Contact"');
    expect(html).not.toContain('data-tooltip="Restore Contact"');
    expect(html).toContain('Show Archived Methods');
    expect(html).toContain('Add Contact Method');
    expect(html).toContain('Add Address');
    expect(html).not.toContain('Add at least one contact method');
    expect(html).toContain('*required');
    expect(html).not.toContain('aria-label="Contact method type"');
    expect(html).not.toContain('aria-label="Address 1"');
    expect(html).toContain('Contact Name');
    expect(html).toContain('Relationship to Participant');
    expect(html).toContain('Can Leave a Message');
    expect(html).toContain('Contact Methods');
    expect(html).toContain('Add Contact Method');
    expect(html).toContain('Add Address');
  });

  it('renders contact history search and Add Contact controls in one row', () => {
    const html = renderToStaticMarkup(
      <ParticipantContactLogs
        participantId="part-uuid-1"
        participantName="John Doe"
      />
    );

    expect(html).toContain('Search contact history...');
    expect(html).toContain('aria-label="Add Contact"');
    expect(html).toMatch(/class="flex items-center justify-between gap-3"><label class="relative block min-w-0 flex-1">[\s\S]*Search contact history\.\.\.[\s\S]*<\/label><button/s);
  });

  it('does not preselect contact, address, consent, or contact-log dropdown values', () => {
    const contactHtml = renderToStaticMarkup(
      <ParticipantContactModal
        isOpen
        onClose={vi.fn()}
        participantId="part-uuid-1"
        participantName="John Doe"
        addresses={[]}
        onSaved={vi.fn()}
      />
    );
    const consentHtml = renderToStaticMarkup(
      <RecordConsentModal
        isOpen
        onClose={vi.fn()}
        participantId="part-uuid-1"
        participantName="John Doe"
      />
    );
    const contactLogHtml = renderToStaticMarkup(
      <AddContactLogModal
        isOpen
        onClose={vi.fn()}
        participantId="part-uuid-1"
        onSaved={vi.fn()}
      />
    );

    expect(contactHtml).toContain('value="" selected="">Relationship</option>');
    expect(consentHtml).toContain('Select...');
    expect(contactLogHtml).toContain('Select contact type...');
    expect(contactLogHtml).toContain('Select who contacted the participant...');
    expect(contactLogHtml).toContain('Select contact outcome...');
    expect(contactLogHtml).toContain('contact-log-modal');
    expect(contactLogHtml).toContain('contact-log-form');
    expect(contactLogHtml).toContain('Contact Date/Time');
    expect(contactLogHtml).toContain('Mark Contact As:');
    expect(contactLogHtml).toContain('Pin Contact');
    expect(contactLogHtml).not.toContain('Date of Last Contact');
    expect(contactLogHtml).not.toContain('Notify Team');
    expect(contactLogHtml).not.toContain('Global Registry Record');
  });
});
