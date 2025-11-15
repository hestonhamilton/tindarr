import { test, expect } from '@playwright/test';

test('Plex login flow', async ({ page }) => {
  await page.goto('http://localhost:5173'); // Assuming client runs on port 5173

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Tindarr/);

  // Click the "Login with Plex" button.
  await page.getByRole('button', { name: 'Login with Plex' }).click();

  // Expect to be redirected to Plex.tv for authentication
  // This is a simplified check, in a real scenario you might mock the Plex API or handle the OAuth flow
  await expect(page.url()).toContain('plex.tv');
});
