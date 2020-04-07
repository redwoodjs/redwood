import * as cell from '../commands/cell'
import * as component from '../commands/component'
import * as layout from '../commands/layout'
import * as page from '../commands/page'
import * as scaffold from '../commands/scaffold'
import * as sdl from '../commands/sdl'
import * as service from '../commands/service'

global.__dirname = __dirname // this file
jest.mock('@redwoodjs/internal', () => {
  const path = require('path')
  return {
    ...require.requireActual('@redwoodjs/internal'),
    getPaths: () => {
      const BASE_PATH = '/path/to/project'
      return {
        base: BASE_PATH,
        api: {
          db: path.join(global.__dirname, 'fixtures'), // this folder
          src: path.join(BASE_PATH, './api/src'),
          services: path.join(BASE_PATH, './api/src/services'),
          graphql: path.join(BASE_PATH, './api/src/graphql'),
        },
        web: {
          src: path.join(BASE_PATH, './web/src'),
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

  describe('scaffold', () => {
    it('files', async (done) => {
      const files = await scaffold.files({ model: 'Post' })
      expect(files).toMatchSnapshot()
      done()
    })

    it('routes', async (done) => {
      expect(await scaffold.routes({ model: 'Post' })).toEqual([
        '<Route path="/posts/new" page={NewPostPage} name="newPost" />',
        '<Route path="/posts/{id:Int}/edit" page={EditPostPage} name="editPost" />',
        '<Route path="/posts/{id:Int}" page={PostPage} name="post" />',
        '<Route path="/posts" page={PostsPage} name="posts" />',
      ])
      done()
    })
  })

  describe('sdl', () => {
    it('files', async (done) => {
      const files = await sdl.files({ name: 'Post', crud: true })
      expect(Object.keys(files)).toMatchSnapshot()
      expect(files).toMatchSnapshot()
      done()
    })
  })

  describe('services', () => {
    it('files', async (done) => {
      const files = await service.files({ name: 'User', crud: true })
      expect(files).toMatchSnapshot()
      done()
    })
  })
})
