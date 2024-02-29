import '@testing-library/jest-dom/jest-globals'

import { useOgImageUrl } from '../ogImage'

const mockLocation = jest.fn()

jest.mock('@redwoodjs/router', () => {
  return {
    useLocation: () => mockLocation(),
  }
})

describe('useOgImageUrl', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('returns a plain URL with a default extension', () => {
    mockLocation.mockReturnValue({
      origin: 'http://localhost/user/1',
      pathname: '/user/1',
      searchParams: new URLSearchParams(),
    })

    const url = useOgImageUrl()

    expect(url).toBe('http://localhost/user/1.png')
  })

  it('returns index.png if at the root', () => {
    mockLocation.mockReturnValue({
      origin: 'http://localhost',
      pathname: '/',
      searchParams: new URLSearchParams(),
    })

    const url = useOgImageUrl()

    expect(url).toBe('http://localhost/index.png')
  })

  it('preserves existing query variables', () => {
    mockLocation.mockReturnValue({
      origin: 'http://localhost/about',
      pathname: '/about',
      searchParams: new URLSearchParams('foo=bar'),
    })

    const url = useOgImageUrl()

    expect(url).toBe('http://localhost/about.png?foo=bar')
  })

  it('allows setting a custom extension', () => {
    mockLocation.mockReturnValue({
      origin: 'http://localhost/user/1/edit',
      pathname: '/user/1/edit',
      searchParams: new URLSearchParams(),
    })

    const url = useOgImageUrl({ extension: 'jpg' })

    expect(url).toBe('http://localhost/user/1/edit.jpg')
  })

  it('allows setting a custom width', () => {
    mockLocation.mockReturnValue({
      origin: 'http://localhost/user/1',
      pathname: '/user/1',
      searchParams: new URLSearchParams(),
    })

    const url = useOgImageUrl({ width: 1000 })

    expect(url).toBe('http://localhost/user/1.png?width=1000')
  })

  it('allows setting a custom height', () => {
    mockLocation.mockReturnValue({
      origin: 'http://localhost/user/1',
      pathname: '/user/1',
      searchParams: new URLSearchParams(),
    })

    const url = useOgImageUrl({ height: 500 })

    expect(url).toBe('http://localhost/user/1.png?height=500')
  })

  it('merges existing query variables with custom ones', () => {
    mockLocation.mockReturnValue({
      origin: 'http://localhost/user/1',
      pathname: '/user/1',
      searchParams: new URLSearchParams('foo=bar'),
    })

    const url = useOgImageUrl({ extension: 'gif', width: 1024, height: 768 })

    expect(url).toBe(
      'http://localhost/user/1.gif?foo=bar&width=1024&height=768'
    )
  })
})
