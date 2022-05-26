// import { db } from '$api/src/lib/db'

import type { AvailableRoutes } from '@redwoodjs/router'

// TODO: This isn't picking up the generated names in .redwood/. How can I make
// this work?
type RouteNames = keyof AvailableRoutes

export default async function prerenderPathParameterValues(): Promise<
  Record<RouteNames, Array<Record<string, unknown>>>
> {
  return {
    // In a real app you'd probably fetch a subset of your entries in your db
    // (using the commented db import above, or by accessing a service) and
    // return those ids here.
    userExample: [{ id: 1 }, { id: 2 }, { id: 3 }]
  }
}
