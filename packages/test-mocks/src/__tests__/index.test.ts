import MockProject from '../index'

jest.mock('mock-fs', () => () => {})

describe('test-mocks', () => {
  const mockrw = new MockProject()

  it('provides a default mock filesystem', () => {
    expect(mockrw.paths).toMatchSnapshot()
  })

  it('allows the filesystem to be mutated', () => {
    mockrw.setPaths((paths) => {
      paths['redwood.toml'] = ''
      return paths
    })
    expect(mockrw.paths).toMatchSnapshot()
  })

  it('allows the filesystem to be updated with merge', () => {
    mockrw.mergePaths(() => {
      return {
        'another-file.text': 'hello',
        web: {
          src: {
            pages: {
              'HelloPage/HelloPage.js': '',
            },
          },
        },
      }
    })
    expect(mockrw.paths).toMatchSnapshot()
  })
})
