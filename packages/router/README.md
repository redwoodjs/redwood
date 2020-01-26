# Redwood Router

This is the built-in router for Redwood apps. It takes inspiration from Ruby on Rails, React Router, and Reach Router, but is very opinionated in its own way.

WARNING: This software is in alpha and should not be considered suitable for production use. In the "make it work; make it right; make it fast" paradigm, RR is in the later stages of the "make it work" phase.

Redwood Router (RR from now on) is designed to list all routes in a single file, without any nesting. We prefer this design, as it makes it very easy to track which routes map to which pages.

## Installation and use outside of a Redwood app

RR was designed for use in Redwood apps, and the rest of the documentation here will use examples that are appropriate in that context. That said, you can use RR outside of Redwood apps too! If you do, there are a few things to note:

1. Redwood auto-imports every Page component in the `Routes.js` file, so if you use it outside of that context, you will need to import your Pages manually.

## Router and Route

The first thing you need is a `Router`. It will contain all of your routes. RR will attempt to match the current URL to each route in turn, stopping when it finds a match, and rendering that route only. The only exception to this is the `notfound` route, which can be placed anywhere in the list and only matches when no other routes do.

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
<Link to={routes.user({ id: 7 })} />
```

All parameters will be converted to strings before being inserted into the generated URL. If you don't like the default JavaScript behavior of how this conversion happens, make sure to convert to a string before passing it into the named route function.

## Route parameter types

Route parameters are extracted as strings by default, but they will often represent typed data. RR offers a convenient way to auto-convert certain types right in the `path` specification:

```js
// Routes.js
<Route path="/user/{id:Int}" page={UserPage} name="user" />
```

By adding `:Int` onto the route parameter, you are telling RR to only match `/\d+/` and then use `parseInt()` to convert the parameter into a number. Now, instead of a string being sent to the Page, a number will be sent! This means you could have both a route that matches numeric user IDs **and** a route that matches string IDs:

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

In the route we've specified a route parameter of `{name:slug}` which will invoke our custom route parameter type and if we have a requst for `/post/redwood-router`, the resulting `name` prop delivered to `PostPage` will be `['redwood', 'router']`.

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
