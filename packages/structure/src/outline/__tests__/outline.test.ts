import { resolve } from 'path'

import { DefaultHost } from '../../hosts'
import { RWProject } from '../../model'
import { getOutline } from '../outline'
import { outlineToJSON } from '../types'

describe('Redwood Project Outline', () => {
  it('can be built for example-todo-main', async () => {
    const projectRoot = getFixtureDir('example-todo-main')
    const project = new RWProject({ projectRoot, host: new DefaultHost() })
    const outline = getOutline(project)
    const outlineJSON = await outlineToJSON(outline)
    outlineJSON //?
  })
})
function getFixtureDir(
  name: 'example-todo-main-with-errors' | 'example-todo-main'
) {
  return resolve(__dirname, `../../../../../__fixtures__/${name}`)
}
