---
description: Declarative data fetching with Cells
---
# Cells

Cells are a declarative approach to data fetching and one of Redwood's signature modes of abstraction.
By providing conventions around data fetching, Redwood can get in between the request and the response to do things like query optimization and more, all without you ever having to change your code.

While it might seem like there's a lot of magic involved, all a Cell really does is execute a GraphQL query and manage its lifecycle.
The idea is that, by exporting named constants that declare what you want your UI to look like throughout a query's lifecycle,
Redwood can assemble these into a component template at build-time using a Babel plugin.
All without you having to write a single line of imperative code!

## Generating a Cell

You can generate a Cell with Redwood's Cell generator:

```bash
yarn rw generate cell <name>
```

This creates a directory named `<name>Cell` in `web/src/components` with four files:

```bash
~/redwood-app$ yarn rw generate cell user
yarn run v1.22.4
$ /redwood-app/node_modules/.bin/rw g cell user
  ✔ Generating cell files...
    ✔ Writing `./web/src/components/UserCell/UserCell.mock.js`...
    ✔ Writing `./web/src/components/UserCell/UserCell.stories.js`...
    ✔ Writing `./web/src/components/UserCell/UserCell.test.js`...
    ✔ Writing `./web/src/components/UserCell/UserCell.js`...
Done in 1.07s.
```

### Single Item Cell vs List Cell

Sometimes you want a Cell that renders a single item, like the example above, and other times you want a Cell that renders a list.
Redwood's Cell generator can do both.

First, it detects if `<name>` is singular or plural.
For example, to generate a Cell that renders a list of users, run `yarn rw generate cell users`.
Second, for **irregular words** whose singular and plural are identical, such as *equipment* or *pokemon*, you can specify the `--list` flag to tell Redwood to generate a list Cell explicitly:

```
yarn rw generate cell equipment --list
```

## Cells in-depth

We'll go over each of these files in detail. But know that the file appended with just `.js` (in the example above, `UserCell.js`) contains all your Cell's logic.

Off the bat, this file exports five constants: `QUERY`, `Loading` , `Empty` , `Failure`  and `Success`. The root query in `QUERY` is the same as `<name>` so that, if you're generating a cell based on a model in your `schema.prisma`, you can get something out of the database right away. But there's a good chance you won't generate your Cell this way, so if you need to, make sure to change the root query. See the [Cells](tutorial/chapter2/cells.md#our-first-cell) section of the Tutorial for a great example of this.

## Usage

With Cells, you have a total of seven exports to work with:

| Name          | Type               | Description                                                  |
| :------------ | :----------------- | :----------------------------------------------------------- |
| `QUERY`       | `string\|function` | The query to execute                                         |
| `beforeQuery` | `function`         | Lifecycle hook; prepares variables and options for the query |
| `isEmpty`     | `function`         | Lifecycle hook; decides if Cell should render Empty          |
| `afterQuery`  | `function`         | Lifecycle hook; sanitizes data returned from the query       |
| `Loading`     | `component`        | If the request is in flight, render this component           |
| `Empty`       | `component`        | If there's no data (`null` or `[]`), render this component   |
| `Failure`     | `component`        | If something went wrong, render this component               |
| `Success`     | `component`        | If the data has loaded, render this component                |

Only `QUERY` and `Success` are required. If you don't export `Empty`, empty results are sent to `Success`, and if you don't export `Failure`, error is output to the console.

In addition to displaying the right component, Cells also make sure to funnel the right props to the right component.  `Loading`, `Empty`, `Failure`, and `Success` all have access to the props passed down from the Cell in good ol' React fashion, and most of `useQuery`'s return (more on that below). In addition to all those props, `Empty` and `Success` also get the `data` returned from the query and an `updating` boolean prop saying whether the Cell is currently fetching new data or not. `Failure` also gets `updating` and exclusive access to `error` and `errorCode`.

With this many props coming in, there's a risk of name clashing. A couple things to look out for are:

- Your Cell has a prop with the same name as root-level data returned by your query.
  - In this case, the root-level data overrides your prop. But since props double as query variables, you can destructure the `variables` prop that `useQuery` returns to retrieve it. Or you can just rename the prop on the Cell!

- Your Cell has props or query results with the same name as any of `useQuery`'s returns.
  - In this case, `useQuery`'s returns overwrite the props and results.

We mentioned above that Cells receive "most" of what's returned from `useQuery`. You can see exactly what `useQuery` returns in Apollo Client's [API reference](https://www.apollographql.com/docs/react/api/react/hooks/#result). Note that, as we just mentioned, `error` and `data` get some special treatment.

### QUERY

`QUERY` can be a string or a function. Note that it's totally more than ok to have more than one root query. Here's an example of that:

```jsx {7-10}
export const QUERY = gql`{
  query {
    posts {
      id
      title
    }
    authors {
      id
      name
    }
  }
}
```

So in this case, both `posts` and `authors` would be available to `Success`:

```jsx
export const Success = ({ posts, authors }) => {
  // render logic with posts and authors
}
```

If `QUERY` is a function, it has to return a valid GraphQL document.
Use a function if your queries need to be more dynamic:

<!-- Source: https://community.redwoodjs.com/t/custom-github-jwt-auth-with-redwood-auth-advice-needed/610 -->
But what about variables? Well, Cells are setup to use any props they receive from their parent as variables (things are setup this way in `beforeQuery`). For example, here `BlogPostCell` takes a prop, `numberToShow`, so `numberToShow` is just available to your `QUERY`:

```jsx {7}
import BlogPostsCell from 'src/components/BlogPostsCell'

const HomePage = () => {
  return (
    <div>
      <h1>Home</h1>
      <BlogPostsCell numberToShow={3} />
    </div>
  )
}

export default HomePage
```

```jsx {2-3}
export const QUERY = gql`
  query($numberToShow: Int!) {
    posts(numberToShow: $numberToShow) {
      id
      title
    }
  }
`
```

This means you can think backwards about your Cell's props from your SDL: whatever the variables in your SDL are, that's what your Cell's props should be.

### beforeQuery

`beforeQuery` is a lifecycle hook. The best way to think about it is as an API for configuring Apollo Client's `Query` component (so you might want to check out Apollo's [docs](https://www.apollographql.com/docs/react/api/react-components/#query) for it).

By default, `beforeQuery` gives any props passed from the parent component to `Query` so that they're available as variables for `QUERY`. It'll also set the fetch policy to `'cache-and-network'` since we felt it matched the behavior users want most of the time.

```jsx
export const beforeQuery = (props) => {
  return {
    variables: props,
    fetchPolicy: 'cache-and-network'
   }
}
```

For example, if you wanted to turn on Apollo's polling option, and prevent caching, you could export something like this (see Apollo's docs on [polling](https://www.apollographql.com/docs/react/data/queries/#polling) and [caching](https://www.apollographql.com/docs/react/data/queries/#setting-a-fetch-policy))

<!-- Source: https://github.com/redwoodjs/redwood/issues/717 -->
```jsx
export const beforeQuery = (props) => {
  return { variables: props, fetchPolicy: 'no-cache', pollInterval: 2500 }
}
```

### isEmpty

`isEmpty` is an optional lifecycle hook. It returns a boolean to indicate if Cell is empty. Use it to override the [default check](#empty).

It receives the `data`, and the default check reference `isDataEmpty`, so it's possible to extend the default check with custom logic.

```jsx
export const isEmpty = (data, { isDataEmpty }) =>
  isDataEmpty(data) || data?.blog?.status === 'hidden'
```

### afterQuery

`afterQuery` is a lifecycle hook. It runs just before data gets to `Success`.
Use it to sanitize data returned from `QUERY` before it gets there.

By default, `afterQuery` just returns the data as it is:

```jsx
export const afterQuery = (data) => ({...data})
```

### Loading

If there's no cached data and the request is in flight, a Cell renders `Loading`.

<!-- For a production example, navigate to [predictcovid.com](https://predictcovid.com), the first site made with Redwood. Usually, when you first navigate there, you'll see most of the dashboard spinning. Those are `Loading` components in action! -->

When you're developing locally, you can catch your Cell waiting to hear back for a moment if set your speed in the Inspector's **Network** tab to something like "Slow 3G".

But why bother with Slow 3G when Redwood comes with Storybook? Storybook makes developing components like `Loading` (and `Failure`) a breeze. We don't have to put up with hacky workarounds like Slow 3G or intentionally breaking our app just to develop our components.

### Empty

A Cell renders this component if there's no data.

What do we mean by no data? We mean if the response is 1) `null` or 2) an empty array (`[]`). There's actually four functions in [createCell.tsx](https://github.com/redwoodjs/redwood/blob/main/packages/web/src/components/createCell.tsx) dedicated just to figuring this out:

```jsx title="createCell.tsx"
const isDataNull = (data: DataObject) => {
  return dataField(data) === null
}

const isDataEmptyArray = (data: DataObject) => {
  const field = dataField(data)
  return Array.isArray(field) && field.length === 0
}

const dataField = (data: DataObject) => {
  return data[Object.keys(data)[0]]
}

const isEmpty = (data: DataObject) => {
  return isDataNull(data) || isDataEmptyArray(data)
}
```

### Failure

A Cell renders this component if something went wrong. You can quickly see this in action (it's easy to break things) if you add a nonsense field to your `QUERY`:

```jsx {6}
const QUERY = gql`
  query {
    posts {
      id
      title
      nonsense
    }
  }
`
```

But, like `Loading`, Storybook is probably a better place to develop this.

<!-- In development, we have it so that errors blanket the page.
In production, failed cells won't break your app, they'll just be empty divs... -->

In this example, we use the `errorCode` to conditionally render the error heading title, and we also use it for our translation string.
```jsx
export const Failure = ({ error, errorCode }: CellFailureProps) => {
  const { t } = useTranslation()
  return (
    <div style={{ color: 'red' }}>
      {errorCode === 'NO_CONFIG' ? <h1>NO_CONFIG</h1> : <h1>ERROR</h1>}
      Error: {error.message} - Code: {errorCode} - {t(`error.${errorCode}`)}
    </div>
  )
}
```

### Success

If everything went well, a Cell renders `Success`.

As mentioned, Success gets exclusive access to the `data` prop. But if you try to destructure it from props, you'll notice that it doesn't exist. This is because Redwood adds another layer of convenience: in [createCell.tsx](https://github.com/redwoodjs/redwood/blob/main/packages/web/src/components/createCell.tsx#L149), Redwood spreads `data` (using the spread operator, `...`) into `Success` so that you can just destructure whatever data you were expecting from your `QUERY` directly.

So, if you're querying for `posts` and `authors`, instead of doing:

```jsx
export const Success = ({ data }) => {
  const { posts, authors } = data

  // render logic with posts and authors
  ...
}
```

Redwood does:

```jsx
export const Success = ({ posts, authors }) => {
  // render logic with posts and authors
  ...
}
```

Note that you can still pass any other props to `Success`. After all, it's still just a React component.

### When should I use a Cell?

Whenever you want to fetch data. Let Redwood juggle what's displayed when. You just focus on what those things should look like.

While you can use a Cell whenever you want to fetch data, it's important to note that you don't have to. You can do anything you want! For example, for one-off queries, there's always `useApolloClient`. This hook returns the client, which you can use to execute queries, among other things:

```jsx
// In a react component...

client = useApolloClient()

client.query({
  query: gql`
    ...
  `
})
```

### Can I Perform a Mutation in a Cell?

Absolutely. We do so in our [example todo app](https://github.com/redwoodjs/example-todo/blob/f29069c9dc89fa3734c6f99816442e14dc73dbf7/web/src/components/TodoListCell/TodoListCell.js#L26-L44).
We also don't think it's an anti-pattern to do so. Far from it—your cells might end up containing a lot of logic and really serve as the hub of your app in many ways.

It's also important to remember that, besides exporting certain things with certain names, there aren't many rules around Cells&mdash;everything you can do in a regular component still goes.

## How Does Redwood Know a Cell is a Cell?

You just have to end a filename in "Cell" right? Well, while that's basically correct, there is one other thing you should know.

Redwood looks for all files ending in "Cell" (so if you want your component to be a Cell, its filename does have to end in "Cell"), but if the file 1) doesn't export a const named `QUERY` and 2) has a default export, then it'll be skipped.

When would you want to do this? If you just want a file to end in "Cell" for some reason. Otherwise, don't worry about it!

<!-- Source: https://github.com/redwoodjs/redwood/pull/597 -->
<!-- Source: https://github.com/redwoodjs/redwood/pull/554 -->
<!-- Code: https://github.com/redwoodjs/redwood/blob/60cb628d5f369d62607fa2f47c694d9a5c00540d/packages/core/config/babel-preset.js#L132-L136 -->
<!-- Code: https://github.com/redwoodjs/redwood/blob/60cb628d5f369d62607fa2f47c694d9a5c00540d/packages/core/src/babel-plugin-redwood-cell.ts#L58-L60 -->

## Advanced Example: Implementing a Cell Yourself

If we didn't do all that build-time stuff for you, how might you go about implementing a Cell yourself?

Consider the [example from the Tutorial](tutorial/chapter2/cells.md#our-first-cell) where we're fetching posts:

```jsx
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

And now let's say that Babel isn't going to come along and assemble our exports. What might we do?

We'd probably do something like this:

<!-- {35,39,44,47,49} -->
```jsx
const QUERY = gql`
  query {
    posts {
      id
      title
      body
      createdAt
    }
  }
`

const Loading = () => <div>Loading...</div>

const Empty = () => <div>No posts yet!</div>

const Failure = ({ error }) => (
  <div>Error loading posts: {error.message}</div>
)

const Success = ({ posts }) => {
  return posts.map((post) => (
    <article>
      <h2>{post.title}</h2>
      <div>{post.body}</div>
    </article>
  ))
}

const isEmpty = (data) => {
  return isDataNull(data) || isDataEmptyArray(data)
}

export const Cell = () => {
  return (
    <Query query={QUERY}>
      {({ error, loading, data }) => {
        if (error) {
          if (Failure) {
            return <Failure error={error} />
          } else {
            console.error(error)
          }
        } else if (loading) {
          return <Loading />
        } else if (data) {
          if (typeof Empty !== 'undefined' && isEmpty(data)) {
            return <Empty />
          } else {
            return <Success {...data} />
          }
        } else {
          throw 'Cannot render Cell: graphQL success but `data` is null'
        }
      }}
    </Query>
  )
}
```

That's a lot of code. A lot of imperative code too.

We're basically just dumping the contents of [createCell.tsx](https://github.com/redwoodjs/redwood/blob/main/packages/web/src/components/createCell.tsx) into this file. Can you imagine having to do this every time you wanted to fetch data that might be delayed in responding? Yikes.
