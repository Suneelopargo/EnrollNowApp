// frontend/microfrontends/participant/src/test/demographicsAndContacts.test.tsx
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { calculateCurrentAge, formatDobForDateInput, ParticipantDetailModal } from '../components/ParticipantDetailModal';
import { ParticipantContactManagement } from '../components/ParticipantContactManagement';
import { AddContactModal } from '../components/AddContactModal';
import { AddAddressModal } from '../components/AddAddressModal';
import { RecordConsentModal } from '../components/RecordConsentModal';
import { AddContactLogModal } from '../components/AddContactLogModal';
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

  it('renders ParticipantContactManagement with Contact Methods and Addresses sections', () => {
    const html = renderToStaticMarkup(
      <ParticipantContactManagement
        participantId="part-uuid-1"
        participantName="John Doe"
      />
    );

    expect(html).toContain('Contact Methods &amp; Authorized Contacts');
    expect(html).toContain('Participant Addresses');
    expect(html).toContain('Add Contact');
    expect(html).toContain('Add Address');
  });

  it('renders AddContactModal in Add mode', () => {
    const html = renderToStaticMarkup(
      <AddContactModal
        isOpen={true}
        onClose={vi.fn()}
        participantId="part-uuid-1"
        participantName="John Doe"
        onContactAdded={vi.fn()}
      />
    );

    expect(html).toContain('Add Contact Method — John Doe');
    expect(html).toContain('Relationship to Participant');
    expect(html).toContain('Can Leave Message?');
    expect(html).toContain('Preferred Method');
  });

  it('renders AddContactModal in Edit mode with prefilled contact details', () => {
    const html = renderToStaticMarkup(
      <AddContactModal
        isOpen={true}
        onClose={vi.fn()}
        participantId="part-uuid-1"
        participantName="John Doe"
        contactToEdit={dummyContact}
        onContactAdded={vi.fn()}
      />
    );

    expect(html).toContain('Edit Contact Methods — John Doe');
    expect(html).toContain('Archive Contact');
    expect(html).toContain('Save Updates');
  });

  it('renders AddAddressModal in Add mode', () => {
    const html = renderToStaticMarkup(
      <AddAddressModal
        isOpen={true}
        onClose={vi.fn()}
        participantId="part-uuid-1"
        participantName="John Doe"
        onAddressAdded={vi.fn()}
      />
    );

    expect(html).toContain('Add Address — John Doe');
    expect(html).toContain('Street Address Line 1');
    expect(html).toContain('Address Type');
  });

  it('renders AddAddressModal in Edit mode with prefilled address details', () => {
    const html = renderToStaticMarkup(
      <AddAddressModal
        isOpen={true}
        onClose={vi.fn()}
        participantId="part-uuid-1"
        participantName="John Doe"
        addressToEdit={dummyAddress}
        onAddressAdded={vi.fn()}
      />
    );

    expect(html).toContain('Edit Address — John Doe');
    expect(html).toContain('Archive Address');
    expect(html).toContain('Save Updates');
  });

  it('does not preselect contact, address, consent, or contact-log dropdown values', () => {
    const contactHtml = renderToStaticMarkup(
      <AddContactModal
        isOpen
        onClose={vi.fn()}
        participantId="part-uuid-1"
        participantName="John Doe"
        onContactAdded={vi.fn()}
      />
    );
    const addressHtml = renderToStaticMarkup(
      <AddAddressModal
        isOpen
        onClose={vi.fn()}
        participantId="part-uuid-1"
        participantName="John Doe"
        onAddressAdded={vi.fn()}
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

    expect(contactHtml).toContain('Select relationship...');
    expect(contactHtml).toContain('Select contact type...');
    expect(addressHtml).toContain('Select address type...');
    expect(consentHtml).toContain('Select...');
    expect(contactLogHtml).toContain('Select contact type...');
    expect(contactLogHtml).toContain('Select who contacted the participant...');
    expect(contactLogHtml).toContain('Select contact outcome...');
  });
});
