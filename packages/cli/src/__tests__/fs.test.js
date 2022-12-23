jest.mock('fs')

import fs from 'fs'

const INITIAL_FS = {
  file_a: 'content_a',
}

describe('files', () => {
  beforeEach(() => {
    fs.__setMockFiles(INITIAL_FS)
  })

  test('reading', () => {
    expect(fs.readFileSync('file_a')).toBe('content_a')
    expect(() => fs.readFileSync('file_b')).toThrowError()
  })
  test('writing', () => {
    expect(fs.writeFileSync('file_a', 'content_a_new'))
    expect(fs.readFileSync('file_a')).toBe('content_a_new')
    expect(fs.writeFileSync('file_b', 'content_b'))
    expect(fs.readFileSync('file_b')).toBe('content_b')
  })
  test('appending', () => {
    expect(fs.appendFileSync('file_a', '_new'))
    expect(fs.readFileSync('file_a')).toBe('content_a_new')
    expect(fs.appendFileSync('file_b', 'content_b'))
    expect(fs.readFileSync('file_b')).toBe('content_b')
  })
  test('deleting', () => {
    expect(fs.rmSync('file_a'))
    expect(() => fs.readFileSync('file_a')).toThrowError()

    expect(fs.writeFileSync('file_a', 'content_a'))
    expect(fs.unlinkSync('file_a'))
    expect(() => fs.readFileSync('file_a')).toThrowError()

    expect(() => fs.rmSync('file_b')).toThrowError()
    expect(() => fs.unlinkSync('file_b')).toThrowError()
  })
  test('exists', () => {
    expect(fs.existsSync('file_a')).toBe(true)
    expect(fs.existsSync('file_b')).toBe(false)
  })
  test('copy', () => {
    expect(fs.copyFileSync('file_a', 'file_b'))
    expect(fs.readFileSync('file_a')).toBe('content_a')
    expect(fs.readFileSync('file_b')).toBe('content_a')
    expect(() => fs.copyFileSync('file_c', 'file_d')).toThrowError()
  })
})

describe('directories', () => {
  beforeEach(() => {
    fs.__setMockFiles(INITIAL_FS)
  })

  test.todo('reading')
  test.todo('writing')
  test.todo('deleting')
  test.todo('exists')
  test.todo('copy')
  test.todo('move')
})
