import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from '@tanstack/react-table';
import { useEffect, useState } from 'react';

type DataTableProps<T> = {
  columns: ColumnDef<T, any>[];
  data: T[];
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
  onPageDataChange?: (rows: T[]) => void;
  onRowClick?: (row: T) => void;
  getRowId?: (row: T) => string;
  selectedRowId?: string | null;
};

export default function DataTable<T>({
  columns,
  data,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  showSearch = true,
  onPageDataChange,
  onRowClick,
  getRowId,
  selectedRowId,
}: DataTableProps<T>) {
  const [internalFilter, setInternalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);

  const isControlled = typeof searchValue === 'string' && typeof onSearchChange === 'function';
  const globalFilter = isControlled ? searchValue : internalFilter;

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: isControlled ? onSearchChange : setInternalFilter,
    onSortingChange: setSorting,
    initialState: { pagination: { pageSize: 25 } },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
  });

  useEffect(() => {
    table.setPageIndex(0);
  }, [globalFilter, data.length, table]);

  const pagination = table.getState().pagination;
  const totalRows = table.getFilteredRowModel().rows.length;
  const pageCount = table.getPageCount();

  useEffect(() => {
    if (!onPageDataChange) return;
    const rows = table.getPaginationRowModel().rows.map((row) => row.original as T);
    onPageDataChange(rows);
  }, [
    onPageDataChange,
    table,
    data.length,
    globalFilter,
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
  ]);

  return (
    <div className="card table-card">
      {showSearch ? (
        <div className="table-toolbar">
          <input
            className="input"
            value={globalFilter ?? ''}
            onChange={(event) => table.setGlobalFilter(String(event.target.value))}
            placeholder={searchPlaceholder ?? 'Search'}
          />
          <div className="table-meta">{totalRows} rows</div>
        </div>
      ) : null}
      <div className="table-wrapper">
        <table>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sortDirection = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      className={canSort ? 'sortable' : undefined}
                    >
                      <div className="th-content">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sortDirection ? (
                          <span className="sort-indicator">
                            {sortDirection === 'asc' ? '▲' : '▼'}
                          </span>
                        ) : null}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={
                  selectedRowId && getRowId && getRowId(row.original) === selectedRowId
                    ? 'row-selected'
                    : undefined
                }
                onClick={onRowClick ? () => onRowClick(row.original as T) : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <button
          className="button secondary"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </button>
        <div className="table-page">
          Page {pagination.pageIndex + 1} of {pageCount}
        </div>
        <button
          className="button secondary"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </button>
      </div>
    </div>
  );
}
