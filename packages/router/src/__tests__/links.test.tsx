import React from 'react'

import { toHaveClass, toHaveStyle } from '@testing-library/jest-dom/matchers'
import { act, render, waitFor } from '@testing-library/react'
// TODO: Remove when jest configs are in place
expect.extend({ toHaveClass, toHaveStyle })

import { navigate, Route, Router, routes } from '../'

import { Link, NavLink, useMatch } from '../links'
import { LocationProvider } from '../location'
import { flattenSearchParams, RouteParams } from '../util'

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

describe('useMatch', () => {
  const MyLink = ({ to, ...rest }) => {
    const [pathname, queryString] = to.split('?')
    const matchInfo = useMatch(pathname, {
      searchParams: flattenSearchParams(queryString),
    })

    return (
      <Link
        to={to}
        style={{ color: matchInfo.match ? 'green' : 'red' }}
        {...rest}
      />
    )
  }

  it('returns a match on the same pathname', () => {
    const mockLocation = createDummyLocation('/dunder-mifflin')

    const { getByText } = render(
      <LocationProvider location={mockLocation}>
        <MyLink to="/dunder-mifflin">Dunder Mifflin</MyLink>
      </LocationProvider>
    )

    expect(getByText(/Dunder Mifflin/)).toHaveStyle('color: green')
  })

  it('returns a match on the same pathname with search parameters', () => {
    const mockLocation = createDummyLocation(
      '/search-params',
      '?page=1&tab=main'
    )

    const { getByText } = render(
      <LocationProvider location={mockLocation}>
        <MyLink to={`/search-params?tab=main&page=1`}>Dunder Mifflin</MyLink>
      </LocationProvider>
    )

    expect(getByText(/Dunder Mifflin/)).toHaveStyle('color: green')
  })

  it('does NOT receive active class on different path', () => {
    const mockLocation = createDummyLocation('/staples')

    const { getByText } = render(
      <LocationProvider location={mockLocation}>
        <MyLink to="/dunder-mifflin">Dunder Mifflin</MyLink>
      </LocationProvider>
    )

    expect(getByText(/Dunder Mifflin/)).toHaveStyle('color: red')
  })

  it('does NOT receive active class on the same pathname with different parameters', () => {
    const mockLocation = createDummyLocation(
      '/search-params',
      '?tab=main&page=1'
    )

    const { getByText } = render(
      <LocationProvider location={mockLocation}>
        <MyLink to={`/search-params?page=2&tab=main`}>Dunder Mifflin</MyLink>
      </LocationProvider>
    )

    expect(getByText(/Dunder Mifflin/)).toHaveStyle('color: red')
  })
  it('returns a match on the same pathname', async () => {
    Object.keys(routes).forEach((key) => delete routes[key])

    const MyPage = () => {
      const matchExactPath = useMatch(
        routes.home({
          dynamic: 'dunder-mifflin',
          path: '1',
        })
      )
      const matchWrongPath = useMatch(
        routes.home({
          dynamic: 'dunder-mifflin',
          path: '0',
        })
      )
      const matchParameterPath = useMatch(
        routes.home({
          dynamic: RouteParams.LITERAL,
          path: RouteParams.LITERAL
        })
      )
      const matchPartialParameterPath = useMatch(
        routes.home({
          dynamic: RouteParams.LITERAL,
          path: '1',
        })
      )
      const matchWrongPartialParameterPath = useMatch(
        routes.home({
          dynamic: RouteParams.LITERAL,
          path: '0',
        })
      )
      // const matchWrongParameterPath = useMatch(routes.anotherHome.path)
      return (
        <>
          {matchExactPath.match ? 'Exact Path true Match' : null}
          {matchWrongPath.match ? null : 'Wrong Path false Match'}
          {matchParameterPath.match ? 'Parameter Path true Match' : null}
          {matchPartialParameterPath.match
            ? 'Partial Parameter Path true Match'
            : null}
          {matchWrongPartialParameterPath.match ? null : 'Wrong Partial Parameter Path false Match'}
        </>
      )
    }
    const TestRouter = () => (
      <Router>
        <Route path="/{dynamic}/{path}" page={MyPage} name="home" />
        {/* <Route path="/{another}/{path}" page={MyPage} name="anotherHome" /> */}
      </Router>
    )

    const screen = render(<TestRouter />)

    act(() =>
      navigate(
        routes.home({
          dynamic: 'dunder-mifflin',
          path: '1',
        })
      )
    )

    await waitFor(() => expect(screen.getByText(/Exact Path true Match/)))
    await waitFor(() => expect(screen.getByText(/Wrong Path false Match/)))
    await waitFor(() => expect(screen.getByText(/Parameter Path true Match/)))
    await waitFor(() =>
      expect(screen.getByText(/Partial Parameter Path true Match/))
    )
    await waitFor(() =>
      expect(screen.getByText(/Wrong Partial Parameter Path false Match/))
    )
  })
})
