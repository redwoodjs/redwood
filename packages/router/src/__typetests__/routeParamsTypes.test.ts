import { expectAssignable, expectType } from 'tsd-lite'

import type { RouteParams, ParamType } from '../routeParamsTypes'

/**
 * FAQ:
 * - why aren't you using expectAssignable in all tests?
 * because {b: string} is assignable to Record, and then test isn't accurate enough
 *
 * - why aren't you just checking the entire type?
 * because sometimes, the parser returns {Params & GenericParams} (and thats ok!), checking the full type will cause failures
 *
 * - why are you assigning the const values if you're just checking the types?
 * for readability: param?.id! everywhere is ugly - it helps with making these tests read like documentation
 *
 */

describe('RouteParams<>', () => {
  test('Single parameters', () => {
    const simple: RouteParams<'bazinga/{id:Int}'> = {
      id: 2,
    }

    expectType<number>(simple.id)
  })

  test('Starts with parameter', () => {
    const startParam: RouteParams<'/{position:Int}/{driver:Float}/stats'> = {
      position: 1,
      driver: 44,
    }

    expectType<number>(startParam.driver)
    expectType<number>(startParam.position)
  })

  test('Route string with no types defaults to string', () => {
    const untypedParams: RouteParams<'/blog/{year}/{month}/{day}/{slug}'> = {
      year: '2020',
      month: '01',
      day: '01',
      slug: 'hello-world',
    }

    expectType<string>(untypedParams.year)
    expectType<string>(untypedParams.month)
    expectType<string>(untypedParams.day)
    expectType<string>(untypedParams.slug)
  })

  test('Custom param types', () => {
    const customParams: RouteParams<'/post/{name:slug}'> = {
      name: 'hello-world-slug',
    }

    expectType<string>(customParams.name)
  })

  test('Parameter inside string', () => {
    const stringConcat: RouteParams<'/signedUp/e{status:Boolean}y'> = {
      status: true,
    }

    expectType<boolean>(stringConcat.status)
  })

  test('Multiple Glob route params', () => {
    const globRoutes: RouteParams<'/from/{fromDate...}/to/{toDate...}'> = {
      fromDate: '2021/11/03',
      toDate: '2021/11/17',
    }

    expectType<string>(globRoutes.fromDate)
    expectType<string>(globRoutes.toDate)
  })

  test('Single Glob route params', () => {
    const globRoutes: RouteParams<'/from/{fromDate...}'> = {
      fromDate: '2021/11/03',
    }

    expectType<string>(globRoutes.fromDate)
  })

  test('Starts with Glob route params', () => {
    const globRoutes: RouteParams<'/{description...}-little/kittens'> = {
      description: 'cute',
    }

    expectType<string>(globRoutes.description)
  })

  test('Glob params in the middle', () => {
    test('Multiple Glob route params', () => {
      const middleGlob: RouteParams<'/repo/{folders...}/edit'> = {
        folders: 'src/lib/auth.js',
      }

      expectType<string>(middleGlob.folders)
    })
  })

  test('Mixed typed and untyped params', () => {
    const untypedFirst: RouteParams<'/mixed/{b}/{c:Boolean}'> = {
      b: 'bazinga',
      c: true,
    }

    const typedFirst: RouteParams<'/mixed/{b:Float}/{c}'> = {
      b: 1245,
      c: 'stringy-string',
    }

    expectType<string>(untypedFirst.b)
    expectType<boolean>(untypedFirst.c)

    expectType<number>(typedFirst.b)
    expectType<string>(typedFirst.c)
  })

  test('Params in the middle', () => {
    const paramsInTheMiddle: RouteParams<'/posts/{authorId:string}/{id:Int}/edit'> =
      {
        authorId: 'id:author',
        id: 10,
      }

    expectType<string>(paramsInTheMiddle.authorId)
    expectType<number>(paramsInTheMiddle.id)
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
