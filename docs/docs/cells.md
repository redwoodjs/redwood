# Cells

Cells are a declarative approach to data fetching and one of Redwood's signature modes of abstraction.
By providing conventions around data fetching, Redwood can get in between the request and the response to do things like query optimization and more, all without you ever having to change your code.

While it might seem like there's a lot of magic involved, all a Cell really does is execute a GraphQL query and manage its lifecycle.
The idea is that, by exporting named constants that declare what you want your UI to look like throughout a query's lifecycle,
Redwood can assemble these into a component template at build-time using a Babel plugin.
All without you having to write a single line of imperative code!

## Generating a Cell

```
yarn rw generate cell <name>
```

This creates a directory named `<name>Cell` in `web/src/components` with four files:

```
web/src/components/<name>Cell/
├── <name>Cell.js
├── <name>Cell.stories.js
├── <name>Cell.test.js
└── <name>Cell.mock.js
```

### Single Item Cell vs List Cell

Sometimes you want a Cell that renders a single item, like the example above, and other times you want a Cell that renders a list.
The Cell generator can do both.

First, the Cell generator detects if `<name>` is singular or plural.
So to generate a Cell that renders a list of users, you can run `yarn rw generate cell users`.
Second, for words whose singular and plural are identical, such as *equipment* or *pokemon*, you can specify the `--list` flag to tell Redwood to generate a list Cell explicitly:

```
yarn rw generate cell equipment --list
```

## Usage

With Cells, you have a total of eight exports to work with:

| Name          | Type                 | Description                                            |
| :------------ | :------------------- | :----------------------------------------------------- |
| `QUERY`       | `string`, `function` | The query to execute                                   |
| `beforeQuery` | `function`           | Prepares variables and options for the query           |
| `isEmpty`     | `function`           | Decides if Cell should render Empty                    |
| `afterQuery`  | `function`           | Sanitizes data returned from the query                 |
| `Loading`     | `component`          | If the request is in flight, render this component     |
| `Empty`       | `component`          | If there's no data, render this component              |
| `Failure`     | `component`          | If something went wrong, render this component         |
| `Success`     | `component`          | If the data successfully loaded, render this component |

A generated Cell exports five: `QUERY`, `Loading` , `Empty` , `Failure`  and `Success`.

The root query in `QUERY` is the same as `<name>` so that, if you're generating a cell based on a model in your `schema.prisma`, you can get something out of the database right away.
But there's a good chance you won't generate your Cell this way, so if you need to, make sure to change the root query.
See the [Cells](tutorial/chapter2/cells.md#our-first-cell) section of the Tutorial for a great example of this.

Strictly speaking, only `QUERY` and `Success` are required.
If you don't export `Empty`, empty results are sent to `Success`, and if you don't export `Failure`, error is output to the console.

In addition to displaying the right component, Cells also make sure to funnel the right props to the right component.
`Loading`, `Empty`, `Failure`, and `Success` all have access to the props passed down from the Cell in classic-React fashion, and most of `useQuery`'s return (more on that below).
In addition to all those props, `Empty` and `Success` also get the `data` returned from the query and an `updating` boolean prop saying whether the Cell is currently fetching new data or not.
`Failure` also gets `updating` and exclusive access to `error` and `errorCode`.

With this many props at play, there's a risk of name clashing.
A couple things to look out for are:

- your Cell has a prop with the same name as root-level data returned by your query.
  - in this case, the root-level data overrides your prop. But since props double as query variables, you can destructure the `variables` prop that `useQuery` returns to retrieve it. Or you can just rename the prop on the Cell!
- your Cell has props or query results with the same name as any of `useQuery`'s returns.
  - in this case, `useQuery`'s returns overwrite the props and results.

We mentioned above that Cells receive "most" of what's returned from `useQuery`. You can see exactly what `useQuery` returns in Apollo Client's [API reference](https://www.apollographql.com/docs/react/api/react/hooks/#result). Note that, as we just mentioned, `error` and `data` get some special treatment.

### QUERY

It's more-than ok to have more than one root query:

```js {7-10}
export const QUERY = gql`
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
`
```

In this case, both `posts` and `authors` are available to `Success`:

```jsx
export const Success = ({ posts, authors }) => {
  // ...
}
```

What about variables?
To pass a variable to a Cell's `QUERY`, just pass a prop of the same name.

For example, `BlogPostCell`'s `QUERY` needs one variable, `numberToShow`.

```jsx {2-3} title="web/src/components/BlogPostCell/BlogPostCell.js"
export const QUERY = gql`
  query($numberToShow: Int!) {
    posts(numberToShow: $numberToShow) {
      id
      title
    }
  }
`
```

Let's say we're rendering the `BlogPostCell` on the `HomePage`.
Just pass `numberToShow`:

```jsx {7} title="web/src/pages/HomePage/HomePage.js"
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

It may be helpful to think backwards about your Cell's props from your SDL.
The variables in your SDL double as your Cell's props.

### beforeQuery

`beforeQuery` is a lifecycle hook.
It receives the props passed to the component and its returns is passed to Apollo Client's `useQuery` hook:

```js
export const beforeQuery = (props) => {
  return {
    variables: props,
    fetchPolicy: 'cache-and-network'
   }
}
```

The code snippet above is `beforeQuery`'s default value.
It passes along `props` to `useQuery` as variables and sets the fetch policy to `'cache-and-network'` since we felt it matched the behavior users want most of the time.

The best way to think about it is as an API for configuring Apollo Client's `useQuery` hook (so you may want to check out Apollo's [docs](https://www.apollographql.com/docs/react/api/react/hooks/#usequery)).
For example, if you want to turn on Apollo Client's polling option and prevent caching, you could export something like this:

```js
export const beforeQuery = (props) => {
  return {
    variables: props,
    // highlight-start
    fetchPolicy: 'no-cache',
    pollInterval: 2_500
    // highlight-end
  }
}
```

### isEmpty

`isEmpty` is a lifecycle hook. It returns a boolean to indicate if Cell is empty. Use it to override the [default check](#empty).

It receives the `data`, and the default check reference `isDataEmpty`, so it's possible to extend the default check with custom logic.

```jsx
export const isEmpty = (data, { isDataEmpty }) =>
  isDataEmpty(data) || data?.blog?.status === 'hidden'
```

### afterQuery

`afterQuery` is a lifecycle hook. It runs just before `data` gets to `Success`.
You can use it to sanitize `data` returned from `QUERY`.

### Loading

If there's no cached data and the request is in flight, a Cell renders `Loading`.

Storybook makes developing components like `Loading` (and `Failure`) a breeze.
We don't have to put up with hacky workarounds like Slow 3G or intentionally breaking our app just to develop our components.

### Empty

A Cell renders this component if there's no data.

What do we mean by "no data"?
We mean if the response is 1) `null` or 2) an empty array (`[]`).
But you can also decide for yourself by re-exporting `isEmpty`.

### Failure

A Cell renders this component if something went wrong.

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

As mentioned, Success gets exclusive access to the `data` prop.
But if you try to destructure it from props, you'll notice that it doesn't exist.
This's because Redwood tries to make things a little more convenient by spreading `data` into `Success`'s so that you can just destructure whatever you were expecting from your `QUERY` directly.

Note that you can still pass any other props to `Success`. After all, it's just a React component.

### When should I use a Cell?

When you want to fetch data.
Let Redwood juggle what's displayed when—just focus on what those things should look like.

While you can use a Cell when you want to fetch data, it's important to keep in mind that you don't have to.
At the end of the day, the frontend is just a React component, so you can do anything you want!

For example, for one-off queries, there's always `useApolloClient`:

```jsx
// In a react component...

client = useApolloClient()

client.query({
  query: gql`
    # ...
  `
})
```

### Can I Perform a Mutation in a Cell?

Absolutely.
We do so in our [example todo app](https://github.com/redwoodjs/example-todo/blob/f29069c9dc89fa3734c6f99816442e14dc73dbf7/web/src/components/TodoListCell/TodoListCell.js#L26-L44).
And we don't think it's an anti-pattern to do so.
A Cell may end up containing a lot of logic and serve as the hub of your app in many ways.

It's also important to remember that, besides exporting certain things with certain names, there aren't many rules around Cells&mdash;everything you can do in a regular component still goes.

## How Does Redwood Know a Cell is a Cell?

You just have to end a file in "Cell" right? Well, while that's basically correct, there is one other thing you should know.
Redwood looks for all files ending in "Cell" (so if you want your component to be a Cell, its name does have to end in "Cell"), but if the file 1) doesn't export a const named `QUERY` and 2) has a default export, then it'll be skipped.

When would you want to do this? If you just want a file to end in "Cell" for some reason.
Otherwise, don't worry about it!

## Advanced Example: Implementing a Cell Yourself

If Redwood didn't do all that build-time stuff for you, how might you go about implementing a Cell yourself?

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

And now let's say that Babel isn't going to come along.
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

That's a lot of code. A lot of imperative code.

We're basically just dumping the contents of [createCell.tsx](https://github.com/redwoodjs/redwood/blob/main/packages/web/src/components/createCell.tsx) into this file. Can you imagine having to do this every time you wanted to fetch data that might be delayed in responding? Yikes.
