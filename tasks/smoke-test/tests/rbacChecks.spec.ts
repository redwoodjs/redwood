import { expect } from '@playwright/test'
import execa from 'execa'
import fs from 'node:fs'
import path from 'node:path'

import devServerTest from '../playwright-fixtures/devServer.fixture'

import { loginAsTestUser, signUpTestUser } from './common'

// This is a special test that does the following
// Signup a user (admin@bazinga.com), because salt/secrets won't match, we need to do this
// Then makes them admin with an rw exec script
// Then checks if they have admin priviledges

devServerTest('RBAC checks', async ({ webUrl, page }) => {
  const email = 'admin@bazinga.com'
  const password = 'test123'

  await signUpTestUser({
    webUrl,
    page,
    email,
    password,
  })

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

  await execa.sync(`yarn rw exec makeAdmin --email ${email}`, {
    cwd: process.env.PROJECT_PATH,
    shell: true,
  })

  await loginAsTestUser({
    webUrl,
    page,
    email,
    password,
  })

  await page.goto(`${webUrl}/profile`)

  const usernameRow = await page.waitForSelector('*css=tr >> text=EMAIL')
  await expect(await usernameRow.innerHTML()).toBe(
    '<td>EMAIL</td><td>admin@bazinga.com</td>'
  )

  // const isAdminRow = await page.waitForSelector('*css=tr >> text=Is Admin')
  // await expect(await isAdminRow.innerHTML()).toBe(
  //   '<td>Is Admin</td><td>true</td>'
  // )

  await page.goto(`${webUrl}/posts/new`)

  // Click input[name="title"]
  await page.locator('input[name="title"]').click()
  // Fill input[name="title"]
  await page
    .locator('input[name="title"]')
    .fill('This is a new post created by the admin')
  // Press Tab
  await page.locator('input[name="title"]').press('Tab')
  // Fill input[name="body"]
  await page.locator('input[name="body"]').fill('Bazinga, bazinga, bazinga')
  // Click text=Save
  await Promise.all([
    page.waitForNavigation({ url: '**/' }),
    page.click('text=SAVE'),
  ])

  await expect(
    page.locator('text=This is a new post created by the admin')
  ).toBeTruthy()
})
