import { expect, test } from '@playwright/test';

test('dashboard → Jr. course roadmap → solve a side-view level', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByText('CodeMonkey Jr.').first()).toBeVisible();
	await page.getByText('Advanced Loops').click();
	await expect(page).toHaveURL(/\/course\/jr-advanced-loops/);

	await page.getByRole('link', { name: /Sunrise Steps/ }).click();
	await expect(page).toHaveURL(/\/play\/jr-loops-01/);
	await expect(page.locator('canvas')).toBeVisible();

	const stepRight = page.getByRole('button', { name: 'Step right', exact: true });
	await stepRight.click();
	await stepRight.click();
	await stepRight.click();

	await page.getByRole('button', { name: 'Run program' }).click();
	await expect(page.getByText('You did it!')).toBeVisible({ timeout: 5000 });
});
