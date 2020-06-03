import { render } from '@testing-library/react'

import { LocationProvider, useLocation } from '../location'

describe('useLocation', () => {
  const MyLocation = () => {
    const location = useLocation()
    return <div>{JSON.stringify(location)}</div>
  }

  it('returns the correct pathname search and hash values', () => {
    const mockLocation = {
      pathname: '/dunder-mifflin',
      search: '?facts=bears',
      hash: '#beats',
    }

    const { getByText } = render(
      <LocationProvider location={mockLocation}>
        <MyLocation />
      </LocationProvider>
    )

    expect(
      getByText(
        '{"pathname":"/dunder-mifflin","search":"?facts=bears","hash":"#beats"}'
      )
    ).toBeTruthy()
  })
})
