'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { X, Bookmark } from 'lucide-react'
import { FilterMultiSelect, FilterOption } from './FilterMultiSelect'
import { FilterPills } from './FilterPill'
import { ExportButton } from './ExportButton'
import { SearchSuggestionsDropdown } from './SearchSuggestionsDropdown'
import { FilterPresetsMenu } from './FilterPresetsMenu'
import { QuickFilterButtons, createDefaultQuickFilters } from './QuickFilterButtons'
import { AdvancedQueryBuilder } from './AdvancedQueryBuilder'
import { QueryTemplateManager } from './QueryTemplateManager'
import { useSearchSuggestions } from '../hooks/useSearchSuggestions'
import { useFilterPresets } from '../hooks/useFilterPresets'
import { useQueryBuilder } from '../hooks/useQueryBuilder'
import { useFilterHistory } from '../hooks/useFilterHistory'
import { FilterHistoryPanel } from './FilterHistoryPanel'
import { FilterState } from '../hooks/useFilterState'
import { UserItem } from '../contexts/UserDataContext'
import { FilterGroup, FilterCondition } from '../types/query-builder'

export interface UserDirectoryFilterBarEnhancedProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  onToggleRole?: (role: string) => void
  onToggleStatus?: (status: string) => void
  onClearRoles?: () => void
  onClearStatuses?: () => void

  selectedCount: number
  totalCount: number
  filteredCount: number
  filteredUsers?: UserItem[]
  allUsers?: UserItem[]
  selectedUserIds?: Set<string>
  onSelectAll: (selected: boolean) => void

  roleOptions?: FilterOption[]
  statusOptions?: FilterOption[]

  onClearFilters: () => void
  multiSelect?: boolean
  showExport?: boolean
  showPresets?: boolean
  showQuickFilters?: boolean
}

const DEFAULT_ROLE_OPTIONS: FilterOption[] = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'TEAM_LEAD', label: 'Team Lead' },
  { value: 'TEAM_MEMBER', label: 'Team Member' },
  { value: 'STAFF', label: 'Staff' },
  { value: 'CLIENT', label: 'Client' },
  { value: 'VIEWER', label: 'Viewer' }
]

const DEFAULT_STATUS_OPTIONS: FilterOption[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' }
]

export function UserDirectoryFilterBarEnhanced({
  filters,
  onFiltersChange,
  onToggleRole,
  onToggleStatus,
  onClearRoles,
  onClearStatuses,
  selectedCount,
  totalCount,
  filteredCount,
  filteredUsers = [],
  allUsers = [],
  selectedUserIds,
  onSelectAll,
  roleOptions = DEFAULT_ROLE_OPTIONS,
  statusOptions = DEFAULT_STATUS_OPTIONS,
  onClearFilters,
  multiSelect = true,
  showExport = true,
  showPresets = true,
  showQuickFilters = true
}: UserDirectoryFilterBarEnhancedProps) {
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [presetsOpen, setPresetsOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  const { suggestions, isLoading } = useSearchSuggestions(
    allUsers,
    filters.search,
    5
  )

  const {
    presets,
    isLoaded: presetsLoaded,
    createPreset,
    deletePreset,
    togglePin,
    getAllPresets
  } = useFilterPresets()

  const queryBuilder = useQueryBuilder()
  const quickFilters = useMemo(() => createDefaultQuickFilters(), [])

  const filterHistory = useFilterHistory()

  const hasActiveFilters = !!(
    filters.search ||
    (filters.roles?.length ?? 0) > 0 ||
    (filters.statuses?.length ?? 0) > 0
  )

  const allFiltered = selectedCount === filteredCount && filteredCount > 0

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const next: FilterState = { ...filters, search: value, roles: filters.roles || [], statuses: filters.statuses || [] }
    onFiltersChange(next)
    setSuggestionsOpen(!!value)
    filterHistory.addEntry(next)
  }, [filters, onFiltersChange, filterHistory])

  const handleSuggestionSelect = useCallback((suggestion: any) => {
    const next: FilterState = { ...filters, search: suggestion.text, roles: filters.roles || [], statuses: filters.statuses || [] }
    onFiltersChange(next)
    setSuggestionsOpen(false)
  }, [filters, onFiltersChange])

  const handleLoadPreset = useCallback((preset: any) => {
    onFiltersChange(preset.filters)
    filterHistory.addEntry(preset.filters)
    setPresetsOpen(false)
  }, [onFiltersChange, filterHistory])

  const handleCreatePreset = useCallback((name: string, filterState: FilterState, description?: string) => {
    createPreset(name, filterState, description)
    filterHistory.addEntry(filterState)
  }, [createPreset, filterHistory])

  const handleApplyQuickFilter = useCallback((filterState: FilterState) => {
    onFiltersChange(filterState)
    filterHistory.addEntry(filterState)
  }, [onFiltersChange, filterHistory])

  const handleApplyAdvancedQuery = useCallback((query: FilterGroup | FilterCondition) => {
    queryBuilder.applyQueryToUsers(allUsers)
    const simpleFilters = queryBuilder.queryToFilterState()
    onFiltersChange(simpleFilters)
    filterHistory.addEntry(simpleFilters)
  }, [queryBuilder, allUsers, onFiltersChange, filterHistory])

  const handleLoadTemplate = useCallback((template: any) => {
    if (template.query) {
      queryBuilder.setQuery(template.query)
      handleApplyAdvancedQuery(template.query)
    }
  }, [queryBuilder, handleApplyAdvancedQuery])

  const handleSelectAllChange = useCallback((checked: boolean) => {
    onSelectAll(checked)
  }, [onSelectAll])

  // Get selected role/status labels for pills
  const selectedRoles = useMemo(() => {
    return (filters.roles || []).map(value => {
      const option = roleOptions.find(opt => opt.value === value)
      return { value, label: option?.label || value }
    })
  }, [filters.roles, roleOptions])

  const selectedStatuses = useMemo(() => {
    return (filters.statuses || []).map(value => {
      const option = statusOptions.find(opt => opt.value === value)
      return { value, label: option?.label || value }
    })
  }, [filters.statuses, statusOptions])

  return (
    <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
      {/* Main filter row */}
      <div
        className="grid grid-cols-[40px_minmax(180px,2fr)_1fr_1fr_auto_auto_auto_auto] gap-3 p-3 items-center"
        role="toolbar"
        aria-label="User directory filters"
      >
        {/* Select All Checkbox */}
        <div className="flex items-center justify-center">
          <Checkbox
            checked={allFiltered && selectedCount > 0}
            onCheckedChange={handleSelectAllChange}
            aria-label={selectedCount > 0 ? 'Deselect all users' : 'Select all filtered users'}
            title={selectedCount > 0 ? 'Deselect all' : 'Select all filtered users'}
          />
        </div>

        {/* Search Input */}
        <div className="relative">
          <Input
            type="text"
            placeholder="Search name, email, phone..."
            value={filters.search}
            onChange={handleSearchChange}
            onFocus={() => setSuggestionsOpen(!!filters.search)}
            onBlur={() => setTimeout(() => setSuggestionsOpen(false), 200)}
            className="w-full text-sm pl-3 pr-8"
            aria-label="Search users by name, email, or phone"
            autoComplete="off"
          />
          {filters.search && (
            <button
              onClick={() => onFiltersChange({ ...filters, search: '' })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <SearchSuggestionsDropdown
            suggestions={suggestions}
            isLoading={isLoading}
            isOpen={suggestionsOpen && (suggestions.length > 0 || isLoading)}
            onSelectSuggestion={handleSuggestionSelect}
            searchQuery={filters.search}
          />
        </div>

        {/* Multi-select role filter */}
        <FilterMultiSelect
          label="Roles"
          placeholder="All Roles"
          options={roleOptions}
          selectedValues={filters.roles || []}
          onToggle={onToggleRole || (() => {})}
          onClear={onClearRoles || (() => {})}
          ariaLabel="Filter by roles (multi-select)"
        />

        {/* Multi-select status filter */}
        <FilterMultiSelect
          label="Status"
          placeholder="All Statuses"
          options={statusOptions}
          selectedValues={filters.statuses || []}
          onToggle={onToggleStatus || (() => {})}
          onClear={onClearStatuses || (() => {})}
          ariaLabel="Filter by status (multi-select)"
        />

        {/* Presets Button */}
        {showPresets && presetsLoaded && (
          <Button
            onClick={() => setPresetsOpen(!presetsOpen)}
            variant={presetsOpen ? 'default' : 'outline'}
            size="sm"
            className="text-xs"
            aria-label="Manage filter presets"
            title="Save and load filter presets"
          >
            <Bookmark className="w-3 h-3 mr-1" />
            Presets
            {presets.length > 0 && (
              <span className="ml-1.5 inline-flex items-center px-1.5 py-0 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                {presets.length}
              </span>
            )}
          </Button>
        )}

        {/* History Button */}
        <Button
          onClick={() => setHistoryOpen(!historyOpen)}
          variant={historyOpen ? 'default' : 'outline'}
          size="sm"
          className="text-xs"
          aria-label="View filter history"
          title="View recent filters"
        >
          {/* Using SVG to avoid additional imports to keep bundle minimal */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 mr-1"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-5h-2"/><path d="M12 7v5l3 2"/></svg>
          History
        </Button>

        {/* Export Button */}
        {showExport && (
          <ExportButton
            users={filteredUsers.length > 0 ? filteredUsers : allUsers}
            selectedUserIds={selectedUserIds}
            filteredCount={filteredCount}
            totalCount={totalCount}
            variant="outline"
            size="sm"
          />
        )}

        {/* Advanced Query Builder */}
        <AdvancedQueryBuilder
          onApplyQuery={handleApplyAdvancedQuery}
        />

        {/* Query Template Manager */}
        <QueryTemplateManager
          onLoadTemplate={handleLoadTemplate}
        />

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            onClick={onClearFilters}
            variant="outline"
            size="sm"
            className="text-xs"
            aria-label="Clear all filters"
          >
            <X className="w-3 h-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Filter Pills Row */}
      {hasActiveFilters && (
        <FilterPills
          search={filters.search}
          roles={selectedRoles}
          statuses={selectedStatuses}
          onRemoveSearch={() => onFiltersChange({ ...filters, search: '' })}
          onRemoveRole={(role) => onToggleRole?.(role)}
          onRemoveStatus={(status) => onToggleStatus?.(status)}
          onClearAll={onClearFilters}
        />
      )}

      {/* Quick Filter Buttons */}
      {showQuickFilters && (
        <QuickFilterButtons
          quickFilters={quickFilters}
          onApplyFilter={handleApplyQuickFilter}
          currentFilters={filters}
          users={allUsers}
        />
      )}

      {/* Results Counter Row */}
      <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-100 bg-gray-50">
        <span aria-live="polite" aria-atomic="true">
          {selectedCount > 0 && (
            <span className="font-medium text-gray-700">
              {selectedCount} selected
            </span>
          )}
          {selectedCount > 0 && ' • '}
          <span>
            {filteredCount} of {totalCount} users
          </span>
        </span>
      </div>

      {/* Filter Presets Menu */}
      {showPresets && presetsLoaded && (
        <FilterPresetsMenu
          presets={getAllPresets()}
          isOpen={presetsOpen}
          onOpenChange={setPresetsOpen}
          onLoadPreset={handleLoadPreset}
          onCreatePreset={handleCreatePreset}
          onDeletePreset={deletePreset}
          onTogglePin={togglePin}
          currentFilters={filters}
        />
      )}

      {/* Filter History Panel */}
      <FilterHistoryPanel
        isOpen={historyOpen}
        onOpenChange={setHistoryOpen}
        history={filterHistory.history}
        onReapply={(f) => { const next: FilterState = { search: f.search || '', roles: f.roles || [], statuses: f.statuses || [] }; onFiltersChange(next); filterHistory.addEntry(next); setHistoryOpen(false) }}
        onClearHistory={() => filterHistory.clearHistory()}
        onExportHistory={() => filterHistory.exportHistory()}
        helpers={{ relativeTime: filterHistory.helpers.relativeTime, describeFilters: filterHistory.helpers.describeFilters }}
      />
    </div>
  )
}
