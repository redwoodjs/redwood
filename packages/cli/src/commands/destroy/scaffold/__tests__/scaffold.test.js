globalThis.__dirname = __dirname

import path from 'path'

import fs from 'fs-extra'
import { vol } from 'memfs'
import { vi, test, describe, beforeEach, afterEach, expect } from 'vitest'

import '../../../../lib/test'

import { getPaths, getDefaultArgs } from '../../../../lib/index.js'
import {
  yargsDefaults as defaults,
  customOrDefaultTemplatePath,
} from '../../../generate/helpers.js'
import { files } from '../../../generate/scaffold/scaffold.js'
import { tasks } from '../scaffold.js'

vi.mock('fs', async () => ({ default: (await import('memfs')).fs }))
vi.mock('fs-extra')
vi.mock('execa')

vi.mock('../../../../lib', async (importOriginal) => {
  const originalLib = await importOriginal()
  return {
    ...originalLib,
    generateTemplate: () => '',
  }
})

vi.mock('../../../../lib/schemaHelpers', async (importOriginal) => {
  const originalSchemaHelpers = await importOriginal()
  const path = require('path')
  return {
    ...originalSchemaHelpers,
    getSchema: () => {
      return require(path.join(globalThis.__dirname, 'fixtures', 'post.json'))
    },
  }
})

const templateDirectoryNames = [
  'assets',
  'components',
  'layouts',
  'lib',
  'pages',
]
const templateDirectories = templateDirectoryNames.map((name) => {
  return customOrDefaultTemplatePath({
    side: 'web',
    generator: 'scaffold',
    templatePath: name,
  })
})
const scaffoldTemplates = {}
const actualFs = await vi.importActual('fs-extra')
templateDirectories.forEach((directory) => {
  const files = actualFs.readdirSync(directory)
  files.forEach((file) => {
    const filePath = path.join(directory, file)
    scaffoldTemplates[filePath] = actualFs.readFileSync(filePath, 'utf-8')
  })
})

describe('rw destroy scaffold', () => {
  describe('destroy scaffold post', () => {
    beforeEach(async () => {
      // This fs is needed for the `files` function imported from `generate`
      vol.fromJSON({ 'redwood.toml': '', ...scaffoldTemplates }, '/')

      const postFiles = await files({
        ...getDefaultArgs(defaults),
        model: 'Post',
        tests: false,
        nestScaffoldByModel: true,
      })

      // This fs is needed for all the tests here
      vol.fromJSON({
        'redwood.toml': '',
        ...scaffoldTemplates,
        ...postFiles,
        [getPaths().web.routes]: [
          '<Routes>',
          '  <Route path="/posts/new" page={NewPostPage} name="newPost" />',
          '  <Route path="/posts/{id:Int}/edit" page={EditPostPage} name="editPost" />',
          '  <Route path="/posts/{id:Int}" page={PostPage} name="post" />',
          '  <Route path="/posts" page={PostsPage} name="posts" />',
          '  <Route path="/" page={HomePage} name="home" />',
          '  <Route notfound page={NotFoundPage} />',
          '</Routes>',
        ].join('\n'),
      })
    })

    afterEach(() => {
      vol.fromJSON(scaffoldTemplates)
      vi.spyOn(fs, 'unlinkSync').mockClear()
    })

    test('destroys files', async () => {
      const unlinkSpy = vi.spyOn(fs, 'unlinkSync')
      const t = tasks({
        model: 'Post',
        tests: false,
        nestScaffoldByModel: true,
      })
      t.options.renderer = 'silent'

      return t.tasks[0].run().then(async () => {
        const generatedFiles = Object.keys(
          await files({
            ...getDefaultArgs(defaults),
            model: 'Post',
            tests: false,
            nestScaffoldByModel: true,
          }),
        )
        expect(generatedFiles.length).toEqual(unlinkSpy.mock.calls.length)
        generatedFiles.forEach((f) => expect(unlinkSpy).toHaveBeenCalledWith(f))
      })
    })

    describe('for typescript files', () => {
      beforeEach(async () => {
        // clear filesystem so files call works as expected
        vol.reset()
        vol.fromJSON({ 'redwood.toml': '', ...scaffoldTemplates }, '/')
        vol.fromJSON({
          ...scaffoldTemplates,
          ...(await files({
            ...getDefaultArgs(defaults),
            typescript: true,
            model: 'Post',
            tests: false,
            nestScaffoldByModel: true,
          })),
          [getPaths().web.routes]: [
            '<Routes>',
            '  <Route path="/posts/new" page={PostNewPostPage} name="newPost" />',
            '  <Route path="/posts/{id:Int}/edit" page={PostEditPostPage} name="editPost" />',
            '  <Route path="/posts/{id:Int}" page={PostPostPage} name="post" />',
            '  <Route path="/posts" page={PostPostsPage} name="posts" />',
            '  <Route path="/" page={HomePage} name="home" />',
            '  <Route notfound page={NotFoundPage} />',
            '</Routes>',
          ].join('\n'),
        })
      })

      test('destroys files', async () => {
        const unlinkSpy = vi.spyOn(fs, 'unlinkSync')
        const t = tasks({
          model: 'Post',
          tests: false,
          nestScaffoldByModel: true,
        })
        t.options.renderer = 'silent'

        return t.tasks[0].run().then(async () => {
          const generatedFiles = Object.keys(
            await files({
              ...getDefaultArgs(defaults),
              typescript: true,
              model: 'Post',
              tests: false,
              nestScaffoldByModel: true,
            }),
          )
          expect(generatedFiles.length).toEqual(unlinkSpy.mock.calls.length)
          generatedFiles.forEach((f) =>
            expect(unlinkSpy).toHaveBeenCalledWith(f),
          )
        })
      })
    })

    test('cleans up routes from Routes.js', async () => {
      const t = tasks({
        model: 'Post',
        tests: false,
        nestScaffoldByModel: true,
      })
      t.options.renderer = 'silent'

      return t.tasks[1].run().then(() => {
        const routes = fs.readFileSync(getPaths().web.routes, 'utf-8')
        expect(routes).toEqual(
          [
            '<Routes>',
            '  <Route path="/" page={HomePage} name="home" />',
            '  <Route notfound page={NotFoundPage} />',
            '</Routes>',
          ].join('\n'),
        )
      })
    })
  })

  describe('destroy namespaced scaffold post', () => {
    beforeEach(async () => {
      // vol.fromJSON(scaffoldTemplates)
      vol.fromJSON({
        'redwood.toml': '',
        ...scaffoldTemplates,
        ...(await files({
          ...getDefaultArgs(defaults),
          model: 'Post',
          path: 'admin',
          tests: false,
          nestScaffoldByModel: true,
        })),
        [getPaths().web.routes]: [
          '<Routes>',
          '  <Route path="/admin/posts/new" page={AdminPostNewPostPage} name="adminNewPost" />',
          '  <Route path="/admin/posts/{id:Int}/edit" page={AdminPostEditPostPage} name="adminEditPost" />',
          '  <Route path="/admin/posts/{id:Int}" page={AdminPostPostPage} name="adminPost" />',
          '  <Route path="/" page={HomePage} name="home" />',
          '  <Route notfound page={NotFoundPage} />',
          '</Routes>',
        ].join('\n'),
      })
    })

    afterEach(() => {
      vol.fromJSON(scaffoldTemplates)
      vi.spyOn(fs, 'unlinkSync').mockClear()
    })

    test('destroys files', async () => {
      const unlinkSpy = vi.spyOn(fs, 'unlinkSync')
      const t = tasks({
        model: 'Post',
        path: 'admin',
        tests: false,
        nestScaffoldByModel: true,
      })
      t.options.renderer = 'silent'

      return t.tasks[0].run().then(async () => {
        const generatedFiles = Object.keys(
          await files({
            ...getDefaultArgs(defaults),
            model: 'Post',
            path: 'admin',
            tests: false,
            nestScaffoldByModel: true,
          }),
        )
        expect(generatedFiles.length).toEqual(unlinkSpy.mock.calls.length)
        generatedFiles.forEach((f) => expect(unlinkSpy).toHaveBeenCalledWith(f))
      })
    })

    describe('for typescript files', () => {
      beforeEach(async () => {
        // clear filesystem so files call works as expected
        vol.fromJSON(scaffoldTemplates)

        vol.fromJSON({
          ...scaffoldTemplates,
          ...(await files({
            ...getDefaultArgs(defaults),
            model: 'Post',
            path: 'admin',
            tests: false,
            nestScaffoldByModel: true,
          })),
          [getPaths().web.routes]: [
            '<Routes>',
            '  <Route path="/admin/posts/new" page={AdminPostNewPostPage} name="adminNewPost" />',
            '  <Route path="/admin/posts/{id:Int}/edit" page={AdminPostEditPostPage} name="adminEditPost" />',
            '  <Route path="/admin/posts/{id:Int}" page={AdminPostPostPage} name="adminPost" />',
            '  <Route path="/" page={HomePage} name="home" />',
            '  <Route notfound page={NotFoundPage} />',
            '</Routes>',
          ].join('\n'),
        })
      })
      test('destroys files', async () => {
        const unlinkSpy = vi.spyOn(fs, 'unlinkSync')
        const t = tasks({
          model: 'Post',
          path: 'admin',
          tests: false,
          nestScaffoldByModel: true,
        })
        t.options.renderer = 'silent'

        return t.tasks[0].run().then(async () => {
          const generatedFiles = Object.keys(
            await files({
              ...getDefaultArgs(defaults),
              model: 'Post',
              path: 'admin',
              tests: false,
              nestScaffoldByModel: true,
            }),
          )
          expect(generatedFiles.length).toEqual(unlinkSpy.mock.calls.length)
          generatedFiles.forEach((f) =>
            expect(unlinkSpy).toHaveBeenCalledWith(f),
          )
        })
      })
    })

    test('cleans up routes from Routes.js', async () => {
      const t = tasks({
        model: 'Post',
        path: 'admin',
        tests: false,
        nestScaffoldByModel: true,
      })
      t.options.renderer = 'silent'

      return t.tasks[1].run().then(() => {
        const routes = fs.readFileSync(getPaths().web.routes, 'utf-8')
        expect(routes).toEqual(
          [
            '<Routes>',
            '  <Route path="/" page={HomePage} name="home" />',
            '  <Route notfound page={NotFoundPage} />',
            '</Routes>',
          ].join('\n'),
        )
      })
    })
  })
})
