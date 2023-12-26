jest.mock('fs')

import path from 'path'

import fs from 'fs-extra'

const INITIAL_FS = {
  file_a: 'content_a',
  [path.join('fake_dir', 'mock_dir', 'made_up_file')]: 'made_up_content',
}

describe('setup', () => {
  beforeEach(() => {
    fs.__setMockFiles(INITIAL_FS)
  })

  test('correct initial mock', () => {
    const originalMock = fs.__getMockFiles()
    const pathFixedMock = {}

    for (const [key, value] of Object.entries(originalMock)) {
      const fixedKey = key.replaceAll(path.sep, '/')
      pathFixedMock[fixedKey] = value
    }

    expect(pathFixedMock).toMatchInlineSnapshot(`
      {
        "fake_dir": undefined,
        "fake_dir/mock_dir": undefined,
        "fake_dir/mock_dir/made_up_file": "made_up_content",
        "file_a": "content_a",
      }
    `)
  })
})

describe('files', () => {
  beforeEach(() => {
    fs.__setMockFiles(INITIAL_FS)
  })

  test('exists', () => {
    expect(fs.existsSync('file_a')).toBe(true)
    expect(fs.existsSync('file_b')).toBe(false)
  })

  test('reading', () => {
    expect(fs.readFileSync('file_a')).toBe('content_a')
    expect(() => fs.readFileSync('file_b')).toThrowError()
  })

  test('writing', () => {
    fs.writeFileSync('file_a', 'content_a_new')
    expect(fs.readFileSync('file_a')).toBe('content_a_new')
    fs.writeFileSync('file_b', 'content_b')
    expect(fs.readFileSync('file_b')).toBe('content_b')

    expect(() =>
      fs.writeFileSync(path.join('non_existing_dir', 'test'), 'test')
    ).toThrowError()
  })

  test('appending', () => {
    fs.appendFileSync('file_a', '_new')
    expect(fs.readFileSync('file_a')).toBe('content_a_new')
    fs.appendFileSync('file_b', 'content_b')
    expect(fs.readFileSync('file_b')).toBe('content_b')

    expect(() =>
      fs.appendFileSync(path.join('non_existing_dir', 'test'), 'test')
    ).toThrowError()
  })

  test('deleting', () => {
    fs.rmSync('file_a')
    expect(() => fs.readFileSync('file_a')).toThrowError()

    fs.writeFileSync('file_a', 'content_a')
    fs.unlinkSync('file_a')
    expect(() => fs.readFileSync('file_a')).toThrowError()

    expect(() => fs.rmSync('file_b')).toThrowError()
    expect(() => fs.unlinkSync('file_b')).toThrowError()
  })

  test('copy', () => {
    fs.copyFileSync('file_a', 'file_b')
    expect(fs.readFileSync('file_a')).toBe('content_a')
    expect(fs.readFileSync('file_b')).toBe('content_a')
    expect(() => fs.copyFileSync('file_c', 'file_d')).toThrowError()
  })
})

describe('directories', () => {
  beforeEach(() => {
    fs.__setMockFiles(INITIAL_FS)
  })

  test('exists', () => {
    expect(fs.existsSync('fake_dir')).toBe(true)
    expect(fs.existsSync('not_a_dir')).toBe(false)
    expect(fs.existsSync(path.join('fake_dir', 'mock_dir'))).toBe(true)
    expect(fs.existsSync(path.join('fake_dir', 'not_a_mock_dir'))).toBe(false)
  })

  test('reading', () => {
    expect(fs.readdirSync('fake_dir')).toStrictEqual(['mock_dir'])
    expect(fs.readdirSync(path.join('fake_dir', 'mock_dir'))).toStrictEqual([
      'made_up_file',
    ])
    expect(() => fs.readdirSync('not_a_fake_dir')).toThrowError()
    expect(() =>
      fs.readdirSync(path.join('fake_dir', 'mock_dir', 'made_up_file'))
    ).toThrowError()
  })

  test('writing', () => {
    fs.mkdirSync('new_fake_dir')
    expect(fs.existsSync('new_fake_dir')).toBe(true)
    expect(fs.readdirSync('new_fake_dir')).toStrictEqual([])
  })

  test('deleting', () => {
    fs.mkdirSync('new_fake_dir')
    expect(fs.existsSync('new_fake_dir')).toBe(true)
    fs.rmdirSync('new_fake_dir')
    expect(fs.existsSync('new_fake_dir')).toBe(false)

    expect(() => fs.rmdirSync('not_a_fake_dir')).toThrowError()

    expect(() => fs.rmdirSync(path.join('fake_dir', 'mock_dir'))).toThrowError()

    expect(() =>
      fs.rmdirSync(path.join('fake_dir', 'mock_dir'), { recursive: true })
    ).not.toThrowError()
    expect(fs.readdirSync('fake_dir')).toStrictEqual([])

    expect(() => fs.rmdirSync('fake_a')).toThrowError()
  })
})
