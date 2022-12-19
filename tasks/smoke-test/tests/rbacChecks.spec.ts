import fs from 'node:fs'
import path from 'node:path'

import {
  expect,
  Page,
  PlaywrightTestArgs,
  PlaywrightWorkerArgs,
} from '@playwright/test'
import execa from 'execa'

import devServerTest, {
  DevServerFixtures,
} from '../playwright-fixtures/devServer.fixture'

import { loginAsTestUser, signUpTestUser } from './common'

// This is a special test that does the following
// Signup a user (admin@bazinga.com), because salt/secrets won't match, we need to do this
// Then makes them admin with an rw exec script
// Then checks if they have admin priviledges
const adminEmail = 'admin@bazinga.com'
const password = 'test123'

let messageDate
devServerTest.beforeAll(async ({ browser }: PlaywrightWorkerArgs) => {
  // @NOTE we can't access webUrl in beforeAll, so hardcoded
  // But we can switch to beforeEach if required
  const webUrl = 'http://localhost:9000'

  const adminSignupPage = await browser.newPage()
  const incognitoPage = await browser.newPage()
  const regularUserSignupPage = await browser.newPage()

  await Promise.all([
    signUpTestUser({
      // @NOTE we can't access webUrl in beforeAll, so hardcoded
      // But we can switch to beforeEach if required
      webUrl,
      page: adminSignupPage,
      email: adminEmail,
      password,
      fullName: 'Admin User',
    }),
    // Signup non-admin user
    signUpTestUser({
      webUrl,
      page: regularUserSignupPage,
    }),
    fillOutContactFormAsAnonymousUser({
      page: incognitoPage,
      webUrl,
      messageDate,
    }),
  ])

  await Promise.all([
    adminSignupPage.close(),
    regularUserSignupPage.close(),
    incognitoPage.close(),
  ])
})

devServerTest(
  'RBAC: Should not be able to delete contact as non-admin user',
  async ({ webUrl, page }: DevServerFixtures & PlaywrightTestArgs) => {
    // Login as non-admin user
    await loginAsTestUser({
      webUrl,
      page,
    })

    // Go to http://localhost:8910/contacts
    await page.goto(`${webUrl}/contacts`)

    page.once('dialog', (dialog) => {
      console.log(`Dialog message: ${dialog.message()}`)
      dialog.accept().catch(() => {
        console.error('Failed to accept dialog')
      })
    })

    await page.locator('text=Delete').first().click()

    await expect(
      page
        .locator('.rw-scaffold')
        .locator("text=You don't have permission to do that")
    ).toBeTruthy()

    // @NOTE we do this because the scaffold content is actually on the page,
    // This is the only way we validate if its actually showing visually
    await expect(
      page.locator('.rw-scaffold').locator('text=Contact deleted')
    ).toBeHidden()

    await expect(
      await page.locator('text=charlie@chimichanga.com').count()
    ).toBeGreaterThan(0)
  }
)

devServerTest(
  'RBAC: Admin user should be able to delete contacts',
  async ({ webUrl, page }: DevServerFixtures & PlaywrightTestArgs) => {
    fs.writeFileSync(
      path.join(process.env.PROJECT_PATH, 'scripts/makeAdmin.ts'),
      `
  import { db } from 'api/src/lib/db'

export default async ({ args }) => {
await db.user.update({
where: {
  email: args.email,
},
data: {
  roles: 'ADMIN',
},
})

console.log(await db.user.findMany())
}`
    )

    console.log(`Giving ${adminEmail} ADMIN role....`)
    await execa(`yarn rw exec makeAdmin --email ${adminEmail}`, {
      cwd: process.env.PROJECT_PATH,
      stdio: 'inherit',
      shell: true,
    })

    await loginAsTestUser({
      webUrl,
      page,
      email: adminEmail,
      password,
    })

    // Go to http://localhost:8910/contacts
    await page.goto(`${webUrl}/contacts`)

    // This makes the test less flaky when running locally against the same
    // test project multiple times
    const contactCountBefore = await waitForContact(page)

    page.once('dialog', (dialog) => {
      console.log(`Dialog message: ${dialog.message()}`)
      dialog.accept().catch(() => {
        console.error('Failed to accept dialog')
      })
    })

    await page.locator('text=Delete').first().click()

    await expect(
      page.locator('.rw-scaffold').locator('text=Contact deleted')
    ).toBeVisible()

    await expect(
      await page.locator('text=charlie@chimichanga.com').count()
    ).toBe(contactCountBefore - 1)
  }
)

async function fillOutContactFormAsAnonymousUser({
  page,
  webUrl,
  messageDate,
}: {
  page: PlaywrightTestArgs['page']
  webUrl: string
  messageDate: string
}) {
  await page.goto(`${webUrl}/contact`)
  // Click input[name="name"]
  await page.locator('input[name="name"]').click()
  // Fill input[name="name"]
  await page.locator('input[name="name"]').fill('Charlie Chimichanga')
  // Click input[name="email"]
  await page.locator('input[name="email"]').click()
  // Fill input[name="email"]
  await page.locator('input[name="email"]').fill('charlie@chimichanga.com')
  // Click textarea[name="message"]
  await page.locator('textarea[name="message"]').click()
  // Fill textarea[name="message"]
  await page
    .locator('textarea[name="message"]')
    .fill(`Hello, I love Mexican food. What about you? - ${messageDate}`)
  // Click text=Save
  const successMessage = page.locator(`text=Thank you for your submission!`)

  await Promise.all([
    successMessage.waitFor({ timeout: 5000 }),
    page.locator('text=Save').click(),
  ])
}

function waitForContact(page: Page) {
  const MAX_INTERVALS = 10

  return new Promise<number>((resolve) => {
    let intervals = 0
    const watchInterval = setInterval(async () => {
      console.log('Waiting for Charlie...')
      const contactCount = await page
        .locator('text=charlie@chimichanga.com')
        .count()

      if (contactCount > 0) {
        clearInterval(watchInterval)
        resolve(contactCount)
      }

      if (intervals > MAX_INTERVALS) {
        expect(contactCount).toBeGreaterThan(0)
      }

      intervals++
    }, 100)
  })
}
