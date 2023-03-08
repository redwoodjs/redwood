import { isValidRoute } from '../route-validators'
import { Route } from '../router'

test('Should throw if Route does not have a path', () => {
  // @ts-expect-error We're checking the validator
  const CheckRoutes = <Route name="noPath" page={() => <h1>Hello</h1>} />

  expect(() => isValidRoute(CheckRoutes)).toThrowError(
    'Route element for "noPath" is missing requiredKeys: path'
  )
})
