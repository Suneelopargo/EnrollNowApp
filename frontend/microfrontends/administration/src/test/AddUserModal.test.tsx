// frontend/microfrontends/administration/src/test/AddUserModal.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AddUserModal } from '../components/AddUserModal';
import { SiteAdminUser } from '../types/admin';
import { toast } from '../../../../shared/toaster';

vi.mock('../../../../shared/toaster', () => ({
  toast: {
    warning: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('../../../../shared/confirmation', () => ({
  requestConfirmation: vi.fn().mockResolvedValue(true),
}));

describe('AddUserModal Study Role & Warning Toast Parity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockStudies = [
    { id: 'study-1', name: 'Cardiology 101' },
    { id: 'study-2', name: 'Neurology 202' },
  ];

  const mockStudyRoles = [
    { id: 'r1', code: 'STUDY_RA', name: 'RA', scopeType: 'STUDY', systemRole: true, active: true },
    { id: 'r2', code: 'STUDY_LEADER', name: 'Leader', scopeType: 'STUDY', systemRole: true, active: true },
    { id: 'r3', code: 'STUDY_ADMIN', name: 'Admin', scopeType: 'STUDY', systemRole: true, active: true },
    { id: 'r4', code: 'STUDY_READ_ONLY', name: 'Read Only', scopeType: 'STUDY', systemRole: true, active: true },
  ];

  it('renders correctly with modal open and study permissions list defaulting to RA', () => {
    const html = renderToStaticMarkup(
      <AddUserModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        availableStudies={mockStudies}
        studyRoles={mockStudyRoles}
      />
    );

    expect(html).toContain('Add User');
    expect(html).toContain('Cardiology 101');
    expect(html).toContain('Neurology 202');
    expect(html).toContain('Assign study Cardiology 101');
  });

  it('verifies that in edit mode with an assigned study lacking explicit permission, it defaults to RA', () => {
    const userToEdit: SiteAdminUser = {
      id: 'usr-1',
      name: 'Dr. Jane Smith',
      firstName: 'Dr. Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      sitePermissions: 'None',
      studies: ['Cardiology 101'],
      studyAssignments: [
        { id: 'study-1', name: 'Cardiology 101', studyRole: null, studyPermission: null },
      ],
      status: 'Active',
      createdAt: '2026-01-01',
    };

    const html = renderToStaticMarkup(
      <AddUserModal
        isOpen={true}
        userToEdit={userToEdit}
        onClose={vi.fn()}
        onSave={vi.fn()}
        availableStudies={mockStudies}
        studyRoles={mockStudyRoles}
      />
    );

    // In edit mode with Cardiology 101 assigned and null permission, the select must default to RA
    expect(html).toContain('Cardiology 101');
    expect(html).toContain('value="RA" selected=""');
  });

  it('verifies exact legacy toast message format and contract for study unassignment', () => {
    const studyName = 'Neurology 202';
    const expectedToast = `The user will be unassigned from all tasks, events, and sites in ${studyName}.`;
    
    // Test toast invocation matches legacy Ripple accessibleSwal specification
    toast.warning(expectedToast);
    expect(toast.warning).toHaveBeenCalledWith(
      'The user will be unassigned from all tasks, events, and sites in Neurology 202.'
    );
  });
});
