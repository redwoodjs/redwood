import React, { useEffect } from 'react'

import '@testing-library/jest-dom/extend-expect'
import { act, render, waitFor } from '@testing-library/react'

import { navigate, Route, Router } from '../'
import { Private, Set } from '../Set'

/**
 * 🎩 Headsup, in this test we're not mocking LazyComponent
 * because all the tests explicitly define the pages in the router.
 *
 * If you add tests with dynamic imports i.e. all the pages aren't explicitly supplied to the route
 * then you'll need to mock LazyComponent (see router.test.tsx)
 */

const HomePage = () => <h1>Home Page</h1>
const Page = () => <h1>Page</h1>

describe('Multiple nested private sets', () => {
  const DebugLayout = (props) => {
    return (
      <div>
        <p>Theme: {props.theme}</p>
        <p>Other Prop: {props.otherProp}</p>
        <p>Page Level: {props.level}</p>
        {props.children}
      </div>
    )
  }

  const TestRouter = () => (
    <Router>
      <Route path="/" page={HomePage} name="home" />
      <Set level="1" theme="blue" wrap={DebugLayout}>
        <Route path="/level1" page={Page} name="level1" />
        <Set level="2" theme="red" otherProp="bazinga">
          <Route path="/level2" page={Page} name="level2" />
          <Set level="3" theme="green">
            <Route path="/level3" page={Page} name="level3" />
          </Set>
        </Set>
      </Set>
    </Router>
  )

  test('level 1, matches expected props', async () => {
    const screen = render(<TestRouter />)

    act(() => navigate('/level1'))

    await waitFor(() => {
      expect(screen.queryByText(`Theme: blue`)).toBeInTheDocument()
      expect(screen.queryByText(`Page Level: 1`)).toBeInTheDocument()
    })
  })

  test('level 2, should override level 1', async () => {
    const screen = render(<TestRouter />)

    act(() => navigate('/level2'))

    await waitFor(() => {
      expect(screen.queryByText(`Theme: red`)).toBeInTheDocument()
      expect(screen.queryByText(`Other Prop: bazinga`)).toBeInTheDocument()
      expect(screen.queryByText(`Page Level: 2`)).toBeInTheDocument()
    })
  })

  test('level 3, should override level 1 & 2 and pass through other props', async () => {
    const screen = render(<TestRouter />)

    act(() => navigate('/level3'))

    await waitFor(() => {
      expect(screen.queryByText(`Theme: green`)).toBeInTheDocument()
      expect(screen.queryByText(`Other Prop: bazinga`)).toBeInTheDocument()
      expect(screen.queryByText(`Page Level: 3`)).toBeInTheDocument()
    })
  })
})

test('Nested sets should not cause a re-mount of wrap components', async () => {
  const layoutOneMount = jest.fn()
  const layoutTwoMount = jest.fn()

  const Layout1 = ({ children }) => {
    useEffect(() => {
      // Called on mount and re-mount of this layout
      layoutOneMount()
    }, [])

    return (
      <>
        <p>ONE</p>
        {children}
      </>
    )
  }

  const Layout2 = ({ children }) => {
    useEffect(() => {
      // Called on mount and re-mount of this layout
      layoutTwoMount()
    }, [])

    return (
      <>
        <p>TWO</p>
        {children}
      </>
    )
  }

  const NestedSetsWithWrap = () => (
    <Router>
      <Set wrap={Layout1}>
        <Route path="/" page={HomePage} name="home" />
        <Set wrap={Layout2}>
          <Route path="/posts/new" page={Page} name="newPost" />
          <Route path="/posts/{id:Int}/edit" page={Page} name="editPost" />
          <Route path="/posts/{id:Int}" page={Page} name="post" />
          <Route path="/posts" page={Page} name="posts" />
        </Set>
      </Set>
    </Router>
  )

  render(<NestedSetsWithWrap />)

  act(() => navigate('/'))
  act(() => navigate('/posts'))
  act(() => navigate('/'))
  act(() => navigate('/posts'))
  act(() => navigate('/'))

  // Layout 1 Should only be mounted once, because it's shared between the two sets
  expect(layoutOneMount).toHaveBeenCalledTimes(1)

  // Layout 2 should be mounted twice, because its used only in the posts routes
  expect(layoutTwoMount).toHaveBeenCalledTimes(2)
})

test('Changing the order of wrap components will cause a remount', async () => {
  // This test is making a point, if you use wraps this way, it'll cause remounts.
  // If you want e.g. Layout1 to not rerender, you should move it to a parent set
  const layoutOneMount = jest.fn()
  const layoutTwoMount = jest.fn()

  const Layout1 = () => {
    useEffect(() => {
      // Called on mount and re-mount of this layout
      layoutOneMount()
    }, [])

    return (
      <>
        <p>ONE</p>
      </>
    )
  }

  const Layout2 = () => {
    useEffect(() => {
      // Called on mount and re-mount of this layout
      layoutTwoMount()
    }, [])

    return (
      <>
        <p>TWO</p>
      </>
    )
  }

  const SameWrapsInDifferentOrder = () => (
    <Router>
      <Set wrap={[Layout1, Layout2]}>
        <Route path="/one" page={HomePage} name="home" />
      </Set>
      <Set wrap={[Layout2, Layout1]}>
        <Route path="/two" page={Page} name="posts" />
      </Set>
    </Router>
  )

  render(<SameWrapsInDifferentOrder />)

  act(() => navigate('/one'))
  act(() => navigate('/two'))
  act(() => navigate('/one'))
  act(() => navigate('/two'))

  // Layout 1 Should only be mounted once, because it's shared between the two sets
  expect(layoutOneMount).toHaveBeenCalledTimes(2)

  // Layout 2 should be mounted twice, because its used only in the posts routes
  expect(layoutTwoMount).toHaveBeenCalledTimes(2)
})

test('Sets nested in Private should not error out if no authenticated prop provided', () => {
  const Layout1 = ({ children }) => (
    <div>
      <p>Layou1</p>
      {children}
    </div>
  )

  const SetInSidePrivate = () => (
    <Router>
      <Route path="/" page={HomePage} name="home" />
      <Route path="/auth" page={() => 'Regular Auth'} name="auth" />
      <Route path="/adminAuth" page={() => 'Admin Auth'} name="adminAuth" />
      <Private unauthenticated="auth">
        <Route path="/two/{slug}" page={Page} name="two" />
        {/*  This set is private implicitly (nested under private),
         but should not need an unauthenticated prop */}
        <Set wrap={Layout1}>
          <Private roles="admin" unauthenticated="adminAuth">
            <Route path="/three" page={Page} name="three" />
          </Private>
        </Set>
      </Private>
      <Set wrap={Layout1} private>
        <Route path="/four" page={Page} name="four" />
      </Set>
    </Router>
  )

  render(<SetInSidePrivate />)

  expect(() => {
    act(() => navigate('/three'))
  }).not.toThrowError()

  // But still throws if you try to navigate to a private route without an unauthenticated prop
  // expect(() => {
  //   act(() => navigate('/four'))
  // }).toThrowError('You must specify an `unauthenticated` route')
})
