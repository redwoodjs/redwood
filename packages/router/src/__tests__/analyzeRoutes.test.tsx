import React, { isValidElement } from 'react'

import { Route, Router } from '../router'
import { analyzeRoutes } from '../util'

const FakePage = () => <h1>Fake Page</h1>

describe('Krisilyze: with homePage and Children', () => {
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
    expect(namePathMap).toEqual(
      expect.objectContaining({
        '/world': { name: 'world', path: '/world' },
        '/hello': { name: 'hello', path: '/hello' },
        '/recipe/{id}': { name: 'recipeById', path: '/recipe/{id}' },
        '/': { name: 'home', path: '/' },
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
