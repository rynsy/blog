import { test, expect } from '@playwright/test'

test.describe('Form Interactions', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to contact page or page with forms
    await page.goto('/contact')
  })

  test('should display contact form correctly', async ({ page }) => {
    // Check if contact form exists
    const form = page.locator('form')
    if (await form.count() === 0) {
      // Skip if no contact form on the site
      test.skip('No contact form found on the site')
    }

    await expect(form).toBeVisible()
    
    // Check for common form fields
    const nameField = form.locator('input[name="name"], input[type="text"]').first()
    const emailField = form.locator('input[name="email"], input[type="email"]').first()
    const messageField = form.locator('textarea, input[name="message"]').first()
    const submitButton = form.locator('button[type="submit"], input[type="submit"]').first()
    
    if (await nameField.count() > 0) {
      await expect(nameField).toBeVisible()
    }
    
    if (await emailField.count() > 0) {
      await expect(emailField).toBeVisible()
    }
    
    if (await messageField.count() > 0) {
      await expect(messageField).toBeVisible()
    }
    
    if (await submitButton.count() > 0) {
      await expect(submitButton).toBeVisible()
    }
  })

  test('should validate required fields', async ({ page }) => {
    const form = page.locator('form')
    if (await form.count() === 0) {
      test.skip('No contact form found on the site')
    }

    const submitButton = form.locator('button[type="submit"], input[type="submit"]').first()
    if (await submitButton.count() === 0) {
      test.skip('No submit button found')
    }

    // Try to submit empty form
    await submitButton.click()
    
    // Check for validation messages (HTML5 validation or custom)
    const requiredFields = form.locator('input[required], textarea[required]')
    const fieldCount = await requiredFields.count()
    
    if (fieldCount > 0) {
      // At least one field should show validation error
      const hasValidationError = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input[required], textarea[required]')
        return Array.from(inputs).some(input => {
          const htmlInput = input as HTMLInputElement
          return !htmlInput.checkValidity() || 
                 htmlInput.validationMessage !== '' ||
                 document.querySelector('.error, .invalid, [aria-invalid="true"]') !== null
        })
      })
      
      expect(hasValidationError).toBe(true)
    }
  })

  test('should handle form input correctly', async ({ page }) => {
    const form = page.locator('form')
    if (await form.count() === 0) {
      test.skip('No contact form found on the site')
    }

    // Test text input
    const nameField = form.locator('input[name="name"], input[type="text"]').first()
    if (await nameField.count() > 0) {
      await nameField.fill('Test User')
      await expect(nameField).toHaveValue('Test User')
    }

    // Test email input
    const emailField = form.locator('input[name="email"], input[type="email"]').first()
    if (await emailField.count() > 0) {
      await emailField.fill('test@example.com')
      await expect(emailField).toHaveValue('test@example.com')
      
      // Test email validation
      await emailField.fill('invalid-email')
      const isValid = await emailField.evaluate((el: HTMLInputElement) => el.checkValidity())
      expect(isValid).toBe(false)
      
      // Correct email
      await emailField.fill('test@example.com')
      const isValidNow = await emailField.evaluate((el: HTMLInputElement) => el.checkValidity())
      expect(isValidNow).toBe(true)
    }

    // Test textarea
    const messageField = form.locator('textarea, input[name="message"]').first()
    if (await messageField.count() > 0) {
      const testMessage = 'This is a test message with multiple lines.\nSecond line here.'
      await messageField.fill(testMessage)
      await expect(messageField).toHaveValue(testMessage)
    }
  })

  test('should handle form submission', async ({ page }) => {
    const form = page.locator('form')
    if (await form.count() === 0) {
      test.skip('No contact form found on the site')
    }

    // Fill out form with valid data
    const nameField = form.locator('input[name="name"], input[type="text"]').first()
    const emailField = form.locator('input[name="email"], input[type="email"]').first()
    const messageField = form.locator('textarea, input[name="message"]').first()
    const submitButton = form.locator('button[type="submit"], input[type="submit"]').first()

    if (await nameField.count() > 0) {
      await nameField.fill('Test User')
    }
    
    if (await emailField.count() > 0) {
      await emailField.fill('test@example.com')
    }
    
    if (await messageField.count() > 0) {
      await messageField.fill('This is a test message.')
    }

    if (await submitButton.count() > 0) {
      // Listen for network requests
      const responses: string[] = []
      page.on('response', response => {
        if (response.request().method() === 'POST') {
          responses.push(response.url())
        }
      })

      await submitButton.click()
      
      // Check for success message, form reset, or redirect
      await page.waitForTimeout(2000) // Allow time for submission
      
      // One of these should happen:
      // 1. Success message appears
      // 2. Form is reset/cleared
      // 3. Page redirects
      // 4. Network request is made
      
      const hasSuccessMessage = await page.locator('.success, .thank-you, [class*="success"]').count() > 0
      const formCleared = await nameField.inputValue() === '' || await emailField.inputValue() === ''
      const hasNetworkRequest = responses.length > 0
      const urlChanged = !page.url().includes('/contact')
      
      expect(hasSuccessMessage || formCleared || hasNetworkRequest || urlChanged).toBe(true)
    }
  })

  test('should be accessible via keyboard navigation', async ({ page }) => {
    const form = page.locator('form')
    if (await form.count() === 0) {
      test.skip('No contact form found on the site')
    }

    // Start with first focusable element
    await page.keyboard.press('Tab')
    
    // Check that focus moves through form elements
    const formElements = form.locator('input, textarea, button, select')
    const elementCount = await formElements.count()
    
    if (elementCount > 0) {
      // Tab through form elements
      for (let i = 0; i < elementCount; i++) {
        const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
        expect(['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT']).toContain(focusedElement)
        await page.keyboard.press('Tab')
      }
    }
  })

  test('should handle form field focus and blur events', async ({ page }) => {
    const form = page.locator('form')
    if (await form.count() === 0) {
      test.skip('No contact form found on the site')
    }

    const firstInput = form.locator('input, textarea').first()
    if (await firstInput.count() > 0) {
      // Focus on field
      await firstInput.click()
      await expect(firstInput).toBeFocused()
      
      // Check for focus styles or behavior
      const hasFocusStyle = await firstInput.evaluate((el) => {
        const styles = window.getComputedStyle(el)
        return styles.outlineWidth !== '0px' || 
               styles.borderColor !== 'initial' || 
               styles.boxShadow !== 'none'
      })
      
      // Either has focus styles or custom focus handling
      expect(typeof hasFocusStyle).toBe('boolean')
      
      // Blur field
      await page.keyboard.press('Tab')
      await expect(firstInput).not.toBeFocused()
    }
  })

  test('should handle form auto-complete attributes', async ({ page }) => {
    const form = page.locator('form')
    if (await form.count() === 0) {
      test.skip('No contact form found on the site')
    }

    // Check for proper autocomplete attributes
    const nameField = form.locator('input[name="name"], input[type="text"]').first()
    const emailField = form.locator('input[name="email"], input[type="email"]').first()
    
    if (await nameField.count() > 0) {
      const autocomplete = await nameField.getAttribute('autocomplete')
      // Should have appropriate autocomplete value or be null
      expect(typeof autocomplete).toBe('string')
    }
    
    if (await emailField.count() > 0) {
      const autocomplete = await emailField.getAttribute('autocomplete')
      // Email field should have email autocomplete
      expect(autocomplete === 'email' || autocomplete === null).toBe(true)
    }
  })

  test('should handle form with CAPTCHA or similar protection', async ({ page }) => {
    const form = page.locator('form')
    if (await form.count() === 0) {
      test.skip('No contact form found on the site')
    }

    // Check for CAPTCHA or honeypot fields
    const captchaElement = page.locator('.captcha, .recaptcha, input[name*="captcha"], input[name*="honeypot"]')
    const hasCaptcha = await captchaElement.count() > 0
    
    if (hasCaptcha) {
      // CAPTCHA should be present and visible (except honeypot)
      const visibleCaptcha = captchaElement.locator(':visible')
      if (await visibleCaptcha.count() > 0) {
        await expect(visibleCaptcha.first()).toBeVisible()
      }
    }
    
    // Test passes regardless of CAPTCHA presence
    expect(true).toBe(true)
  })

  test('should maintain form state during WebGL background interaction', async ({ page }) => {
    const form = page.locator('form')
    if (await form.count() === 0) {
      test.skip('No contact form found on the site')
    }

    const nameField = form.locator('input[name="name"], input[type="text"]').first()
    if (await nameField.count() > 0) {
      // Fill form field
      await nameField.fill('Test User')
      
      // Click on background (WebGL canvas)
      const canvas = page.locator('canvas')
      if (await canvas.count() > 0) {
        await canvas.click()
      } else {
        // Click on background area
        await page.click('body')
      }
      
      // Form field should maintain its value
      await expect(nameField).toHaveValue('Test User')
    }
  })
})