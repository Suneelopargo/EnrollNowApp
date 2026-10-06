import React from 'react';
import { AllCommunityModule, type Module } from 'ag-grid-community';
import { AgGridReact, type AgGridReactProps } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

const DEFAULT_COLUMN_DEFINITION = {
  resizable: true,
  sortable: true,
  filter: true,
  floatingFilter: true,
};

export interface DataGridProps<TData = any> extends Omit<AgGridReactProps<TData>, 'defaultColDef' | 'modules'> {
  /** Class applied to the shared grid frame for page-specific sizing. */
  wrapperClassName?: string;
  /** Extend or override the shared column defaults for this grid. */
  defaultColDef?: AgGridReactProps<TData>['defaultColDef'];
  /** Add modules when a grid needs functionality outside the community bundle. */
  modules?: Module[];
}

export type { ColDef, GridApi } from 'ag-grid-community';

/** Shared AG Grid wrapper with the application-wide theme and sensible defaults. */
export function DataGrid<TData = any>({
  className = '',
  wrapperClassName = '',
  defaultColDef,
  modules,
  ...gridProps
}: DataGridProps<TData>) {
  const gridClasses = ['enl-ag-grid', 'ag-theme-quartz', className, wrapperClassName]
    .filter(Boolean)
    .join(' ');

  return (
    <AgGridReact<TData>
      {...gridProps}
      className={gridClasses}
      modules={modules ?? [AllCommunityModule]}
      defaultColDef={{ ...DEFAULT_COLUMN_DEFINITION, ...defaultColDef }}
    />
  );
}

export default DataGrid;
