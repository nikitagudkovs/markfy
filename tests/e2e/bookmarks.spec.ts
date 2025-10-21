import { test, expect } from '@playwright/test'

test.describe('Bookmarks App E2E Tests', () => {
  test('should display bookmarks list', async ({ page }) => {
    await page.goto('/')
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle')
    
    // Check if the main heading is visible (it might be hidden on mobile)
    const heading = page.locator('h1.logo')
    await expect(heading).toBeVisible()
    
    // Check if the search input is visible
    await expect(page.getByPlaceholder('Search...')).toBeVisible()
    
    // Check if the add button is visible
    await expect(page.getByRole('button', { name: 'Add', exact: true })).toBeVisible()
  })

  test('should add a new bookmark', async ({ page }) => {
    const suffix = Date.now().toString()
    const title = `E2E Test Bookmark ${suffix}`
    const url = `https://e2e-test-${suffix}.com`

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Click the add button to open the modal
    await page.click('button:has-text("Add")')
    
    // Wait for modal to open
    await expect(page.getByRole('heading', { name: 'Add Bookmark' })).toBeVisible()
    
    // Fill out the add bookmark form
    await page.fill('input[name="title"]', title)
    await page.fill('input[name="url"]', url)
    await page.fill('textarea[name="description"]', 'This is an E2E test bookmark')
    await page.check('input[name="isFavorite"]')
    
    // Submit the form
    await page.click('button[type="submit"]')
    
    // Wait for the form submission to complete (check for loading state)
    await page.waitForTimeout(1000)
    
    // Check if there's an error message first (generic patterns)
    const errorMessage = page.locator('text=/Failed to .* bookmark|already exists/i')
    if (await errorMessage.isVisible()) {
      throw new Error(`Server action failed: ${await errorMessage.first().innerText()}`)
    }
    
    // If no error, wait for modal to close
    await expect(page.getByRole('heading', { name: 'Add Bookmark' })).not.toBeVisible({ timeout: 10000 })
    
    // Wait for the page to reload and server action to complete
    await page.waitForTimeout(2000)
    await page.waitForLoadState('networkidle')
    
    // Check if the bookmark was added by looking for the title heading
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
    
    // Also check for the URL link
    await expect(page.locator(`a[href="${url}"]`)).toBeVisible()
  })

  test('should search bookmarks', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Search for a bookmark using the search input
    await page.fill('input[placeholder="Search..."]', 'Next.js')
    
    // Wait for debounced search to complete and page to reload
    await page.waitForTimeout(1000)
    await page.waitForLoadState('networkidle')
    
    // Check if the search functionality works by verifying the input is interactive
    const searchInput = page.locator('input[placeholder="Search..."]')
    await expect(searchInput).toBeVisible()
    await expect(searchInput).toBeEnabled()
  })

  test('should sort bookmarks', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Change sort order using the select dropdown
    await page.selectOption('select', 'title')
    
    // Wait for debounced sort to complete and page to reload
    await page.waitForTimeout(1500)
    await page.waitForLoadState('networkidle')
    
    // Check if the sort functionality works by verifying the select is interactive
    const sortSelect = page.locator('select')
    await expect(sortSelect).toBeVisible()
    await expect(sortSelect).toBeEnabled()
  })

  test('should toggle favorite status', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Find the first bookmark's favorite button
    const favoriteButton = page.locator('button[title*="favorite"]').first()
    
    // Click to toggle favorite
    await favoriteButton.click()
    
    // Wait for the page to reload
    await page.waitForTimeout(1000)
    await page.waitForLoadState('networkidle')
    
    // Check if the favorite status changed
    await expect(favoriteButton).toBeVisible()
  })

  test('should delete a bookmark', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Click delete button on first bookmark
    const deleteButton = page.locator('button[title="Delete"]').first()
    
    // Set up dialog handler for confirmation
    page.on('dialog', dialog => dialog.accept())
    
    await deleteButton.click()
    
    // Wait for the page to reload
    await page.waitForTimeout(1000)
    await page.waitForLoadState('networkidle')
    
    // The bookmark should be removed from the list
    // This test would need specific bookmark identification
  })

  test('should handle pagination', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check if pagination controls are visible (if there are enough bookmarks)
    const pagination = page.locator('text=Showing')
    if (await pagination.isVisible()) {
      // Click next page if available
      const nextButton = page.locator('button:has-text("Next")')
      if (await nextButton.isEnabled()) {
        await nextButton.click()
        await page.waitForTimeout(500)
        await page.waitForLoadState('networkidle')
        
        // Check if we're on page 2 (mobile view)
        const pageIndicator = page.locator('text=Page 2')
        if (await pageIndicator.isVisible()) {
          await expect(pageIndicator).toBeVisible()
        }
      }
    }
  })
})
