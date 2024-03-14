import React from 'react'

import { render } from '@testing-library/react'

import { NavLink } from '../links'
import { LocationProvider } from '../location'

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

describe('<NavLink />', () => {
  it('receives active class on the same pathname', () => {
    const mockLocation = createDummyLocation('/dunder-mifflin')

    const { getByText } = render(
      <LocationProvider location={mockLocation}>
        <NavLink activeClassName="activeTest" to="/dunder-mifflin">
          Dunder Mifflin
        </NavLink>
      </LocationProvider>
    )

    expect(getByText(/Dunder Mifflin/)).toHaveClass('activeTest')
  })

  it('receives active class on the same pathname with search parameters', () => {
    const mockLocation = createDummyLocation(
      '/search-params',
      '?tab=main&page=1'
    )

    const { getByText } = render(
      <LocationProvider location={mockLocation}>
        <NavLink
          activeClassName="activeTest"
          to={`/search-params?page=1&tab=main`}
        >
          Dunder Mifflin
        </NavLink>
      </LocationProvider>
    )

    expect(getByText(/Dunder Mifflin/)).toHaveClass('activeTest')
  })

  it('receives active class on the pathname when we are on a sub page', () => {
    const mockLocation = createDummyLocation('/users/1')

    const { getByText } = render(
      <LocationProvider location={mockLocation}>
        <NavLink activeClassName="activeTest" matchSubPaths to="/users">
          Dunder Mifflin
        </NavLink>
      </LocationProvider>
    )

    expect(getByText(/Dunder Mifflin/)).toHaveClass('activeTest')
  })

  it('receives active class on the pathname when we are on the exact page, but also matching child paths', () => {
    const mockLocation = createDummyLocation('/users/1')

    const { getByText } = render(
      <LocationProvider location={mockLocation}>
        <NavLink activeClassName="activeTest" matchSubPaths to="/users/1">
          Dunder Mifflin
        </NavLink>
      </LocationProvider>
    )

    expect(getByText(/Dunder Mifflin/)).toHaveClass('activeTest')
  })

  it('receives active class on the same pathname only', () => {
    const mockLocation = createDummyLocation('/pathname', '?tab=main&page=1')

    const { getByText } = render(
      <LocationProvider location={mockLocation}>
        <NavLink
          activeClassName="activeTest"
          to="/pathname?tab=second&page=2"
          activeMatchParams={[]}
        >
          Dunder Mifflin
        </NavLink>
      </LocationProvider>
    )

    expect(getByText(/Dunder Mifflin/)).toHaveClass('activeTest')
  })

  it('receives active class on the same pathname with a matched param key', () => {
    const mockLocation = createDummyLocation(
      '/pathname-params',
      '?tab=main&page=1'
    )

    const { getByText } = render(
      <LocationProvider location={mockLocation}>
        <NavLink
          activeClassName="activeTest"
          to={`/pathname-params?tab=main&page=2`}
          activeMatchParams={['tab']}
        >
          Dunder Mifflin
        </NavLink>
      </LocationProvider>
    )

    expect(getByText(/Dunder Mifflin/)).toHaveClass('activeTest')
  })

  it('receives active class on the same pathname with a matched key-value param', () => {
    const mockLocation = createDummyLocation(
      '/search-params',
      '?tab=main&page=1'
    )

    const { getByText } = render(
      <LocationProvider location={mockLocation}>
        <NavLink
          activeClassName="activeTest"
          to={`/search-params?page=1&tab=main`}
          activeMatchParams={[{ page: 1 }]}
        >
          Dunder Mifflin
        </NavLink>
      </LocationProvider>
    )

    expect(getByText(/Dunder Mifflin/)).toHaveClass('activeTest')
  })

  it('receives active class on the same pathname with a matched param key and a matched key-value param', () => {
    const mockLocation = createDummyLocation(
      '/search-params',
      '?tab=main&page=1&category=book'
    )

    const { getByText } = render(
      <LocationProvider location={mockLocation}>
        <NavLink
          activeClassName="activeTest"
          to={`/search-params?page=3&tab=main&category=book`}
          activeMatchParams={[{ category: 'book' }, 'page']}
        >
          Dunder Mifflin
        </NavLink>
      </LocationProvider>
    )

    expect(getByText(/Dunder Mifflin/)).toHaveClass('activeTest')
  })

  it('receives active class on the same pathname with a matched param key and multiple matched key-value param', () => {
    const mockLocation = createDummyLocation(
      '/search-params',
      '?tab=about&page=3&category=magazine'
    )

    const { getByText } = render(
      <LocationProvider location={mockLocation}>
        <NavLink
          activeClassName="activeTest"
          to={`/search-params?page=3&tab=main&category=magazine`}
          activeMatchParams={[{ page: 3, category: 'magazine' }, 'tab']}
        >
          Dunder Mifflin
        </NavLink>
      </LocationProvider>
    )

    expect(getByText(/Dunder Mifflin/)).toHaveClass('activeTest')
  })

  it('receives active class on the same pathname with a matched param key and multiple matched key-value param in separated', () => {
    const mockLocation = createDummyLocation(
      '/search-params',
      '?tab=about&page=3&category=magazine'
    )

    const { getByText } = render(
      <LocationProvider location={mockLocation}>
        <NavLink
          activeClassName="activeTest"
          to={`/search-params?page=3&tab=main&category=magazine`}
          activeMatchParams={[{ page: 3 }, { category: 'magazine' }, 'tab']}
        >
          Dunder Mifflin
        </NavLink>
      </LocationProvider>
    )

    expect(getByText(/Dunder Mifflin/)).toHaveClass('activeTest')
  })

  it('does NOT receive active class on a different path that starts with the same word', () => {
    const mockLocation = createDummyLocation('/users-settings')

    const { getByText } = render(
      <LocationProvider location={mockLocation}>
        <NavLink activeClassName="activeTest" matchSubPaths to="/users">
          Dunder Mifflin
        </NavLink>
      </LocationProvider>
    )

    expect(getByText(/Dunder Mifflin/)).not.toHaveClass('activeTest')
  })

  it('does NOT receive active class on different path', () => {
    const mockLocation = createDummyLocation('/staples')

    const { getByText } = render(
      <LocationProvider location={mockLocation}>
        <NavLink activeClassName="activeTest" to="/dunder-mifflin">
          Dunder Mifflin
        </NavLink>
      </LocationProvider>
    )

    expect(getByText(/Dunder Mifflin/)).not.toHaveClass('activeTest')
  })

  it('does NOT receive active class on the same pathname with different search params', () => {
    const mockLocation = createDummyLocation(
      '/search-params',
      '?tab=main&page=1'
    )

    const { getByText } = render(
      <LocationProvider location={mockLocation}>
        <NavLink
          activeClassName="activeTest"
          to={`/search-params?page=2&tab=main`}
        >
          Dunder Mifflin
        </NavLink>
      </LocationProvider>
    )

    expect(getByText(/Dunder Mifflin/)).not.toHaveClass('activeTest')
  })

  it('does NOT receive active class on the same pathname with a different search param key', () => {
    const mockLocation = createDummyLocation(
      '/pathname-params',
      '?category=car&page=1'
    )

    const { getByText } = render(
      <LocationProvider location={mockLocation}>
        <NavLink
          activeClassName="activeTest"
          to={`/pathname-params?tab=main&page=2`}
          activeMatchParams={['tab']}
        >
          Dunder Mifflin
        </NavLink>
      </LocationProvider>
    )

    expect(getByText(/Dunder Mifflin/)).not.toHaveClass('activeTest')
  })
})
