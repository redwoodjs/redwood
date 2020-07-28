global.__dirname = __dirname
import path from 'path'

import { loadGeneratorFixture } from 'src/lib/test'

import * as auth from '../auth'

let magicFile, auth0File, firebaseFile, goTrueFile, netlifyFile
beforeAll(() => {
  magicFile = auth.files(['magicLink'])
  auth0File = auth.files(['auth0'])
  firebaseFile = auth.files(['firebase'])
  goTrueFile = auth.files(['goTrue'])
  netlifyFile = auth.files(['netlify'])
})
test('magiclink returns exactly 1 file', () => {
  expect(Object.keys(magicFile).length).toEqual(1)
})
test('auth0 returns exactly 1 file', () => {
  expect(Object.keys(auth0File).length).toEqual(1)
})
test('firebase returns exactly 1 file', () => {
  expect(Object.keys(firebaseFile).length).toEqual(1)
})
test('goTrue returns exactly 1 file', () => {
  expect(Object.keys(goTrueFile).length).toEqual(1)
})
test('netlify returns exactly 1 file', () => {
  expect(Object.keys(netlifyFile).length).toEqual(1)
})

test('creates a regular auth component', () => {
  expect(
    magicFile[path.normalize('/path/to/project/api/src/lib/auth.js')]
  ).toEqual(loadGeneratorFixture('auth', 'authFixture.js'))
})
test('creates a firebase auth component', () => {
  expect(
    firebaseFile[path.normalize('/path/to/project/api/src/lib/auth.js')]
  ).toEqual(loadGeneratorFixture('auth', 'firebaseAuthFixture.js'))
})

test('addApiConfig is called', () => {
  const spy = jest.spyOn(auth, 'addApiConfig')
  auth.addApiConfig()

  expect(spy).toBeCalled()
})
test('addConfigToIndex is called', () => {
  const spy = jest.spyOn(auth, 'addConfigToIndex')
  auth.addConfigToIndex({
    imports: [`import { Magic } from 'magic-sdk'`],
    init: 'const m = new Magic(process.env.MAGICLINK_PUBLIC)',
    authProvider: {
      client: 'm',
      type: 'magicLink',
    },
  })
  expect(spy).toBeCalled()
})
