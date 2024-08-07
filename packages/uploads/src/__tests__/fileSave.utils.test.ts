import { describe, it, expect } from 'vitest'

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
