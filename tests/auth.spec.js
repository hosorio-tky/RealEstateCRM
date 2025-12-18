const { test, expect } = require('@playwright/test');

test.describe('Authentication & Security', () => {

    test('should show login page with initial fields', async ({ page }) => {
        await page.goto('/login');
        await expect(page.locator('h3:has-text("RealEstate CRM")')).toBeVisible();
        await expect(page.locator('input[placeholder="Email"]')).toBeVisible();
        await expect(page.locator('input[placeholder="Password"]')).toBeVisible();
        await expect(page.locator('button:has-text("Log in")')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[placeholder="Email"]', 'invalid@example.com');
        await page.fill('input[placeholder="Password"]', 'wrongpassword');
        await page.click('button:has-text("Log in")');

        // Wait for Ant Design message component
        const errorMessage = page.locator('.ant-message-error');
        await expect(errorMessage).toBeVisible();
    });

    test('should allow switching between Login and Register tabs', async ({ page }) => {
        await page.goto('/login');

        // Click Register tab
        await page.click('.ant-tabs-tab-btn:has-text("Register")');
        await expect(page.locator('input[placeholder="Confirm Password"]')).toBeVisible();
        await expect(page.locator('button:has-text("Register")')).toBeVisible();

        // Switch back to Login
        await page.click('.ant-tabs-tab-btn:has-text("Login")');
        await expect(page.locator('input[placeholder="Confirm Password"]')).not.toBeVisible();
    });

    // This test requires environment variables or a valid user in the DB
    test('should login successfully with valid credentials', async ({ page }) => {
        const email = process.env.TEST_USER_EMAIL;
        const password = process.env.TEST_USER_PASSWORD;

        if (!email || !password) {
            console.warn('Skipping login test: TEST_USER_EMAIL and TEST_USER_PASSWORD not set');
            return;
        }

        await page.goto('/login');
        await page.fill('input[placeholder="Email"]', email);
        await page.fill('input[placeholder="Password"]', password);
        await page.click('button:has-text("Log in")');

        // Wait for navigation to dashboard
        await expect(page).toHaveURL(/.*dashboard/);
        await expect(page.locator('h2')).toContainText('Bienvenido');
        await expect(page.locator('h2')).toContainText(email);

    });

});
