# SEO & Meta tags

Making your app findable is arguably just as important as making your app.
Along with quality content, meta tags go a long way towards improving SEO, and Redwood has a built-in way of working with them.

> For these headers to appear to search engines and web crawlers e.g. for twitter to show your title, you have to make sure your page is prerendered
> Make sure you prerender your pages.
> If your content is static you can use Redwood's built in [Prerender](prerender.md).
> For dynamic tags, check the [Dynamic head tags](#dynamic-tags)

## Your App's Title

At some point, you'll probably want to change the title of your app.
You can do so by changing the `title` key in `redwood.toml`

```diff title="redwood.toml"
[web]
- title = "Redwood App"
+ title = "My Cool App"
```

### `RedwoodProvider`'s `titleTemplate` prop

While the title will vary with the page, you still probably want some consistency.
That's `RedwoodProvider`'s `titleTemplate` is for.

```jsx title="web/src/App.js"
import { FatalErrorBoundary, RedwoodProvider } from '@redwoodjs/web'

// ...

const App = () => (
  <FatalErrorBoundary page={FatalErrorPage}>
    // highlight-next-line
    <RedwoodProvider titleTemplate="%PageTitle | %AppTitle">
      {/* ... */}
    </RedwoodProvider>
  </FatalErrorBoundary>
)

export default App
```

Now you only need to provide the title of the page.

## Adding to page `<head>`

If you want to change the title of your page or add elements to the `<head>` of the page, use the `Head` component.

For example, to change the title of the About page:

```jsx title="web/src/pages/AboutPage/AboutPage.js"
// highlight-next-line
import { Head } from '@redwoodjs/web'

const AboutPage = () => {
  return (
    <>
      <h2>AboutPage</h2>
      // highlight-start
      <Head>
        <title>About the team</title>
      </Head>
      // highlight-end
      {/* JSX... */}
    </>
  )
}

export default AboutPage
```

To make things easier, Redwood has a utility component.
See [MetaTags](#setting-meta-tags-open-graph-directives).

### What about nested tags?

Redwood uses [react-helmet-async](https://github.com/staylor/react-helmet-async) which uses the tags furthest down the React component tree.
For example, if you set `title` in a Layout and `title` in a Page, it'll render the one in Page.

## Setting meta tags / open graph directives

Usually we want to set more than just the title.
Most commonly to set "og" headers.
OG stands for for [open graph](https://ogp.me/).

Redwood provides a convenience component `<MetaTags>` to help you get all the relevant tags with one go (but you can totally choose to do them yourself)

Here's an example setting some common headers, including how to set an `og:image`

```jsx title="web/src/pages/AboutPage/AboutPage.js"
import { MetaTags } from '@redwoodjs/web'

const AboutPage = () => {
  return (
    <div>
      <h2>AboutPage</h2>
      <MetaTags
        title="About page"
        description="About the awesome team"
        ogUrl="https://awesomeredwoodapp.com/start"
        ogContentUrl="https://awesomeredwoodapp.com/static/og.png"
        robots={['nofollow']}
        locale={}
      />
      <p className="font-light">This is the about page!</p>
    </div>
  )
}

export default AboutPage
```

This is great not just for link unfurling on say Facebook or Slack, but also for SEO.

## Dynamic tags

So far search engines and crawlers will pick up our tags if we've prerendered the page, but what if we want to set the header based on the `QUERY` of a Cell?

> **`<head>`s up**
>
> For dynamic tags to appear to bots and link scrapers you have to setup an external prerendering service. If you're on Netlify you can use their [built-in one](https://docs.netlify.com/site-deploys/post-processing/prerendering/). Otherwise you can follow [this great how to](https://community.redwoodjs.com/t/cookbook-getting-og-and-meta-tags-working-with-nginx-pre-render-io-and-docker/2014) from the Redwood community

_Just keep in mind, that Cells are currently not prerendered_ - so it'll be visible to your users, but not to link scrapers and bots.

Let's say that in PostCell, we want to set the title to match the post:

```jsx title="web/src/components/PostCell/PostCell.js"
// highlight-next-line
import { MetaTags } from '@redwoodjs/web'
import Post from 'src/components/Post/Post'

export const QUERY = gql`
  query FindPostById($id: Int!) {
    post: post(id: $id) {
      title
      snippet
      author {
        name
      }
    }
  }
`

export const Loading = /* ... */

export const Empty = /* ... */

export const Success = ({ post }) => {
  return (
    <>
      // highlight-start
      <MetaTags
        title={post.title}
        author={post.author.name}
        description={post.snippet}
      />
      // highlight-end
      <Post post={post} />
    </>
  )
}
```

Once the success component renders, it'll update your page's title and set the relevant meta tags for you!
