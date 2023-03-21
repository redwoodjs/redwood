import React from 'react'

import '@testing-library/jest-dom/extend-expect'

import { Route, analyzeRouterTree } from '../router'
import { Set } from '../Set'

// SETUP
const ChildA = () => <h1>ChildA</h1>
const ChildB = () => <h1>ChildB</h1>
const ChildC = () => <h1>ChildC</h1>
const ChildD = () => <h1>ChildD</h1>
const NotFound = () => <h1>404 Not Found</h1>

it('finds the active page in a flat router (matches first)', async () => {
  const Routes: React.ReactNode = [
    <Route path="/a" page={ChildA} name="childA" key=".0" />,
    <Route path="/b" page={ChildB} name="childB" key=".1" />,
  ]

  const { root, activeRoute, NotFoundPage, prerender } = analyzeRouterTree(
    Routes,
    '/a'
  )

  expect(root).toEqual(activeRoute)
  expect(activeRoute?.props.path).toEqual('/a')
  expect(activeRoute?.props.name).toEqual('childA')
  expect(activeRoute?.props.page).toEqual(ChildA)
  expect(NotFoundPage).toBeUndefined()
  expect(prerender).toBeFalsy()
})

it('finds the active page in a flat router (matches last)', async () => {
  const Routes: React.ReactNode = [
    <Route path="/a" page={ChildA} name="childA" key=".0" />,
    <Route path="/b" page={ChildB} name="childB" key=".1" />,
    <Route path="/c" page={ChildC} name="childC" key=".2" />,
  ]

  const { root, activeRoute, NotFoundPage, prerender } = analyzeRouterTree(
    Routes,
    '/c'
  )

  expect(root).toEqual(activeRoute)
  expect(activeRoute?.props.path).toEqual('/c')
  expect(activeRoute?.props.name).toEqual('childC')
  expect(activeRoute?.props.page).toEqual(ChildC)
  expect(NotFoundPage).toBeUndefined()
  expect(prerender).toBeFalsy()
})

it('finds the active page in a set', async () => {
  const Routes: React.ReactNode = [
    <Route path="/a" page={ChildA} name="childA" key=".0" />,
    <Set key=".1">
      <Route path="/b" page={ChildB} name="childB" key=".2" />
      <Route path="/c" page={ChildC} name="childC" prerender key=".3" />
    </Set>,
    <Route path="/d" page={ChildD} name="childD" key=".4" />,
  ]

  const { root, activeRoute, NotFoundPage, prerender } = analyzeRouterTree(
    Routes,
    '/c'
  )

  expect(root).not.toEqual(activeRoute)
  expect(activeRoute?.props.path).toEqual('/c')
  expect(activeRoute?.props.name).toEqual('childC')
  expect(activeRoute?.props.page).toEqual(ChildC)
  expect(NotFoundPage).toBeUndefined()
  expect(prerender).toBeTruthy()
})

describe('prerender', () => {
  it('finds prerender prop on root Route', async () => {
    const Routes: React.ReactNode = [
      <Route path="/a" page={ChildA} name="childA" prerender key=".0" />,
      <Set key=".1">
        <Route path="/b" page={ChildB} name="childB" key=".2" />
        <Route path="/c" page={ChildC} name="childC" prerender key=".3" />
      </Set>,
      <Route path="/d" page={ChildD} name="childD" key=".4" />,
    ]

    const { activeRoute, prerender } = analyzeRouterTree(Routes, '/a')

    expect(activeRoute?.props.name).toEqual('childA')
    expect(prerender).toBeTruthy()
  })

  it('finds prerender prop on Route in Set', async () => {
    const Routes: React.ReactNode = [
      <Route path="/a" page={ChildA} name="childA" key=".0" />,
      <Set key=".1">
        <Route path="/b" page={ChildB} name="childB" key=".2" />
        <Route path="/c" page={ChildC} name="childC" prerender key=".3" />
      </Set>,
      <Route path="/d" page={ChildD} name="childD" key=".4" />,
    ]

    const { activeRoute, prerender } = analyzeRouterTree(Routes, '/c')

    expect(activeRoute?.props.name).toEqual('childC')
    expect(prerender).toBeTruthy()
  })

  it('prerender when set is prerendered', async () => {
    const Routes: React.ReactNode = [
      <Route path="/a" page={ChildA} name="childA" key=".0" />,
      <Set prerender key=".1">
        <Route path="/b" page={ChildB} name="childB" key=".2" />
        <Route path="/c" page={ChildC} name="childC" key=".3" />
      </Set>,
      <Route path="/d" page={ChildD} name="childD" key=".4" />,
    ]

    const { activeRoute, prerender } = analyzeRouterTree(Routes, '/c')

    expect(activeRoute?.props.name).toEqual('childC')
    expect(prerender).toBeTruthy()
  })

  it('returns falsy prerender when non-active set is prerendered', async () => {
    const Routes: React.ReactNode = [
      <Route path="/a" page={ChildA} name="childA" key=".0" />,
      <Set prerender key=".1">
        <Route path="/b" page={ChildB} name="childB" key=".2" />
        <Route path="/c" page={ChildC} name="childC" key=".3" />
      </Set>,
      <Route path="/d" page={ChildD} name="childD" key=".4" />,
    ]

    const { activeRoute, prerender } = analyzeRouterTree(Routes, '/d')

    expect(activeRoute?.props.name).toEqual('childD')
    expect(prerender).toBeFalsy()
  })

  it('returns falsy prerender when another set is prerendered', async () => {
    const Routes: React.ReactNode = [
      <Route path="/a" page={ChildA} name="childA" key=".0" />,
      <Set prerender key=".1">
        <Route path="/b" page={ChildB} name="childB" key=".2" />
        <Route path="/c" page={ChildC} name="childC" key=".3" />
      </Set>,
      <Set key=".4">
        <Route path="/d" page={ChildD} name="childD" key=".5" />
      </Set>,
    ]

    const { activeRoute, prerender } = analyzeRouterTree(Routes, '/d')

    expect(activeRoute?.props.name).toEqual('childD')
    expect(prerender).toBeFalsy()
  })

  it('prerender when nested set is prerendered', async () => {
    const Routes: React.ReactNode = [
      <Route path="/a" page={ChildA} name="childA" key=".0" />,
      <Set key=".1">
        <Set prerender key=".2">
          <Route path="/b" page={ChildB} name="childB" key=".3" />
        </Set>
        <Route path="/c" page={ChildC} name="childC" key=".4" />
      </Set>,
      <Route path="/d" page={ChildD} name="childD" key=".5" />,
    ]

    const { activeRoute, prerender } = analyzeRouterTree(Routes, '/b')

    expect(activeRoute?.props.name).toEqual('childB')
    expect(prerender).toBeTruthy()
  })

  it('prerender when nested in prerendered set', async () => {
    const Routes: React.ReactNode = [
      <Route path="/a" page={ChildA} name="childA" key=".0" />,
      <Set prerender key=".1">
        <Set key=".2">
          <Route path="/b" page={ChildB} name="childB" key=".3" />
        </Set>
        <Route path="/c" page={ChildC} name="childC" key=".4" />
      </Set>,
      <Route path="/d" page={ChildD} name="childD" key=".5" />,
    ]

    const { activeRoute, prerender } = analyzeRouterTree(Routes, '/b')

    expect(activeRoute?.props.name).toEqual('childB')
    expect(prerender).toBeTruthy()
  })

  it('returns falsy prerender when adjacent nested set is prerendered', async () => {
    const Routes: React.ReactNode = [
      <Route path="/a" page={ChildA} name="childA" key=".0" />,
      <Set key=".1">
        <Set prerender key=".2">
          <Route path="/b" page={ChildB} name="childB" key=".3" />
        </Set>
        <Route path="/c" page={ChildC} name="childC" key=".4" />
      </Set>,
      <Route path="/d" page={ChildD} name="childD" key=".5" />,
    ]

    const { activeRoute, prerender } = analyzeRouterTree(Routes, '/c')

    expect(activeRoute?.props.name).toEqual('childC')
    expect(prerender).toBeFalsy()
  })

  it('supports setting prerender to true', () => {
    const Routes: React.ReactNode = [
      <Route path="/a" page={ChildA} name="childA" prerender={true} key=".0" />,
      <Set key=".1">
        <Route path="/b" page={ChildB} name="childB" key=".2" />
        <Route path="/c" page={ChildC} name="childC" prerender key=".3" />
      </Set>,
      <Route path="/d" page={ChildD} name="childD" key=".4" />,
    ]

    const { activeRoute, prerender } = analyzeRouterTree(Routes, '/a')

    expect(activeRoute?.props.name).toEqual('childA')
    expect(prerender).toBeTruthy()
  })

  it('supports setting prerender to false', () => {
    const Routes: React.ReactNode = [
      <Route
        path="/a"
        page={ChildA}
        name="childA"
        prerender={false}
        key=".0"
      />,
      <Set key=".1">
        <Route path="/b" page={ChildB} name="childB" key=".2" />
        <Route path="/c" page={ChildC} name="childC" prerender key=".3" />
      </Set>,
      <Route path="/d" page={ChildD} name="childD" key=".4" />,
    ]

    const { activeRoute, prerender } = analyzeRouterTree(Routes, '/a')

    expect(activeRoute?.props.name).toEqual('childA')
    expect(prerender).toBeFalsy()
  })

  it('supports overriding prerender in set by setting it on the route (false on set)', () => {
    const Routes: React.ReactNode = [
      <Route path="/a" page={ChildA} name="childA" key=".0" />,
      <Set prerender={false} key=".1">
        <Route path="/b" page={ChildB} name="childB" key=".2" />
        <Route path="/c" page={ChildC} name="childC" prerender key=".3" />
      </Set>,
      <Route path="/d" page={ChildD} name="childD" key=".4" />,
    ]

    const { activeRoute, prerender } = analyzeRouterTree(Routes, '/c')

    expect(activeRoute?.props.name).toEqual('childC')
    expect(prerender).toBeTruthy()
  })

  it('supports overriding prerender in set by setting it on the route (false on route)', () => {
    const Routes: React.ReactNode = [
      <Route path="/a" page={ChildA} name="childA" key=".0" />,
      <Set prerender key=".1">
        <Route path="/b" page={ChildB} name="childB" key=".2" />
        <Route
          path="/c"
          page={ChildC}
          name="childC"
          prerender={false}
          key=".3"
        />
      </Set>,
      <Route path="/d" page={ChildD} name="childD" key=".4" />,
    ]

    const { activeRoute: activeRouteB, prerender: prerenderB } =
      analyzeRouterTree(Routes, '/b')
    const { activeRoute: activeRouteC, prerender: prerenderC } =
      analyzeRouterTree(Routes, '/c')

    expect(activeRouteB?.props.name).toEqual('childB')
    expect(prerenderB).toBeTruthy()

    expect(activeRouteC?.props.name).toEqual('childC')
    expect(prerenderC).toBeFalsy()
  })

  it('supports overriding prerender in set by setting it on a nested set (making it false)', () => {
    const Routes: React.ReactNode = [
      <Route path="/a" page={ChildA} name="childA" key=".0" />,
      <Set prerender key=".1">
        <Route path="/b" page={ChildB} name="childB" key=".2" />
        <Set prerender={false} key=".3">
          <Route path="/c" page={ChildC} name="childC" key=".4" />
        </Set>
      </Set>,
      <Route path="/d" page={ChildD} name="childD" key=".5" />,
    ]

    const { activeRoute: activeRouteB, prerender: prerenderB } =
      analyzeRouterTree(Routes, '/b')
    const { activeRoute: activeRouteC, prerender: prerenderC } =
      analyzeRouterTree(Routes, '/c')

    expect(activeRouteB?.props.name).toEqual('childB')
    expect(prerenderB).toBeTruthy()

    expect(activeRouteC?.props.name).toEqual('childC')
    expect(prerenderC).toBeFalsy()
  })

  it('supports overriding prerender in set by setting it on a nested set (making it true)', () => {
    const Routes: React.ReactNode = [
      <Route path="/a" page={ChildA} name="childA" key=".0" />,
      <Set prerender={false} key=".1">
        <Route path="/b" page={ChildB} name="childB" key=".2" />
        <Set prerender key=".3">
          <Route path="/c" page={ChildC} name="childC" key=".4" />
        </Set>
      </Set>,
      <Route path="/d" page={ChildD} name="childD" key=".5" />,
    ]

    const { activeRoute: activeRouteB, prerender: prerenderB } =
      analyzeRouterTree(Routes, '/b')
    const { activeRoute: activeRouteC, prerender: prerenderC } =
      analyzeRouterTree(Routes, '/c')

    expect(activeRouteB?.props.name).toEqual('childB')
    expect(prerenderB).toBeFalsy()

    expect(activeRouteC?.props.name).toEqual('childC')
    expect(prerenderC).toBeTruthy()
  })

  it('supports prerendering NotFoundPage', () => {
    const Routes: React.ReactNode = [
      <Route notfound page={NotFound} prerender key=".0" />,
      <Route path="/a" page={ChildA} name="childA" key=".1" />,
      <Route path="/b" page={ChildB} name="childB" key=".2" />,
    ]

    const { activeRoute, prerender, NotFoundPage } = analyzeRouterTree(
      Routes,
      '/c'
    )

    expect(activeRoute?.props.name).toBeUndefined()
    expect(prerender).toBeTruthy()
    expect(NotFoundPage).toEqual(NotFound)
  })

  it('does not interfere with other routes to set prerender on notfound', () => {
    const Routes: React.ReactNode = [
      <Route notfound page={NotFound} prerender key=".0" />,
      <Route path="/a" page={ChildA} name="childA" key=".1" />,
      <Route path="/b" page={ChildB} name="childB" key=".2" />,
    ]

    const { activeRoute, prerender, NotFoundPage } = analyzeRouterTree(
      Routes,
      '/a'
    )

    expect(activeRoute?.props.name).toEqual('childA')
    expect(prerender).toBeFalsy()
    expect(NotFoundPage).toEqual(NotFound)
  })
})
