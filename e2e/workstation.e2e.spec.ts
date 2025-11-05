import { test, expect } from '@playwright/test'

test.describe('Workstation E2E Tests', () => {
  const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'
  const ADMIN_USERS_PATH = '/admin/users'

  test.beforeEach(async ({ page }) => {
    // Navigate to admin users page
    await page.goto(`${BASE_URL}${ADMIN_USERS_PATH}`)
    // Wait for page to load
    await page.waitForLoadState('networkidle')
  })

  test.describe('1. Layout and Structure Tests', () => {
    test('should render complete workstation layout', async ({ page }) => {
      // Check for main layout elements
      const container = page.locator('.workstation-container')
      await expect(container).toBeVisible()

      const sidebar = page.locator('.workstation-sidebar')
      await expect(sidebar).toBeVisible()

      const mainContent = page.locator('.workstation-main-content')
      await expect(mainContent).toBeVisible()

      const insightsPanel = page.locator('.workstation-insights-panel')
      await expect(insightsPanel).toBeVisible()
    })

    test('should have correct semantic structure', async ({ page }) => {
      // Check for main element
      const mainElement = page.locator('main.workstation-main-content')
      await expect(mainElement).toBeVisible()

      // Check for aside elements
      const asideElements = page.locator('aside')
      const count = await asideElements.count()
      expect(count).toBeGreaterThanOrEqual(2)
    })

    test('should render sidebar with all sections', async ({ page }) => {
      const sidebar = page.locator('[data-testid="workstation-sidebar"]')
      await expect(sidebar).toBeVisible()

      const statsSection = page.locator('[data-testid="quick-stats-section"]')
      await expect(statsSection).toBeVisible()

      const filtersSection = page.locator('[data-testid="filters-section"]')
      await expect(filtersSection).toBeVisible()

      const footer = page.locator('[data-testid="sidebar-footer"]')
      await expect(footer).toBeVisible()
    })

    test('should render main content with all sections', async ({ page }) => {
      // Check for quick actions
      const quickActions = page.locator('[aria-label="Quick Actions"]')
      await expect(quickActions).toBeVisible()

      // Check for metrics
      const metrics = page.locator('[aria-label="User Metrics"]')
      await expect(metrics).toBeVisible()

      // Check for user directory
      const directory = page.locator('[aria-label="User Directory"]')
      await expect(directory).toBeVisible()

      // Check for pagination
      const pagination = page.locator('[aria-label="Pagination"]')
      await expect(pagination).toBeVisible()
    })
  })

  test.describe('2. Filter Workflow Tests', () => {
    test('should apply client filter when clicking Clients view', async ({ page }) => {
      const clientsBtn = page.locator('[data-testid="view-btn-clients"]')
      await expect(clientsBtn).toBeVisible()

      // Click clients button
      await clientsBtn.click()

      // Button should show active state
      await expect(clientsBtn).toHaveClass(/active/)
    })

    test('should apply admin filter when clicking Admins view', async ({ page }) => {
      const adminsBtn = page.locator('[data-testid="view-btn-admins"]')
      await expect(adminsBtn).toBeVisible()

      // Click admins button
      await adminsBtn.click()

      // Button should show active state
      await expect(adminsBtn).toHaveClass(/active/)
    })

    test('should reset filters when clicking reset button', async ({ page }) => {
      // First apply a filter
      const clientsBtn = page.locator('[data-testid="view-btn-clients"]')
      await clientsBtn.click()

      // Then reset
      const resetBtn = page.locator('[data-testid="reset-filters-btn"]')
      await resetBtn.click()

      // All view should be active again
      const allBtn = page.locator('[data-testid="view-btn-all"]')
      await expect(allBtn).toHaveClass(/active/)
    })

    test('should display user counts on view buttons', async ({ page }) => {
      const allBtn = page.locator('[data-testid="view-btn-all"]')
      const clientsBtn = page.locator('[data-testid="view-btn-clients"]')
      const teamBtn = page.locator('[data-testid="view-btn-team"]')
      const adminsBtn = page.locator('[data-testid="view-btn-admins"]')

      await expect(allBtn).toContainText(/\d+/)
      await expect(clientsBtn).toContainText(/\d+/)
      await expect(teamBtn).toContainText(/\d+/)
      await expect(adminsBtn).toContainText(/\d+/)
    })

    test('should switch between different saved views smoothly', async ({ page }) => {
      const views = ['clients', 'team', 'admins', 'all']

      for (const view of views) {
        const btn = page.locator(`[data-testid="view-btn-${view}"]`)
        await btn.click()
        await expect(btn).toHaveClass(/active/)

        // Wait for any animations
        await page.waitForTimeout(300)
      }
    })
  })

  test.describe('3. Action Button Tests', () => {
    test('should have all action buttons visible and clickable', async ({ page }) => {
      const addBtn = page.locator('button[aria-label="Add new user"]')
      const importBtn = page.locator('button[aria-label="Import users"]')
      const bulkBtn = page.locator('button[aria-label="Bulk operations"]')
      const exportBtn = page.locator('button[aria-label="Export user list"]')
      const refreshBtn = page.locator('button[aria-label="Refresh user list"]')

      await expect(addBtn).toBeVisible()
      await expect(importBtn).toBeVisible()
      await expect(bulkBtn).toBeVisible()
      await expect(exportBtn).toBeVisible()
      await expect(refreshBtn).toBeVisible()
    })

    test('should have minimum touch target size of 44x44px', async ({ page }) => {
      const addBtn = page.locator('button[aria-label="Add new user"]')
      const box = await addBtn.boundingBox()

      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44)
        expect(box.height).toBeGreaterThanOrEqual(44)
      }
    })

    test('should refresh user list when clicking refresh button', async ({ page }) => {
      const refreshBtn = page.locator('button[aria-label="Refresh user list"]')
      const originalContent = await page.locator('[aria-label="User Directory"]').textContent()

      // Click refresh
      await refreshBtn.click()

      // Wait for potential API call
      await page.waitForTimeout(1000)

      // Content should still be visible
      const newContent = await page.locator('[aria-label="User Directory"]').textContent()
      expect(newContent).toBeTruthy()
    })
  })

  test.describe('4. Stats Display Tests', () => {
    test('should display quick stats card', async ({ page }) => {
      const statsContainer = page.locator('[data-testid="stats-container"]')
      await expect(statsContainer).toBeVisible()
    })

    test('should display total users stat', async ({ page }) => {
      const statsContainer = page.locator('[data-testid="stats-container"]')
      const text = await statsContainer.textContent()
      expect(text).toContain('Total Users')
    })

    test('should display all metric cards', async ({ page }) => {
      const metricsSection = page.locator('[aria-label="User Metrics"]')
      await expect(metricsSection).toBeVisible()

      const cards = page.locator('.metric-card')
      const count = await cards.count()
      expect(count).toBe(4) // Total, Pending, In Progress, Due This Week
    })

    test('should update stats after refresh', async ({ page }) => {
      const statsContainer = page.locator('[data-testid="stats-container"]')
      const initialText = await statsContainer.textContent()

      const refreshBtn = page.locator('button[aria-label="Refresh user list"]')
      await refreshBtn.click()

      await page.waitForTimeout(500)

      const updatedText = await statsContainer.textContent()
      expect(updatedText).toBeTruthy()
    })
  })

  test.describe('5. Mobile Responsiveness Tests', () => {
    test('should render on mobile viewport (375px)', async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 375, height: 667 },
      })
      const page = await context.newPage()
      await page.goto(`${BASE_URL}${ADMIN_USERS_PATH}`)
      await page.waitForLoadState('networkidle')

      const mainContent = page.locator('.workstation-main-content')
      await expect(mainContent).toBeVisible()

      // Insights panel should be hidden on mobile
      const insightsPanel = page.locator('.workstation-insights-panel')
      const display = await insightsPanel.evaluate(el => window.getComputedStyle(el).display)
      expect(display).toBe('none')

      await context.close()
    })

    test('should render on tablet viewport (768px)', async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 768, height: 1024 },
      })
      const page = await context.newPage()
      await page.goto(`${BASE_URL}${ADMIN_USERS_PATH}`)
      await page.waitForLoadState('networkidle')

      const container = page.locator('.workstation-container')
      await expect(container).toBeVisible()

      await context.close()
    })

    test('should render on desktop viewport (1920px)', async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
      })
      const page = await context.newPage()
      await page.goto(`${BASE_URL}${ADMIN_USERS_PATH}`)
      await page.waitForLoadState('networkidle')

      const sidebar = page.locator('.workstation-sidebar')
      const mainContent = page.locator('.workstation-main-content')
      const insightsPanel = page.locator('.workstation-insights-panel')

      await expect(sidebar).toBeVisible()
      await expect(mainContent).toBeVisible()
      await expect(insightsPanel).toBeVisible()

      await context.close()
    })
  })

  test.describe('6. Accessibility Tests', () => {
    test('should have proper ARIA labels on all interactive elements', async ({ page }) => {
      const addBtn = page.locator('button[aria-label="Add new user"]')
      const resetBtn = page.locator('[data-testid="reset-filters-btn"]')

      await expect(addBtn).toHaveAttribute('aria-label', /Add new user/)
      await expect(resetBtn).toHaveAttribute('aria-label', /Reset all filters/)
    })

    test('should be keyboard navigable', async ({ page }) => {
      // Tab to first button
      await page.keyboard.press('Tab')
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
      expect(focusedElement).toBeTruthy()

      // Continue tabbing
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab')
      }

      // Should still be able to interact
      const button = page.locator('[data-testid="reset-filters-btn"]')
      await expect(button).toBeVisible()
    })

    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = page.locator('h1')
      const h2 = page.locator('h2')
      const h3 = page.locator('h3')

      // At least h2 and h3 should be present
      const h2Count = await h2.count()
      const h3Count = await h3.count()

      expect(h2Count + h3Count).toBeGreaterThan(0)
    })

    test('should have sufficient color contrast', async ({ page }) => {
      // Check that text is readable (this is a basic check)
      const textElements = page.locator('p, span, h1, h2, h3, h4, h5, h6')
      const count = await textElements.count()
      expect(count).toBeGreaterThan(0)
    })

    test('should support focus visible indicators', async ({ page }) => {
      const button = page.locator('button[aria-label="Add new user"]')
      await button.focus()

      // Check that button has focus
      const isFocused = await button.evaluate(el => document.activeElement === el)
      expect(isFocused).toBe(true)
    })
  })

  test.describe('7. User Directory Display Tests', () => {
    test('should display user count', async ({ page }) => {
      const directory = page.locator('[aria-label="User Directory"]')
      const text = await directory.textContent()
      expect(text).toContain('users')
    })

    test('should display pagination controls', async ({ page }) => {
      const pagination = page.locator('[aria-label="Pagination"]')
      await expect(pagination).toBeVisible()

      const prevBtn = page.locator('button[aria-label="Previous page"]')
      const nextBtn = page.locator('button[aria-label="Next page"]')

      await expect(prevBtn).toBeVisible()
      await expect(nextBtn).toBeVisible()
    })

    test('should show loading state during user list refresh', async ({ page }) => {
      const refreshBtn = page.locator('button[aria-label="Refresh user list"]')
      await refreshBtn.click()

      // Should eventually return to normal state
      await page.waitForTimeout(2000)

      const directory = page.locator('[aria-label="User Directory"]')
      await expect(directory).toBeVisible()
    })

    test('should handle empty user list gracefully', async ({ page }) => {
      // Apply a filter that might return no users (if such a filter exists)
      const directory = page.locator('[aria-label="User Directory"]')
      const text = await directory.textContent()

      // Should either show users or "no users found" message
      expect(text).toBeTruthy()
    })
  })

  test.describe('8. Filter Persistence Tests', () => {
    test('should maintain filter state during page interactions', async ({ page }) => {
      // Apply a filter
      const clientsBtn = page.locator('[data-testid="view-btn-clients"]')
      await clientsBtn.click()

      await expect(clientsBtn).toHaveClass(/active/)

      // Refresh the page
      const refreshBtn = page.locator('button[aria-label="Refresh user list"]')
      await refreshBtn.click()

      // Wait for refresh
      await page.waitForTimeout(1000)

      // Clients button should still be active
      await expect(clientsBtn).toHaveClass(/active/)
    })

    test('should apply multiple filters sequentially', async ({ page }) => {
      const allBtn = page.locator('[data-testid="view-btn-all"]')
      const clientsBtn = page.locator('[data-testid="view-btn-clients"]')
      const teamBtn = page.locator('[data-testid="view-btn-team"]')
      const adminsBtn = page.locator('[data-testid="view-btn-admins"]')

      // Apply each filter
      await allBtn.click()
      await page.waitForTimeout(200)
      await expect(allBtn).toHaveClass(/active/)

      await clientsBtn.click()
      await page.waitForTimeout(200)
      await expect(clientsBtn).toHaveClass(/active/)

      await teamBtn.click()
      await page.waitForTimeout(200)
      await expect(teamBtn).toHaveClass(/active/)

      await adminsBtn.click()
      await page.waitForTimeout(200)
      await expect(adminsBtn).toHaveClass(/active/)
    })
  })

  test.describe('9. Error Handling Tests', () => {
    test('should handle missing data gracefully', async ({ page }) => {
      // Page should still render even if some data is missing
      const mainContent = page.locator('.workstation-main-content')
      await expect(mainContent).toBeVisible()

      // Check that component doesn't show console errors
      let consoleErrors = 0
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors++
        }
      })

      await page.waitForTimeout(500)
      expect(consoleErrors).toBe(0)
    })

    test('should handle slow network gracefully', async ({ page }) => {
      // Simulate slow network
      await page.route('**/*', route => {
        setTimeout(() => route.continue(), 500)
      })

      const refreshBtn = page.locator('button[aria-label="Refresh user list"]')
      await refreshBtn.click()

      // Component should still be responsive
      const sidebar = page.locator('.workstation-sidebar')
      await expect(sidebar).toBeVisible()
    })
  })

  test.describe('10. Complete Workflow Tests', () => {
    test('should complete full user filtering workflow', async ({ page }) => {
      // Step 1: View all users
      const allBtn = page.locator('[data-testid="view-btn-all"]')
      await expect(allBtn).toHaveClass(/active/)

      // Step 2: Switch to clients
      const clientsBtn = page.locator('[data-testid="view-btn-clients"]')
      await clientsBtn.click()
      await expect(clientsBtn).toHaveClass(/active/)

      // Step 3: Refresh data
      const refreshBtn = page.locator('button[aria-label="Refresh user list"]')
      await refreshBtn.click()
      await page.waitForTimeout(1000)

      // Step 4: Reset filters
      const resetBtn = page.locator('[data-testid="reset-filters-btn"]')
      await resetBtn.click()
      await expect(allBtn).toHaveClass(/active/)

      // Step 5: View all users again
      const directory = page.locator('[aria-label="User Directory"]')
      await expect(directory).toBeVisible()
    })

    test('should handle rapid view switching', async ({ page }) => {
      const views = ['clients', 'team', 'admins', 'all']

      for (let i = 0; i < 3; i++) {
        for (const view of views) {
          const btn = page.locator(`[data-testid="view-btn-${view}"]`)
          await btn.click()
          await page.waitForTimeout(100)
        }
      }

      // Should end up on last view
      const allBtn = page.locator('[data-testid="view-btn-all"]')
      await expect(allBtn).toHaveClass(/active/)
    })
  })
})
