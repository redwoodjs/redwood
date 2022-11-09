globalThis.__dirname = __dirname
import path from 'path'

// Load shared mocks
import '../../../../lib/test'

import * as layout from '../layout'

describe('Single Word default files', () => {
  const singleWordDefaultFiles = layout.files({
    name: 'App',
    tests: true,
    stories: true,
  })

  it('returns exactly 3 files', () => {
    expect(Object.keys(singleWordDefaultFiles).length).toEqual(3)
  })

  it('creates a single word layout component', () => {
    expect(
      singleWordDefaultFiles[
        path.normalize(
          '/path/to/project/web/src/layouts/AppLayout/AppLayout.js'
        )
      ]
    ).toMatchSnapshot()
  })

  it('creates a single word layout test', () => {
    expect(
      singleWordDefaultFiles[
        path.normalize(
          '/path/to/project/web/src/layouts/AppLayout/AppLayout.test.js'
        )
      ]
    ).toMatchSnapshot()
  })

  test('creates a single word layout stories', () => {
    expect(
      singleWordDefaultFiles[
        path.normalize(
          '/path/to/project/web/src/layouts/AppLayout/AppLayout.stories.js'
        )
      ]
    ).toMatchSnapshot()
  })
})

describe('Multi word default files', () => {
  const multiWordDefaultFiles = layout.files({
    name: 'SinglePage',
    tests: true,
    stories: true,
  })

  it('creates a multi word layout component', () => {
    expect(
      multiWordDefaultFiles[
        path.normalize(
          '/path/to/project/web/src/layouts/SinglePageLayout/SinglePageLayout.js'
        )
      ]
    ).toMatchSnapshot()
  })

  it('creates a multi word layout test', () => {
    expect(
      multiWordDefaultFiles[
        path.normalize(
          '/path/to/project/web/src/layouts/SinglePageLayout/SinglePageLayout.test.js'
        )
      ]
    ).toMatchSnapshot()
  })

  it('creates a multi word layout test', () => {
    expect(
      multiWordDefaultFiles[
        path.normalize(
          '/path/to/project/web/src/layouts/SinglePageLayout/SinglePageLayout.stories.js'
        )
      ]
    ).toMatchSnapshot()
  })
})

describe('JS Files', () => {
  const javascriptFiles = layout.files({
    name: 'JavascriptPage',
    javascript: true,
    tests: true,
    stories: true,
  })

  it('creates JS layout components if javacript = true', () => {
    expect(
      javascriptFiles[
        path.normalize(
          '/path/to/project/web/src/layouts/JavascriptPageLayout/JavascriptPageLayout.js'
        )
      ]
    ).not.toBeUndefined()
    expect(
      javascriptFiles[
        path.normalize(
          '/path/to/project/web/src/layouts/JavascriptPageLayout/JavascriptPageLayout.test.js'
        )
      ]
    ).not.toBeUndefined()
  })
})

test('trims Layout from end of name', () => {
  const files = layout.files({
    name: 'BazingaLayout',
    tests: true,
    stories: true,
  })

  const layoutCode =
    files[
      path.normalize(
        '/path/to/project/web/src/layouts/BazingaLayout/BazingaLayout.js'
      )
    ]

  expect(layoutCode).not.toBeUndefined()
  expect(
    layoutCode.split('\n').includes('export default BazingaLayout')
  ).toBeTruthy()
})

test('Does not trim Layout from beginning of name', () => {
  const files = layout.files({
    name: 'LayoutForBazinga',
    tests: true,
    stories: true,
  })

  const layoutCode =
    files[
      path.normalize(
        '/path/to/project/web/src/layouts/LayoutForBazingaLayout/LayoutForBazingaLayout.js'
      )
    ]

  expect(layoutCode).not.toBeUndefined()
  expect(
    layoutCode.split('\n').includes('export default LayoutForBazingaLayout')
  ).toBeTruthy()
})

test('Does not trim Layout from middle of name', () => {
  const files = layout.files({
    name: 'MyLayoutForBazinga',
    tests: true,
    stories: true,
  })

  const layoutCode =
    files[
      path.normalize(
        '/path/to/project/web/src/layouts/MyLayoutForBazingaLayout/MyLayoutForBazingaLayout.js'
      )
    ]

  expect(layoutCode).not.toBeUndefined()
  expect(
    layoutCode.split('\n').includes('export default MyLayoutForBazingaLayout')
  ).toBeTruthy()
})

test('Only trims Layout once', () => {
  const files = layout.files({
    name: 'BazingaLayoutLayout',
    tests: true,
    stories: true,
  })

  const layoutCode =
    files[
      path.normalize(
        '/path/to/project/web/src/layouts/BazingaLayoutLayout/BazingaLayoutLayout.js'
      )
    ]

  expect(layoutCode).not.toBeUndefined()
  expect(
    layoutCode.split('\n').includes('export default BazingaLayoutLayout')
  ).toBeTruthy()
})

describe('TS files', () => {
  const typescriptFiles = layout.files({
    name: 'TypescriptPage',
    typescript: true,
    tests: true,
    stories: true,
  })

  it('creates TS layout components if typescript = true', () => {
    expect(
      typescriptFiles[
        path.normalize(
          '/path/to/project/web/src/layouts/TypescriptPageLayout/TypescriptPageLayout.tsx'
        )
      ]
    ).not.toBeUndefined()
    expect(
      typescriptFiles[
        path.normalize(
          '/path/to/project/web/src/layouts/TypescriptPageLayout/TypescriptPageLayout.test.tsx'
        )
      ]
    ).not.toBeUndefined()
  })
})

test("doesn't include storybook file when --stories is set to false", () => {
  const withoutStoryFiles = layout.files({
    name: 'withoutStories',
    javascript: true,
    tests: true,
    stories: false,
  })

  expect(Object.keys(withoutStoryFiles)).toEqual([
    path.normalize(
      '/path/to/project/web/src/layouts/WithoutStoriesLayout/WithoutStoriesLayout.test.js'
    ),
    path.normalize(
      '/path/to/project/web/src/layouts/WithoutStoriesLayout/WithoutStoriesLayout.js'
    ),
  ])
})

test("doesn't include test file when --tests is set to false", () => {
  const withoutTestFiles = layout.files({
    name: 'withoutTests',
    tests: false,
    stories: true,
  })

  expect(Object.keys(withoutTestFiles)).toEqual([
    path.normalize(
      '/path/to/project/web/src/layouts/WithoutTestsLayout/WithoutTestsLayout.stories.js'
    ),
    path.normalize(
      '/path/to/project/web/src/layouts/WithoutTestsLayout/WithoutTestsLayout.js'
    ),
  ])
})

test('JavaScript: includes skip link when --skipLink is set to true', () => {
  const withSkipLinkFilesJS = layout.files({
    name: 'A11y',
    skipLink: true,
  })

  expect(
    withSkipLinkFilesJS[
      path.normalize(
        '/path/to/project/web/src/layouts/A11yLayout/A11yLayout.js'
      )
    ]
  ).toMatchSnapshot()
})

test('TypeScript: includes skip link when --skipLink is set to true', () => {
  const withSkipLinkFilesTS = layout.files({
    name: 'A11y',
    skipLink: true,
    typescript: true,
  })

  expect(
    withSkipLinkFilesTS[
      path.normalize(
        '/path/to/project/web/src/layouts/A11yLayout/A11yLayout.tsx'
      )
    ]
  ).toMatchSnapshot()
})
