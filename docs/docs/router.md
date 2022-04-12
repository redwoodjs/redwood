---
description: About the built-in router for Redwood apps
---

# Router

This is the built-in router for Redwood apps. It takes inspiration from Ruby on Rails, React Router, and Reach Router, but is very opinionated in its own way.

The router is designed to list all routes in a single file, with limited nesting. We prefer this design, as it makes it very easy to track which routes map to which pages.

## Router and Route

The first thing you need is a `Router`. It will contain all of your routes. The router will attempt to match the current URL to each route in turn, and only render those with a matching `path`. The only exception to this is the `notfound` route, which can be placed anywhere in the list and only matches when no other routes do.

Each route is specified with a `Route`. Our first route will tell the router what to render when no other route matches:

```jsx title="Routes.js"
import { Router, Route } from '@redwoodjs/router'

const Routes = () => (
  <Router>
    <Route notfound page={NotFoundPage} />
  </Router>
)

export default Routes
```

The router expects a single `Route` with a `notfound` prop. When no other route is found to match, the component in the `page` prop will be rendered.

To create a route to a normal Page, you'll pass three props: `path`, `page`, and `name`:

```jsx title="Routes.js"
<Route path="/" page={HomePage} name="home" />
```

The `path` prop specifies the URL path to match, starting with the beginning slash. The `page` prop specifies the Page component to render when the path is matched. The `name` prop is used to specify the name of the _named route function_.

## Private Routes

Some pages should only be visible to authenticated users.

We support this using private `<Set>`s or the `<Private>` component. Read more [further down](#private-set).

## Sets of Routes

You can group Routes into sets using the `Set` component. `Set` allows you to wrap a set of Routes in another component or array of components—usually a Context, a Layout, or both:

```jsx title="Routes.js"
import { Router, Route, Set } from '@redwoodjs/router'
import BlogContext from 'src/contexts/BlogContext'
import BlogLayout from 'src/layouts/BlogLayout'

const Routes = () => {
  return (
    <Router>
      <Set wrap={[BlogContext, BlogLayout]}>
        <Route path="/" page={HomePage} name="home" />
        <Route path="/about" page={AboutPage} name="about" />
        <Route path="/contact" page={ContactPage} name="contact" />
        <Route path="/blog-post/{id:Int}" page={BlogPostPage} name="blogPost" />
      </Set>
    </Router>
  )
}

export default Routes
```

The `wrap` prop accepts a single component or an array of components. Components are rendered in the same order they're passed, so in the example above, Set expands to:

```jsx
<BlogContext>
  <BlogLayout>
    <Route path="/" page={HomePage} name="home" />
    // ...
  </BlogLayout>
</BlogContext>
```

Conceptually, this fits with how we think about Context and Layouts as things that wrap Pages and contain content that’s outside the scope of the Pages themselves. Crucially, since they're higher in the tree, `BlogContext` and `BlogLayout` won't rerender across Pages in the same Set.

There's a lot of flexibility here. You can even nest `Sets` to great effect:

```jsx title="Routes.js"
import { Router, Route, Set, Private } from '@redwoodjs/router'
import BlogContext from 'src/contexts/BlogContext'
import BlogLayout from 'src/layouts/BlogLayout'
import BlogNavLayout from 'src/layouts/BlogNavLayout'

const Routes = () => {
  return (
    <Router>
      <Set wrap={[BlogContext, BlogLayout]}>
        <Route path="/" page={HomePage} name="home" />
        <Route path="/about" page={AboutPage} name="about" />
        <Route path="/contact" page={ContactPage} name="contact" />
        <Set wrap={BlogNavLayout}>
          <Route path="/blog-post/{id:Int}" page={BlogPostPage} name="blogPost" />
        </Set>
      </Set>
    </Router>
  )
}
```

### Forwarding props

All props you give to `<Set>` (except for `wrap`) will be passed to the wrapper components.

So this...

```jsx
<Set wrap={MainLayout} theme="dark">
  <Route path="/" page={HomePage} name="home" />
</Set>
```

becomes...

```jsx
<MainLayout theme="dark">
  <Route path="/" page={HomePage} name="home" />
</MainLayout>
```

### `private` Set

Sets can take a `private` prop which makes all Routes inside that Set require authentication. When a user isn't authenticated and attempts to visit one of the Routes in the private Set, they'll be redirected to the Route passed as the Set's `unauthenticated` prop. The originally-requested Route's path is added to the query string as a `redirectTo` param. This lets you send the user to the page they originally requested once they're logged-in.

For more fine-grained control, you can specify `roles` (which takes a string for a single role or an array of roles), and the router will check to see that the user is authorized before giving them access to the Route. If they're not, it'll redirect them in the same way as above.

Here's an example of how you'd use a private set:

```jsx title="Routes.js"
<Router>
  <Route path="/" page={HomePage} name="home" />
  <Set private unauthenticated="home">
    <Route path="/admin" page={AdminPage} name="admin" />
  </Set>
</Router>
```

Private routes are important and should be easy to spot in your Routes file. The larger your Routes file gets, the more difficult it will probably become to find `<Set private /*...*/>` among your other Sets. So we also provide a `<Private>` component that's just an alias for `<Set private /*...*/>`. Most of our documentation uses `<Private>`.

Here's the same example again, but now using `<Private>`

```jsx title="Routes.js"
<Router>
  <Route path="/" page={HomePage} name="home" />
  <Private unauthenticated="home">
    <Route path="/admin" page={AdminPage} name="admin" />
  </Private>
</Router>
```

Redwood uses the `useAuth` hook under the hood to determine if the user is authenticated. Read more about authentication in Redwood [here](tutorial/chapter4/authentication.md).

## Link and named route functions

When it comes to routing, matching URLs to Pages is only half the equation. The other half is generating links to your pages. The router makes this really simple without having to hardcode URL paths. In a Page component, you can do this (only relevant bits are shown in code samples from now on):

```jsx title="SomePage.js"
import { Link, routes } from '@redwoodjs/router'

// Given the route in the last section, this produces: <a href="/">
const SomePage = () => <Link to={routes.home()} />
```

You use a `Link` to generate a link to one of your routes and can access URL generators for any of your routes from the `routes` object. We call the functions on the `routes` object _named route functions_ and they are named after whatever you specify in the `name` prop of the `Route`.

Named route functions simply return a string, so you can still pass in hardcoded strings to the `to` prop of the `Link` component, but using the proper named route function is easier and safer. Plus, if you ever decide to change the `path` of a route, you don't need to change any of the `Link`s to it (as long as you keep the `name` the same)!

## Active links

`NavLink` is a special version of `Link` that will add an `activeClassName` to the rendered element when it matches **exactly** the current URL.

```jsx title="MainMenu.js"
import { NavLink, routes } from '@redwoodjs/router'

// Will render <a className="link activeLink" {...rest}> respectively when on the page
const MainMenu = () =>
  <ul>
    <li>
      <!-- When match "/" -->
      <NavLink
        className="link"
        activeClassName="activeLink"
        to={routes.home()}>
        Home
      </NavLink>
    </li>
    <li>
      <!-- When match "/?tab=tutorial" (params order insensitive) -->
      <NavLink
        className="link"
        activeClassName="activeLink"
        to={routes.home({ tab: 'tutorial' })}>
          Home > Tutorial
      </NavLink>
    </li>
  </ul>
```

Alternatively, you can add the `activeMatchParams` prop to your `NavLink` to match the current URL **partially**

```jsx
import { NavLink, routes } from '@redwoodjs/router'

// Will render <a href="/?tab=tutorial&page=2" className="link activeLink"> when on any of Home tutorial pages
const MainMenu = () => (
  <li>
    <NavLink
      className="link"
      activeClassName="activeLink"
      activeMatchParams={[{ tab: 'tutorial' }]}
      to={routes.home({ tab: 'tutorial', page: '2' })}
    >
      Home > Tutorial
    </NavLink>
  </li>
)
```

> Note `activeMatchParams` is an array of `string` _(key only)_ or `Record<string, any>` _(key and value)_

More granular match, `page` key only and `tab=tutorial`

```jsx
// Match /?tab=tutorial&page=*
activeMatchParams={[{ tab: 'tutorial' }, 'page' ]}
```

You can `useMatch` to create your own component with active styles.

> `NavLink` uses it internally!

```jsx
import { Link, routes, useMatch } from '@redwoodjs/router'

const CustomLink = ({ to, ...rest }) => {
  const matchInfo = useMatch(to)

  return <SomeStyledComponent as={Link} to={to} isActive={matchInfo.match} />
}

const MainMenu = () => {
  return <CustomLink to={routes.about()} />
}
```

`useMatch` accepts `searchParams` in the `options` for matching granularity which is exactly the same as `activeMatchParams` of `NavLink`

```jsx
import { Link, routes, useMatch } from '@redwoodjs/router'

const CustomLink = ({ to, ...rest }) => {
  const matchInfo = useMatch(to, { searchParams: [{ tab: 'tutorial' }, 'page'] })

  return <SomeStyledComponent as={Link} to={to} isActive={matchInfo.match} />
}
```

## Route parameters

To match variable data in a path, you can use route parameters, which are specified by a parameter name surrounded by curly braces:

```jsx title="Routes.js"
<Route path="/user/{id}>" page={UserPage} name="user" />
```

This route will match URLs like `/user/7` or `/user/mojombo`. You can have as many route parameters as you like:

```jsx title="Routes.js"
<Route path="/blog/{year}/{month}/{day}/{slug}" page={PostPage} name="post" />
```

By default, route parameters will match up to the next slash or end-of-string. Once extracted, the route parameters are sent as props to the Page component. In the 2nd example above, you can receive them like so:

```jsx title="PostPage.js"
const PostPage = ({ year, month, day, slug }) => { ... }
```

## Named route functions with parameters

If a route has route parameters, then its named route function will take an object of those same parameters as an argument:

```jsx title="SomePage.js"
<Link to={routes.user({ id: 7 })}>...</Link>
```

All parameters will be converted to strings before being inserted into the generated URL. If you don't like the default JavaScript behavior of how this conversion happens, make sure to convert to a string before passing it into the named route function.

If you specify parameters to the named route function that do not correspond to parameters defined on the route, they will be appended to the end of the generated URL as search params in `key=val` format:

```jsx title="SomePage.js"
<Link to={routes.users({ sort: 'desc', filter: 'all' })}>...</Link>
// => "/users?sort=desc&filter=all"
```

## Route parameter types

Route parameters are extracted as strings by default, but they will often represent typed data. The router offers a convenient way to auto-convert certain types right in the `path` specification:

```jsx title="Routes.js"
<Route path="/user/{id:Int}" page={UserPage} name="user" />
```

By adding `:Int` onto the route parameter, you are telling the router to only match `/\d+/` and then use `Number()` to convert the parameter into a number. Now, instead of a string being sent to the Page, a number will be sent! This means you could have both a route that matches numeric user IDs **and** a route that matches string IDs:

```jsx title="Routes.js"
<Route path="/user/{id:Int}" page={UserIntPage} name="userInt" />
<Route path="/user/{id}" page={UserStringPage} name="userString" />
```

Now, if a request for `/user/mojombo` comes in, it will fail to match the first route, but will succeed in matching the second.

## Core route parameter types

We call built-in parameter types _core parameter types_. All core parameter types begin with a capital letter. Here are the types:

- `Int` - Matches and converts an integer.
- `Float` - Matches and converts a Float.
- `Boolean` - Matches and converts Boolean (true or false only)

> Note on TypeScript support
> Redwood will automatically generate types for your named routes, but you do have to run `yarn redwood dev` or `yarn redwood build` at least once for your `Routes.{js,ts}` to be parsed

### Glob Type

There is one more core type that is a bit different: the glob type. Instead of matching to the next `/` or the end of the string, it will greedily match as much as possible (including `/` characters) and capture the match as a string.

```jsx title="Routes.js"
<Route path="/file/{filePath...}" page={FilePage} name="file" />
```

In this example, we want to take everything after `/file/` and have it sent to the Page as `filePath`. So for the path `/file/api/src/lib/auth.js`, `filePath` would contain `api/src/lib/auth.js`.

You can use multiple globs in your paths:

```jsx title="Routes.js"
<Route path="/from/{fromDate...}/to/{toDate...}" page={DatePage} name="dateRange" />
```

This will match a path like `/from/2021/11/03/to/2021/11/17`. Note that for this to work, there must be some static string between the globs so the router can determine where the boundaries of the matches should be.

## User route parameter types

The router goes even further, allowing you to define your own route parameter types. Your custom types must begin with a lowercase letter. You can specify them like so:

```jsx title="Routes.js"
const userRouteParamTypes = {
  slug: {
    match: /\w+-\w+/,
    parse: (param) => param.split('-'),
  },
}

<Router paramTypes={userRouteParamTypes}>
  <Route path="/post/{name:slug}" page={PostPage} name={post} />
</Router>
```

Here we've created a custom `slug` route parameter type. It is defined by `match` and `parse`. Both are optional; the default `match` regexp is `/[^/]+/` and the default `parse` function is `(param) => param`.

In the route we've specified a route parameter of `{name:slug}` which will invoke our custom route parameter type and if we have a request for `/post/redwood-router`, the resulting `name` prop delivered to `PostPage` will be `['redwood', 'router']`.

## Trailing slashes

The router by default removes all trailing slashes before attempting to match the route you are trying to navigate to.

For example, if you attempt to navigate to `/about` and you enter `/about/`, the router will remove the trailing `/` and will match `path="/about"`

There are 3 values that can be used with the `trailingSlashes` prop

1. **never** (default): strips trailing slashes before matching ("/about/" -> "/about")
2. **always**: always adds trailing slashes before matching ("/about" -> "/about/")
3. **preserve** -> paths without a slash won't match paths with a slash ("/about" -> "/about", "/about/" -> "/about/")

If you need to match trailing slashes exactly, use the `preserve` value.
In the following example, `/about/` will _not_ match `/about` and you will be sent to the `NotFoundPage`

```jsx
<Router trailingSlashes={'preserve'}>
  <Route path="/" page={HomePage} name="home" />
  <Route path="/about" page={AboutPage} name="about" />
  <Route notfound page={NotFoundPage} />
</Router>
```

## useParams

Sometimes it's convenient to receive route parameters as the props to the Page, but in the case where a deeply nested component needs access to the route parameters, it quickly becomes tedious to pass those props through every intervening component. The router solves this with the `useParams` hook:

```jsx title="SomeDeeplyNestedComponent.js"
import { useParams } from '@redwoodjs/router'

const SomeDeeplyNestedComponent = () => {
  const { id } = useParams()
  ...
}
```

In the above example, we've pulled in the `id` route parameter without needing to have it passed in to us from anywhere.

## useLocation

If you'd like to get access to the current URL, `useLocation` returns a read-only location object representing it. The location object has three properties, [pathname](https://developer.mozilla.org/en-US/docs/Web/API/Location/pathname), [search](https://developer.mozilla.org/en-US/docs/Web/API/Location/search), and [hash](https://developer.mozilla.org/en-US/docs/Web/API/Location/hash), that update when the URL changes. This makes it easy to fire off navigation side effects or use the URL as if it were state:

```jsx
import { useLocation } from '@redwoodjs/router'

const App = () => {
  const { pathname, search, hash } = useLocation()

  // log the URL when the pathname changes
  React.useEffect(() => {
    myLogger(pathname)
  }, [pathname])

  // initiate a query state with the search val
  const [query, setQuery] = React.useState(search)

  // conditionally render based on hash
  if (hash === '#ping') {
    return <Pong />
  }

  return <>...</>
}
```

## Navigation

### navigate

If you'd like to programmatically navigate to a different page, you can simply use the `navigate` function:

```jsx title="SomePage.js"
import { navigate, routes } from '@redwoodjs/router'

const SomePage = () => {
  const onSomeAction = () => {
    navigate(routes.home())
  }
  ...
}
```

The browser keeps track of the browsing history in a stack. By default when you navigate to a new page a new item is pushed to the history stack. But sometimes you want to replace the top item on the stack instead of appending to the stack. This is how you do that in Redwood: `navigate(routes.home(), { replace: true })`. As you can see you need to pass an options object as the second parameter to `navigate` with the option `replace` set to `true`.

### back

Going back is as easy as using the `back()` function that's exported from the router.

```jsx title="SomePage.js"
import { back } from '@redwoodjs/router'

const SomePage = () => {
  const onSomeAction = () => {
    back()
  }
  ...
}
```

## Redirect

If you want to declaratively redirect to a different page, use the `<Redirect>` component.

In the example below, SomePage will redirect to the home page.

```jsx title="SomePage.js"
import { Redirect, routes } from '@redwoodjs/router'

const SomePage = () => {
  <Redirect to={routes.home()} />
}
```

In addition to the `to` prop, `<Redirect />` also takes an `options` prop. This is the same as [`navigate()`](#navigate)'s second argument: `navigate(_, { replace: true })`. We can use it to *replace* the top item of the browser history stack (instead of pushing a new one). This is how you use it to have this effect: `<Redirect to={routes.home()} options={{ replace: true }}/>`.

## Code-splitting

By default, the router will code-split on every Page, creating a separate lazy-loaded webpack bundle for each. When navigating from page to page, the router will wait until the new Page module is loaded before re-rendering, thus preventing the "white-flash" effect.

## Not code splitting

If you'd like to override the default lazy-loading behavior and include certain Pages in the main webpack bundle, you can simply add the import statement to the `Routes.js` file:

```jsx title="Routes.js"
import HomePage from 'src/pages/HomePage'
```

Redwood will detect your explicit import and refrain from splitting that page into a separate bundle. Be careful with this feature, as you can easily bloat the size of your main bundle to the point where your initial page load time becomes unacceptable.

## Page loaders & PageLoadingContext

### Loader while page chunks load

Because lazily-loaded pages can take a non-negligible amount of time to load (depending on bundle size and network connection), you may want to show a loading indicator to signal to the user that something is happening after they click a link.

In order to show a loader as your page chunks are loading, you simply add the `whileLoadingPage` prop to your route, `Set` or `Private` component.

```jsx title="Routes.js"
import SkeletonLoader from 'src/components/SkeletonLoader'
<Router>
  <Set whileLoadingPage={SkeletonLoader}>
    <Route path="/contact" page={ContactPage} name="contact" />
    <Route path="/about" page={AboutPage} name="about" />
  </Set>
</Router>
```

After adding this to your app you will probably not see it when navigating between pages. This is because having a loading indicator is nice, but can get annoying when it shows up every single time you navigate to a new page. In fact, this behavior makes it feel like your pages take even longer to load than they actually do! The router takes this into account and, by default, will only show the loader when it takes more than 1000 milliseconds for the page to load. You can change this to whatever you like with the `pageLoadingDelay` prop on `Router`:

```jsx title="Routes.js"
<Router pageLoadingDelay={500}>...</Router>
```

Now the loader will show up after 500ms of load time. To see your loading indicator, you can set this value to 0 or, even better, [change the network speed](https://developers.google.com/web/tools/chrome-devtools/network#throttle) in developer tools to "Slow 3G" or another agonizingly slow connection speed.

#### Using PageLoadingContext

An alternative way to implement whileLoadingPage is to use `usePageLoadingContext`:

> **VIDEO:** If you'd prefer to watch a video, there's one accompanying this section: https://www.youtube.com/watch?v=BVkyXjUQADs&feature=youtu.be

```jsx title="SomeLayout.js"
import { usePageLoadingContext } from '@redwoodjs/router'

const SomeLayout = (props) => {
  const { loading } = usePageLoadingContext()
  return (
    <div>
      {loading && <div>Loading...</div>}
      <main>{props.children}</main>
    </div>
  )
}
```

When the lazy-loaded page is loading, `PageLoadingContext.Consumer` will pass `{ loading: true }` to the render function, or false otherwise. You can use this context wherever you like in your application!

### Loader while auth details are being retrieved

Let's say you have a dashboard area on your Redwood app, which can only be accessed after logging in. When Redwood Router renders your private page, it will first fetch the user's details, and only render the page if it determines the user is indeed logged in.

In order to display a loader while auth details are being retrieved you can add the `whileLoadingAuth` prop to your private `<Route>`, `<Set private>` or the `<Private>` component:

```jsx
//Routes.js

<Router>
  <Private
    wrap={DashboardLayout}
    unauthenticated="login"
    whileLoadingAuth={SkeletonLoader} //<-- auth loader
    whileLoadingPage={SkeletonLoader} // <-- page chunk loader
    prerender
  >
    <Route path="/dashboard" page={DashboardHomePage} name="dashboard" />

    {/* other routes */}
  </Private>
</Router>
```
