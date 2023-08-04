let mockDelay = 0
jest.mock('../util', () => {
  const actualUtil = jest.requireActual('../util')
  const { lazy } = jest.requireActual('react')

  return {
    ...actualUtil,
    normalizePage: (specOrPage: Spec | React.ComponentType<unknown>) => ({
      name: specOrPage.name,
      prerenderLoader: () => ({ default: specOrPage }),
      LazyComponent: lazy(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ default: specOrPage }), mockDelay)
          )
      ),
    }),
  }
})

import React, { useEffect, useState } from 'react'

import {
  render,
  waitFor,
  act,
  fireEvent,
  configure,
} from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

import { AuthContextInterface } from '@redwoodjs/auth'

import {
  Router,
  Route,
  Private,
  Redirect,
  routes as generatedRoutes,
  Link,
  navigate,
  back,
  usePageLoadingContext,
} from '../'
import { useLocation } from '../location'
import { useParams } from '../params'
import { Set } from '../Set'
import type { Spec, GeneratedRoutesMap } from '../util'

/** running into intermittent test timeout behavior in https://github.com/redwoodjs/redwood/pull/4992
 attempting to work around by bumping the default timeout of 5000 */
const timeoutForFlakeyAsyncTests = 8000

type UnknownAuthContextInterface = AuthContextInterface<
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown
>

// The types are generated in the user's project
const routes = generatedRoutes as GeneratedRoutesMap

function createDummyAuthContextValues(
  partial: Partial<UnknownAuthContextInterface>
) {
  const authContextValues: UnknownAuthContextInterface = {
    loading: true,
    isAuthenticated: false,
    userMetadata: null,
    currentUser: null,
    logIn: async () => null,
    logOut: async () => null,
    signUp: async () => null,
    getToken: async () => null,
    getCurrentUser: async () => null,
    hasRole: () => false,
    reauthenticate: async () => {},
    client: null,
    type: 'custom',
    hasError: false,
    forgotPassword: async () => null,
    resetPassword: async () => null,
    validateResetToken: async () => null,
  }

  return { ...authContextValues, ...partial }
}

interface MockAuth {
  isAuthenticated?: boolean
  loading?: boolean
  hasRole?: boolean
  loadingTimeMs?: number
}

const mockUseAuth =
  (
    {
      isAuthenticated = false,
      loading = false,
      hasRole = false,
      loadingTimeMs,
    }: MockAuth = {
      isAuthenticated: false,
      loading: false,
      hasRole: false,
    }
  ) =>
  () => {
    const [authLoading, setAuthLoading] = useState(loading)
    const [authIsAuthenticated, setAuthIsAuthenticated] =
      useState(isAuthenticated)

    useEffect(() => {
      let timer: NodeJS.Timeout | undefined
      if (loadingTimeMs) {
        timer = setTimeout(() => {
          setAuthLoading(false)
          setAuthIsAuthenticated(true)
        }, loadingTimeMs)
      }
      return () => {
        if (timer) {
          clearTimeout(timer)
        }
      }
    }, [])

    return createDummyAuthContextValues({
      loading: authLoading,
      isAuthenticated: authIsAuthenticated,
      hasRole: () => hasRole,
    })
  }

const HomePage = () => <h1>Home Page</h1>
const LoginPage = () => <h1>Login Page</h1>
const AboutPage = () => <h1>About Page</h1>
const PrivatePage = () => <h1>Private Page</h1>
const RedirectPage = () => <Redirect to="/about" />
const NotFoundPage = () => <h1>404</h1>
const ParamPage = ({ value, q }: { value: string; q: string }) => {
  const params = useParams()

  return (
    <div>
      <p>param {`${value}${q}`}</p>
      <p>hookparams {`${params.value}?${params.q}`}</p>
    </div>
  )
}

configure({
  asyncUtilTimeout: 5_000,
})

beforeEach(() => {
  window.history.pushState({}, '', '/')
  Object.keys(routes).forEach((key) => delete routes[key])
})

describe('slow imports', () => {
  const HomePagePlaceholder = () => <>HomePagePlaceholder</>
  const AboutPagePlaceholder = () => <>AboutPagePlaceholder</>
  const ParamPagePlaceholder = () => <>ParamPagePlaceholder</>
  const RedirectPagePlaceholder = () => <>RedirectPagePlaceholder</>
  const PrivatePagePlaceholder = () => <>PrivatePagePlaceholder</>
  const LoginPagePlaceholder = () => <>LoginPagePlaceholder</>

  const LocationPage = () => {
    const location = useLocation()

    return (
      <>
        <h1>Location Page</h1>
        <p>{location.pathname}</p>
      </>
    )
  }

  const PageLoadingContextLayout = ({ children }) => {
    const { loading } = usePageLoadingContext()

    return (
      <>
        <h1>Page Loading Context Layout</h1>
        {loading && <p>loading in layout...</p>}
        {!loading && <p>done loading in layout</p>}
        {children}
      </>
    )
  }

  const PageLoadingContextPage = () => {
    const { loading } = usePageLoadingContext()

    return (
      <>
        <h1>Page Loading Context Page</h1>
        {loading && <p>loading in page...</p>}
        {!loading && <p>done loading in page</p>}
      </>
    )
  }

  const TestRouter = ({
    authenticated,
    hasRole,
  }: {
    authenticated?: boolean
    hasRole?: boolean
  }) => (
    <Router
      useAuth={mockUseAuth({ isAuthenticated: authenticated, hasRole })}
      pageLoadingDelay={0}
    >
      <Route
        path="/"
        page={HomePage}
        name="home"
        whileLoadingPage={HomePagePlaceholder}
      />
      <Route
        path="/about"
        page={AboutPage}
        name="about"
        whileLoadingPage={AboutPagePlaceholder}
      />
      <Route
        path="/redirect"
        page={RedirectPage}
        name="redirect"
        whileLoadingPage={RedirectPagePlaceholder}
      />
      <Route path="/redirect2/{value}" redirect="/param-test/{value}" />
      <Route
        path="/login"
        page={LoginPage}
        name="login"
        whileLoadingPage={LoginPagePlaceholder}
      />
      <Private unauthenticated="login">
        <Route
          path="/private"
          page={PrivatePage}
          name="private"
          whileLoadingPage={PrivatePagePlaceholder}
        />
      </Private>
      <Private unauthenticated="login" roles="admin">
        <Route
          path="/private_with_role"
          page={PrivatePage}
          name="private_with_role"
          whileLoadingPage={PrivatePagePlaceholder}
        />
      </Private>
      <Private unauthenticated="login" roles={['admin', 'moderator']}>
        <Route
          path="/private_with_several_roles"
          page={PrivatePage}
          name="private_with_several_roles"
          whileLoadingPage={PrivatePagePlaceholder}
        />
      </Private>
      <Route
        path="/param-test/{value}"
        page={ParamPage}
        name="params"
        whileLoadingPage={ParamPagePlaceholder}
      />
      <Route path="/location" page={LocationPage} name="home" />
      <Set wrap={PageLoadingContextLayout}>
        <Route
          path="/page-loading-context"
          page={PageLoadingContextPage}
          name="pageLoadingContext"
        />
      </Set>
      <Route notfound page={NotFoundPage} />
    </Router>
  )

  beforeEach(() => {
    // One of the tests modifies this, so we need to reset it before each test
    mockDelay = 400
  })

  afterEach(() => {
    mockDelay = 0
  })

  test(
    'Basic home page',
    async () => {
      const screen = render(<TestRouter />)

      await waitFor(() => screen.getByText('HomePagePlaceholder'))
      await waitFor(() => screen.getByText('Home Page'))
    },
    timeoutForFlakeyAsyncTests
  )

  test(
    'Navigation',
    async () => {
      const screen = render(<TestRouter />)
      // First we should render an empty page while waiting for pageLoadDelay to
      // pass

      //TODO: implement pageLoadDelay potentially don't need with preloading features
      // expect(screen.container).toBeEmptyDOMElement()

      // Then we should render whileLoadingPage
      await waitFor(() => screen.getByText('HomePagePlaceholder'))

      // Finally we should render the actual page
      await waitFor(() => screen.getByText('Home Page'))

      act(() => navigate('/about'))

      // Now after navigating we should keep rendering the previous page until
      // the new page has loaded, or until pageLoadDelay has passed. This
      // ensures we don't show a "white flash", i.e. render an empty page, while
      // navigating the page
      expect(screen.container).not.toBeEmptyDOMElement()
      await waitFor(() => screen.getByText('Home Page'))
      expect(screen.container).not.toBeEmptyDOMElement()

      // As for HomePage we first render the placeholder...
      await waitFor(() => screen.getByText('AboutPagePlaceholder'))
      // ...and then the actual page
      await waitFor(() => screen.getByText('About Page'))
    },
    timeoutForFlakeyAsyncTests
  )

  test(
    'Redirect page',
    async () => {
      act(() => navigate('/redirect'))
      const screen = render(<TestRouter />)
      await waitFor(() => screen.getByText('RedirectPagePlaceholder'))
      await waitFor(() => screen.getByText('About Page'))
    },
    timeoutForFlakeyAsyncTests
  )

  test(
    'Redirect route',
    async () => {
      const screen = render(<TestRouter />)
      await waitFor(() => screen.getByText('HomePagePlaceholder'))
      await waitFor(() => screen.getByText('Home Page'))
      act(() => navigate('/redirect2/redirected?q=cue'))
      await waitFor(() => screen.getByText('ParamPagePlaceholder'))
      await waitFor(() => screen.getByText('param redirectedcue'))
    },
    timeoutForFlakeyAsyncTests
  )

  test(
    'Private page when not authenticated',
    async () => {
      act(() => navigate('/private'))
      const screen = render(<TestRouter />)
      await waitFor(() => {
        expect(
          screen.queryByText('PrivatePagePlaceholder')
        ).not.toBeInTheDocument()
        expect(screen.queryByText('Private Page')).not.toBeInTheDocument()
        expect(screen.queryByText('LoginPagePlaceholder')).toBeInTheDocument()
      })
      await waitFor(() => screen.getByText('Login Page'))
    },
    timeoutForFlakeyAsyncTests
  )

  test(
    'Private page when authenticated',
    async () => {
      act(() => navigate('/private'))
      const screen = render(<TestRouter authenticated={true} />)

      await waitFor(() => screen.getByText('PrivatePagePlaceholder'))
      await waitFor(() => screen.getByText('Private Page'))
      await waitFor(() => {
        expect(screen.queryByText('Login Page')).not.toBeInTheDocument()
      })
    },
    timeoutForFlakeyAsyncTests
  )

  test(
    'Private page when authenticated but does not have the role',
    async () => {
      act(() => navigate('/private_with_role'))
      const screen = render(<TestRouter authenticated={true} hasRole={false} />)

      await waitFor(() => {
        expect(
          screen.queryByText('PrivatePagePlaceholder')
        ).not.toBeInTheDocument()
        expect(screen.queryByText('Private Page')).not.toBeInTheDocument()
        expect(screen.queryByText('LoginPagePlaceholder')).toBeInTheDocument()
      })
      await waitFor(() => screen.getByText('Login Page'))
    },
    timeoutForFlakeyAsyncTests
  )

  test(
    'Private page when authenticated but does have the role',
    async () => {
      act(() => navigate('/private_with_role'))
      const screen = render(<TestRouter authenticated={true} hasRole={true} />)

      await waitFor(() => {
        expect(
          screen.queryByText('PrivatePagePlaceholder')
        ).not.toBeInTheDocument()
        expect(screen.queryByText('Private Page')).toBeInTheDocument()
      })
    },
    timeoutForFlakeyAsyncTests
  )

  test(
    'useLocation',
    async () => {
      act(() => navigate('/location'))
      const screen = render(<TestRouter />)
      await waitFor(() => screen.getByText('Location Page'))
      await waitFor(() => screen.getByText('/location'))

      act(() => navigate('/about'))
      // After navigating we will keep rendering the previous page for 100 ms,
      // (which is our configured delay) before rendering the "whileLoading"
      // page.
      // TODO: We don't currently implement page loading delay anymore
      // await waitFor(() => screen.getByText('Location Page'))

      // And then we'll render the placeholder...
      await waitFor(() => screen.getByText('AboutPagePlaceholder'))
      // ...followed by the actual page
      await waitFor(() => screen.getByText('About Page'))
    },
    timeoutForFlakeyAsyncTests
  )

  test(
    'path params should never be empty',
    async () => {
      const PathParamPage = ({ value }) => {
        expect(value).not.toBeFalsy()
        return <p>{value}</p>
      }

      const TestRouter = () => (
        <Router pageLoadingDelay={100}>
          <Route
            path="/about"
            page={AboutPage}
            name="about"
            whileLoadingPage={AboutPagePlaceholder}
          />
          <Route
            path="/path-param-test/{value}"
            page={PathParamPage}
            name="params"
            whileLoadingPage={ParamPagePlaceholder}
          />
        </Router>
      )

      act(() => navigate('/path-param-test/test_value'))
      const screen = render(<TestRouter />)

      // First we render the path parameter value "test_value"
      await waitFor(() => screen.getByText('test_value'))

      act(() => navigate('/about'))
      // After navigating we should keep displaying the old path value...
      await waitFor(() => screen.getByText('test_value'))
      // ...until we switch over to render the about page loading component...
      await waitFor(() => screen.getByText('AboutPagePlaceholder'))
      // ...followed by the actual page
      await waitFor(() => screen.getByText('About Page'))
    },
    timeoutForFlakeyAsyncTests
  )

  test(
    'usePageLoadingContext',
    async () => {
      // We want to show a loading indicator if loading pages is taking a long
      // time. But at the same time we don't want to show it right away, because
      // then there'll be a flash of the loading indicator on every page load.
      // So we have a `pageLoadingDelay` delay to control how long it waits
      // before showing the loading state (default is 1000 ms).
      //
      // RW lazy loads pages by default, that's why it could potentially take a
      // while to load a page. But during tests we don't do that. So we have to
      // fake a delay. That's what `mockDelay` is for. `mockDelay` has to be
      // longer than `pageLoadingDelay`, but not too long so the test takes
      // longer than it has to, and also not too long so the entire test times
      // out.

      // Had to increase this to make the test pass on Windows
      mockDelay = 700

      // <TestRouter> sets pageLoadingDelay={200}. (Default is 1000.)
      const screen = render(<TestRouter />)

      act(() => navigate('/page-loading-context'))

      // 'Page Loading Context Layout' should always be shown
      await waitFor(() => screen.getByText('Page Loading Context Layout'))

      // 'loading in layout...' should only be shown while the page is loading.
      // So in this case, for the first 700ms
      await waitFor(() => screen.getByText('loading in layout...'))

      // After 700ms 'Page Loading Context Page' should be rendered
      await waitFor(() => screen.getByText('Page Loading Context Page'))

      // This shouldn't show up, because the page shouldn't render before it's
      // fully loaded
      expect(screen.queryByText('loading in page...')).not.toBeInTheDocument()

      await waitFor(() => screen.getByText('done loading in page'))
      await waitFor(() => screen.getByText('done loading in layout'))
    },
    timeoutForFlakeyAsyncTests
  )
})

describe('inits routes and navigates as expected', () => {
  const TestRouter = () => (
    <Router>
      <Route path="/" page={HomePage} name="home" />
      <Route path="/about" page={AboutPage} name="about" />
      <Route path="/redirect" page={RedirectPage} name="redirect" />
      <Route path="/redirect2/{value}" redirect="/param-test/{value}" />
      <Private unauthenticated="home">
        <Route path="/private" page={PrivatePage} name="private" />
      </Private>
      <Route path="/param-test/{value}" page={ParamPage} name="params" />
      <Route notfound page={NotFoundPage} />
    </Router>
  )

  const getScreen = () => render(<TestRouter />)

  test('starts on home page', async () => {
    const screen = getScreen()
    await waitFor(() => screen.getByText(/Home Page/i))
  })

  test('navigate to about page', async () => {
    const screen = getScreen()
    act(() => navigate(routes.about()))
    await waitFor(() => screen.getByText(/About Page/i))
  })

  test('passes search params to the page', async () => {
    const screen = getScreen()
    act(() => navigate(routes.params({ value: 'val', q: 'q' })))
    await waitFor(() => {
      expect(screen.queryByText('param valq')).toBeInTheDocument()
      expect(screen.queryByText('hookparams val?q')).toBeInTheDocument()
    })
  })

  test('navigate to redirect page should redirect to about', async () => {
    const screen = getScreen()

    act(() => navigate(routes.redirect()))
    await waitFor(() => {
      expect(screen.queryByText(/Redirect Page/)).not.toBeInTheDocument()
      expect(screen.queryByText(/About Page/)).toBeInTheDocument()
    })
  })

  test('navigate to redirect2 should forward params', async () => {
    const screen = getScreen()

    await waitFor(() => screen.getByText(/Home Page/i))

    act(() => navigate('/redirect2/redirected?q=cue'))
    await waitFor(() => screen.getByText(/param redirectedcue/i))

    act(() => navigate('/redirect2/redirected'))
    await waitFor(() => screen.getByText(/param redirected/))
  })

  test('multiple navigates to params page should update params', async () => {
    const screen = getScreen()
    act(() => navigate(routes.params({ value: 'one' })))
    await waitFor(() => screen.getByText(/param one/i))

    act(() => navigate(routes.params({ value: 'two' })))
    await waitFor(() => screen.getByText(/param two/i))
  })

  test('notfound page catches undefined paths', async () => {
    const screen = getScreen()
    act(() => navigate('/no/route/defined'))
    await waitFor(() => screen.getByText('404'))
  })
})

describe('test params escaping', () => {
  const ParamPage = ({ value, q }: { value: string; q: string }) => {
    const params = useParams()

    return (
      <div>
        <p>param {`${value}${q}`}</p>
        <p>hookparams {`${params.value}?${params.q}`}</p>
      </div>
    )
  }

  const TestRouter = () => (
    <Router>
      <Route path="/redirect2/{value}" redirect="/param-test/{value}" />
      <Route path="/param-test/{value}" page={ParamPage} name="params" />
      <Route notfound page={NotFoundPage} />
    </Router>
  )

  const getScreen = () => render(<TestRouter />)

  test('Params with unreserved characters work in path and query', async () => {
    const screen = getScreen()
    act(() =>
      navigate(routes.params({ value: 'example.com', q: 'example.com' }))
    )
    await waitFor(() => {
      expect(
        screen.queryByText('param example.comexample.com')
      ).toBeInTheDocument()
      expect(
        screen.queryByText('hookparams example.com?example.com')
      ).toBeInTheDocument()
    })
  })

  test('Params with reserved characters work in path and query', async () => {
    const screen = getScreen()
    act(() =>
      navigate(routes.params({ value: 'example!com', q: 'example!com' }))
    )

    await waitFor(() => {
      expect(
        screen.queryByText('param example!comexample!com')
      ).toBeInTheDocument()
      expect(
        screen.queryByText('hookparams example!com?example!com')
      ).toBeInTheDocument()
    })
  })

  test('Params with unsafe characters work in query, are escaped in path', async () => {
    const screen = getScreen()
    act(() =>
      navigate(routes.params({ value: 'example com', q: 'example com' }))
    )

    await waitFor(() => {
      expect(
        screen.queryByText('param example%20comexample com')
      ).toBeInTheDocument()
      expect(
        screen.queryByText('hookparams example%20com?example com')
      ).toBeInTheDocument()
    })
  })

  test('Character / is valid as part of a param in query', async () => {
    const screen = getScreen()
    act(() => navigate(routes.params({ value: 'example', q: 'example/com' })))

    await waitFor(() => {
      expect(screen.queryByText('param exampleexample/com')).toBeInTheDocument()
      expect(
        screen.queryByText('hookparams example?example/com')
      ).toBeInTheDocument()
    })
  })

  test('Character / is not captured as part of a param in path', async () => {
    const screen = getScreen()
    act(() =>
      navigate(routes.params({ value: 'example/com', q: 'example/com' }))
    )

    await waitFor(() => screen.getByText('404'))
  })

  test('navigate to redirect2 should forward params with unreserved characters', async () => {
    const screen = getScreen()
    act(() => navigate('/redirect2/example.com?q=example.com'))
    await waitFor(() => screen.getByText(/param example.comexample.com/i))
  })

  test('navigate to redirect2 should forward params with escaped characters', async () => {
    const screen = getScreen()
    act(() => navigate('/redirect2/example!com?q=example!com'))
    await waitFor(() => screen.getByText(/param example!comexample!com/i))
  })
})

describe('query params should not override path params', () => {
  const ParamPage = ({ id, contactId }: { id: number; contactId: number }) => {
    const params = useParams()

    return (
      <div>
        <p>param {`${id},${contactId}`}</p>
        <p>hookparams {`${params.id},${params.contactId}`}</p>
      </div>
    )
  }

  const TestRouter = () => (
    <Router>
      <Route
        path="/user/{id:Int}/contact/{contactId:Int}"
        page={ParamPage}
        name="contact"
      />
    </Router>
  )

  const getScreen = () => render(<TestRouter />)

  test('query params of same key as path params should not override path params', async () => {
    const screen = getScreen()
    act(() => navigate('/user/1/contact/2?contactId=two'))
    await waitFor(() => {
      expect(screen.queryByText('param 1,2')).toBeInTheDocument()
      expect(screen.queryByText('hookparams 1,2')).toBeInTheDocument()
    })
  })
})

test('unauthenticated user is redirected away from private page', async () => {
  const TestRouter = () => (
    <Router>
      <Route path="/" page={HomePage} name="home" />
      <Route path="/login" page={LoginPage} name="login" />
      <Route path="/about" page={AboutPage} name="about" />
      <Private unauthenticated="login">
        <Route path="/private" page={PrivatePage} name="private" />
      </Private>
    </Router>
  )
  const screen = render(<TestRouter />)

  // starts on home page
  await waitFor(() => screen.getByText(/Home Page/i))

  // navigate to private page
  // should redirect to login
  act(() => navigate(routes.private()))

  await waitFor(() => {
    expect(screen.queryByText(/Private Page/i)).not.toBeInTheDocument()
    screen.getByText(/Login Page/i)
    expect(window.location.pathname).toBe('/login')
    expect(window.location.search).toBe('?redirectTo=/private')
  })
})

test('unauthenticated user is redirected including search params', async () => {
  const TestRouter = () => (
    <Router>
      <Route path="/" page={HomePage} name="home" />
      <Route path="/login" page={LoginPage} name="login" />
      <Private unauthenticated="login">
        <Route path="/private" page={PrivatePage} name="private" />
      </Private>
    </Router>
  )
  const screen = render(<TestRouter />)

  // starts on home page
  await waitFor(() => screen.getByText(/Home Page/i))

  // navigate to private page
  // should redirect to login
  act(() => navigate(routes.private({ bazinga: 'yeah' })))

  await waitFor(() => {
    expect(screen.queryByText(/Private Page/i)).not.toBeInTheDocument()
    expect(window.location.pathname).toBe('/login')
    expect(window.location.search).toBe(
      `?redirectTo=/private${encodeURIComponent('?bazinga=yeah')}`
    )
    screen.getByText(/Login Page/i)
  })
})

test('authenticated user can access private page', async () => {
  const TestRouter = () => (
    <Router useAuth={mockUseAuth({ isAuthenticated: true })}>
      <Route path="/" page={HomePage} name="home" />
      <Private unauthenticated="home">
        <Route path="/private" page={PrivatePage} name="private" />
      </Private>
    </Router>
  )
  const screen = render(<TestRouter />)

  // starts on home page
  await waitFor(() => screen.getByText(/Home Page/i))

  // navigate to private page
  // should not redirect
  act(() => navigate(routes.private()))
  await waitFor(() => {
    expect(screen.getByText(/Private Page/)).toBeInTheDocument()
    expect(screen.queryByText(/Home Page/)).not.toBeInTheDocument()
  })
})

test('can display a loading screen whilst waiting for auth', async () => {
  const TestRouter = () => (
    <Router useAuth={mockUseAuth({ isAuthenticated: false, loading: true })}>
      <Route path="/" page={HomePage} name="home" />
      <Private
        unauthenticated="home"
        whileLoadingAuth={() => <>Authenticating...</>}
      >
        <Route path="/private" page={PrivatePage} name="private" />
      </Private>
    </Router>
  )
  const screen = render(<TestRouter />)

  // starts on home page
  await waitFor(() => screen.getByText(/Home Page/i))

  // navigate to private page
  // should not redirect
  act(() => navigate(routes.private()))
  await waitFor(() => {
    expect(screen.getByText(/Authenticating.../)).toBeInTheDocument()
    expect(screen.queryByText(/Home Page/)).not.toBeInTheDocument()
  })
})

test('can display a loading screen with a hook', async () => {
  const HookLoader = () => {
    const [showStill, setShowStill] = useState(false)

    useEffect(() => {
      const timer = setTimeout(() => setShowStill(true), 100)
      return () => clearTimeout(timer)
    }, [])

    return <>{showStill ? 'Still authenticating...' : 'Authenticating...'}</>
  }

  const TestRouter = () => (
    <Router
      useAuth={mockUseAuth({
        isAuthenticated: false,
        loading: true,
        loadingTimeMs: 700,
      })}
    >
      <Route path="/" page={HomePage} name="home" />
      <Private unauthenticated="home" whileLoadingAuth={HookLoader}>
        <Route path="/private" page={PrivatePage} name="private" />
      </Private>
    </Router>
  )
  const screen = render(<TestRouter />)

  // starts on home page
  await waitFor(() => screen.getByText(/Home Page/i))

  // navigate to private page
  // should not redirect
  act(() => navigate(routes.private()))
  await waitFor(() => {
    expect(screen.getByText(/Authenticating.../)).toBeInTheDocument()
    expect(screen.queryByText(/Home Page/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Private Page/)).not.toBeInTheDocument()
  })
  await waitFor(() => {
    expect(screen.getByText(/Still authenticating.../)).toBeInTheDocument()
    expect(screen.queryByText(/Home Page/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Private Page/)).not.toBeInTheDocument()
  })
})

test('inits routes two private routes with a space in between and loads as expected', async () => {
  const TestRouter = () => (
    <Router>
      <Route path="/" page={HomePage} name="home" />
      <Route path="/about" page={AboutPage} name="about" />
      <Route path="/redirect" page={RedirectPage} name="redirect" />
      <Private unauthenticated="home">
        <Route path="/private" page={PrivatePage} name="private" />{' '}
        <Route path="/another-private" page={PrivatePage} name="private" />
      </Private>

      <Route
        path="/param-test/:value"
        page={({ value }) => <div>param {value}</div>}
        name="params"
      />
    </Router>
  )
  const screen = render(<TestRouter />)

  // starts on home page
  await waitFor(() => screen.getByText(/Home Page/i))
})

test('supports <Set>', async () => {
  const GlobalLayout = ({ children }) => (
    <div>
      <h1>Global Layout</h1>
      {children}
    </div>
  )

  const TestRouter = () => (
    <Router>
      <Set wrap={GlobalLayout}>
        <Route path="/" page={HomePage} name="home" />
        <Route path="/about" page={AboutPage} name="about" />
        <Route path="/redirect" page={RedirectPage} name="redirect" />
        <Private unauthenticated="home">
          <Route path="/private" page={PrivatePage} name="private" />
          <Route
            path="/another-private"
            page={PrivatePage}
            name="anotherPrivate"
          />
        </Private>
      </Set>
    </Router>
  )
  const screen = render(<TestRouter />)

  await waitFor(() => screen.getByText(/Global Layout/i))
  await waitFor(() => screen.getByText(/Home Page/i))
})

test('can use named routes for navigating', async () => {
  const MainLayout = ({ children }) => {
    return (
      <div>
        <h1>Main Layout</h1>
        <Link to={routes.home()}>Home-link</Link>
        <Link to={routes.about()}>About-link</Link>
        <hr />
        {children}
      </div>
    )
  }

  const TestRouter = () => (
    <Router>
      <Set wrap={MainLayout}>
        <Route path="/" page={HomePage} name="home" />
        <Route path="/about" page={AboutPage} name="about" />
      </Set>
    </Router>
  )

  const screen = render(<TestRouter />)

  // starts on home page, with MainLayout
  await waitFor(() => screen.getByText(/Home Page/))
  await waitFor(() => screen.getByText(/Main Layout/))

  fireEvent.click(screen.getByText('About-link'))
  await waitFor(() => screen.getByText(/About Page/))
})

test('renders only active path', async () => {
  const AboutLayout = ({ children }) => {
    return (
      <div>
        <h1>About Layout</h1>
        <hr />
        {children}
      </div>
    )
  }

  const LoginLayout = ({ children }) => {
    return (
      <div>
        <h1>Login Layout</h1>
        <hr />
        {children}
      </div>
    )
  }

  const TestRouter = () => (
    <Router>
      <Route path="/" page={HomePage} name="home" />
      <Set wrap={AboutLayout}>
        <Route path="/about" page={AboutPage} name="about" />
      </Set>
      <Set wrap={LoginLayout}>
        <Route path="/login" page={LoginPage} name="login" />
      </Set>
    </Router>
  )

  const screen = render(<TestRouter />)

  // starts on home page, with no layout
  await waitFor(() => screen.getByText(/Home Page/))
  expect(screen.queryByText('About Layout')).not.toBeInTheDocument()
  expect(screen.queryByText('Login Layout')).not.toBeInTheDocument()

  // go to about page, with only about layout
  act(() => navigate(routes.about()))
  await waitFor(() => screen.getByText(/About Page/))
  expect(screen.queryByText('About Layout')).toBeInTheDocument()
  expect(screen.queryByText('Login Layout')).not.toBeInTheDocument()

  // go to login page, with only login layout
  act(() => navigate(routes.login()))
  await waitFor(() => screen.getByText(/Login Page/))
  expect(screen.queryByText('About Layout')).not.toBeInTheDocument()
  expect(screen.queryByText('Login Layout')).toBeInTheDocument()
})

test('renders first matching route only', async () => {
  const ParamPage = ({ param }: { param: string }) => <div>param {param}</div>

  const TestRouter = () => (
    <Router>
      <Route path="/" page={HomePage} name="home" />
      <Route path="/about" page={AboutPage} name="about" />
      <Route path="/{param}" page={ParamPage} name="param" />
    </Router>
  )

  const screen = render(<TestRouter />)

  await waitFor(() => screen.getByText(/Home Page/))

  // go to about page, and make sure that's the only page rendered
  act(() => navigate(routes.about()))

  await waitFor(() => screen.getByText('About Page'))
  expect(screen.queryByText(/param/)).not.toBeInTheDocument()
})

test('renders first matching route only, even if multiple routes have the same name', async () => {
  const ParamPage = ({ param }: { param: string }) => <div>param {param}</div>
  const AboutTwoPage = () => <h1>About Two Page</h1>

  const TestRouter = () => (
    <Router>
      <Route path="/" page={HomePage} name="home" />
      <Route path="/about" page={AboutPage} name="about" />
      <Route path="/{param}" page={ParamPage} name="about" />
      <Route path="/about" page={AboutTwoPage} name="about" />
      <Route path="/about" page={AboutPage} name="about" />
    </Router>
  )

  const screen = render(<TestRouter />)

  await waitFor(() => screen.getByText(/Home Page/))

  // go to about page, and make sure that's the only page rendered
  act(() => navigate(routes.about()))
  // `getByText` will throw an error if more than one node is found
  // which is perfect, because that's exactly what we want to test
  await waitFor(() => screen.getByText('About Page'))
  expect(screen.queryByText('param')).not.toBeInTheDocument()
  expect(screen.queryByText('About Two Page')).not.toBeInTheDocument()
})

test('renders first matching route only, also with Private', async () => {
  const ParamPage = ({ param }: { param: string }) => <div>param {param}</div>

  const TestRouter = () => (
    <Router>
      <Route path="/" page={HomePage} name="home" />
      <Route path="/login" page={LoginPage} name="login" />
      <Route path="/about" page={AboutPage} name="about" />
      <Private unauthenticated="login">
        <Route path="/{param}" page={ParamPage} name="param" />
      </Private>
    </Router>
  )

  const screen = render(<TestRouter />)

  await waitFor(() => screen.getByText(/Home Page/))

  // go to about page, and make sure that's the only page rendered
  act(() => navigate(routes.about()))
  await waitFor(() => screen.getByText('About Page'))
  expect(screen.queryByText(/param/)).not.toBeInTheDocument()
})

test('renders first matching route only, also with param path outside Private', async () => {
  const ParamPage = ({ param }: { param: string }) => <div>param {param}</div>

  const TestRouter = () => (
    <Router useAuth={mockUseAuth({ isAuthenticated: true })}>
      <Route path="/" page={HomePage} name="home" />
      <Private unauthenticated="login">
        <Route path="/private" page={PrivatePage} name="private" />
      </Private>
      <Route path="/{param}" page={ParamPage} name="param" />
    </Router>
  )

  const screen = render(<TestRouter />)

  await waitFor(() => screen.getByText(/Home Page/))

  // go to about page, and make sure that's the only page rendered
  act(() => navigate(routes.private()))
  await waitFor(() => screen.getByText('Private Page'))
  expect(screen.queryByText(/param/)).not.toBeInTheDocument()
})

test('params should never be an empty object', async () => {
  const ParamPage = () => {
    const params = useParams()
    expect(params).not.toEqual({})
    return null
  }

  const TestRouter = () => (
    <Router>
      <Route path="/test/{documentId}" page={ParamPage} name="param" />
    </Router>
  )

  act(() => navigate('/test/1'))
  render(<TestRouter />)
})

test('params should never be an empty object in Set', async () => {
  const ParamPage = () => {
    return <div>Param Page</div>
  }

  const SetWithUseParams = ({ children }) => {
    const params = useParams()
    expect(params).not.toEqual({})
    return children
  }

  const TestRouter = () => (
    <Router>
      <Set wrap={SetWithUseParams}>
        <Route path="/test/{documentId}" page={ParamPage} name="param" />
      </Set>
    </Router>
  )

  act(() => navigate('/test/1'))
  const screen = render(<TestRouter />)
  await waitFor(() => screen.getByText('Param Page'))
})

test('params should never be an empty object in Set with waitFor (I)', async () => {
  const ParamPage = () => {
    const { documentId } = useParams()
    return <>documentId: {documentId}</>
  }

  const SetWithUseParams = ({ children }) => {
    const params = useParams()
    // 1st run: { documentId: '1' }
    // 2nd run: { documentId: '2' }
    expect(params).not.toEqual({})
    return children
  }

  const TestRouter = () => (
    <Router>
      <Set wrap={SetWithUseParams}>
        <Route path="/test/{documentId}" page={ParamPage} name="param" />
      </Set>
      <Route path="/" page={() => <Redirect to="/test/2" />} name="home" />
    </Router>
  )

  act(() => navigate('/test/1'))
  const screen = render(<TestRouter />)
  await waitFor(() => screen.getByText(/documentId: 1/))
  act(() => navigate('/'))
  await waitFor(() => screen.getByText(/documentId: 2/))
})

test('params should never be an empty object in Set without waitFor (II)', async () => {
  const ParamPage = () => {
    const { documentId } = useParams()
    return <>documentId: {documentId}</>
  }

  const SetWithUseParams = ({ children }) => {
    const params = useParams()
    // 1st run: { documentId: '1' }
    // 2nd run: { documentId: '2' }
    expect(params).not.toEqual({})
    return children
  }

  const TestRouter = () => (
    <Router>
      <Set wrap={SetWithUseParams}>
        <Route path="/test/{documentId}" page={ParamPage} name="param" />
      </Set>
      <Route path="/" page={() => <Redirect to="/test/2" />} name="home" />
    </Router>
  )

  act(() => navigate('/test/1'))
  const screen = render(<TestRouter />)
  act(() => navigate('/'))
  await waitFor(() => screen.getByText(/documentId: 2/))
})

test('Set is not rendered for unauthenticated user.', async () => {
  const ParamPage = () => {
    // This should never be called. We should be redirected to login instead.
    expect(false).toBe(true)
    return null
  }

  const SetWithUseParams = ({ children }) => {
    // This should never be called. We should be redirected to login instead.
    expect(false).toBe(true)
    return children
  }

  const TestRouter = () => (
    <Router>
      <Set private wrap={SetWithUseParams} unauthenticated="login">
        <Route path="/test/{documentId}" page={ParamPage} name="param" />
      </Set>
      <Route path="/" page={HomePage} name="home" />
      <Route path="/login" page={() => <div>auth thyself</div>} name="login" />
    </Router>
  )

  // Go to home page and start loading
  // Wait until it has loaded
  // Go to /test/1 and start loading
  // Get redirected to /login
  const screen = render(<TestRouter />)
  await waitFor(() => screen.getByText('Home Page'))
  act(() => navigate('/test/1'))
  await waitFor(() => screen.getByText(/auth thyself/))
})

test('Set is not rendered for unauthenticated user on direct navigation', async () => {
  const ParamPage = () => {
    // This should never be called. We should be redirected to login instead.
    expect(false).toBe(true)
    return null
  }

  const SetWithUseParams = ({ children }) => {
    // This should never be called. We should be redirected to login instead.
    expect(false).toBe(true)
    return children
  }

  const TestRouter = () => (
    <Router>
      <Set private wrap={SetWithUseParams} unauthenticated="login">
        <Route path="/test/{documentId}" page={ParamPage} name="param" />
      </Set>
      <Route path="/" page={HomePage} name="home" />
      <Route path="/login" page={() => <div>auth thyself</div>} name="login" />
    </Router>
  )

  act(() => navigate('/test/1'))
  const screen = render(<TestRouter />)
  await waitFor(() => screen.getByText(/auth thyself/))
})

test('Private is an alias for Set private', async () => {
  const PrivateLayout = ({ children, theme }) => (
    <div>
      <h1>Private Layout ({theme})</h1>
      {children}
    </div>
  )

  const TestRouter = () => (
    <Router useAuth={mockUseAuth({ isAuthenticated: true })}>
      <Route path="/" page={HomePage} name="home" />
      <Private wrap={PrivateLayout} unauthenticated="home" theme="dark">
        <Route path="/private" page={PrivatePage} name="private" />
      </Private>
    </Router>
  )
  const screen = render(<TestRouter />)

  await waitFor(() => screen.getByText(/Home Page/i))

  act(() => navigate('/private'))
  await waitFor(() => screen.getByText(/Private Layout \(dark\)/))
  await waitFor(() => screen.getByText(/Private Page/))
})

test('redirect to last page', async () => {
  const TestRouter = () => (
    <Router>
      <Route path="/" page={HomePage} name="home" />
      <Route path="/about" page={AboutPage} name="about" />
      <Private unauthenticated="login">
        <Route path="/private" page={PrivatePage} name="private" />
      </Private>
      <Route path="/login" page={LoginPage} name="login" />
    </Router>
  )
  const screen = render(<TestRouter />)

  // starts on home page
  await waitFor(() => screen.getByText(/Home Page/i))

  // navigate to private page
  // should redirect to login
  act(() => navigate(routes.private()))

  await waitFor(() => {
    expect(screen.queryByText(/Private Page/i)).not.toBeInTheDocument()
    screen.getByText('Login Page')
    expect(window.location.pathname).toBe('/login')
    expect(window.location.search).toBe('?redirectTo=/private')
  })
})

test('no location match means nothing is rendered', async () => {
  const TestRouter = () => (
    <Router>
      <Route path="/" page={HomePage} name="home" />
    </Router>
  )
  const screen = render(<TestRouter />)

  // starts on home page
  await waitFor(() => screen.getByText(/Home Page/i))

  // navigate page that doesn't exist
  act(() => navigate('/not/found'))

  // wait for rendering
  // Otherwise adding a NotFound route still makes this test pass
  await new Promise((r) => setTimeout(r, 200))

  expect(screen.container).toMatchInlineSnapshot('<div />')
})

test('jump to new route, then go back', async () => {
  const HelpPage = () => <h1>Help Page</h1>
  const TestRouter = () => (
    <Router>
      <Route path="/" page={HomePage} name="home" />
      <Route path="/login" page={LoginPage} name="login" />
      <Route path="/about" page={AboutPage} name="about" />
      <Route path="/help" page={HelpPage} name="help" />
    </Router>
  )
  const screen = render(<TestRouter />)

  // starts on home page
  await waitFor(() => screen.getByText('Home Page'))

  act(() => navigate(routes.about()))
  await waitFor(() => screen.getByText('About Page'))
  act(() => navigate(routes.help(), { replace: true }))
  await waitFor(() => screen.getByText('Help Page'))
  act(() => back())
  await waitFor(() => screen.getByText('Home Page'))
})

test('redirect replacing route', async () => {
  const ListWithDefaultParamsPage = (props) => {
    if (props['_limit']) {
      return <h1>List Page</h1>
    }
    return <Redirect to="/list?_limit=10" options={{ replace: true }} />
  }
  const TestRouter = () => (
    <Router>
      <Route path="/" page={HomePage} name="home" />
      <Route path="/list" page={ListWithDefaultParamsPage} name="list" />
    </Router>
  )
  const screen = render(<TestRouter />)

  // starts on home page
  await waitFor(() => screen.getByText('Home Page'))

  // This will navigate to /list, which will then redirect to /list?_limit=10
  // which will render `<h1>List Page</h1>`
  act(() => navigate(routes.list()))
  await waitFor(() => screen.getByText('List Page'))
  act(() => back())
  // without options.replace = true in Redirect, back would go to List Page
  await waitFor(() => screen.getByText('Home Page'))
})

describe('trailing slashes', () => {
  const TSNeverRouter = () => (
    <Router trailingSlashes="never">
      <Route path="/" page={HomePage} name="home" />
      <Route path="/about" page={AboutPage} name="about" />
      <Route notfound page={NotFoundPage} />
    </Router>
  )
  const getTSNeverScreen = () => render(<TSNeverRouter />)

  test('starts on home page', async () => {
    const screen = getTSNeverScreen()
    await waitFor(() => screen.getByText(/Home Page/i))
  })

  test('strips trailing slash on navigating to about page', async () => {
    const screen = getTSNeverScreen()
    act(() => navigate('/about/'))
    await waitFor(() => screen.getByText(/About Page/i))
  })

  const TSAlwaysRouter = () => (
    <Router trailingSlashes="always">
      <Route path="/" page={HomePage} name="home" />
      <Route path="/about/" page={AboutPage} name="about" />
      <Route notfound page={NotFoundPage} />
    </Router>
  )
  const getTSAlwaysScreen = () => render(<TSAlwaysRouter />)

  test('starts on home page', async () => {
    const screen = getTSAlwaysScreen()
    await waitFor(() => screen.getByText(/Home Page/i))
  })

  test('adds trailing slash on navigating to about page', async () => {
    const screen = getTSAlwaysScreen()
    act(() => navigate('/about'))
    await waitFor(() => screen.getByText(/About Page/i))
  })

  const TSPreserveRouter = () => (
    <Router trailingSlashes="preserve">
      <Route path="/" page={HomePage} name="home" />
      <Route path="/about" page={AboutPage} name="about" />
      <Route path="/contact/" page={() => <h1>Contact Page</h1>} name="about" />
      <Route notfound page={NotFoundPage} />
    </Router>
  )
  const getTSPreserveScreen = () => render(<TSPreserveRouter />)

  test('starts on home page', async () => {
    const screen = getTSPreserveScreen()
    await waitFor(() => screen.getByText(/Home Page/i))
  })

  test('navigates to about page as is', async () => {
    const screen = getTSPreserveScreen()
    act(() => navigate('/about'))
    await waitFor(() => screen.getByText(/About Page/i))
  })

  test('navigates to contact page as is', async () => {
    const screen = getTSPreserveScreen()
    act(() => navigate('/contact/'))
    await waitFor(() => screen.getByText(/Contact Page/i))
  })
})

test('params should be updated if navigated to different route with same page', async () => {
  const UserPage = ({ id }: { id?: number }) => {
    const { id: idFromContext } = useParams()
    return (
      <>
        <p>param {id ? id : 'no-id'}</p>
        <p>hookparams {idFromContext ? idFromContext : 'no-param-id'} </p>
      </>
    )
  }
  const TestRouter = () => (
    <Router>
      <Route path="/user" page={UserPage} name="allUsers" />
      <Route path="/user/{id:Int}" page={UserPage} name="user" />
    </Router>
  )

  const screen = render(<TestRouter />)
  act(() => navigate('/user'))
  // Wait for page load
  await waitFor(() => screen.getByText('param no-id'))
  act(() => navigate('/user/99'))

  await waitFor(() => {
    expect(screen.queryByText('param 99')).toBeInTheDocument()
    expect(screen.queryByText('hookparams 99')).toBeInTheDocument()
  })
})

test('should handle ref and key as search params', async () => {
  const ParamsPage = () => {
    const { ref, key } = useParams()
    return <p>{JSON.stringify({ ref, key })}</p>
  }

  const TestRouter = () => (
    <Router>
      <Route path="/params" page={ParamsPage} name="params" />
    </Router>
  )

  const screen = render(<TestRouter />)
  act(() => navigate('/params?ref=1&key=2'))

  await waitFor(() => {
    expect(screen.queryByText(`{"ref":"1","key":"2"}`)).toBeInTheDocument()
  })
})

describe('Unauthorized redirect error messages', () => {
  let err

  beforeAll(() => {
    err = console.error
    console.error = jest.fn()
  })

  afterAll(() => {
    console.error = err
  })

  test('Private set with unauthenticated prop with nonexisting page', async () => {
    const TestRouter = ({ authenticated }: { authenticated?: boolean }) => (
      <Router useAuth={mockUseAuth({ isAuthenticated: authenticated })}>
        <Route path="/" page={HomePage} name="home" />
        <Set private unauthenticated="does-not-exist">
          <Route path="/private" page={PrivatePage} name="private" />
        </Set>
      </Router>
    )

    act(() => navigate('/private'))
    expect(() => render(<TestRouter authenticated={false} />)).toThrow(
      'We could not find a route named does-not-exist'
    )
  })

  test('Private set redirecting to page that needs parameters', async () => {
    const TestRouter = ({ authenticated }: { authenticated?: boolean }) => (
      <Router useAuth={mockUseAuth({ isAuthenticated: authenticated })}>
        <Route path="/" page={HomePage} name="home" />
        <Route path="/param-test/{value}" page={ParamPage} name="params" />
        <Set private unauthenticated="params">
          <Route path="/private" page={PrivatePage} name="private" />
        </Set>
      </Router>
    )

    act(() => navigate('/private'))
    expect(() => render(<TestRouter authenticated={false} />)).toThrow(
      'Redirecting to route "params" would require route parameters, which ' +
        'currently is not supported. Please choose a different route'
    )
  })
})
