import path from 'path'

import { stripAndFormatPathForTesting } from '../../lib/testing'
import * as cell from '../cell'
import * as directive from '../directive'
import * as func from '../function'
import * as layout from '../layout'
import * as page from '../page'
import { RedwoodProject } from '../project'
import * as router from '../router'
import * as sdl from '../sdl/sdl'
import * as service from '../service/service'
import * as side from '../side'

const FIXTURE_PATH = path.join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  '..',
  '__fixtures__'
)
describe.each([
  'empty-project',
  'example-todo-main',
  'example-todo-main-with-errors',
  'test-project',
])('From within the %s fixture', (PROJECT_NAME) => {
  const PROJECT_PATH = path.join(FIXTURE_PATH, PROJECT_NAME)

  const RWJS_CWD = process.env.RWJS_CWD
  beforeAll(() => {
    process.env.RWJS_CWD = PROJECT_PATH
  })
  afterAll(() => {
    process.env.RWJS_CWD = RWJS_CWD
  })

  test('Complexity is measured correctly', () => {
    const project = RedwoodProject.getProject({
      readFromCache: false,
      insertIntoCache: false,
    })
    expect(project.getComplexity()).toMatchSnapshot('complexity metric')
  })

  test('Minimal project matches expectation', () => {
    const project = RedwoodProject.getProject({
      readFromCache: false,
      insertIntoCache: false,
    })
    project.filepath = stripAndFormatPathForTesting(
      project.filepath,
      PROJECT_PATH
    )
    expect(project).toMatchSnapshot()
  })

  test.todo('Full project matches expectation')

  if (PROJECT_NAME === 'test-project') {
    describe('caching', () => {
      test('cells', () => {
        const extractSpy = jest.spyOn(cell, 'extractCells')
        const project = RedwoodProject.getProject({
          readFromCache: false,
          insertIntoCache: true,
        })
        expect(extractSpy).toHaveBeenCalledTimes(0)
        let data = project.getCells()
        expect(data).not.toBe(undefined)
        expect(extractSpy).toHaveBeenCalledTimes(1)
        data = project.getCells()
        expect(data).not.toBe(undefined)
        expect(extractSpy).toHaveBeenCalledTimes(1)
        const cachedProject = RedwoodProject.getProject({
          readFromCache: true,
          insertIntoCache: true,
        })
        data = cachedProject.getCells()
        expect(data).not.toBe(undefined)
        expect(extractSpy).toHaveBeenCalledTimes(1)
        data = cachedProject.getCells(true)
        expect(extractSpy).toHaveBeenCalledTimes(2)
        extractSpy.mockReset()
        extractSpy.mockRestore()
      })
      test('function', () => {
        const extractSpy = jest.spyOn(func, 'extractFunctions')
        const project = RedwoodProject.getProject({
          readFromCache: false,
          insertIntoCache: true,
        })
        expect(extractSpy).toHaveBeenCalledTimes(0)
        let data = project.getFunctions()
        expect(data).not.toBe(undefined)
        expect(extractSpy).toHaveBeenCalledTimes(1)
        data = project.getFunctions()
        expect(data).not.toBe(undefined)
        expect(extractSpy).toHaveBeenCalledTimes(1)
        const cachedProject = RedwoodProject.getProject({
          readFromCache: true,
          insertIntoCache: true,
        })
        data = cachedProject.getFunctions()
        expect(data).not.toBe(undefined)
        expect(extractSpy).toHaveBeenCalledTimes(1)
        data = cachedProject.getFunctions(true)
        expect(extractSpy).toHaveBeenCalledTimes(2)
        extractSpy.mockReset()
        extractSpy.mockRestore()
      })
      test('layout', () => {
        const extractSpy = jest.spyOn(layout, 'extractLayouts')
        const project = RedwoodProject.getProject({
          readFromCache: false,
          insertIntoCache: true,
        })
        expect(extractSpy).toHaveBeenCalledTimes(0)
        let data = project.getLayouts()
        expect(data).not.toBe(undefined)
        expect(extractSpy).toHaveBeenCalledTimes(1)
        data = project.getLayouts()
        expect(data).not.toBe(undefined)
        expect(extractSpy).toHaveBeenCalledTimes(1)
        const cachedProject = RedwoodProject.getProject({
          readFromCache: true,
          insertIntoCache: true,
        })
        data = cachedProject.getLayouts()
        expect(data).not.toBe(undefined)
        expect(extractSpy).toHaveBeenCalledTimes(1)
        data = cachedProject.getLayouts(true)
        expect(extractSpy).toHaveBeenCalledTimes(2)
        extractSpy.mockReset()
        extractSpy.mockRestore()
      })
      test('page', () => {
        const extractSpy = jest.spyOn(page, 'extractPages')
        const project = RedwoodProject.getProject({
          readFromCache: false,
          insertIntoCache: true,
        })
        expect(extractSpy).toHaveBeenCalledTimes(0)
        let data = project.getPages()
        expect(data).not.toBe(undefined)
        expect(extractSpy).toHaveBeenCalledTimes(1)
        data = project.getPages()
        expect(data).not.toBe(undefined)
        expect(extractSpy).toHaveBeenCalledTimes(1)
        const cachedProject = RedwoodProject.getProject({
          readFromCache: true,
          insertIntoCache: true,
        })
        data = cachedProject.getPages()
        expect(data).not.toBe(undefined)
        expect(extractSpy).toHaveBeenCalledTimes(1)
        data = cachedProject.getPages(true)
        expect(extractSpy).toHaveBeenCalledTimes(2)
        extractSpy.mockReset()
        extractSpy.mockRestore()
      })
      test('router', () => {
        const extractSpy = jest.spyOn(router, 'extractRouters')
        const project = RedwoodProject.getProject({
          readFromCache: false,
          insertIntoCache: true,
        })
        expect(extractSpy).toHaveBeenCalledTimes(0)
        let data = project.getRouters()
        expect(data).not.toBe(undefined)
        expect(extractSpy).toHaveBeenCalledTimes(1)
        data = project.getRouters()
        expect(data).not.toBe(undefined)
        expect(extractSpy).toHaveBeenCalledTimes(1)
        const cachedProject = RedwoodProject.getProject({
          readFromCache: true,
          insertIntoCache: true,
        })
        data = cachedProject.getRouters()
        expect(data).not.toBe(undefined)
        expect(extractSpy).toHaveBeenCalledTimes(1)
        data = cachedProject.getRouters(true)
        expect(extractSpy).toHaveBeenCalledTimes(2)
        extractSpy.mockReset()
        extractSpy.mockRestore()
      })
      test('sides', () => {
        const extractSpy = jest.spyOn(side, 'extractSides')
        const project = RedwoodProject.getProject({
          readFromCache: false,
          insertIntoCache: true,
        })
        expect(extractSpy).toHaveBeenCalledTimes(0)
        let data = project.getSides()
        expect(data).not.toBe(undefined)
        expect(extractSpy).toHaveBeenCalledTimes(1)
        data = project.getSides()
        expect(data).not.toBe(undefined)
        expect(extractSpy).toHaveBeenCalledTimes(1)
        const cachedProject = RedwoodProject.getProject({
          readFromCache: true,
          insertIntoCache: true,
        })
        data = cachedProject.getSides()
        expect(data).not.toBe(undefined)
        expect(extractSpy).toHaveBeenCalledTimes(1)
        data = cachedProject.getSides(true)
        expect(extractSpy).toHaveBeenCalledTimes(2)
        extractSpy.mockReset()
        extractSpy.mockRestore()
      })
      test('directives', () => {
        const extractSpy = jest.spyOn(directive, 'extractDirectives')
        const project = RedwoodProject.getProject({
          readFromCache: false,
          insertIntoCache: true,
        })
        expect(extractSpy).toHaveBeenCalledTimes(0)
        let data = project.getDirectives()
        expect(data).not.toBe(undefined)
        expect(extractSpy).toHaveBeenCalledTimes(1)
        data = project.getDirectives()
        expect(data).not.toBe(undefined)
        expect(extractSpy).toHaveBeenCalledTimes(1)
        const cachedProject = RedwoodProject.getProject({
          readFromCache: true,
          insertIntoCache: true,
        })
        data = cachedProject.getDirectives()
        expect(data).not.toBe(undefined)
        expect(extractSpy).toHaveBeenCalledTimes(1)
        data = cachedProject.getDirectives(true)
        expect(extractSpy).toHaveBeenCalledTimes(2)
        extractSpy.mockReset()
        extractSpy.mockRestore()
      })
      test('services', () => {
        const extractSpy = jest.spyOn(service, 'extractServices')
        const project = RedwoodProject.getProject({
          readFromCache: false,
          insertIntoCache: true,
        })
        expect(extractSpy).toHaveBeenCalledTimes(0)
        let data = project.getServices()
        expect(data).not.toBe(undefined)
        expect(extractSpy).toHaveBeenCalledTimes(1)
        data = project.getServices()
        expect(data).not.toBe(undefined)
        expect(extractSpy).toHaveBeenCalledTimes(1)
        const cachedProject = RedwoodProject.getProject({
          readFromCache: true,
          insertIntoCache: true,
        })
        data = cachedProject.getServices()
        expect(data).not.toBe(undefined)
        expect(extractSpy).toHaveBeenCalledTimes(1)
        data = cachedProject.getServices(true)
        expect(extractSpy).toHaveBeenCalledTimes(2)
        extractSpy.mockReset()
        extractSpy.mockRestore()
      })
      test('SDLs', () => {
        const extractSpy = jest.spyOn(sdl, 'extractSDLs')
        const project = RedwoodProject.getProject({
          readFromCache: false,
          insertIntoCache: true,
        })
        expect(extractSpy).toHaveBeenCalledTimes(0)
        let data = project.getSDLs()
        expect(data).not.toBe(undefined)
        expect(extractSpy).toHaveBeenCalledTimes(1)
        data = project.getSDLs()
        expect(data).not.toBe(undefined)
        expect(extractSpy).toHaveBeenCalledTimes(1)
        const cachedProject = RedwoodProject.getProject({
          readFromCache: true,
          insertIntoCache: true,
        })
        data = cachedProject.getSDLs()
        expect(data).not.toBe(undefined)
        expect(extractSpy).toHaveBeenCalledTimes(1)
        data = cachedProject.getSDLs(true)
        expect(extractSpy).toHaveBeenCalledTimes(2)
        extractSpy.mockReset()
        extractSpy.mockRestore()
      })
    })
  }
})
