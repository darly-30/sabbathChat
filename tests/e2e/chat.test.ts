import { test, expect } from '@playwright/test';

test('flujo de chat', async ({ page }) => {
  await page.goto('/es-ES/chat');
  await page.getByTestId('new-conversation').click();
  await page.getByTestId('chat-input').fill('Hola');
  await page.getByTestId('send-button').click();
  await expect(page.getByTestId('message-assistant')).toBeVisible();
});
