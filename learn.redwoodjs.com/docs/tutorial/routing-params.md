---
id: routing-params
title: "Routing Params"
sidebar_label: "Routing Params"
---

Now that we have our homepage listing all the posts, let's build the "detail" page—a canonical URL that displays a single post. First we'll generate the page and route:

    yarn rw g page BlogPost

> Note that we can't call this page simply `Post` because our scaffold already created a page with that name.

Now let's link the title of the post on the homepage to the detail page (and include the `import` for `Link` and `routes`):

```javascript {3,12}
// web/src/components/BlogPostsCell/BlogPostsCell.js

import { Link, routes } from '@redwoodjs/router'

// QUERY, Loading, Empty and Failure definitions...

export const Success = ({ posts }) => {
  return posts.map((post) => (
    <article key={post.id}>
      <header>
        <h2>
          <Link to={routes.blogPost()}>{post.title}</Link>
        </h2>
      </header>
      <p>{post.body}</p>
      <div>Posted at: {post.createdAt}</div>
    </article>
  ))
}
```

If you click the link on the title of the blog post you should see the boilerplate text on `BlogPostPage`. But what we really need is to specify _which_ post we want to view on this page. It would be nice to be able to specify the ID of the post in the URL with something like `/blog-post/1`. Let's tell the `<Route>` to expect another part of the URL, and when it does, give that part a name that we can reference later:

```html
// web/src/Routes.js

<Route path="/blog-post/{id}" page={BlogPostPage} name="blogPost" />
```

Notice the `{id}`. Redwood calls these _route parameters_. They say "whatever value is in this position in the path, let me reference it by the name inside the curly braces". And while we're in the routes file, lets move the route inside the `Set` with the `BlogLayout`.

```javascript {5}
// web/src/Routes.js

<Router>
  <Set wrap={BlogLayout}>
    <Route path="/blog-post/{id}" page={BlogPostPage} name="blogPost" />
    <Route path="/about" page={AboutPage} name="about" />
    <Route path="/" page={HomePage} name="home" />
  </Set>
  <Route notfound page={NotFoundPage} />
</Router>
```

Cool, cool, cool. Now we need to construct a link that has the ID of a post in it:

```html
// web/src/components/BlogPostsCell/BlogPostsCell.js

<Link to={routes.blogPost({ id: post.id })}>{post.title}</Link>
```

For routes with route parameters, the named route function expects an object where you specify a value for each parameter. If you click on the link now, it will indeed take you to `/blog-post/1` (or `/blog-post/2`, etc, depending on the ID of the post).

### Using the Param

Ok, so the ID is in the URL. What do we need next in order to display a specific post? It sounds like we'll be doing some data retrieval from the database, which means we want a cell:

    yarn rw g cell BlogPost

And then we'll use that cell in `BlogPostPage`:

```javascript
// web/src/pages/BlogPostPage/BlogPostPage.js

import BlogPostCell from 'src/components/BlogPostCell'

const BlogPostPage = () => {
  return (
    <BlogPostCell />
  )
}

export default BlogPostPage
```

Now over to the cell, we need access to that `{id}` route param so we can look up the ID of the post in the database. Let's update the query to accept a variable (and again change the query name from `blogPost` to just `post`)

```javascript {4,5,7-9,20,21}
// web/src/components/BlogPostCell/BlogPostCell.js

export const QUERY = gql`
  query BlogPostQuery($id: Int!) {
    post(id: $id) {
      id
      title
      body
      createdAt
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>Empty</div>

export const Failure = ({ error }) => <div>Error: {error.message}</div>

export const Success = ({ post }) => {
  return JSON.stringify(post)
}
```

Okay, we're getting closer. Still, where will that `$id` come from? Redwood has another trick up its sleeve. Whenever you put a route param in a route, that param is automatically made available to the page that route renders. Which means we can update `BlogPostPage` to look like this:

```javascript {3,5}
// web/src/pages/BlogPostPage/BlogPostPage.js

const BlogPostPage = ({ id }) => {
  return (
    <BlogPostCell id={id} />
  )
}
```

`id` already exists since we named our route param `{id}`. Thanks Redwood! But how does that `id` end up as the `$id` GraphQL parameter? If you've learned anything about Redwood by now, you should know it's going to take care of that for you! By default, any props you give to a cell will automatically be turned into variables and given to the query. "Say what!" you're saying. It's true!

We can prove it! Try going to the detail page for a post in the browser and—uh oh. Hmm:

![image](https://user-images.githubusercontent.com/300/75820346-096b9100-5d51-11ea-8f6e-53fda78d1ed5.png)

> By the way, this error message you're seeing is thanks to the `Failure` section of our Cell!

If you take a look in the web inspector console you can see the actual error coming from GraphQL:

    [GraphQL error]: Message: Variable "$id" got invalid value "1";
      Expected type Int. Int cannot represent non-integer value: "1",
      Location: [object Object], Path: undefined

It turns out that route params are extracted as strings from the URL, but GraphQL wants an integer for the ID. We could use `parseInt()` to convert it to a number before passing it into `BlogPostCell`, but honestly, we can do better than that!

### Route Param Types

What if you could request the conversion right in the route's path? Well, guess what: you can! Introducing **route param types**. It's as easy as adding `:Int` to our existing route param:

```html
// web/src/Routes.js

<Route path="/blog-post/{id:Int}" page={BlogPostPage} name="blogPost" />
```

Voilà! Not only will this convert the `id` param to a number before passing it to your Page, it will prevent the route from matching unless the `id` path segment consists entirely of digits. If any non-digits are found, the router will keep trying other routes, eventually showing the `NotFoundPage` if no routes match.

> **What if I want to pass some other prop to the cell that I don't need in the query, but do need in the Success/Loader/etc. components?**
>
> All of the props you give to the cell will be automatically available as props in the render components. Only the ones that match the GraphQL variables list will be given to the query. You get the best of both worlds! In our post display above, if you wanted to display some random number along with the post (for some contrived, tutorial-like reason), just pass that prop:
>
> ```javascript
> <BlogPostCell id={id} rand={Math.random()} />
> ```
>
> And get it, along with the query result (and even the original `id` if you want) in the component:
>
> ```javascript
> export const Success = ({ post, id, rand }) => {
>   //...
> }
> ```
>
> Thanks again, Redwood!

### Displaying a Blog Post

Now let's display the actual post instead of just dumping the query result. This seems like the perfect place for a good old fashioned component since we're displaying a post on both the home page and this detail page, and it's (currently) the same exact output. Let's Redwood-up a component (I just invented that phrase):

    yarn rw g component BlogPost

Which creates `web/src/components/BlogPost/BlogPost.js` (and test!) as a super simple React component:

```javascript
// web/src/components/BlogPost/BlogPost.js

const BlogPost = () => {
  return (
    <div>
      <h2>{'BlogPost'}</h2>
      <p>{'Find me in ./web/src/components/BlogPost/BlogPost.js'}</p>
    </div>
  )
}

export default BlogPost
```

> You may notice we don't have any explicit `import` statements for `React` itself. We (the Redwood dev team) got tired of constantly importing it over and over again in every file so we automatically import it for you!

Let's take the post display code out of `BlogPostsCell` and put it here instead, taking the `post` in as a prop:

```javascript {3,5,7-14}
// web/src/components/BlogPost/BlogPost.js

import { Link, routes } from '@redwoodjs/router'

const BlogPost = ({ post }) => {
  return (
    <article>
      <header>
        <h2>
          <Link to={routes.blogPost({ id: post.id })}>{post.title}</Link>
        </h2>
      </header>
      <div>{post.body}</div>
    </article>
  )
}

export default BlogPost
```

And update `BlogPostsCell` and `BlogPostCell` to use this new component instead:

```javascript {3,8}
// web/src/components/BlogPostsCell/BlogPostsCell.js

import BlogPost from 'src/components/BlogPost'

// Loading, Empty, Failure...

export const Success = ({ posts }) => {
  return posts.map((post) => <BlogPost key={post.id} post={post} />)
}
```

```javascript {3,8}
// web/src/components/BlogPostCell/BlogPostCell.js

import BlogPost from 'src/components/BlogPost'

// Loading, Empty, Failure...

export const Success = ({ post }) => {
  return <BlogPost post={post} />
}
```

And there we go! We should be able to move back and forth between the homepage and the detail page.

> If you like what you've been seeing from the router, you can dive deeper into the [Redwood Router](https://redwoodjs.com/docs/redwood-router) guide.

### Summary

Let's summarize:

1. We created a new page to show a single post (the "detail" page).
2. We added a route to handle the `id` of the post and turn it into a route param.
3. We created a cell to fetch and display the post.
4. Redwood made the world a better place by making that `id` available to us at several key junctions in our code and even turning it into a number automatically.
5. We turned the actual post display into a standard React component and used it in both the homepage and new detail page.

