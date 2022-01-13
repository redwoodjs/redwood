---
id: a-second-page-and-a-link
title: "A Second Page and a Link"
sidebar_label: "A Second Page and a Link"
---

Let's create an "About" page for our blog so everyone knows about the geniuses behind this achievement. We'll create another page using `redwood`:

    yarn redwood generate page about

Notice that we didn't specify a route path this time. If you leave it off the `redwood generate page` command, Redwood will create a `Route` and give it a path that is the same as the page name you specified prepended with a slash. In this case it will be `/about`.

> **Code-splitting each page**
>
> As you add more pages to your app, you may start to worry that more and more code has to be downloaded by the client on any initial page load. Fear not! Redwood will automatically code-split on each Page, which means that initial page loads can be blazingly fast, and you can create as many Pages as you want without having to worry about impacting overall webpack bundle size. If, however, you do want specific Pages to be included in the main bundle, you can override the default behavior.

http://localhost:8910/about should show our new page. But no one's going to find it by manually changing the URL so let's add a link from our homepage to the About page and vice versa. We'll start creating a simple header and nav bar at the same time on the HomePage:

```javascript {3,7-19}
// web/src/pages/HomePage/HomePage.js

import { Link, routes } from '@redwoodjs/router'

const HomePage = () => {
  return (
    <>
      <header>
        <h1>Redwood Blog</h1>
        <nav>
          <ul>
            <li>
              <Link to={routes.about()}>About</Link>
            </li>
          </ul>
        </nav>
      </header>
      <main>Home</main>
    </>
  )
}

export default HomePage
```

Let's point out a few things here:

- Redwood loves [Function Components](https://www.robinwieruch.de/react-function-component). We'll make extensive use of [React Hooks](https://reactjs.org/docs/hooks-intro.html) as we go and these are only enabled in function components. You're free to use class components, but we recommend avoiding them unless you need their special capabilities.
- Redwood's `<Link>` tag, in its most basic usage, takes a single `to` attribute. That `to` attribute calls a _named route function_ in order to generate the correct URL. The function has the same name as the `name` attribute on the `<Route>`:

  `<Route path="/about" page={AboutPage} name="about" />`

  If you don't like the name that `redwood generate` used for your route, feel free to change it in `Routes.js`! Named routes are awesome because if you ever change the path associated with a route, you need only change it in `Routes.js` and every link using a named route function will still point to the correct place. You can also pass a string to the `to` attribute, but you'll lose out on all the Redwood goodness that named routes provide.

### Back Home

Once we get to the About page we don't have any way to get back so let's add a link there as well:

```javascript {3,7-25}
// web/src/pages/AboutPage/AboutPage.js

import { Link, routes } from '@redwoodjs/router'

const AboutPage = () => {
  return (
    <>
      <header>
        <h1>Redwood Blog</h1>
        <nav>
          <ul>
            <li>
              <Link to={routes.about()}>About</Link>
            </li>
          </ul>
        </nav>
      </header>
      <main>
        <p>
          This site was created to demonstrate my mastery of Redwood: Look on my
          works, ye mighty, and despair!
        </p>
        <Link to={routes.home()}>Return home</Link>
      </main>
    </>
  )
}

export default AboutPage
```

Great! Try that out in the browser and verify you can get back and forth.

As a world-class developer you probably saw that copy-and-pasted `<header>` and gasped in disgust. We feel you. That's why Redwood has a little something called _Layouts_.

