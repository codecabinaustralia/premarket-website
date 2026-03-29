'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';

export default function AdminTable({
  columns,
  data,
  loading = false,
  searchKeys = [],
  searchPlaceholder = 'Search...',
  filterOptions = [],
  activeFilter = null,
  onFilterChange = null,
  pageSize = 25,
  onRowClick = null,
  rowActions = null,
  emptyIcon: EmptyIcon = null,
  emptyMessage = 'No data available',
  bulkActions = [],
  getRowId = (row) => row.id,
}) {
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Sorting state
  const [sortConfig, setSortConfig] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Selection state
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [activeFilter]);

  // Filter and search data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search
    if (debouncedSearch && searchKeys.length > 0) {
      const searchLower = debouncedSearch.toLowerCase();
      result = result.filter((row) =>
        searchKeys.some((key) => {
          const value = key.split('.').reduce((obj, k) => obj?.[k], row);
          return String(value || '').toLowerCase().includes(searchLower);
        })
      );
    }

    return result;
  }, [data, debouncedSearch, searchKeys]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    const { key, direction } = sortConfig;
    const sorted = [...filteredData].sort((a, b) => {
      const aValue = key.split('.').reduce((obj, k) => obj?.[k], a);
      const bValue = key.split('.').reduce((obj, k) => obj?.[k], b);

      // Handle null/undefined
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // String comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue);
      }

      // Number comparison
      if (aValue < bValue) return -1;
      if (aValue > bValue) return 1;
      return 0;
    });

    return direction === 'desc' ? sorted.reverse() : sorted;
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, sortedData.length);

  // Handle column sort
  const handleSort = (columnKey) => {
    setSortConfig((prev) => {
      if (!prev || prev.key !== columnKey) {
        return { key: columnKey, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { key: columnKey, direction: 'desc' };
      }
      return null; // Remove sort
    });
  };

  // Get sort icon
  const getSortIcon = (columnKey) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="h-4 w-4 text-slate-400" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="h-4 w-4 text-orange-500" />
    ) : (
      <ChevronDown className="h-4 w-4 text-orange-500" />
    );
  };

  // Handle selection
  const handleSelectAll = (checked) => {
    if (checked) {
      const newSelected = new Set(paginatedData.map(getRowId));
      setSelectedIds(newSelected);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (rowId, checked) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(rowId);
    } else {
      newSelected.delete(rowId);
    }
    setSelectedIds(newSelected);
  };

  const allCurrentPageSelected =
    paginatedData.length > 0 &&
    paginatedData.every((row) => selectedIds.has(getRowId(row)));

  const someCurrentPageSelected =
    paginatedData.some((row) => selectedIds.has(getRowId(row))) &&
    !allCurrentPageSelected;

  // Handle bulk actions
  const handleBulkAction = (action) => {
    action.onClick(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  // Get page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const leftBound = Math.max(1, currentPage - 2);
      const rightBound = Math.min(totalPages, currentPage + 2);

      if (leftBound > 1) pages.push(1);
      if (leftBound > 2) pages.push('...');

      for (let i = leftBound; i <= rightBound; i++) {
        pages.push(i);
      }

      if (rightBound < totalPages - 1) pages.push('...');
      if (rightBound < totalPages) pages.push(totalPages);
    }

    return pages;
  };

  // Helper to get responsive classes
  const getHideClass = (hideBelow) => {
    if (!hideBelow) return '';
    if (hideBelow === 'sm') return 'hidden sm:table-cell';
    if (hideBelow === 'md') return 'hidden md:table-cell';
    if (hideBelow === 'lg') return 'hidden lg:table-cell';
    return '';
  };

  // Prepare columns with actions if needed
  const displayColumns = useMemo(() => {
    const cols = [...columns];
    if (rowActions) {
      cols.push({
        key: '_actions',
        label: 'Actions',
        sortable: false,
        width: 'w-32',
      });
    }
    return cols;
  }, [columns, rowActions]);

  const hasBulkActions = bulkActions.length > 0;

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="space-y-3">
        {/* Search */}
        {searchKeys.length > 0 && (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
          </div>
        )}

        {/* Filter pills */}
        {filterOptions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((filter) => (
              <button
                key={filter.key}
                onClick={() => onFilterChange?.(filter.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeFilter === filter.key
                    ? 'bg-orange-500 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {hasBulkActions && selectedIds.size > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm font-medium text-slate-700">
            {selectedIds.size} {selectedIds.size === 1 ? 'item' : 'items'}{' '}
            selected
          </div>
          <div className="flex flex-wrap gap-2">
            {bulkActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleBulkAction(action)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  action.variant === 'danger'
                    ? 'bg-red-50 text-red-700 hover:bg-red-100'
                    : action.variant === 'primary'
                    ? 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                {/* Checkbox column */}
                {hasBulkActions && (
                  <th className="py-3 px-6 text-left w-12">
                    <input
                      type="checkbox"
                      checked={allCurrentPageSelected}
                      ref={(el) => {
                        if (el) {
                          el.indeterminate = someCurrentPageSelected;
                        }
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500"
                    />
                  </th>
                )}

                {/* Data columns */}
                {displayColumns.map((column) => (
                  <th
                    key={column.key}
                    className={`py-3 px-6 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider ${
                      column.width || ''
                    } ${getHideClass(column.hideBelow)}`}
                  >
                    {column.sortable ? (
                      <button
                        onClick={() => handleSort(column.key)}
                        className="flex items-center gap-2 hover:text-slate-700 transition-colors"
                      >
                        {column.label}
                        {getSortIcon(column.key)}
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // Loading skeleton
                Array.from({ length: 8 }).map((_, idx) => (
                  <tr key={idx} className="border-b border-slate-100">
                    {hasBulkActions && (
                      <td className="px-6 py-4">
                        <div className="h-4 w-4 bg-slate-200 rounded animate-pulse" />
                      </td>
                    )}
                    {displayColumns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-6 py-4 ${getHideClass(
                          column.hideBelow
                        )}`}
                      >
                        <div className="h-4 bg-slate-200 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                // Empty state
                <tr>
                  <td
                    colSpan={
                      displayColumns.length + (hasBulkActions ? 1 : 0)
                    }
                    className="px-6 py-16"
                  >
                    <div className="flex flex-col items-center justify-center text-center">
                      {EmptyIcon && (
                        <EmptyIcon className="h-12 w-12 text-slate-300 mb-4" />
                      )}
                      <p className="text-slate-500 text-sm">{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                // Data rows
                paginatedData.map((row) => {
                  const rowId = getRowId(row);
                  const isSelected = selectedIds.has(rowId);

                  return (
                    <tr
                      key={rowId}
                      onClick={() => !hasBulkActions && onRowClick?.(row)}
                      className={`border-b border-slate-100 transition-colors ${
                        onRowClick && !hasBulkActions
                          ? 'cursor-pointer hover:bg-slate-50'
                          : ''
                      } ${isSelected ? 'bg-orange-50' : ''}`}
                    >
                      {/* Checkbox cell */}
                      {hasBulkActions && (
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleSelectRow(rowId, e.target.checked);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500"
                          />
                        </td>
                      )}

                      {/* Data cells */}
                      {displayColumns.map((column) => {
                        // Actions column
                        if (column.key === '_actions' && rowActions) {
                          return (
                            <td
                              key={column.key}
                              className={`px-6 py-4 ${getHideClass(
                                column.hideBelow
                              )}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {rowActions(row)}
                            </td>
                          );
                        }

                        // Regular column
                        const value = column.key
                          .split('.')
                          .reduce((obj, k) => obj?.[k], row);

                        return (
                          <td
                            key={column.key}
                            className={`px-6 py-4 text-sm text-slate-700 ${getHideClass(
                              column.hideBelow
                            )}`}
                          >
                            {column.render
                              ? column.render(value, row)
                              : value ?? '-'}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && sortedData.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Results text */}
            <div className="text-sm text-slate-600">
              Showing {startIndex}-{endIndex} of {sortedData.length}
            </div>

            {/* Page controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                {/* Previous button */}
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Page numbers */}
                {getPageNumbers().map((page, idx) => {
                  if (page === '...') {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-3 py-2 text-slate-400"
                      >
                        ...
                      </span>
                    );
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        currentPage === page
                          ? 'bg-orange-500 text-white'
                          : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                {/* Next button */}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
