import path from 'path'

import { RedwoodProject } from '../project'

describe('From outside a project', () => {
  const FIXTURE_PATH = path.join(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    '..',
    '__fixtures__'
  )

  const RWJS_CWD = process.env.RWJS_CWD
  beforeAll(() => {
    process.env.RWJS_CWD = FIXTURE_PATH
  })
  afterAll(() => {
    process.env.RWJS_CWD = RWJS_CWD
  })

  describe('project', () => {
    it('fails without a path', () => {
      const callGetProject = () => {
        // eslint-disable-next-line no-new
        new RedwoodProject()
      }
      expect(callGetProject).toThrowError(
        `Could not find a "redwood.toml" file, are you sure you're in a Redwood project?`
      )
    })

    it('fails with a path', () => {
      const callGetProject = () => {
        // eslint-disable-next-line no-new
        new RedwoodProject({
          pathWithinProject: path.join(FIXTURE_PATH, 'redwood.toml'),
        })
      }
      expect(callGetProject).toThrowError(
        `Could not find a "redwood.toml" file, are you sure you're in a Redwood project?`
      )
    })
  })

  describe('full project', () => {
    it('fails without a path', () => {
      const callGetFullProject = () => {
        // eslint-disable-next-line no-new
        new RedwoodProject({ full: true })
      }
      expect(callGetFullProject).toThrowError(
        `Could not find a "redwood.toml" file, are you sure you're in a Redwood project?`
      )
    })

    it('fails with a path', () => {
      const callGetFullProject = () => {
        // eslint-disable-next-line no-new
        new RedwoodProject({
          pathWithinProject: path.join(FIXTURE_PATH, 'redwood.toml'),
          full: true,
        })
      }
      expect(callGetFullProject).toThrowError(
        `Could not find a "redwood.toml" file, are you sure you're in a Redwood project?`
      )
    })
  })
})

describe('From inside the test-project fixture', () => {
  const FIXTURE_PATH = path.join(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    '..',
    '__fixtures__',
    'test-project'
  )

  const RWJS_CWD = process.env.RWJS_CWD
  beforeAll(() => {
    process.env.RWJS_CWD = FIXTURE_PATH
  })
  afterAll(() => {
    process.env.RWJS_CWD = RWJS_CWD
  })

  describe('project', () => {
    it('is correct without a path provided', () => {
      const project = new RedwoodProject()
      expect(project).toMatchSnapshot()
    })
    it('is correct with a path provided', () => {
      const project = new RedwoodProject({
        pathWithinProject: path.join(FIXTURE_PATH, 'redwood.toml'),
      })
      expect(project).toMatchSnapshot()
    })
    it.todo('prints the correct warning messages')
    it.todo('prints the correct error messages')
  })

  describe('full project', () => {
    it('is correct without a path provided', () => {
      const project = new RedwoodProject({ full: true })
      expect(project).toMatchSnapshot()
    })
    it('is correct with a path provided', () => {
      const project = new RedwoodProject({
        pathWithinProject: path.join(FIXTURE_PATH, 'redwood.toml'),
        full: true,
      })
      expect(project).toMatchSnapshot()
    })
    it.todo('prints the correct warning messages')
    it.todo('prints the correct error messages')
  })
})
