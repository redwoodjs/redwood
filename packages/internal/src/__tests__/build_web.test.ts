import path from 'path'

import { prebuildWebFiles, cleanWebBuild } from '../build/web'
import { findWebFiles } from '../files'
import { ensurePosixPath } from '../paths'

const FIXTURE_PATH = path.resolve(
  __dirname,
  '../../../../__fixtures__/example-todo-main'
)

const cleanPaths = (p) => {
  return ensurePosixPath(path.relative(FIXTURE_PATH, p))
}

const fullPath = (p) => {
  return path.join(FIXTURE_PATH, p)
}

// Fixtures, filled in beforeAll
let prebuiltFiles
let relativePaths

beforeAll(() => {
  process.env.RWJS_CWD = FIXTURE_PATH
  cleanWebBuild()

  const webFiles = findWebFiles()
  prebuiltFiles = prebuildWebFiles(webFiles)

  relativePaths = prebuiltFiles
    .filter((x) => typeof x !== 'undefined')
    .map(cleanPaths)
})
afterAll(() => {
  delete process.env.RWJS_CWD
})

test('api files are prebuilt', async () => {
  // Builds non-nested functions
  expect(relativePaths).toMatchInlineSnapshot(`
    Array [
      ".redwood/prebuild/web/src/App.js",
      ".redwood/prebuild/web/src/Routes.js",
      ".redwood/prebuild/web/src/components/AddTodo/AddTodo.js",
      ".redwood/prebuild/web/src/components/AddTodoControl/AddTodoControl.js",
      ".redwood/prebuild/web/src/components/Check/Check.js",
      ".redwood/prebuild/web/src/components/NumTodosCell/NumTodosCell.js",
      ".redwood/prebuild/web/src/components/NumTodosTwoCell/NumTodosTwoCell.js",
      ".redwood/prebuild/web/src/components/TableCell/TableCell.js",
      ".redwood/prebuild/web/src/components/TodoItem/TodoItem.js",
      ".redwood/prebuild/web/src/components/TodoListCell/TodoListCell.tsx",
      ".redwood/prebuild/web/src/layouts/SetLayout/SetLayout.js",
      ".redwood/prebuild/web/src/pages/BarPage/BarPage.tsx",
      ".redwood/prebuild/web/src/pages/FatalErrorPage/FatalErrorPage.js",
      ".redwood/prebuild/web/src/pages/FooPage/FooPage.tsx",
      ".redwood/prebuild/web/src/pages/HomePage/HomePage.tsx",
      ".redwood/prebuild/web/src/pages/NotFoundPage/NotFoundPage.js",
      ".redwood/prebuild/web/src/pages/PrivatePage/PrivatePage.tsx",
      ".redwood/prebuild/web/src/pages/TypeScriptPage/TypeScriptPage.tsx",
      ".redwood/prebuild/web/src/pages/admin/EditUserPage/EditUserPage.jsx",
    ]
  `)
})
