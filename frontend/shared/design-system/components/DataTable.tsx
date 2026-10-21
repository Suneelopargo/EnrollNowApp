import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string | number;
  emptyMessage?: string;
  loading?: boolean;
  ariaLabel?: string;
  caption?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No records found.',
  loading = false,
  ariaLabel,
  caption,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="spinner-container" role="status" aria-live="polite">
        <div className="spinner" aria-hidden="true" />
        <span>Loading records...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="spinner-container" role="status" aria-live="polite">
        <span>{emptyMessage}</span>
      </div>
    );
  }

  return (
    <div className="table-responsive" role="region" aria-label={ariaLabel || 'Data table'} tabIndex={0}>
      <table className="data-table" aria-label={ariaLabel}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={keyExtractor(item, index)}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(item) : (item as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
