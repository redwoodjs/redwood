global.__dirname = __dirname

import fs from 'fs'

import '../../../../lib/test'

import { getPaths, getDefaultArgs } from '../../../../lib'
import { yargsDefaults as defaults } from '../../../generate'
import { files } from '../../../generate/scaffold/scaffold'
import { tasks } from '../scaffold'

jest.mock('fs')
jest.mock('execa')

jest.mock('../../../../lib', () => {
  return {
    ...jest.requireActual('../../../../lib'),
    generateTemplate: () => '',
  }
})

jest.mock('../../../../lib/schemaHelpers', () => {
  const path = require('path')
  return {
    ...jest.requireActual('../../../../lib/schemaHelpers'),
    getSchema: () =>
      require(path.join(global.__dirname, 'fixtures', 'post.json')),
  }
})

describe('rw destroy scaffold', () => {
  describe('destroy scaffold post', () => {
    beforeEach(async () => {
      fs.__setMockFiles({
        ...(await files({
          ...getDefaultArgs(defaults),
          model: 'Post',
          tests: false,
          nestScaffoldByModel: true,
        })),
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
      fs.__setMockFiles({})
      jest.spyOn(fs, 'unlinkSync').mockClear()
    })

    test('destroys files', async () => {
      const unlinkSpy = jest.spyOn(fs, 'unlinkSync')
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
          })
        )
        expect(generatedFiles.length).toEqual(unlinkSpy.mock.calls.length)
        generatedFiles.forEach((f) => expect(unlinkSpy).toHaveBeenCalledWith(f))
      })
    })

    describe('for typescript files', () => {
      beforeEach(async () => {
        fs.__setMockFiles({}) // clear filesystem so files call works as expected
        fs.__setMockFiles({
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
        const unlinkSpy = jest.spyOn(fs, 'unlinkSync')
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
            })
          )
          expect(generatedFiles.length).toEqual(unlinkSpy.mock.calls.length)
          generatedFiles.forEach((f) =>
            expect(unlinkSpy).toHaveBeenCalledWith(f)
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
  })

  describe('destroy namespaced scaffold post', () => {
    beforeEach(async () => {
      fs.__setMockFiles({
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
      fs.__setMockFiles({})
      jest.spyOn(fs, 'unlinkSync').mockClear()
    })

    test('destroys files', async () => {
      const unlinkSpy = jest.spyOn(fs, 'unlinkSync')
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
          })
        )
        expect(generatedFiles.length).toEqual(unlinkSpy.mock.calls.length)
        generatedFiles.forEach((f) => expect(unlinkSpy).toHaveBeenCalledWith(f))
      })
    })

    describe('for typescript files', () => {
      beforeEach(async () => {
        fs.__setMockFiles({}) // clear filesystem so files call works as expected
        fs.__setMockFiles({
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
        const unlinkSpy = jest.spyOn(fs, 'unlinkSync')
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
            })
          )
          expect(generatedFiles.length).toEqual(unlinkSpy.mock.calls.length)
          generatedFiles.forEach((f) =>
            expect(unlinkSpy).toHaveBeenCalledWith(f)
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
  })
})
