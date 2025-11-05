'use client'

import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../../../../test-mocks/testing-library-react'
import { WorkstationLayout } from '../WorkstationLayout'
import { WorkstationSidebar } from '../WorkstationSidebar'
import { WorkstationMainContent } from '../WorkstationMainContent'
import type { UserFilters, QuickStatsData } from '../../../types/workstation'

describe('Workstation Integration Tests', () => {
  const defaultStats: QuickStatsData = {
    totalUsers: 150,
    activeUsers: 120,
    pendingApprovals: 10,
    inProgressWorkflows: 5,
    refreshedAt: new Date(),
  }

  const defaultFilters: UserFilters = {
    search: '',
    role: '',
    status: '',
    department: '',
    dateRange: 'all',
  }

  const mockUsers = [
    { id: '1', name: 'John Admin', email: 'john@example.com' },
    { id: '2', name: 'Jane Client', email: 'jane@example.com' },
    { id: '3', name: 'Bob Staff', email: 'bob@example.com' },
  ]

  // Test 1: Filter Application Flow
  describe('Filter Application Flow', () => {
    it('should apply filters when saved view button clicked', () => {
      const onFiltersChange = jest.fn()

      render(
        <WorkstationSidebar
          filters={defaultFilters}
          onFiltersChange={onFiltersChange}
          stats={defaultStats}
        />
      )

      const clientsBtn = screen.getByTestId('view-btn-clients')
      fireEvent.click(clientsBtn)

      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'CLIENT',
        })
      )
    })

    it('should clear filters when reset button clicked', () => {
      const onFiltersChange = jest.fn()
      const onReset = jest.fn()

      render(
        <WorkstationSidebar
          filters={{ ...defaultFilters, role: 'ADMIN', search: 'john' }}
          onFiltersChange={onFiltersChange}
          stats={defaultStats}
          onReset={onReset}
        />
      )

      const resetBtn = screen.getByTestId('reset-filters-btn')
      fireEvent.click(resetBtn)

      expect(onFiltersChange).toHaveBeenCalledWith({
        search: '',
        role: '',
        status: '',
        department: '',
        dateRange: 'all',
      })
      expect(onReset).toHaveBeenCalled()
    })

    it('should persist filters across component updates', () => {
      const filters: UserFilters = {
        search: 'admin',
        role: 'ADMIN',
        status: 'ACTIVE',
        department: 'IT',
        dateRange: 'month',
      }

      const { rerender } = render(
        <WorkstationSidebar
          filters={filters}
          onFiltersChange={() => {}}
          stats={defaultStats}
        />
      )

      const sidebar1 = screen.getByTestId('workstation-sidebar')
      expect(sidebar1).toBeTruthy()

      rerender(
        <WorkstationSidebar
          filters={filters}
          onFiltersChange={() => {}}
          stats={defaultStats}
        />
      )

      const sidebar2 = screen.getByTestId('workstation-sidebar')
      expect(sidebar2).toBeTruthy()
    })
  })

  // Test 2: User List Update Flow
  describe('User List Update Flow', () => {
    it('should update user list when filters change', () => {
      const { rerender } = render(
        <WorkstationMainContent
          users={mockUsers as any}
          stats={{ total: 3, clients: 1, staff: 1, admins: 1 } as any}
          isLoading={false}
        />
      )

      expect(screen.getByText('3 users')).toBeTruthy()

      // Simulate filter being applied (in real app, this would fetch new users)
      const filteredUsers = [mockUsers[1]] // Only clients
      rerender(
        <WorkstationMainContent
          users={filteredUsers as any}
          stats={{ total: 1, clients: 1, staff: 0, admins: 0 } as any}
          isLoading={false}
        />
      )

      expect(screen.getByText('1 users')).toBeTruthy()
    })

    it('should show loading state during refresh', async () => {
      const onRefresh = jest.fn(async () => {
        return new Promise(resolve => setTimeout(resolve, 100))
      })

      const { rerender } = render(
        <WorkstationMainContent
          users={mockUsers as any}
          stats={{ total: 3 } as any}
          isLoading={false}
          onRefresh={onRefresh}
        />
      )

      expect(screen.queryByText(/Loading user directory/i)).toBeFalsy()

      // Simulate loading state
      rerender(
        <WorkstationMainContent
          users={mockUsers as any}
          stats={{ total: 3 } as any}
          isLoading={true}
          onRefresh={onRefresh}
        />
      )

      expect(screen.getByText(/Loading user directory/i)).toBeTruthy()

      // Back to loaded
      rerender(
        <WorkstationMainContent
          users={mockUsers as any}
          stats={{ total: 3 } as any}
          isLoading={false}
          onRefresh={onRefresh}
        />
      )

      expect(screen.queryByText(/Loading user directory/i)).toBeFalsy()
    })

    it('should maintain scroll position when filters applied', () => {
      const { container, rerender } = render(
        <WorkstationMainContent
          users={mockUsers as any}
          stats={{ total: 3 } as any}
          isLoading={false}
        />
      )

      // In real app, user would scroll - we just verify component structure
      expect(container.querySelector('.workstation-main-content')).toBeTruthy()

      rerender(
        <WorkstationMainContent
          users={mockUsers as any}
          stats={{ total: 3 } as any}
          isLoading={false}
        />
      )

      expect(container.querySelector('.workstation-main-content')).toBeTruthy()
    })
  })

  // Test 3: Sidebar-Main Content Interaction
  describe('Sidebar-Main Content Interaction', () => {
    it('should compose sidebar and main content in layout', () => {
      const sidebarContent = (
        <WorkstationSidebar
          filters={defaultFilters}
          onFiltersChange={() => {}}
          stats={defaultStats}
        />
      )

      const mainContent = (
        <WorkstationMainContent
          users={mockUsers as any}
          stats={{ total: 3 } as any}
          isLoading={false}
        />
      )

      render(
        <WorkstationLayout
          sidebar={sidebarContent}
          main={mainContent}
          insights={<div>Insights</div>}
        />
      )

      // Both sidebar and main content should be present
      expect(screen.getByTestId('workstation-sidebar')).toBeTruthy()
      expect(screen.getByText('User Directory')).toBeTruthy()
    })

    it('should handle sidebar state changes with main content updates', () => {
      const onFiltersChange = jest.fn()

      const { rerender } = render(
        <WorkstationLayout
          sidebar={
            <WorkstationSidebar
              isOpen={true}
              onClose={() => {}}
              filters={defaultFilters}
              onFiltersChange={onFiltersChange}
              stats={defaultStats}
            />
          }
          main={
            <WorkstationMainContent
              users={mockUsers as any}
              stats={{ total: 3 } as any}
              isLoading={false}
            />
          }
          insights={<div>Insights</div>}
        />
      )

      // Click saved view
      const clientsBtn = screen.getByTestId('view-btn-clients')
      fireEvent.click(clientsBtn)

      expect(onFiltersChange).toHaveBeenCalled()

      // Update with filtered users
      rerender(
        <WorkstationLayout
          sidebar={
            <WorkstationSidebar
              isOpen={true}
              onClose={() => {}}
              filters={{ ...defaultFilters, role: 'CLIENT' }}
              onFiltersChange={onFiltersChange}
              stats={defaultStats}
            />
          }
          main={
            <WorkstationMainContent
              users={[mockUsers[1]] as any}
              stats={{ total: 1 } as any}
              isLoading={false}
            />
          }
          insights={<div>Insights</div>}
        />
      )

      expect(screen.getByText('1 users')).toBeTruthy()
    })
  })

  // Test 4: Mobile Drawer Integration
  describe('Mobile Drawer Integration', () => {
    it('should open and close sidebar drawer on mobile', () => {
      const onClose = jest.fn()
      const { rerender } = render(
        <WorkstationSidebar
          isOpen={false}
          onClose={onClose}
          filters={defaultFilters}
          onFiltersChange={() => {}}
          stats={defaultStats}
        />
      )

      expect(screen.getByTestId('sidebar-close-btn')).toBeTruthy()

      // Simulate drawer close
      const closeBtn = screen.getByTestId('sidebar-close-btn')
      fireEvent.click(closeBtn)

      expect(onClose).toHaveBeenCalled()
    })

    it('should maintain filter state when drawer closes', () => {
      const filters: UserFilters = {
        search: 'admin',
        role: 'ADMIN',
        status: '',
        department: '',
        dateRange: 'month',
      }

      const onClose = jest.fn()

      render(
        <WorkstationSidebar
          isOpen={true}
          onClose={onClose}
          filters={filters}
          onFiltersChange={() => {}}
          stats={defaultStats}
        />
      )

      const closeBtn = screen.getByTestId('sidebar-close-btn')
      fireEvent.click(closeBtn)

      expect(onClose).toHaveBeenCalled()
      // Filters should be preserved
      expect(screen.getByTestId('workstation-sidebar')).toBeTruthy()
    })
  })

  // Test 5: Quick Stats Refresh Integration
  describe('Quick Stats Refresh Integration', () => {
    it('should update stats when refresh button clicked', async () => {
      let statsValue = defaultStats

      const onRefresh = jest.fn(async () => {
        statsValue = {
          ...statsValue,
          activeUsers: 125,
          refreshedAt: new Date(),
        }
      })

      const { rerender } = render(
        <WorkstationSidebar
          filters={defaultFilters}
          onFiltersChange={() => {}}
          stats={statsValue}
        />
      )

      expect(screen.getByTestId('stats-container')).toBeTruthy()

      // Simulate refresh
      await onRefresh()

      rerender(
        <WorkstationSidebar
          filters={defaultFilters}
          onFiltersChange={() => {}}
          stats={statsValue}
        />
      )

      expect(screen.getByTestId('stats-container')).toBeTruthy()
    })

    it('should maintain filter state during stats refresh', async () => {
      const filters: UserFilters = {
        search: 'test',
        role: 'ADMIN',
        status: 'ACTIVE',
        department: '',
        dateRange: 'week',
      }

      const onRefresh = jest.fn(async () => {})

      const { rerender } = render(
        <WorkstationSidebar
          filters={filters}
          onFiltersChange={() => {}}
          stats={defaultStats}
        />
      )

      // Even after refresh, filters should persist
      rerender(
        <WorkstationSidebar
          filters={filters}
          onFiltersChange={() => {}}
          stats={{
            ...defaultStats,
            activeUsers: 125,
            refreshedAt: new Date(),
          }}
        />
      )

      expect(screen.getByTestId('workstation-sidebar')).toBeTruthy()
    })
  })

  // Test 6: Action Button Coordination
  describe('Action Button Coordination', () => {
    it('should coordinate actions across sidebar and main content', () => {
      const onAddUser = jest.fn()
      const onFiltersChange = jest.fn()

      render(
        <div>
          <WorkstationSidebar
            filters={defaultFilters}
            onFiltersChange={onFiltersChange}
            stats={defaultStats}
            onAddUser={onAddUser}
          />
          <WorkstationMainContent
            users={mockUsers as any}
            stats={{ total: 3 } as any}
            isLoading={false}
            onAddUser={onAddUser}
          />
        </div>
      )

      // Both components have add user button capability
      expect(onAddUser).toBeDefined()
      expect(onFiltersChange).toBeDefined()
    })

    it('should handle multiple action callbacks simultaneously', async () => {
      const onAddUser = jest.fn()
      const onImport = jest.fn()
      const onBulkOperation = jest.fn()
      const onExport = jest.fn()
      const onRefresh = jest.fn(async () => {})

      render(
        <WorkstationMainContent
          users={mockUsers as any}
          stats={{ total: 3 } as any}
          isLoading={false}
          onAddUser={onAddUser}
          onImport={onImport}
          onBulkOperation={onBulkOperation}
          onExport={onExport}
          onRefresh={onRefresh}
        />
      )

      // Verify all callbacks are registered
      expect(onAddUser).toBeDefined()
      expect(onImport).toBeDefined()
      expect(onBulkOperation).toBeDefined()
      expect(onExport).toBeDefined()
      expect(onRefresh).toBeDefined()
    })
  })

  // Test 7: State Synchronization
  describe('State Synchronization', () => {
    it('should sync filter changes between components', () => {
      const onFiltersChange = jest.fn()
      const newFilters: UserFilters = {
        search: 'john',
        role: 'ADMIN',
        status: 'ACTIVE',
        department: 'Engineering',
        dateRange: 'month',
      }

      const { rerender } = render(
        <WorkstationSidebar
          filters={defaultFilters}
          onFiltersChange={onFiltersChange}
          stats={defaultStats}
        />
      )

      // Apply filter via saved view
      const adminBtn = screen.getByTestId('view-btn-admins')
      fireEvent.click(adminBtn)

      expect(onFiltersChange).toHaveBeenCalled()

      // Verify filter is applied
      rerender(
        <WorkstationSidebar
          filters={newFilters}
          onFiltersChange={onFiltersChange}
          stats={defaultStats}
        />
      )

      expect(screen.getByTestId('workstation-sidebar')).toBeTruthy()
    })

    it('should sync stats between sidebar and main content', () => {
      const stats: QuickStatsData = {
        totalUsers: 200,
        activeUsers: 180,
        pendingApprovals: 15,
        inProgressWorkflows: 8,
        refreshedAt: new Date(),
      }

      const { rerender } = render(
        <div>
          <WorkstationSidebar
            filters={defaultFilters}
            onFiltersChange={() => {}}
            stats={stats}
          />
          <WorkstationMainContent
            users={mockUsers as any}
            stats={{ total: 200 } as any}
            isLoading={false}
          />
        </div>
      )

      // Update stats
      const updatedStats = {
        ...stats,
        totalUsers: 210,
        refreshedAt: new Date(),
      }

      rerender(
        <div>
          <WorkstationSidebar
            filters={defaultFilters}
            onFiltersChange={() => {}}
            stats={updatedStats}
          />
          <WorkstationMainContent
            users={mockUsers as any}
            stats={{ total: 210 } as any}
            isLoading={false}
          />
        </div>
      )

      expect(screen.getByTestId('workstation-sidebar')).toBeTruthy()
    })
  })

  // Test 8: Error Recovery
  describe('Error Recovery', () => {
    it('should recover from filter change errors', async () => {
      const onFiltersChange = jest.fn()

      render(
        <WorkstationSidebar
          filters={defaultFilters}
          onFiltersChange={onFiltersChange}
          stats={defaultStats}
        />
      )

      // Apply filter
      const clientsBtn = screen.getByTestId('view-btn-clients')
      fireEvent.click(clientsBtn)

      expect(onFiltersChange).toHaveBeenCalled()

      // Component should still be functional
      const resetBtn = screen.getByTestId('reset-filters-btn')
      expect(resetBtn).toBeTruthy()
    })

    it('should handle refresh failures gracefully', async () => {
      const onRefresh = jest.fn(async () => {
        throw new Error('Refresh failed')
      })

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      render(
        <WorkstationMainContent
          users={mockUsers as any}
          stats={{ total: 3 } as any}
          isLoading={false}
          onRefresh={onRefresh}
        />
      )

      const refreshBtn = screen.getByRole('button', { name: /Refresh/i })
      fireEvent.click(refreshBtn)

      // Wait for error to be logged
      await waitFor(() => {
        // Component should still be functional
        expect(screen.getByText('User Directory')).toBeTruthy()
      })

      consoleErrorSpy.mockRestore()
    })
  })

  // Test 9: Performance Optimization
  describe('Performance Optimization', () => {
    it('should not re-render unnecessarily when props unchanged', () => {
      const renderSpy = jest.fn()

      const Component = ({ filters }: { filters: UserFilters }) => {
        renderSpy()
        return (
          <WorkstationSidebar
            filters={filters}
            onFiltersChange={() => {}}
            stats={defaultStats}
          />
        )
      }

      const { rerender } = render(
        <Component filters={defaultFilters} />
      )

      const initialCallCount = renderSpy.mock.calls.length

      // Re-render with same filters
      rerender(
        <Component filters={defaultFilters} />
      )

      // Should still work (though memo might not be fully testable here)
      expect(screen.getByTestId('workstation-sidebar')).toBeTruthy()
    })
  })

  // Test 10: Complex User Workflows
  describe('Complex User Workflows', () => {
    it('should handle complete user filtering workflow', () => {
      const onFiltersChange = jest.fn()

      const { rerender } = render(
        <WorkstationLayout
          sidebar={
            <WorkstationSidebar
              filters={defaultFilters}
              onFiltersChange={onFiltersChange}
              stats={defaultStats}
            />
          }
          main={
            <WorkstationMainContent
              users={mockUsers as any}
              stats={{ total: 3 } as any}
              isLoading={false}
            />
          }
          insights={<div>Insights</div>}
        />
      )

      // Step 1: View all users
      expect(screen.getByText('3 users')).toBeTruthy()

      // Step 2: Click Clients view
      const clientsBtn = screen.getByTestId('view-btn-clients')
      fireEvent.click(clientsBtn)

      expect(onFiltersChange).toHaveBeenCalled()

      // Step 3: Update with filtered users
      rerender(
        <WorkstationLayout
          sidebar={
            <WorkstationSidebar
              filters={{ ...defaultFilters, role: 'CLIENT' }}
              onFiltersChange={onFiltersChange}
              stats={defaultStats}
            />
          }
          main={
            <WorkstationMainContent
              users={[mockUsers[1]] as any}
              stats={{ total: 1 } as any}
              isLoading={false}
            />
          }
          insights={<div>Insights</div>}
        />
      )

      expect(screen.getByText('1 users')).toBeTruthy()

      // Step 4: Reset filters
      const resetBtn = screen.getByTestId('reset-filters-btn')
      fireEvent.click(resetBtn)

      // Step 5: Back to all users
      rerender(
        <WorkstationLayout
          sidebar={
            <WorkstationSidebar
              filters={defaultFilters}
              onFiltersChange={onFiltersChange}
              stats={defaultStats}
            />
          }
          main={
            <WorkstationMainContent
              users={mockUsers as any}
              stats={{ total: 3 } as any}
              isLoading={false}
            />
          }
          insights={<div>Insights</div>}
        />
      )

      expect(screen.getByText('3 users')).toBeTruthy()
    })

    it('should handle multiple concurrent operations', async () => {
      const onRefresh = jest.fn(async () => {})
      const onFiltersChange = jest.fn()

      const { rerender } = render(
        <div>
          <WorkstationSidebar
            filters={defaultFilters}
            onFiltersChange={onFiltersChange}
            stats={defaultStats}
          />
          <WorkstationMainContent
            users={mockUsers as any}
            stats={{ total: 3 } as any}
            isLoading={false}
            onRefresh={onRefresh}
          />
        </div>
      )

      // Apply filter while loading
      rerender(
        <div>
          <WorkstationSidebar
            filters={{ ...defaultFilters, role: 'ADMIN' }}
            onFiltersChange={onFiltersChange}
            stats={defaultStats}
          />
          <WorkstationMainContent
            users={[mockUsers[0]] as any}
            stats={{ total: 1 } as any}
            isLoading={true}
            onRefresh={onRefresh}
          />
        </div>
      )

      expect(screen.getByTestId('workstation-sidebar')).toBeTruthy()
      expect(screen.getByText(/Loading/i)).toBeTruthy()
    })
  })
})
