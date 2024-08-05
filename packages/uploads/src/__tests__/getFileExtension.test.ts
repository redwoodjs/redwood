import { describe, it, expect } from 'vitest'

import { getFileExtension } from '../prismaExtension'

describe('getFileExtension', () => {
  it('should return the correct file extension for a given data type', () => {
    const dataType = 'data:image/png;base64'
    const extension = getFileExtension(dataType)
    expect(extension).toBe('png')
  })

  it('handles svgs', () => {
    const dataType = 'data:image/svg+xml;base64'
    expect(getFileExtension(dataType)).toBe('svg')
  })

  it('handles gif', () => {
    const dataType = 'data:image/gif;base64'
    expect(getFileExtension(dataType)).toBe('gif')
  })
})
