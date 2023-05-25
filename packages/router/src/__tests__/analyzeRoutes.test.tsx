import React, { isValidElement } from 'react'

import { Route, Router } from '../router'
import { Private, Set } from '../Set'
import { analyzeRoutes } from '../util'

const FakePage = () => <h1>Fake Page</h1>

const FakeLayout1 = ({ children }) => <div className="layout1">{children}</div>
const FakeLayout2 = ({ children }) => <div className="layout2">{children}</div>
const FakeLayout3 = ({ children }) => <div className="layout2">{children}</div>

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

  const { pathRouteMap, namedRoutesMap, hasHomeRoute, NotFoundPage } =
    analyzeRoutes(CheckRoutes.props.children, {
      currentPathName: '/',
    })

  test('Should return namePathMap and hasHomeRoute correctly', () => {
    expect(Object.keys(pathRouteMap)).toEqual([
      '/hello',
      '/world',
      '/recipe/{id}',
      '/',
    ])

    expect(pathRouteMap['/hello']).toEqual(
      expect.objectContaining({
        name: 'hello',
        page: FakePage,
        path: '/hello',
      })
    )

    expect(pathRouteMap['/world']).toEqual(
      expect.objectContaining({
        name: 'world',
        page: FakePage,
        path: '/world',
      })
    )

    // @NOTE the path here is the path DEFINITION, not that actual path
    expect(pathRouteMap['/recipe/{id}']).toEqual(
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
    const { activeRoutePath } = analyzeRoutes(CheckRoutes.props.children, {
      currentPathName: '/recipe/512512',
    })
    expect(activeRoutePath).toBeDefined()
    expect(activeRoutePath).toBe('/recipe/{id}')
  })

  test('No home Route', () => {
    const CheckRoutes = (
      <Router>
        <Route path="/iGots" name="iGots" page={FakePage} />
        <Route path="/noHome" name="noHome" page={FakePage} />
      </Router>
    )

    const { pathRouteMap, namedRoutesMap, hasHomeRoute } = analyzeRoutes(
      CheckRoutes.props.children,
      {
        currentPathName: '/',
      }
    )

    expect(Object.keys(namedRoutesMap).length).toEqual(2)
    expect(Object.keys(pathRouteMap).length).toEqual(2)
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

    const { pathRouteMap } = analyzeRoutes(Simple.props.children, {
      currentPathName: '/',
    })

    expect(pathRouteMap['/a']).toEqual(
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

    expect(pathRouteMap['/b']).toEqual(
      expect.objectContaining({
        redirect: null,
        name: 'routeB',
        path: '/b',
        whileLoadingPage: undefined,
        wrappers: [WrapperX, WrapperY], // both wrappers
        setProps: {
          id: 'set-two', // the id gets overwritten by the second Set
          theme: 'blue',
          passThruProp: 'bazinga', // from the first set
        },
      })
    )

    expect(pathRouteMap['/c']).toEqual(
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

  test('Creates setWrapper map with nested sets', () => {
    const KrismasTree = (
      <Private unauthenticated="signIn">
        <Route path="/dashboard" page={FakePage} name="dashboard" />
        <Set wrap={[FakeLayout1, FakeLayout2]}>
          <Route
            path="/{org}/settings/general"
            page={FakePage}
            name="settingsGeneral"
          />
          <Route
            path="/{org}/settings/api"
            page={FakePage}
            name="settingsAPI"
          />
          <Route
            path="/{org}/settings/twitter"
            page={FakePage}
            name="settingsTwitter"
          />
        </Set>
        <Set wrap={FakeLayout1}>
          <Set wrap={[FakeLayout2, FakeLayout3]}>
            <Route path="/{org}/series" page={FakePage} name="series" />
            <Route path="/{org}" page={FakePage} name="organization" />
            <Route
              path="/account/reset-password"
              page={FakePage}
              name="resetPassword"
              prerender
            />
          </Set>
          <Set wrap={FakeLayout2}>
            <Route
              path="/{org}/events/{eventCode}/edit"
              page={FakePage}
              name="editEvent"
            />
            <Route
              path="/{org}/events/{eventCode}/players"
              page={FakePage}
              name="eventPlayers"
            />
            <Route
              path="/{org}/events/{eventCode}/analytics"
              page={FakePage}
              name="eventAnalytics"
            />
            <Route
              path="/{org}/events/{eventCode}/scores"
              page={FakePage}
              name="eventScores"
            />
            <Route
              path="/{org}/events/{eventCode}/tweets"
              page={FakePage}
              name="eventTweets"
            />
          </Set>
        </Set>
      </Private>
    )

    const { pathRouteMap } = analyzeRoutes(KrismasTree.props.children, {
      currentPathName: '/bazingaOrg/events/kittenCode/edit',
    })

    expect(Object.keys(pathRouteMap).length).toBe(12)

    // @TODO finish writing the expectations
  })

  test('Handles Private', () => {
    const Routes = (
      <Router>
        <Route path="/" name="home" page={FakePage} />
        <Private unauthenticated="home">
          <Route path="/private" name="privateRoute" page={FakePage} />
        </Private>
      </Router>
    )

    const { pathRouteMap } = analyzeRoutes(Routes.props.children, {
      currentPathName: '/',
    })

    expect(pathRouteMap['/private']).toStrictEqual({
      redirect: null,
      name: 'privateRoute',
      path: '/private',
      whileLoadingPage: undefined,
      page: FakePage,
      wrappers: [],
      setProps: {
        private: true,
        unauthenticated: 'home',
      },
    })
  })

  test('Redirect routes analysis', () => {
    const RedirectedRoutes = (
      <Router>
        <Route path="/simple" redirect="/rdSimple" name="simple" />
        <Route
          path="/rdSimple"
          name="rdSimple"
          page={() => <h1>Redirected page</h1>}
        />
      </Router>
    )

    const { pathRouteMap, namedRoutesMap } = analyzeRoutes(
      RedirectedRoutes.props.children,
      {
        currentPathName: '/simple',
      }
    )

    expect(pathRouteMap['/simple'].redirect).toBe('/rdSimple')
    expect(pathRouteMap['/rdSimple'].redirect).toBeFalsy()

    // @TODO true for now, but we may not allow names on a redirect route
    expect(Object.keys(namedRoutesMap).length).toBe(2)
    expect(namedRoutesMap.simple()).toBe('/simple')
    expect(namedRoutesMap.rdSimple()).toBe('/rdSimple')
  })
})
