import { expect, test } from '@playwright/test';

test('solves a jump-over-a-pit challenge end to end', async ({ page }) => {
	await page.goto('/play/leap-of-faith');

	await expect(page.locator('canvas')).toBeVisible();

	await page.getByRole('button', { name: 'Forward', exact: true }).click();
	await page.getByRole('button', { name: 'Jump', exact: true }).click();
	await page.getByRole('button', { name: 'Forward', exact: true }).click();

	await page.getByRole('button', { name: /Run/ }).click();

	await expect(page.getByText('You did it!')).toBeVisible({ timeout: 5000 });
	await expect(page.getByText('⭐⭐⭐')).toBeVisible();
});

test('falls into the pit when walking forward instead of jumping', async ({ page }) => {
	await page.goto('/play/leap-of-faith');

	const forward = page.getByRole('button', { name: 'Forward', exact: true });
	await forward.click();
	await forward.click();
	await forward.click();

	await page.getByRole('button', { name: /Run/ }).click();

	await expect(page.getByText('the monkey bumped into something', { exact: false })).not.toBeVisible();
	// Falling into a pit and bumping into a rock use different hint copy in
	// the play route — this challenge only has a pit, so a failed run here
	// must be the fall path, not the generic "incomplete" one either.
	await expect(page.getByText(/fell|pit/i)).toBeVisible({ timeout: 5000 });
});
