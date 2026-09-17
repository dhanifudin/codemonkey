import { expect, test } from '@playwright/test';

test('solves the first challenge end to end', async ({ page }) => {
	await page.goto('/play/first-steps');

	// Phaser canvas mounted
	await expect(page.locator('canvas')).toBeVisible();

	const forward = page.getByRole('button', { name: 'Forward', exact: true });
	await forward.click();
	await forward.click();
	await forward.click();

	await page.getByRole('button', { name: /Run/ }).click();

	await expect(page.getByText('You did it!')).toBeVisible({ timeout: 5000 });
	await expect(page.getByText('⭐⭐⭐')).toBeVisible();
});

test('reports incomplete when the program falls short', async ({ page }) => {
	await page.goto('/play/first-steps');

	await page.getByRole('button', { name: 'Forward', exact: true }).click();
	await page.getByRole('button', { name: /Run/ }).click();

	await expect(page.getByText("didn't reach the goal", { exact: false })).toBeVisible({ timeout: 5000 });
});

test('course map links into a challenge', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByText('First Steps')).toBeVisible();
	await page.getByText('First Steps').click();
	await expect(page).toHaveURL(/\/play\/first-steps/);
});
