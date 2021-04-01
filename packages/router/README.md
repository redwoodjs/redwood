# Redwood Router

This is the built-in router for Redwood apps. It takes inspiration from Ruby on Rails, React Router, and Reach Router, but is very opinionated in its own way.

> **WARNING:** RedwoodJS software has not reached a stable version 1.0 and should not be considered suitable for production use. In the "make it work; make it right; make it fast" paradigm, Redwood is in the later stages of the "make it work" phase.

Redwood Router (RR from now on) is designed to list all routes in a single file, with limited nesting. We prefer this design, as it makes it very easy to track which routes map to which pages.

## Router and Route

The first thing you need is a `Router`. It will contain all of your routes. RR will attempt to match the current URL to each route in turn, and only render those with a matching `path`. The only exception to this is the `notfound` route, which can be placed anywhere in the list and only matches when no other routes do.

Each route is specified with a `Route`. Our first route will tell RR what to render when no other route matches:

```js
// Routes.js
import { Router, Route } from '@redwoodjs/router'

const Routes = () => (
  <Router>
    <Route notfound page={NotFoundPage} />
  </Router>
)

export default Routes
```

RR expects a single `Route` with a `notfound` prop. When no other route is found to match, the component in the `page` prop will be rendered.

To create a route to a normal Page, you'll pass three props: `path`, `page`, and `name`:

```js
// Routes.js
<Route path="/" page={HomePage} name="home" />
```

The `path` prop specifies the URL path to match, starting with the beginning slash. The `page` prop specifies the Page component to render when the path is matched. The `name` prop is used to specify the name of the _named route function_.

## Private Routes

Some pages should only be visible to authenticated users.

All `Routes` nested in `<Private>` require authentication.
When a user is not authenticated and attempts to visit this route,
they will be redirected to the route passed as the `unauthenticated` prop and the originally requested route's path will be added to the querystring in a `redirectTo` param. This lets you send the user to the originally requested once logged in.

```js
// Routes.js
<Router>
  <Route path="/" page={HomePage} name="home" />
  <Private unauthenticated="home">
    <Route path="/admin" page={AdminPage} name="admin" />
  </Private>
</Router>
```

Redwood uses the `useAuth` hook under the hood to determine if the user is authenticated.
Read more about authentication in redwood [here](https://redwoodjs.com/tutorial/authentication).

## Sets of Routes

You can group Routes into sets using the `Set` component. `Set` allows you to wrap a set of Routes in another component or array of components—usually a Context, a Layout, or both:

```js
// Routes.js

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

The `wrap` prop accepts a single component or an array of components. Components are rendered in the same order they're passed, so in the exmaple above, Set expands to:

```js
<BlogContext>
  <BlogLayout>
    <Route path="/" page={HomePage} name="home" />
    // ...
  </BlogLayout>
</BlogContext>
```

Conceptually, this fits with how we think about Context and Layouts as things that wrap Pages and contain content that’s outside the scope of the Pages themselves. Crucially, since they're higher in the tree, `BlogContext` and `BlogLayout` won't rerender across Pages in the same Set.

There's a lot of flexibility here. You can even nest `Sets` to great effect:

```js
// Routes.js

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

## Link and named route functions

When it comes to routing, matching URLs to Pages is only half the equation. The other half is generating links to your pages. RR makes this really simple without having to hardcode URL paths. In a Page component, you can do this (only relevant bits are shown in code samples from now on):

```js
// SomePage.js
import { Link, routes } from '@redwoodjs/router'

// Given the route in the last section, this produces: <a href="/">
const SomePage = () => <Link to={routes.home()} />
```

You use a `Link` to generate a link to one of your routes and can access URL generators for any of your routes from the `routes` object. We call the functions on the `routes` object _named route functions_ and they are named after whatever you specify in the `name` prop of the `Route`.

Named route functions simply return a string, so you can still pass in hardcoded strings to the `to` prop of the `Link` component, but using the proper named route function is easier and safer. Plus, if you ever decide to change the `path` of a route, you don't need to change any of the `Link`s to it (as long as you keep the `name` the same)!

## Active links

`NavLink` is a special version of `Link` that will add an `activeClassName` to the rendered element when it matches the current URL.

```js
// MainMenu.js
import { NavLink, routes } from '@redwoodjs/router'

// Will render <a href="/" className="link activeLink"> when on the home page
const MainMenu = () => <NavLink className="link" activeClassName="activeLink" to={routes.home()} >Home</NavLink>
```

You can `useMatch` to create your own component with active styles. `NavLink` uses it internally!

```js
import { Link, routes, useMatch } from '@redwoodjs/router'

const CustomLink = ({to, ...rest}) => {
  const matchInfo = useMatch(to)

  return <SomeStyledComponent as={Link} to={to} isActive={matchInfo.match} />
}

const MainMenu = () => {
  return <CustomLink to={routes.about()} />
}
```

## Route parameters

To match variable data in a path, you can use route parameters, which are specified by a parameter name surrounded by curly braces:

```js
// Routes.js
<Route path="/user/{id}>" page={UserPage} name="user" />
```

This route will match URLs like `/user/7` or `/user/mojombo`. You can have as many route parameters as you like:

```js
// Routes.js
<Route path="/blog/{year}/{month}/{day}/{slug}" page={PostPage} name="post" />
```

By default, route parameters will match up to the next slash or end-of-string. Once extracted, the route parameters are sent as props to the Page component. In the 2nd example above, you can receive them like so:

```js
// PostPage.js
const PostPage = ({ year, month, day, slug }) => { ... }
```

## Named route functions with parameters

If a route has route parameters, then its named route function will take an object of those same parameters as an argument:

```js
// SomePage.js
<Link to={routes.user({ id: 7 })}>...</Link>
```

All parameters will be converted to strings before being inserted into the generated URL. If you don't like the default JavaScript behavior of how this conversion happens, make sure to convert to a string before passing it into the named route function.

If you specify parameters to the named route function that do not correspond to parameters defined on the route, they will be appended to the end of the generated URL as search params in `key=val` format:

```js
// SomePage.js
<Link to={routes.users({ sort: 'desc', filter: 'all' })}>...</Link>
// => "/users?sort=desc&filter=all"
```

## Route parameter types

Route parameters are extracted as strings by default, but they will often represent typed data. RR offers a convenient way to auto-convert certain types right in the `path` specification:

```js
// Routes.js
<Route path="/user/{id:Int}" page={UserPage} name="user" />
```

By adding `:Int` onto the route parameter, you are telling RR to only match `/\d+/` and then use `Number()` to convert the parameter into a number. Now, instead of a string being sent to the Page, a number will be sent! This means you could have both a route that matches numeric user IDs **and** a route that matches string IDs:

```js
// Routes.js
<Route path="/user/{id:Int}" page={UserIntPage} name="userInt" />
<Route path="/user/{id}" page={UserStringPage} name="userString" />
```

Now, if a request for `/user/mojombo` comes in, it will fail to match the first route, but will succeed in matching the second.

## Core route parameter types

We call built-in parameter types _core parameter types_. All core parameter types begin with a capital letter. Here are the types:

- `Int` - Matches and converts an integer.

## User route parameter types

RR goes even further, allowing you to define your own route parameter types. Your custom types must begin with a lowercase letter. You can specify them like so:

```js
// Routes.js
const userRouteParamTypes = {
  slug: {
    constraint: /\w+-\w+/,
    transform: (param) => param.split('-'),
  }
}

<Router paramTypes={userRouteParamTypes}>
  <Route path="/post/{name:slug}" page={PostPage} name={post} />
</Router>
```

Here we've created a custom `slug` route parameter type. It is defined by a `constraint` and a `transform`. Both are optional; the default constraint is `/[^/]+/` and the default transform is `(param) => param`.

In the route we've specified a route parameter of `{name:slug}` which will invoke our custom route parameter type and if we have a request for `/post/redwood-router`, the resulting `name` prop delivered to `PostPage` will be `['redwood', 'router']`.

## useParams

Sometimes it's convenient to receive route parameters as the props to the Page, but in the case where a deeply nested component needs access to the route parameters, it quickly becomes tedious to pass those props through every intervening component. RR solves this with the `useParams` hook:

```js
// SomeDeeplyNestedComponent.js
import { useParams } from '@redwoodjs/router'

const SomeDeeplyNestedComponent = () => {
  const { id } = useParams()
  ...
}
```

In the above example, we've pulled in the `id` route parameter without needing to have it passed in to us from anywhere.

## useLocation

If you'd like to get access to the current URL, `useLocation` returns a read-only location object representing it. The location object has three properties, [pathname](https://developer.mozilla.org/en-US/docs/Web/API/Location/pathname), [search](https://developer.mozilla.org/en-US/docs/Web/API/Location/search), and [hash](https://developer.mozilla.org/en-US/docs/Web/API/Location/hash), that update when the URL changes. This makes it easy to fire off navigation side effects or use the URL as if it were state:

```js
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
  if ( hash === "#ping" ) {
    return <Pong />
  }

  return (
    <>...</>
  )

}

```

## navigate

If you'd like to programmatically navigate to a different page, you can simply use the `navigate` function:

```js
// SomePage.js
import { navigate, routes } from '@redwoodjs/router'

const SomePage = () => {
  const onSomeAction = () => {
    navigate(routes.home())
  }
  ...
}
```

## Redirect

If you want to declaratively redirect to a different page, use the `<Redirect>` component.

In the example below, SomePage will redirect to the home page.

```js
// SomePage.js
import { Redirect, routes } from '@redwoodjs/router'

const SomePage = () => {
  <Redirect to={routes.home()}/>
}
```

## Code-splitting

By default, RR will code-split on every Page, creating a separate lazy-loaded webpack bundle for each. When navigating from page to page, RR will wait until the new Page module is loaded before re-rendering, thus preventing the "white-flash" effect.

## Not code splitting

If you'd like to override the default lazy-loading behavior and include certain Pages in the main webpack bundle, you can simply add the import statement to the `Routes.js` file:

```js
// Routes.js

import HomePage from 'src/pages/HomePage'
```

Redwood will detect your explicit import and refrain from splitting that page into a separate bundle. Be careful with this feature, as you can easily bloat the size of your main bundle to the point where your initial page load time becomes unacceptable.

## PageLoadingContext

> **VIDEO:** If you'd prefer to watch a video, there's one accompanying this section: https://www.youtube.com/watch?v=BVkyXjUQADs&feature=youtu.be

Because lazily-loaded pages can take a non-negligible amount of time to load (depending on bundle size and network connection), you may want to show a loading indicator to signal to the user that something is happening after they click a link. RR makes this really easy with `usePageLoadingContext`:

```js
// SomeLayout.js

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

After adding this to your app you will probably not see it when navigating between pages. This is because having a loading indicator is nice, but can get annoying when it shows up every single time you navigate to a new page. In fact, this behavior makes it feel like your pages take even longer to load than they actually do! RR takes this into account and, by default, will only show the loader when it takes more than 1000 milliseconds for the page to load. You can change this to whatever you like with the `pageLoadingDelay` prop on `Router`:

```js
// Routes.js

<Router pageLoadingDelay={500}>...</Router>
```

Now the loader will show up after 500ms of load time. To see your loading indicator, you can set this value to 0 or, even better, [change the network speed](https://developers.google.com/web/tools/chrome-devtools/network#throttle) in developer tools to "Slow 3G" or another agonizingly slow connection speed.
