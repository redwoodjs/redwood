import * as cell from '../commands/cell'
import * as component from '../commands/component'
import * as layout from '../commands/layout'
import * as page from '../commands/page'
import * as sdl from '../commands/sdl'
import * as service from '../commands/service'

jest.mock('@redwoodjs/internal', () => {
  const path = require('path')
  return {
    ...require.requireActual('@redwoodjs/internal'),
    getPaths: () => {
      const BASE_PATH = '/path/to/project'
      return {
        base: BASE_PATH,
        api: {
          src: path.join(BASE_PATH, './api/src'),
          services: path.join(BASE_PATH, './api/src/services'),
          graphql: path.join(BASE_PATH, './api/src/graphql'),
        },
        web: {
          routes: path.join(BASE_PATH, 'web/src/Routes.js'),
          components: path.join(BASE_PATH, '/web/src/components'),
          layouts: path.join(BASE_PATH, '/web/src/layouts'),
          pages: path.join(BASE_PATH, '/web/src/pages'),
        },
      }
    },
  }
})

describe('generate', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('cell files', () => {
    expect(cell.files({ name: 'BlogPost' })).toMatchSnapshot()
  })

  it('component files', () => {
    expect(component.files({ name: 'Button' })).toMatchSnapshot()
  })

  it('layout files', () => {
    expect(layout.files({ name: 'MainNavigation' })).toMatchSnapshot()
  })

  describe('page', () => {
    it('files', () => {
      expect(page.files({ name: 'Home' })).toMatchSnapshot()
    })

    it('routes', () => {
      expect(page.routes({ name: 'Home', path: '/home' })).toMatchSnapshot()
    })
  })

  // describe('sdl', () => {
  //   it('files', () => {
  //     expect(sdl.files({ name: 'User', crud: true })).toMatchSnapshot()
  //   })
  // })

  describe('services', () => {
    it('files', async (done) => {
      const files = await service.files({ name: 'User', crud: true })
      expect(files).toMatchSnapshot()
      done()
    })
  })
})
