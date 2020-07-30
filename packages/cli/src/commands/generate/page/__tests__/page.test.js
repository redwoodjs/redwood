import { join } from 'path'

import { getProject } from '@redwoodjs/structure'

import { getActions } from '../page'

describe('page generator', () => {
  test('creates the correct templates', () => {
    const project = getProject(global.FIXTURE_PATH)

    const name = 'Home'
    const path = '/home'
    const route = project.router.createRouteString(name, path)
    const newTemplates = getActions({ name, path, routes: [route] }, project)
    // Test the path output.
    expect(newTemplates.map((t) => global.stripFixturePath(t.path)))
      .toMatchInlineSnapshot(`
      Array [
        "/web/src/pages/HomePage/HomePage.stories.js",
        "/web/src/pages/HomePage/HomePage.test.js",
        "/web/src/pages/HomePage/HomePage.js",
        "/web/src/Routes.js",
      ]
    `)
    // write a snapshot for each generated template.
    for (const t of newTemplates) {
      const snapshotPath = join(
        __dirname,
        '__snapshots__',
        global.stripFixturePath(t.path).replaceAll('/', '_')
      )
      expect(t.contents).toMatchFile(snapshotPath)
    }
  })
})
