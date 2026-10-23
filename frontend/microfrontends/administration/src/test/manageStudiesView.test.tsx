// frontend/microfrontends/administration/src/test/manageStudiesView.test.tsx - Tests for ManageStudiesView & Add Study Integration
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ManageStudiesView } from '../components/ManageStudiesView';
import { SiteAdminDashboard } from '../components/SiteAdminDashboard';
import { studyApi } from '../../../../shared/api/studyApi';

let capturedDataGridProps: any = null;
let capturedAddStudyModalProps: any = null;
let mockLocationSearch = '';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({
    search: mockLocationSearch,
    pathname: '/admin',
  }),
}));

vi.mock('../../../../shared/design-system/components/DataGrid', () => ({
  DataGrid: (props: any) => {
    capturedDataGridProps = props;
    return <div data-testid="mock-data-grid" />;
  },
}));

vi.mock('../../../../shared/design-system/components/AddStudyModal', () => ({
  AddStudyModal: (props: any) => {
    capturedAddStudyModalProps = props;
    return <div data-testid="mock-add-study-modal" data-is-open={String(props.isOpen)} />;
  },
}));

vi.mock('../../../../shared/api/studyApi', () => ({
  studyApi: {
    getStudies: vi.fn().mockResolvedValue([
      {
        id: 'study-1',
        name: 'Cardiology 2026 Trial',
        protocolNumber: 'CARD-2026',
        status: 'ACTIVE',
        archived: false,
        startDate: '2026-01-15',
        endDate: '2027-01-15',
        admins: [
          { userId: 'u1', name: 'Dr. Jane Smith', email: 'jane@example.com', initials: 'JS' },
        ],
      },
      {
        id: 'study-2',
        name: 'Oncology Phase II',
        protocolNumber: 'ONC-02',
        status: 'ARCHIVED',
        archived: true,
        startDate: '2025-03-01',
        endDate: '2025-12-01',
        admins: [],
      },
    ]),
    archiveStudy: vi.fn().mockResolvedValue({}),
    restoreStudy: vi.fn().mockResolvedValue({}),
    deleteStudy: vi.fn().mockResolvedValue({}),
  },
}));

describe('ManageStudiesView with AG Grid and Add Study Modal', () => {
  beforeEach(() => {
    capturedDataGridProps = null;
    capturedAddStudyModalProps = null;
    mockLocationSearch = '';
    vi.clearAllMocks();
  });

  it('renders Manage Studies screen with title, Add Study button, filter dropdown, and search input', () => {
    const html = renderToStaticMarkup(<ManageStudiesView />);

    expect(html).toContain('Manage Studies');
    expect(html).toContain('Add Study');
    expect(html).toContain('Active Studies');
    expect(html).toContain('Archived Studies');
    expect(html).toContain('All Studies');
    expect(html).toContain('Search studies...');
    expect(html).toContain('mock-data-grid');
    expect(html).toContain('mock-add-study-modal');
  });

  it('initializes Add Study modal as open when initialAddModalOpen is true', () => {
    const html = renderToStaticMarkup(<ManageStudiesView initialAddModalOpen={true} />);

    expect(html).toContain('data-is-open="true"');
  });

  it('initializes Add Study modal as open when URL query parameter has action=add', () => {
    mockLocationSearch = '?tab=studies&action=add';
    const html = renderToStaticMarkup(<ManageStudiesView />);

    expect(html).toContain('data-is-open="true"');
  });

  it('configures AG Grid column definitions for Name, Admin, Date Active, Date Ending, and Actions', () => {
    renderToStaticMarkup(<ManageStudiesView />);

    expect(capturedDataGridProps).not.toBeNull();
    const colDefs = capturedDataGridProps.columnDefs;
    expect(colDefs).toBeDefined();
    expect(Array.isArray(colDefs)).toBe(true);

    const headers = colDefs.map((c: any) => c.headerName);
    expect(headers).toContain('Name');
    expect(headers).toContain('Admin');
    expect(headers).toContain('Date Active');
    expect(headers).toContain('Date Ending');
    expect(headers).toContain('Actions');
  });

  it('renders action buttons appropriately for active vs archived studies', () => {
    renderToStaticMarkup(<ManageStudiesView />);

    const colDefs = capturedDataGridProps.columnDefs;
    const actionsCol = colDefs.find((c: any) => c.headerName === 'Actions');
    expect(actionsCol).toBeDefined();

    // Active study cell renderer test
    const activeParams: any = {
      data: { id: 's1', name: 'Active Study', archived: false, status: 'ACTIVE' },
    };
    const activeActionsNode = actionsCol.cellRenderer(activeParams);
    const activeHtml = renderToStaticMarkup(activeActionsNode);
    expect(activeHtml).toContain('Edit');
    expect(activeHtml).toContain('Archive');
    expect(activeHtml).toContain('data-tooltip="Edit Active Study"');
    expect(activeHtml).toContain('data-tooltip="Archive Active Study"');
    expect(activeHtml).toContain('site-admin-tooltip-btn');
    expect(activeHtml).not.toContain('Unarchive');
    expect(activeHtml).not.toContain('Delete');

    // Archived study cell renderer test
    const archivedParams: any = {
      data: { id: 's2', name: 'Archived Study', archived: true, status: 'ARCHIVED' },
    };
    const archivedActionsNode = actionsCol.cellRenderer(archivedParams);
    const archivedHtml = renderToStaticMarkup(archivedActionsNode);
    expect(archivedHtml).toContain('Unarchive');
    expect(archivedHtml).toContain('Delete');
    expect(archivedHtml).toContain('data-tooltip="Unarchive Archived Study"');
    expect(archivedHtml).toContain('data-tooltip="Delete Archived Study"');
    expect(archivedHtml).toContain('site-admin-tooltip-btn');
    expect(archivedHtml).not.toContain('Edit');
    expect(archivedHtml).not.toContain('>Archive</button>');
  });

  it('renders admin initials badge and tooltip in Admin column', () => {
    renderToStaticMarkup(<ManageStudiesView />);

    const colDefs = capturedDataGridProps.columnDefs;
    const adminCol = colDefs.find((c: any) => c.headerName === 'Admin');
    expect(adminCol).toBeDefined();

    const adminParams: any = {
      data: {
        id: 's1',
        name: 'Trial',
        admins: [
          { userId: 'u1', name: 'Jane Doe', email: 'jane@example.com', initials: 'JD' },
          { userId: 'u2', name: 'Bob Smith', email: 'bob@example.com', initials: 'BS' },
        ],
      },
    };
    const adminNode = adminCol.cellRenderer(adminParams);
    const adminHtml = renderToStaticMarkup(adminNode);

    expect(adminHtml).toContain('JD');
    expect(adminHtml).toContain('BS');
    expect(adminHtml).toContain('site-admin-tooltip-btn');
    expect(adminHtml).toContain('data-tooltip="Jane Doe"');
    expect(adminHtml).toContain('data-tooltip="Bob Smith"');
    expect(adminHtml).toContain('aria-label="Jane Doe"');
    expect(adminHtml).toContain('aria-label="Bob Smith"');
    expect(adminHtml).not.toContain('title="Jane Doe"');
    expect(adminHtml).not.toContain('jane@example.com');
    expect(adminHtml).not.toContain('bob@example.com');
  });

  it('renders SiteAdminDashboard on Studies tab when URL contains tab=studies', () => {
    mockLocationSearch = '?tab=studies&action=add';
    const html = renderToStaticMarkup(<SiteAdminDashboard />);

    expect(html).toContain('Manage Studies');
    expect(html).toContain('site-admin-container');
    expect(html).toContain('mock-data-grid');
  });
});
