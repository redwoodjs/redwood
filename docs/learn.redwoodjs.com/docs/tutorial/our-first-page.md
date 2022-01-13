---
id: our-first-page
title: "Our First Page"
sidebar_label: "Our First Page"
---

Let's give our users something to look at besides the Redwood welcome page. We'll use the `redwood` command line tool to create a page for us:

    yarn redwood generate page home /

The command above does four things:

- Creates `web/src/pages/HomePage/HomePage.js`. Redwood takes the name you specified as the first argument, capitalizes it, and appends "Page" to construct your new page component.
- Creates a test file to go along with this new page component at `web/src/pages/HomePage/HomePage.test.js` with a single, passing test. You _do_ write tests for your components, _don't you??_
- Creates a Storybook file for this component at `web/src/pages/HomePage/HomePage.stories.js`. Storybook is a wonderful tool for efficiently developing and organizing UI components. If you'd like to learn more, see this [Redwood Forum topic](https://community.redwoodjs.com/t/how-to-use-the-new-storybook-integration-in-v0-13-0/873) to start using it in your development process.
- Adds a `<Route>` in `web/src/Routes.js` that maps the path `/` to the new _HomePage_ page.

> **Automatic import of pages in Routes file**
>
> If you look in Routes you'll notice that we're referencing a component, `HomePage`, that isn't imported anywhere. Redwood automatically imports all pages in the Routes file since we're going to need to reference them all anyway. It saves a potentially huge `import` declaration from cluttering up the routes file.

In fact this page is already live (your browser automatically reloaded):

![Default HomePage render](https://user-images.githubusercontent.com/300/76237559-b760ba80-61eb-11ea-9a77-b5006b03031f.png)

It's not pretty, but it's a start! Open the page in your editor, change some text and save. Your browser should reload with your new text.

### Routing

Open up `web/src/Routes.js` and take a look at the route that was created:

```html
<Route path="/" page={HomePage} name="home" />
```

Try changing the route to something like:

```html
<Route path="/hello" page={HomePage} name="home" />
```

As soon as you add your first route, you'll never see the initial Redwood splash screen again. From now on, when no route can be found that matches the requested URL, Redwood will render the `NotFoundPage`. Change your URL to http://localhost:8910/hello and you should see the homepage again.

Change the route path back to `/` before continuing!

