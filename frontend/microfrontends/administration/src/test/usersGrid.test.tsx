// frontend/microfrontends/administration/src/test/usersGrid.test.tsx - Tests for UsersGrid Keyboard Navigation & ARIA Grid Configuration
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { UsersGrid } from '../components/UsersGrid';
import { SiteAdminUser } from '../types/admin';

// Mock the shared DataGrid component to inspect the props passed to it
let capturedDataGridProps: any = null;
vi.mock('../../../../shared/design-system/components/DataGrid', () => ({
  DataGrid: (props: any) => {
    capturedDataGridProps = props;
    return <div data-testid="mock-data-grid" />;
  },
}));

describe('UsersGrid ARIA Grid Keyboard Navigation & Accessibility', () => {
  const mockUsers: SiteAdminUser[] = [
    {
      id: 'usr-1',
      name: 'Dr. Jane Smith',
      email: 'jane.smith@example.com',
      sitePermissions: 'FullSiteAdmin',
      studies: ['Cardio 2026', 'Neuro 101'],
      status: 'Active',
      createdAt: '2026-01-01',
    },
    {
      id: 'usr-2',
      name: 'Bob Johnson',
      email: 'bob.johnson@example.com',
      sitePermissions: 'StudyCoordinator',
      studies: ['Onco 300'],
      status: 'Inactive',
      createdAt: '2026-01-05',
    },
  ];

  it('enables cell keyboard navigation by not setting suppressCellFocus', () => {
    capturedDataGridProps = null;
    const onAddUser = vi.fn();
    const onEditUser = vi.fn();
    const onDeleteUser = vi.fn();
    const onToggleStatus = vi.fn();

    renderToStaticMarkup(
      React.createElement(UsersGrid, {
        users: mockUsers,
        onAddUser,
        onEditUser,
        onDeleteUser,
        onToggleStatus,
      })
    );

    expect(capturedDataGridProps).not.toBeNull();
    // suppressCellFocus must NOT be true, enabling native AG Grid cell navigation and arrow keys
    expect(capturedDataGridProps.suppressCellFocus).toBeUndefined();
    expect(typeof capturedDataGridProps.onCellKeyDown).toBe('function');
  });

  it('correctly configures the Actions column without a floating filter and with pinned right orientation', () => {
    capturedDataGridProps = null;

    renderToStaticMarkup(
      React.createElement(UsersGrid, {
        users: mockUsers,
        onAddUser: vi.fn(),
        onEditUser: vi.fn(),
        onDeleteUser: vi.fn(),
        onToggleStatus: vi.fn(),
      })
    );

    const columns = capturedDataGridProps.columnDefs;
    const actionsCol = columns.find((c: any) => c.headerName === 'Actions');

    expect(actionsCol).toBeDefined();
    expect(actionsCol.filter).toBe(false);
    expect(actionsCol.floatingFilter).toBe(false);
    expect(actionsCol.suppressMenu).toBe(true);
    expect(actionsCol.suppressSizeToFit).toBe(true);
    expect(actionsCol.pinned).toBe('right');
  });

  it('activates user editing when Enter or Space is pressed on the Name cell', () => {
    capturedDataGridProps = null;
    const onEditUser = vi.fn();

    renderToStaticMarkup(
      React.createElement(UsersGrid, {
        users: mockUsers,
        onAddUser: vi.fn(),
        onEditUser,
        onDeleteUser: vi.fn(),
        onToggleStatus: vi.fn(),
      })
    );

    const onCellKeyDown = capturedDataGridProps.onCellKeyDown;
    const mockPreventDefault = vi.fn();

    // Trigger Enter key on Name column
    onCellKeyDown({
      event: { key: 'Enter', preventDefault: mockPreventDefault },
      column: { getColId: () => 'name' },
      data: mockUsers[0],
    });

    expect(mockPreventDefault).toHaveBeenCalled();
    expect(onEditUser).toHaveBeenCalledWith(mockUsers[0]);

    // Trigger Space key on Name column
    onCellKeyDown({
      event: { key: ' ', preventDefault: mockPreventDefault },
      column: { getColId: () => 'name' },
      data: mockUsers[1],
    });

    expect(onEditUser).toHaveBeenCalledWith(mockUsers[1]);
  });

  it('focuses the first action button when Enter or Space is pressed on the Actions cell', () => {
    capturedDataGridProps = null;
    const onEditUser = vi.fn();

    renderToStaticMarkup(
      React.createElement(UsersGrid, {
        users: mockUsers,
        onAddUser: vi.fn(),
        onEditUser,
        onDeleteUser: vi.fn(),
        onToggleStatus: vi.fn(),
      })
    );

    const onCellKeyDown = capturedDataGridProps.onCellKeyDown;
    const mockPreventDefault = vi.fn();
    const mockButtonFocus = vi.fn();

    const mockCellEl = {
      querySelector: vi.fn((selector) => {
        if (selector === 'button') {
          return { focus: mockButtonFocus };
        }
        return null;
      }),
    };

    onCellKeyDown({
      event: {
        key: 'Enter',
        preventDefault: mockPreventDefault,
        target: { closest: () => mockCellEl },
      },
      column: { getColId: () => 'actions' },
      data: mockUsers[0],
    });

    expect(mockPreventDefault).toHaveBeenCalled();
    expect(mockButtonFocus).toHaveBeenCalled();
  });
});
