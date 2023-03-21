import React, { isValidElement } from 'react'

import { Route, Router } from '../router'
import { Set } from '../Set'
import { analyzeRoutes } from '../util'

const FakePage = () => <h1>Fake Page</h1>

describe('AnalyzeRoutes: with homePage and Children', () => {
  const CheckRoutes = (
    <Router>
      <Route path="/hello" name="hello" page={FakePage} />
      <Route path="/world" name="world" page={FakePage} />
      <Route path="/recipe/{id}" name="recipeById" page={FakePage} />
      <Route path="/" name="home" page={FakePage} />
      <Route notfound page={FakePage} />
    </Router>
  )

  const { namePathMap, namedRoutesMap, hasHomeRoute, NotFoundPage } =
    analyzeRoutes(CheckRoutes.props.children, {
      currentPathName: '/',
    })
  test('Should return namePathMap and hasHomeRoute correctly', () => {
    expect(Object.keys(namePathMap)).toEqual([
      'hello',
      'world',
      'recipeById',
      'home',
    ])

    expect(namePathMap.hello).toEqual(
      expect.objectContaining({
        name: 'hello',
        page: FakePage,
        path: '/hello',
      })
    )

    expect(namePathMap.world).toEqual(
      expect.objectContaining({
        name: 'world',
        page: FakePage,
        path: '/world',
      })
    )

    expect(namePathMap.recipeById).toEqual(
      expect.objectContaining({
        name: 'recipeById',
        page: FakePage,
        path: '/recipe/{id}',
      })
    )

    expect(hasHomeRoute).toBe(true)
  })

  test('Should return namedRoutesMap correctly', () => {
    expect(namedRoutesMap.home()).toEqual('/')
    expect(namedRoutesMap.world()).toEqual('/world')
    expect(namedRoutesMap.hello({ queryGuy: 1 })).toEqual('/hello?queryGuy=1')
    expect(namedRoutesMap.recipeById({ id: 55 })).toEqual('/recipe/55')
  })

  test('Should return the notFoundPage', () => {
    expect(NotFoundPage).toBeDefined()

    // @ts-expect-error We know its a valid element
    // We know that FakePage is an React component, and not a Spec
    expect(isValidElement(NotFoundPage())).toBe(true)
  })

  test('Should return the active Route by name', () => {
    const { activeRouteName } = analyzeRoutes(CheckRoutes.props.children, {
      currentPathName: '/recipe/512512',
    })
    expect(activeRouteName).toBeDefined()
    expect(activeRouteName).toBe('recipeById')
  })

  test('No home Route', () => {
    const CheckRoutes = (
      <Router>
        <Route path="/iGots" name="iGots" page={FakePage} />
        <Route path="/noHome" name="noHome" page={FakePage} />
      </Router>
    )

    const { namePathMap, namedRoutesMap, hasHomeRoute } = analyzeRoutes(
      CheckRoutes.props.children,
      {
        currentPathName: '/',
      }
    )

    expect(Object.keys(namedRoutesMap).length).toEqual(2)
    expect(Object.keys(namePathMap).length).toEqual(2)
    expect(hasHomeRoute).toBe(false)
  })

  test('Creates setWrapper map', () => {
    const WrapperX = ({ children }) => (
      <>
        <h1>WrapperA</h1>
        {children}
      </>
    )

    const WrapperY = ({ children }) => (
      <>
        <h1>WrapperY</h1>
        {children}
      </>
    )

    const Simple = (
      <Router>
        <Set wrap={[WrapperX]} id="set-one" passThruProp="bazinga">
          <Route path="/a" name="routeA" page={FakePage} />
          <Set wrap={[WrapperY]} id="set-two" theme="blue">
            <Route name="routeB" path="/b" page={FakePage} />
            <Route name="routeC" path="/c" page={FakePage} />
          </Set>
        </Set>
      </Router>
    )

    const { namePathMap } = analyzeRoutes(Simple.props.children, {
      currentPathName: '/',
    })

    expect(namePathMap.routeA).toEqual(
      expect.objectContaining({
        redirect: null,
        name: 'routeA',
        path: '/a',
        whileLoadingPage: undefined,
        wrappers: [WrapperX],
        // Props passed through from set
        setProps: {
          id: 'set-one',
          passThruProp: 'bazinga',
        },
      })
    )

    expect(namePathMap.routeB).toEqual(
      expect.objectContaining({
        redirect: null,
        name: 'routeB',
        path: '/b',
        whileLoadingPage: undefined,
        wrappers: [WrapperX, WrapperY], // both wrappers
        setProps: {
          id: 'set-two',
          theme: 'blue',
          passThruProp: 'bazinga', // from the first set
        },
      })
    )

    expect(namePathMap.routeC).toEqual(
      expect.objectContaining({
        redirect: null,
        name: 'routeC',
        path: '/c',
        whileLoadingPage: undefined,
        wrappers: [WrapperX, WrapperY], // both wrappers
        setProps: {
          id: 'set-two',
          theme: 'blue',
          passThruProp: 'bazinga', // from the first set
        },
      })
    )
  })
})
