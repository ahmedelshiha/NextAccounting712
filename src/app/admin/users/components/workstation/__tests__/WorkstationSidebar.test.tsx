import React from 'react'
import { render, screen } from '../../../../../../test-mocks/testing-library-react'
import { WorkstationSidebar } from '../WorkstationSidebar'

const noop = () => {}

test('WorkstationSidebar shows quick stats and filters sections', () => {
  const stats = { total: 42, clients: 10, staff: 20, admins: 3 }

  render(
    <WorkstationSidebar
      isOpen={true}
      onClose={noop}
      filters={{}}
      onFiltersChange={noop}
      stats={stats as any}
      onAddUser={noop}
      onReset={noop}
    />
  )

  // Quick stats section should be present
  const quickStats = screen.getByTestId('quick-stats-section')
  expect(quickStats).toBeTruthy()

  // Filters section should be present
  const filters = screen.getByTestId('filters-section')
  expect(filters).toBeTruthy()

  // Saved views buttons render counts (total included)
  const rendered = (globalThis as any).__renderedHtml || ''
  expect(rendered).toContain('Total Users')
  // Saved Views button should be rendered
  if (rendered) {
    expect(rendered).toContain('Saved Views')
  }
})
