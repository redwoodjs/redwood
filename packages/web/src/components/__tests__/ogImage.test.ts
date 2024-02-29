import '@testing-library/jest-dom/jest-globals'

import { useOgImageUrl, OGIMAGE_DEFAULTS } from '../ogImage'

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

    const { url } = useOgImageUrl()

    expect(url).toBe('http://localhost/user/1.png')
  })

  it('returns the default width of the image', () => {
    mockLocation.mockReturnValue({
      origin: 'http://localhost/user/1',
      pathname: '/user/1',
      searchParams: new URLSearchParams(),
    })

    const { width } = useOgImageUrl()

    expect(width).toBe(OGIMAGE_DEFAULTS.width)
  })

  it('returns the default height of the image', () => {
    mockLocation.mockReturnValue({
      origin: 'http://localhost/user/1',
      pathname: '/user/1',
      searchParams: new URLSearchParams(),
    })

    const { height } = useOgImageUrl()

    expect(height).toBe(OGIMAGE_DEFAULTS.height)
  })

  it('returns all the props necessary to build the og:image meta tags', () => {
    mockLocation.mockReturnValue({
      origin: 'http://localhost/user/1',
      pathname: '/user/1',
      searchParams: new URLSearchParams(),
    })

    const { ogProps } = useOgImageUrl()

    expect(ogProps).toEqual({
      image: ['http://localhost/user/1.png', { width: 1200, height: 630 }],
    })
  })

  it('returns index.png if at the root', () => {
    mockLocation.mockReturnValue({
      origin: 'http://localhost',
      pathname: '/',
      searchParams: new URLSearchParams(),
    })

    const { url } = useOgImageUrl()

    expect(url).toBe('http://localhost/index.png')
  })

  it('preserves existing query variables', () => {
    mockLocation.mockReturnValue({
      origin: 'http://localhost/about',
      pathname: '/about',
      searchParams: new URLSearchParams('foo=bar'),
    })

    const { url } = useOgImageUrl()

    expect(url).toBe('http://localhost/about.png?foo=bar')
  })

  it('allows setting a custom extension', () => {
    mockLocation.mockReturnValue({
      origin: 'http://localhost/user/1/edit',
      pathname: '/user/1/edit',
      searchParams: new URLSearchParams(),
    })

    const { url } = useOgImageUrl({ extension: 'jpg' })

    expect(url).toBe('http://localhost/user/1/edit.jpg')
  })

  it('allows setting a custom width', () => {
    mockLocation.mockReturnValue({
      origin: 'http://localhost/user/1',
      pathname: '/user/1',
      searchParams: new URLSearchParams(),
    })

    const { url, width, height } = useOgImageUrl({ width: 1000 })

    expect(url).toBe('http://localhost/user/1.png?width=1000')
    expect(width).toBe(1000)
    expect(height).toBe(OGIMAGE_DEFAULTS.height)
  })

  it('allows setting a custom height', () => {
    mockLocation.mockReturnValue({
      origin: 'http://localhost/user/1',
      pathname: '/user/1',
      searchParams: new URLSearchParams(),
    })

    const { url, width, height } = useOgImageUrl({ height: 500 })

    expect(url).toBe('http://localhost/user/1.png?height=500')
    expect(width).toBe(OGIMAGE_DEFAULTS.width)
    expect(height).toBe(500)
  })

  it('merges existing query variables with custom ones', () => {
    mockLocation.mockReturnValue({
      origin: 'http://localhost/user/1',
      pathname: '/user/1',
      searchParams: new URLSearchParams('foo=bar'),
    })

    const { url, width, height } = useOgImageUrl({
      extension: 'gif',
      width: 1024,
      height: 768,
    })

    expect(url).toBe(
      'http://localhost/user/1.gif?foo=bar&width=1024&height=768'
    )
    expect(width).toBe(1024)
    expect(height).toBe(768)
  })
})
