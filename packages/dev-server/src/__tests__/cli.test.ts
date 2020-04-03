import MockProject from '@redwoodjs/test-mocks'

import { getArgsForSide } from '../cli'

describe('cli', () => {
  it('getArgsForSide supplies the appropriate options to the dev server', () => {
    const mockfs = new MockProject()
    mockfs.mock()
    const args = getArgsForSide('api')
    mockfs.restore()
    expect(args).toMatchSnapshot()
  })
})
