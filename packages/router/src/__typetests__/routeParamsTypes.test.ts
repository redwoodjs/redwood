// import { A } from 'ts-toolbelt'
import { expectType } from 'tsd-lite'

import type { RouteParams, ParamType } from '@redwoodjs/router'

describe('RouteParams<>', () => {
  test('Single parameters', () => {
    const singleParameters: RouteParams<'bazinga/{id:Int}'> = {
      id: 1,
    }

    expectType<{ id: number }>(singleParameters)
  })

  test('Route string with no types defaults to string', () => {
    const singleParameters: RouteParams<'/blog/{year}/{month}/{day}/{slug}'> = {
      year: '2020',
      month: '01',
      day: '01',
      slug: 'hello-world',
    }

    expectType<{ year: string; month: string; day: string; slug: string }>(
      singleParameters
    )
  })

  test('Custom param types', () => {
    const customParams: RouteParams<'/post/{name:slug}'> = {
      name: 'hello-world-slug',
    }

    expectType<{ name: string }>(customParams)
  })

  // test('Glob route params', () => {
  //   const globRoutes: RouteParams<'/from/{fromDate...}/to/{toDate...}'> = {
  //     fromDate: '2021/11/03',
  //     toDate: '2021/11/17',
  //   }

  //   expectType<{ fromDate: string; toDate: string }>(globRoutes)
  // })

  test('Mixed typed and untyped params', () => {
    const untypedFirst: RouteParams<'/mixed/{b}/{c:Boolean}'> = {
      b: 'bazinga',
      c: true,
    }

    const typedFirst: RouteParams<'/mixed/{b:Float}/{c}'> = {
      b: 1245,
      c: 'stringy-string',
    }

    expectType<{ b: string; c: boolean }>(untypedFirst)
    expectType<{ b: number; c: string }>(typedFirst)
  })

  // test('Params in the middle', () => {
  //   const paramsInTheMiddle: RouteParams<'/posts/{authorId:string}/{id:Int}/edit'> =
  //     {
  //       authorId: 'id:author',
  //       id: 10,
  //     }

  //   //     A.Compute<{ authorId: string; id: number } & Record<string | number, any>>

  //   expectType<{ authorId: string; id: number }>(paramsInTheMiddle)
  // })
})

describe('ParamType<>', () => {
  test('Float', () => {
    const float: ParamType<'Float'> = 1

    expectType<number>(float)
  })

  test('Boolean', () => {
    // Use a function because assigning a boolean narrows the type automatically
    const returnBool: (a?: any) => ParamType<'Boolean'> = (a) => {
      return !!a
    }

    expectType<boolean>(returnBool())
  })

  test('Int', () => {
    const myInt: ParamType<'Int'> = 1

    expectType<number>(myInt)
  })

  test('String', () => {
    const myString: ParamType<'String'> = 'bazinga'

    expectType<string>(myString)
  })
})
