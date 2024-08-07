import { describe, it, expect, vi } from 'vitest'

import {
  getFileExtensionFromDataUri,
  saveUploadToFile,
} from '../fileSave.utils'

describe('getFileExtension', () => {
  it('should return the correct file extension for a given data type', () => {
    const dataType = 'data:image/png;base64'
    const extension = getFileExtensionFromDataUri(dataType)
    expect(extension).toBe('png')
  })

  it('handles svgs', () => {
    const dataType = 'data:image/svg+xml;base64'
    expect(getFileExtensionFromDataUri(dataType)).toBe('svg')
  })

  it('handles gif', () => {
    const dataType = 'data:image/gif;base64'
    expect(getFileExtensionFromDataUri(dataType)).toBe('gif')
  })
})

describe('saveUploadToFile', () => {
  vi.mock('node:fs/promises', () => ({
    default: {
      writeFile: vi.fn(),
      unlink: vi.fn(),
      // readFile: vi.fn((path, encoding) => {
      //   if (encoding === 'base64') {
      //     return 'BASE64_FILE_CONTENT'
      //   }

      //   return 'MOCKED_FILE_CONTENT'
      // }),
    },
  }))

  // it('Should call saveBase64DataUriToFile if the uploadUrlOrDataUrl is a base64 data uri', async () => {
  //   saveUploadToFile('data:image/png;base64,....', {
  //     saveDir: 'uploads',
  //     fileName: 'test',
  //   })
  // })

  // it('Should call saveTusFileToFile if the uploadUrlOrDataUrl is a tus url', async () => {})

  it('Should throw an error if the uploadUrlOrDataUrl is not a base64 data uri or a tus url', async () => {
    try {
      await saveUploadToFile('/random/path/to/whatever.png', {
        saveDir: 'uploads',
        fileName: 'test',
      })
    } catch (e) {
      expect(e.message).toBe('Unsupported upload format')
    }
  })
})
