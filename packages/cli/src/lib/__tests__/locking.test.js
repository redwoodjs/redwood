global.__dirname = __dirname
jest.mock('@redwoodjs/config', () => {
  return {
    ...jest.requireActual('@redwoodjs/config'),
    getPaths: () => {
      return {
        generated: {
          base: '.redwood',
        },
      }
    },
  }
})
jest.mock('fs')

import fs from 'fs'
import path from 'path'

import { setLock, unsetLock, isLockSet, clearLocks } from '../locking'

beforeEach(() => {
  // Start with no files
  fs.__setMockFiles({})
})

it('Set a lock', () => {
  setLock('TEST')

  const lockExists = fs.existsSync(path.join('.redwood', 'locks', 'TEST'))
  expect(lockExists).toBe(true)
})

it('Set a lock which is already set', () => {
  setLock('TEST')

  const func = () => setLock('TEST')
  expect(func).toThrow('Lock "TEST" is already set')
})

it('Unset a lock', () => {
  setLock('TEST')
  unsetLock('TEST')

  const lockExists = fs.existsSync(path.join('.redwood', 'locks', 'TEST'))
  expect(lockExists).toBe(false)
})

it('Unset a lock which is not already set', () => {
  unsetLock('TEST')

  const lockExists = fs.existsSync(path.join('.redwood', 'locks', 'TEST'))
  expect(lockExists).toBe(false)
})

it('Detect if lock is set when it is already set', () => {
  setLock('TEST')

  const isSet = isLockSet('TEST')
  expect(isSet).toBe(true)
})

it('Detect if lock is set when it is already unset', () => {
  setLock('TEST')
  unsetLock('TEST')

  const isSet = isLockSet('TEST')
  expect(isSet).toBe(false)
})

it('Clear a list of locks', () => {
  setLock('TEST-1')
  setLock('TEST-2')
  setLock('TEST-3')
  clearLocks(['TEST-1', 'TEST-3'])

  const isSet1 = isLockSet('TEST-1')
  const isSet2 = isLockSet('TEST-2')
  const isSet3 = isLockSet('TEST-3')
  expect(isSet1).toBe(false)
  expect(isSet2).toBe(true)
  expect(isSet3).toBe(false)
})

it('Clear all locks', () => {
  setLock('TEST-1')
  setLock('TEST-2')
  setLock('TEST-3')
  clearLocks()

  const isSet1 = isLockSet('TEST-1')
  const isSet2 = isLockSet('TEST-2')
  const isSet3 = isLockSet('TEST-3')
  expect(isSet1 || isSet2 || isSet3).toBe(false)
})
