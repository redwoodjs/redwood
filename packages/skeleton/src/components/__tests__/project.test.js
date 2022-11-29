import path from 'path'

import { getProject, getFullProject } from '../project'

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
        getProject()
      }
      expect(callGetProject).toThrowError(
        `Could not find a "redwood.toml" file, are you sure you're in a Redwood project?`
      )
    })

    it('fails with a path', () => {
      const callGetProject = () => {
        getProject(path.join(FIXTURE_PATH, 'redwood.toml'))
      }
      expect(callGetProject).toThrowError(
        `Could not find a "redwood.toml" file, are you sure you're in a Redwood project?`
      )
    })
  })

  describe('full project', () => {
    it('fails without a path', () => {
      const callGetFullProject = () => {
        getFullProject()
      }
      expect(callGetFullProject).toThrowError(
        `Could not find a "redwood.toml" file, are you sure you're in a Redwood project?`
      )
    })

    it('fails with a path', () => {
      const callGetFullProject = () => {
        getFullProject(path.join(FIXTURE_PATH, 'redwood.toml'))
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
    it('has the correct root path without a path provided', () => {
      const project = getProject()
      expect(project.path).toBe(FIXTURE_PATH)
    })
    it('has the correct root path with a path provided', () => {
      const project = getProject(path.join(FIXTURE_PATH, 'redwood.toml'))
      expect(project.path).toBe(FIXTURE_PATH)
    })
  })

  describe('full project', () => {
    it('has the correct root path without a path provided', () => {
      const project = getProject()
      expect(project.path).toBe(FIXTURE_PATH)
    })
    it('has the correct root path with a path provided', () => {
      const project = getProject(path.join(FIXTURE_PATH, 'redwood.toml'))
      expect(project.path).toBe(FIXTURE_PATH)
    })
  })
})
