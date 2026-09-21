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
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No records found.',
  loading = false,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner" />
        <span>Loading records...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="spinner-container">
        <span>{emptyMessage}</span>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>
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
