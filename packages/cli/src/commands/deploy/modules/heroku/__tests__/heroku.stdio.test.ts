import execa from 'execa'

import { buildSpawner, createLogger, writeStdout } from '../stdio'

jest.mock('execa')

jest.mock('../../../../../lib')

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(execa).mockResolvedValue({ stdout: 'i am stdout' } as any)
})

describe('all things stdio', () => {
  it('builder builds and spawns a spawner', async () => {
    const actual = buildSpawner('test', false)
    expect(actual).toBeInstanceOf(Function)

    const out = await actual('i am command')
    expect(out).toBe('i am stdout')
  })

  it('creates a logger', () => {
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'debug').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(console, 'info').mockImplementation(() => {})

    const actual = createLogger(true)

    expect(actual.log).toBeInstanceOf(Function)
    expect(actual.debug).toBeInstanceOf(Function)
    expect(actual.error).toBeInstanceOf(Function)
    expect(actual.info).toBeInstanceOf(Function)

    actual.log('i am log')
    actual.debug('i am debug')
    actual.error('i am error')
    actual.info('i am info')

    expect(console.log).toHaveBeenCalledWith('i am log')
    expect(console.debug).toHaveBeenCalledWith('🦄 i am debug')
    expect(console.error).toHaveBeenCalledWith('❌ i am error')
    expect(console.info).toHaveBeenCalledWith('🔍 i am info')
  })

  it('wraps stdout for easier mocks in other tests', () => {
    const mockStd = jest.spyOn(process.stdout, 'write')
    const actual = writeStdout('i am stdout')
    expect(actual).toBeUndefined()
    expect(mockStd).toHaveBeenCalledWith('i am stdout')
  })
})
