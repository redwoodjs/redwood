---
id: cells
title: "Cells"
sidebar_label: "Cells"
---

These features are common in most web apps. We wanted to see if there was something we could do to make developers' lives easier when it comes to adding them to a typical component. We think we've come up with something to help. We call them _Cells_. Cells provide a simpler and more declarative approach to data fetching. ([Read the full documentation about Cells](https://redwoodjs.com/docs/cells).)

When you create a cell you export several specially named constants and then Redwood takes it from there. A typical cell may look something like:

```javascript
export const QUERY = gql`
  query {
    posts {
      id
      title
      body
      createdAt
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>No posts yet!</div>

export const Failure = ({ error }) => (
  <div>Error loading posts: {error.message}</div>
)

export const Success = ({ posts }) => {
  return posts.map((post) => (
    <article>
      <h2>{post.title}</h2>
      <div>{post.body}</div>
    </article>
  ))
}
```

When React renders this component, Redwood will perform the `QUERY` and display the `Loading` component until a response is received.

Once the query returns, it will display one of three states:
  - If there was an error, the `Failure` component
  - If the data return is empty (`null` or empty array), the `Empty` component
  - Otherwise, the `Success` component

There are also some lifecycle helpers like `beforeQuery` (for massaging any props before being given to the `QUERY`) and `afterQuery` (for massaging the data returned from GraphQL but before being sent to the `Success` component).

The minimum you need for a cell are the `QUERY` and `Success` exports. If you don't export an `Empty` component, empty results will be sent to your `Success` component. If you don't provide a `Failure` component, you'll get error output sent to the console.

A guideline for when to use cells is if your component needs some data from the database or other service that may be delayed in responding. Let Redwood worry about juggling what is displayed when and you can focus on the happy path of the final, rendered component populated with data.

### Our First Cell

The homepage displaying a list of posts is a perfect candidate for our first cell. Naturally, there is a Redwood generator for them:

    yarn rw g cell BlogPosts

This command will result in a new file at `/web/src/components/BlogPostsCell/BlogPostsCell.js` (and a test file) with some boilerplate to get you started:

```javascript
// web/src/components/BlogPostsCell/BlogPostsCell.js

export const QUERY = gql`
  query BlogPostsQuery {
    blogPosts {
      id
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>Empty</div>

export const Failure = ({ error }) => <div>Error: {error.message}</div>

export const Success = ({ blogPosts }) => {
  return JSON.stringify(blogPosts)
}
```

> **Indicating Multiplicity to the Cell Generator**
>
> When generating a cell you can use any case you'd like and Redwood will do the right thing when it comes to naming. These will all create the same filename (`web/src/components/BlogPostsCell/BlogPostsCell.js`):
>
>     yarn rw g cell blog_posts
>     yarn rw g cell blog-posts
>     yarn rw g cell blogPosts
>     yarn rw g cell BlogPosts
>
> You will need _some_ kind of indication that you're using more than one word: either snake_case (`blog_posts`), kebab-case (`blog-posts`), camelCase (`blogPosts`) or PascalCase (`BlogPosts`).
>
> Calling `yarn redwood g cell blogposts` (without any indication that we're using two words) will generate a file at `web/src/components/BlogpostsCell/BlogpostsCell.js`.

To get you off and running as quickly as possible the generator assumes you've got a root GraphQL query named the same thing as your cell and gives you the minimum query needed to get something out of the database. In this case the query is called `blogPosts`:

```javascript
// web/src/components/BlogPostsCell/BlogPostsCell.js

export const QUERY = gql`
  query BlogPostsQuery {
    blogPosts {
      id
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>Empty</div>

export const Failure = ({ error }) => <div>Error: {error.message}</div>

export const Success = ({ posts }) => {
  return JSON.stringify(posts)
}
```

However, this is not a valid query name for our existing Posts SDL (`src/graphql/posts.sdl.js`) and Service (`src/services/posts/posts.js`). (To see where these files come from, go back to the [Creating a Post Editor section](./getting-dynamic#creating-a-post-editor) in the *Getting Dynamic* part.)

We'll have to rename that to just `posts` in both the query name and in the prop name in `Success`:

```javascript {5,17,18}
// web/src/components/BlogPostsCell/BlogPostsCell.js

export const QUERY = gql`
  query BlogPostsQuery {
    posts {
      id
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>Empty</div>

export const Failure = ({ error }) => <div>Error: {error.message}</div>

export const Success = ({ posts }) => {
  return JSON.stringify(posts)
}
```

Let's plug this cell into our `HomePage` and see what happens:

```javascript {3,7}
// web/src/pages/HomePage/HomePage.js

import BlogPostsCell from 'src/components/BlogPostsCell'

const HomePage = () => {
  return (
    <BlogPostsCell />
  )
}

export default HomePage
```

The browser should actually show an array with a number of post items (assuming you created a blog post with our [scaffolding](./getting-dynamic#creating-a-post-editor) from earlier). Neat!

<img src="https://user-images.githubusercontent.com/300/73210519-5380a780-40ff-11ea-8639-968507a79b1f.png" />

> **In the `Success` component, where did `posts` come from?**
>
> Notice in the `QUERY` that the query we're making is `posts`. Whatever the name of this query is, that's the name of the prop that will be available in `Success` with your data. You can alias the name of the variable containing the result of the GraphQL query, and that will be the name of the prop:
>
> ```javascript
> export const QUERY = gql`
>   query BlogPostsQuery {
>     postIds: posts {
>       id
>     }
>   }
> `
> ```
>
> Now `postIds` will be available in `Success` instead of `posts`

In addition to the `id` that was added to the `query` by the generator, let's get the title, body, and createdAt too:

```javascript {7-9}
// web/src/components/BlogPostsCell/BlogPostsCell.js

export const QUERY = gql`
  query BlogPostsQuery {
    posts {
      id
      title
      body
      createdAt
    }
  }
`
```

The page should now show a dump of all the data you created for any blog posts you scaffolded:

<img src="https://user-images.githubusercontent.com/300/73210715-abb7a980-40ff-11ea-82d6-61e6bdcd5739.png" />

Now we're in the realm of good ol' React components, so just build out the `Success` component to display the blog post in a nicer format:

```javascript {4-12}
// web/src/components/BlogPostsCell/BlogPostsCell.js

export const Success = ({ posts }) => {
  return posts.map((post) => (
    <article key={post.id}>
      <header>
        <h2>{post.title}</h2>
      </header>
      <p>{post.body}</p>
      <div>Posted at: {post.createdAt}</div>
    </article>
  ))
}
```

And just like that we have a blog! It may be the most basic, ugly blog that ever graced the internet, but it's something! (Don't worry, we've got more features to add.)

<img src="https://user-images.githubusercontent.com/300/73210997-3dbfb200-4100-11ea-847a-602cbf59cb2a.png" />

### Summary

To sum up, what did we actually do to get this far?

1. Generate the homepage
2. Generate the blog layout
3. Define the database schema
4. Run migrations to update the database and create a table
5. Scaffold a CRUD interface to the database table
6. Create a cell to load the data and take care of loading/empty/failure/success states
7. Add the cell to the page

This will become a standard lifecycle of new features as you build a Redwood app.

So far, other than a little HTML, we haven't had to do much by hand. And we especially didn't have to write a bunch of plumbing just to move data from one place to another. It makes web development a little more enjoyable, don't you think?

