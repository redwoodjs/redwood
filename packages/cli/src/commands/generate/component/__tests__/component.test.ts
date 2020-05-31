global.__dirname = __dirname
import { loadGeneratorFixture } from 'src/lib/test'

// TODO: Revert to import from '../component' when it gets types.
import * as component from 'src/commands/generate/component/component';

type WordFilesType = { [key: string]: string };

let singleWordDefaultFiles: WordFilesType;
let multiWordDefaultFiles: WordFilesType;
let javascriptFiles: WordFilesType;
let typescriptFiles: WordFilesType;

beforeAll(() => {
  singleWordDefaultFiles = component.files({ name: 'User' })
  multiWordDefaultFiles = component.files({ name: 'UserProfile' })
  javascriptFiles = component.files({ name: 'JavascriptUser', javascript: true })
  typescriptFiles = component.files({ name: 'TypescriptUser', typescript: true })
})

test('returns exactly 2 files', () => {
  expect(Object.keys(singleWordDefaultFiles).length).toEqual(2)
})

test('creates a JS single word component by default', () => {
  expect(
    singleWordDefaultFiles['/path/to/project/web/src/components/User/User.js']
  ).toEqual(loadGeneratorFixture('component', 'singleWordComponent.tsx'))
})

test('creates a JS single word component test by default', () => {
  expect(
    singleWordDefaultFiles['/path/to/project/web/src/components/User/User.test.js']
  ).toEqual(loadGeneratorFixture('component', 'singleWordComponent.test.tsx'))
})

test('creates a JS multi word component by default', () => {
  expect(
    multiWordDefaultFiles[
      '/path/to/project/web/src/components/UserProfile/UserProfile.js'
    ]
  ).toEqual(loadGeneratorFixture('component', 'multiWordComponent.tsx'))
})

test('creates a JS multi word component test by default', () => {
  expect(
    multiWordDefaultFiles[
      '/path/to/project/web/src/components/UserProfile/UserProfile.test.js'
    ]
  ).toEqual(loadGeneratorFixture('component', 'multiWordComponent.test.tsx'))
})

test('creates JS component files if javacript = true', () => {
  expect(
    javascriptFiles['/path/to/project/web/src/components/JavascriptUser/JavascriptUser.js']
  ).toEqual(loadGeneratorFixture('component', 'javascriptComponent.js'))
  expect(
    javascriptFiles['/path/to/project/web/src/components/JavascriptUser/JavascriptUser.test.js']
  ).toEqual(loadGeneratorFixture('component', 'javascriptComponent.test.js'))
})

test('creates TS component files if typescript = true', () => {
  expect(
    typescriptFiles['/path/to/project/web/src/components/TypescriptUser/TypescriptUser.ts']
  ).toEqual(loadGeneratorFixture('component', 'typescriptComponent.tsx'))
  expect(
    typescriptFiles['/path/to/project/web/src/components/TypescriptUser/TypescriptUser.test.ts']
  ).toEqual(loadGeneratorFixture('component', 'typescriptComponent.test.tsx'))
})



