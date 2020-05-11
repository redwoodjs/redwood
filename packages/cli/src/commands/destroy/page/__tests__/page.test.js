global.__dirname = __dirname
jest.mock('fs')
jest.mock('src/lib', () => {
  return {
    ...require.requireActual('src/lib'),
    generateTemplate: () => '',
  }
})

import fs from 'fs'

import 'src/lib/test'
import { getPaths } from 'src/lib'

import { files } from '../../../generate/page/page'
import { tasks } from '../page'

beforeEach(() => {
  fs.__setMockFiles({
    ...files({ name: 'About' }),
    [getPaths().web.routes]: [
      '<Routes>',
      '  <Route path="/about" page={AboutPage} name="about" />',
      '  <Route path="/" page={HomePage} name="home" />',
      '  <Route notfound page={NotFoundPage} />',
      '</Routes>',
    ].join('\n'),
  })
})

test('destroys a page and route', async () => {
  const unlinkSpy = jest.spyOn(fs, 'unlinkSync')
  const t = tasks({ name: 'About' })
  t.setRenderer('silent')

  return t.run().then(() => {
    // Make sure all generated files were destroyed.
    const generatedFiles = Object.keys(files({ name: 'About' }))
    expect(generatedFiles.length).toEqual(unlinkSpy.mock.calls.length)
    generatedFiles.forEach((f) => expect(unlinkSpy).toHaveBeenCalledWith(f))

    // Make sure Routes.js has been cleaned up.
    const routes = fs.readFileSync(getPaths().web.routes)
    expect(routes).toEqual(
      [
        '<Routes>',
        '  <Route path="/" page={HomePage} name="home" />',
        '  <Route notfound page={NotFoundPage} />',
        '</Routes>',
      ].join('\n')
    )
  })
})
