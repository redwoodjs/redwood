import { test, expect } from '@playwright/test'

test('Fragments', async ({ page }) => {
  await page.goto('/groceries')

  const strawberryChild = page.locator('text="Fruit Name: Strawberries"')
  const fruitCard = page.locator('div').filter({ has: strawberryChild })
  await expect(fruitCard.getByText('Fruit Name: Strawberries')).toBeVisible()
  await expect(fruitCard.getByText('Stall Name: Pie Veggies')).toBeVisible()

  const lettuceChild = page.locator('text="Vegetable Name: Lettuce"')
  const vegetableCard = page.locator('div', { has: lettuceChild })
  await expect(vegetableCard.getByText('Vegetable Name: Lettuce')).toBeVisible()
  await expect(
    vegetableCard.getByText('Stall Name: Salad Veggies'),
  ).toBeVisible()
})
