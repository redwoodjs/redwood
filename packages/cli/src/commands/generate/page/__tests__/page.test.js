import path from 'path'

import { getProject } from '@redwoodjs/structure'

import { templates } from '../page'

describe('page generator', () => {
  const fx = path.resolve(
    __dirname,
    '../../../../../../../__fixtures__/example-todo-main'
  )
  const project = getProject(fx)

  it('creates the correct templates', () => {
    const name = 'Home'
    const path = '/home'
    const route = project.router.createRouteString(name, path)
    const newTemplates = templates({ name, path, routes: [route] }, { project })
    // Test the path output.
    expect(newTemplates.map((t) => t.path.replace(fx, '')))
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
      expect(t.contents).toMatchSnapshot(t.path.replace(fx, ''))
    }
  })
})
