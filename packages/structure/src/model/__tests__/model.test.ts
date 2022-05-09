import { basename, resolve } from 'path'

import { DefaultHost } from '../../hosts'
import { URL_file } from '../../x/URL'
import { RWProject } from '../RWProject'

describe('Redwood Project Model', () => {
  it('can process example-todo-main', async () => {
    const projectRoot = getFixtureDir('example-todo-main')
    const project = new RWProject({ projectRoot, host: new DefaultHost() })

    const pageNames = new Set(project.pages.map((p) => p.basenameNoExt))
    expect(pageNames).toEqual(
      new Set([
        'FatalErrorPage',
        'HomePage',
        'NotFoundPage',
        'PrivatePage',
        'TypeScriptPage',
        'EditUserPage',
        'FooPage',
        'BarPage',
      ])
    )
    for (const page of project.pages) {
      page.basenameNoExt
      page.route?.id
    }
    expect(project.sdls.map((s) => s.name)).toEqual(['currentUser', 'todos'])

    for (const c of project.components) {
      c.basenameNoExt
    }
    project.components.length
    project.components.map((c) => c.basenameNoExt)
    project.functions.length
    project.services.length
    project.sdls.length
    const ds = await project.collectDiagnostics()
    ds.length
    const uri = URL_file(projectRoot, 'api/src/graphql/todos.sdl.js')
    const node = await project.findNode(uri)
    expect(node).toBeDefined()
    expect(node.id).toEqual(uri)
    if (node) {
      const info = await node.collectIDEInfo()
      info.length
      info
    }
  })

  it('example-todo-main-with-errors', async () => {
    const projectRoot = getFixtureDir('example-todo-main-with-errors')
    const project = new RWProject({ projectRoot, host: new DefaultHost() })
    const ds = await project.collectDiagnostics()
    expect(ds.length).toBeGreaterThan(0)
    // const diagnosticCodes = new Set(ds.map((d) => d.diagnostic.code))
    // expect(diagnosticCodes).toEqual(
    //   new Set([RWError.NOTFOUND_PAGE_NOT_DEFINED])
    // )
    const dss = await project.router.collectDiagnostics()
    expect(dss.length).toBeGreaterThan(0)
  })
})

describe('Cells', () => {
  it('Correctly determines a Cell component vs a normal component', () => {
    const projectRoot = getFixtureDir('example-todo-main-with-errors')
    const project = new RWProject({ projectRoot, host: new DefaultHost() })
    const cells = project.cells
    expect(cells).toHaveLength(1)
    expect(cells.map((cell) => basename(cell.filePath))).not.toContain(
      'TableCell.js'
    )
  })

  it('Can get the operation name of the QUERY', () => {
    const projectRoot = getFixtureDir('example-todo-main')
    const project = new RWProject({ projectRoot, host: new DefaultHost() })
    const cell = project.cells.find((x) => x.uri.endsWith('TodoListCell.tsx'))
    expect(cell.queryOperationName).toMatch('TodoListCell_GetTodos')
  })

  it('Warns you when you do not supply a name to QUERY', async () => {
    const projectRoot = getFixtureDir('example-todo-main-with-errors')
    const project = new RWProject({ projectRoot, host: new DefaultHost() })

    const cell = project.cells.find((x) => x.uri.endsWith('TodoListCell.js'))
    const x = await cell.collectDiagnostics()
    expect(x.map((e) => e.diagnostic.message)).toContain(
      'We recommend that you name your query operation'
    )
  })
})

describe('Retrieves TSConfig settings', () => {
  beforeAll(() => {
  })
  afterAll(() => {
    delete process.env.RWJS_CWD
  })

  it('Gets config for a TS Project', () => {
    const TS_FIXTURE_PATH =getFixtureDir('test-project')

    process.env.RWJS_CWD = TS_FIXTURE_PATH

    const project = new RWProject({ projectRoot: TS_FIXTURE_PATH, host: new DefaultHost() }) //?

    expect(project.getTsConfigs.web).not.toBe(null)
    expect(project.getTsConfigs.api).not.toBe(null)

    // Check some of the values
    expect(project.getTsConfigs.web.compilerOptions.noEmit).toBe(true)
    expect(project.getTsConfigs.api.compilerOptions.rootDirs).toEqual([ './src', '../.redwood/types/mirror/api/src' ])

  })

  it('Returns null for JS projects', () => {
    const JS_FIXTURE_PATH =getFixtureDir('example-todo-main-with-errors')

    process.env.RWJS_CWD = JS_FIXTURE_PATH

    const project = new RWProject({ projectRoot: JS_FIXTURE_PATH, host: new DefaultHost() }) //?

    expect(project.getTsConfigs.web).toBe(null)
    expect(project.getTsConfigs.api).toBe(null)
  })
})

describe.skip('env vars', () => {
  it('Warns if env vars are not ok', async () => {
    const projectRoot = getFixtureDir('example-todo-main-with-errors')
    const project = new RWProject({ projectRoot, host: new DefaultHost() })
    project.envHelper.process_env_expressions.length
    const env = project.envHelper
    env.env
    env.env_defaults
    project.redwoodTOML.web_includeEnvironmentVariables
    env.process_env_expressions
  })
})

describe('Redwood Route detection', () => {
  it('detects routes with the prerender prop', async () => {
    const projectRoot = getFixtureDir('example-todo-main')
    const project = new RWProject({ projectRoot, host: new DefaultHost() })
    const routes = project.getRouter().routes

    const prerenderRoutes = routes
      .filter((r) => r.prerender)
      // Make it a little easier to read by only keeping the attributes we're
      // interested in
      .map(({ name, path }) => ({ name, path }))

    expect(prerenderRoutes.length).toBe(6)
    expect(prerenderRoutes).toContainEqual({ name: 'home', path: '/' })
    expect(prerenderRoutes).toContainEqual({
      name: 'typescriptPage',
      path: '/typescript',
    })
    expect(prerenderRoutes).toContainEqual({
      name: 'someOtherPage',
      path: '/somewhereElse',
    })
    expect(prerenderRoutes).toContainEqual({ name: 'fooPage', path: '/foo' })
    expect(prerenderRoutes).toContainEqual({ name: 'barPage', path: '/bar' })
    expect(prerenderRoutes).toContainEqual({ name: 'privatePage', path: '/private-page' })
  })
})

function getFixtureDir(
  name: 'example-todo-main-with-errors' | 'example-todo-main' | 'empty-project' | 'test-project'
) {
  return resolve(__dirname, `../../../../../__fixtures__/${name}`)
}
