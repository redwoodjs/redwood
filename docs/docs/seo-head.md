---
description: Use meta tags to set page info for SEO
---

# SEO & Meta tags

## Add app title
You certainly want to change the title of your Redwood app.
You can start by adding or modify `title` inside `redwood.toml`

```diff
[web]
- title = "Redwood App"
+ title = "My Cool App"
  port = 8910
  apiUrl = "/.redwood/functions"
```
This title (the app title) is used by default for all your pages if you don't define another one.
It will also be use for the title template !
### Title template
Now that you have the app title set, you probably want some consistence with the page title, that's what the title template is for.

Add `titleTemplate` as a prop for `RedwoodProvider` to have a title template for every pages

In _web/src/App.{tsx,js}_
```diff
-  <RedwoodProvider>
+  <RedwoodProvider titleTemplate="%PageTitle | %AppTitle">
    /* ... */
  <RedwoodProvider />
```

You can write the format you like.

_Examples  :_
```jsx
"%PageTitle | %AppTitle" => "Home Page | Redwood App"

"%AppTitle · %PageTitle" => "Redwood App · Home Page"

"%PageTitle : %AppTitle" => "Home Page : Redwood App"
```

So now in your page you only need to write the title of the page.

## Adding to page `<head>`
So you want to change the title of your page, or add elements to the `<head>` of the page? We've got you!


Let's say you want to change the title of your About page,
Redwood provides a built in `<Head>` component, which you can use like this


In _AboutPage/AboutPage.{tsx,js}_
```diff
+import { Head } from '@redwoodjs/web'

const AboutPage = () => {
  return (
    <div>
      <h2>AboutPage</h2>
+     <Head>
+       <title>About the team</title>
+     </Head>
```

You can include any valid `<head>` tag in here that you like, but just to make things easier we also have a utility component [MetaTags](#setting-meta-tags-open-graph-directives).

### What about nested tags?
Redwood uses [react-helmet-async](https://github.com/staylor/react-helmet-async) underneath, which will use the tags furthest down your component tree.

For example, if you set title in your Layout, and a title in your Page, it'll render the one in Page - this way you can override the tags you wish, while sharing the tags defined in Layout.


> **Side note**
> for these headers to appear to bots and scrapers e.g. for twitter to show your title, you have to make sure your page is prerendered
> If your content is static you can use Redwood's built in [Prerender](prerender.md). For dynamic tags, check the [Dynamic head tags](#dynamic-tags)

## Setting meta tags / open graph directives
Often we want to set more than just the title - most commonly to set "og" headers. Og standing for
[open graph](https://ogp.me/) of course.

Redwood provides a convenience component `<MetaTags>` to help you get all the relevant tags with one go (but you can totally choose to do them yourself)

Here's an example setting some common headers, including how to set an `og:image`
```jsx
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

This is great not just for link unfurling on say Facebook or Slack, but also for SEO. Take a look at the [source](https://github.com/redwoodjs/redwood/blob/main/packages/web/src/components/MetaTags.tsx#L83) if you're curious what tags get set here.


## Dynamic tags
Great - so far we can see the changes, and bots will pick up our tags if we've prerendered the page, but what if I want to set the header based on the output of the Cell?

> **Prerendering cells**<br/>
> As of v3.x, Redwood supports prerendering your [Cells](https://redwoodjs.com/docs/cells) with the data you were querying. For more information please refer [to this section](https://redwoodjs.com/docs/prerender#cell-prerendering).


Let's say in our PostCell, we want to set the title to match the Post.
```jsx
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
      <MetaTags
        title={post.title}
        author={post.author.name}
        description={post.snippet}
      />
      <Post post={post} />
    </>
  )
}
```
Once the success component renders, it'll update your page's title and set the relevant meta tags for you!
