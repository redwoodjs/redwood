import { expectType } from 'tsd-lite'

import { RouteParams } from '@redwoodjs/router'

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

test('Glob route params', () => {
  const globRoutes: RouteParams<'/from/{fromDate...}/to/{toDate...}'> = {
    fromDate: '2021/11/03',
    toDate: '2021/11/17',
  }

  expectType<{ fromDate: string; toDate: string }>(globRoutes)
})
