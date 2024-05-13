import { createFromFetch } from 'react-server-dom-webpack/client'

import { LocationProvider, useLocation } from '@redwoodjs/router/dist/location'

function rscFetch(rscId: string, props: Record<string, unknown> = {}) {
  const searchParams = new URLSearchParams()
  searchParams.set('props', JSON.stringify(props))

  const response = fetch('/rw-rsc/' + rscId + '?' + searchParams, {
    headers: {
      'rw-rsc': '1',
    },
  })

  return createFromFetch(response)
}

let serverRoutes: React.ReactElement = null

export const ClientRouter = () => {
  return (
    // Wrap it in the provider so that useLocation can be used
    <LocationProvider>
      <LocationAwareRouter />
    </LocationProvider>
  )
}

const LocationAwareRouter = () => {
  const location = useLocation()

  // TODO (RSC): Refetch when the location changes
  // It currently works because we always do a full page refresh, but that's
  // not what we really want to do)
  if (!serverRoutes) {
    serverRoutes = rscFetch('__rwjs__ServerRoutes', {
      // All we need right now is the pathname. Plus, `location` is a URL
      // object, and it doesn't JSON.stringify well. Basically all you end up
      // with is the href. That's why we manually construct the object here
      // instead of just passing `location`.
      location: { pathname: location.pathname },
    })
  }

  return serverRoutes
}
