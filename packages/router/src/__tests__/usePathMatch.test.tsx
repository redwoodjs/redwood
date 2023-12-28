import React from 'react'

import * as testingLibraryReact from '@testing-library/react'

import { LocationProvider } from '..'
import { usePathMatch } from '../usePathMatch'

function createDummyLocation(pathname: string, search = '') {
  return {
    pathname,
    hash: '',
    host: '',
    hostname: '',
    href: '',
    ancestorOrigins: null,
    assign: () => null,
    reload: () => null,
    replace: () => null,
    origin: '',
    port: '',
    protocol: '',
    search,
  }
}

describe('usePathMatch', () => {
  let locationPathname = '/dummy-location'
  let locationSearch = ''

  type CallbackType = Parameters<typeof testingLibraryReact.renderHook>[0]
  function renderHook(cb: CallbackType) {
    const mockLocation = createDummyLocation(locationPathname, locationSearch)

    return testingLibraryReact.renderHook(cb, {
      wrapper: ({ children }) => (
        <LocationProvider location={mockLocation}>{children}</LocationProvider>
      ),
    })
  }

  function setLocation(pathname: string, search = '') {
    locationPathname = pathname
    locationSearch = search
  }

  afterEach(() => {
    setLocation('/dummy-location')
  })

  it('matches on identical url and path', () => {
    const { result } = renderHook(() => usePathMatch('/about', '/about'))

    expect(result.current).toBeTruthy()
  })

  it('matches on location', () => {
    setLocation('/test-path')

    const { result } = renderHook(() => usePathMatch('/test-path'))

    expect(result.current).toBeTruthy()
  })

  it('matches a path with given param value', () => {
    const { result } = renderHook(() =>
      usePathMatch('/posts/uuid-string', '/posts/{id}', {
        paramValues: { id: 'uuid-string' },
      })
    )

    expect(result.current).toBeTruthy()
  })

  it('matches a path with given param value, using location', () => {
    setLocation('/posts/uuid-string')

    const { result } = renderHook(() =>
      usePathMatch('/posts/{id}', { paramValues: { id: 'uuid-string' } })
    )

    expect(result.current).toBeTruthy()
  })

  it('matches a path with default param type', () => {
    const { result } = renderHook(() =>
      usePathMatch('/posts/123', '/posts/{id}', {
        paramValues: { id: '123' },
      })
    )

    expect(result.current).toBeTruthy()
  })

  it('matches a path with a specified param type', () => {
    const { result } = renderHook(() =>
      usePathMatch('/posts/123', '/posts/{id:Int}', {
        paramValues: { id: 123 },
      })
    )

    expect(result.current).toBeTruthy()
  })

  it("doesn't match a path with a specified param type with different value", () => {
    const { result } = renderHook(() =>
      usePathMatch('/posts/123', '/posts/{id:Int}', {
        paramValues: { id: '0' },
      })
    )

    expect(result.current).toBeFalsy()
  })
})
