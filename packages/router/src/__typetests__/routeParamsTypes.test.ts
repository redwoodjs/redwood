import { expectAssignable } from 'tsd-lite'

// @WARN!: I'm importing this from the built package.
// So you will need to build, before running test again!
// See https://github.com/jest-community/jest-runner-tsd/issues/111
import type { RouteParams, ParamType } from '../routeParamsTypes'

describe('RouteParams<>', () => {
  test('Single parameters', () => {
    expectAssignable<RouteParams<'bazinga/{id:Int}'>>({
      id: 1,
    })
  })

  test('Route string with no types defaults to string', () => {
    expectAssignable<RouteParams<'/blog/{year}/{month}/{day}/{slug}'>>({
      year: '2020',
      month: '01',
      day: '01',
      slug: 'hello-world',
    })
  })

  test('Custom param types', () => {
    const customParams = {
      name: 'hello-world-slug',
    }

    expectAssignable<RouteParams<'/post/{name:slug}'>>(customParams)
  })

  test('Multiple Glob route params', () => {
    const globRoutes = {
      fromDate: '2021/11/03',
      toDate: '2021/11/17',
    }

    expectAssignable<RouteParams<'/from/{fromDate...}/to/{toDate...}'>>(
      globRoutes
    )
  })

  test('Single Glob route params', () => {
    const globRoutes = {
      fromDate: '2021/11/03',
    }

    expectAssignable<RouteParams<'/from/{fromDate...}'>>(globRoutes)
  })

  test('Glob params in the middle', () => {
    test('Multiple Glob route params', () => {
      const middleGlob = {
        folders: 'src/lib/auth.js',
      }

      expectAssignable<RouteParams<'/repo/{folders...}/edit'>>(middleGlob)
    })
  })

  test('Mixed typed and untyped params', () => {
    const untypedFirst = {
      b: 'bazinga',
      c: true,
    }

    const typedFirst = {
      b: 1245,
      c: 'stringy-string',
    }

    expectAssignable<RouteParams<'/mixed/{b}/{c:Boolean}'>>(untypedFirst)
    expectAssignable<RouteParams<'/mixed/{b:Float}/{c}'>>(typedFirst)
  })

  test('Params in the middle', () => {
    const paramsInTheMiddle = {
      authorId: 'id:author',
      id: 10,
    }

    expectAssignable<RouteParams<'/posts/{authorId:string}/{id:Int}/edit'>>(
      paramsInTheMiddle
    )
  })
})

describe('ParamType<>', () => {
  test('Float', () => {
    expectAssignable<ParamType<'Float'>>(1.02)
  })

  test('Boolean', () => {
    expectAssignable<ParamType<'Boolean'>>(true)
    expectAssignable<ParamType<'Boolean'>>(false)
  })

  test('Int', () => {
    expectAssignable<ParamType<'Int'>>(51)
  })

  test('String', () => {
    expectAssignable<ParamType<'String'>>('bazinga')
  })
})
