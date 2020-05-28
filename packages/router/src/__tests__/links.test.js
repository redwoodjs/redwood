import { render } from '@testing-library/react'
// TODO: Remove when jest configs are in place
import { toHaveClass, toHaveStyle } from '@testing-library/jest-dom/matchers'
expect.extend({ toHaveClass, toHaveStyle })

import { NavLink, useMatch, Link } from '../links'
import { LocationProvider } from '../location'

describe('<NavLink />', () => {
  it('receives active class on the same path', () => {
    const mockLocation = {
      pathname: '/dunder-mifflin',
    }

    const { getByText } = render(
      <LocationProvider location={mockLocation}>
        <NavLink activeClassName="activeTest" to="/dunder-mifflin">
          Dunder Mifflin
        </NavLink>
      </LocationProvider>
    )

    expect(getByText(/Dunder Mifflin/)).toHaveClass('activeTest')
  })

  it('does NOT receive active class on different path', () => {
    const mockLocation = {
      pathname: '/staples',
    }

    const { getByText } = render(
      <LocationProvider location={mockLocation}>
        <NavLink activeClassName="activeTest" to="/dunder-mifflin">
          Dunder Mifflin
        </NavLink>
      </LocationProvider>
    )

    expect(getByText(/Dunder Mifflin/)).not.toHaveClass('activeTest')
  })
})

describe('useMatch', () => {
  const MyLink = ({ to, ...rest }) => {
    const matchInfo = useMatch(to)

    return (
      <Link
        to={to}
        style={{ color: matchInfo.match ? 'green' : 'red' }}
        {...rest}
      />
    )
  }

  it('returns a match on the same path', () => {
    const mockLocation = {
      pathname: '/dunder-mifflin',
    }

    const { getByText } = render(
      <LocationProvider location={mockLocation}>
        <MyLink to="/dunder-mifflin">Dunder Mifflin</MyLink>
      </LocationProvider>
    )

    expect(getByText(/Dunder Mifflin/)).toHaveStyle('color: green')
  })

  it('does NOT receive active class on different path', () => {
    const mockLocation = {
      pathname: '/staples',
    }

    const { getByText } = render(
      <LocationProvider location={mockLocation}>
        <MyLink to="/dunder-mifflin">Dunder Mifflin</MyLink>
      </LocationProvider>
    )

    expect(getByText(/Dunder Mifflin/)).toHaveStyle('color: red')
  })
})
