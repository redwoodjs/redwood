# Storybook

Storybook enables a frontend-first, component-driven workflow.
By developing your UI components in isolation, you get to focus exclusively on your UI's needs,
saving you from getting too caught up in the details of your Prisma data models too early.

Storybook also makes debugging a lot easier.
You don't have to start the dev server, login as a user, tab through dropdowns, and click buttons just for that one bug to show up.
Or render a whole page and make six GraphQL calls just to change the color of a modal.
You can set it all up as a story, tweak it there as you see fit, and even test it for good measure.

<div class="video-container">
  <iframe src="https://www.youtube.com/embed/GfhPeOiXDLA?rel=0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; modestbranding; showinfo=0" allowfullscreen></iframe>
</div>

## Configuring Storybook

You only have to configure Storybook if you want to extend Redwood's default configuration, which handles things like how to find stories, configuring webpack, starting [Mock Service Worker](https://mswjs.io/), etc.

You only have to configure Storybook if you want to extend Redwood's default configuration, which handles things like how to find stories, configuring Webpack, starting Mock Service Worker, etc.
Note that you may have to create the `web/config` directory:

```
cd redwood-project/web
mkdir config
touch config/storybook.config.js config/storybook.manager.js config/storybook.preview.js
```

`storybook.config.js` configures Storybook's server, `storybook.manager.js` configures Storybook's UI, and `storybook.preview.js` configures the way stories render.
All of these files get merged with Redwood's default configurations, which you can find in the [`@redwoodjs/testing`](https://github.com/redwoodjs/redwood/tree/main/packages/testing/config/storybook) package.

### Configuring the Server with `storybook.config.js`

> Since `storybook.config.js` configures Storybook's server, any changes you make require restarting Storybook.

While you can configure [any of Storybook server's options](https://storybook.js.org/docs/react/configure/overview#configure-your-storybook-project) in `storybook.config.js`, you'll probably only want to configure `addons`:

```js title="web/config/storybook.config.js"
module.exports = {
  // This adds all of Storybook's essential addons.
  // See https://storybook.js.org/addons/tag/essentials.
  addons: ['@storybook/addon-essentials'],
}
```

### Configuring Rendering with `storybook.preview.js`

Sometimes you want to change the way all your stories render.
It'd be mixing concerns to add that logic to your actual components, and it'd get old fast to add it to every single `.stories.js` file.
Instead, decorate all your stories with any custom rendering logic you want in `storybook.preview.js`.

For example, something you may want to do is add some margin to all your stories so that they're not glued to the top left corner:

```jsx title="web/config/storybook.preview.js"
export const decorators = [
  (Story) => (
    <div style={{ margin: 48 }}>
      <Story />
    </div>
  ),
]
```

For more, see [Configure story rendering](https://storybook.js.org/docs/react/configure/overview#configure-story-rendering).

### Configuring the UI with `storybook.manager.js`

> Some of the changes you make to Storybook's UI require refreshing its cache.
> The easiest way to do so is when starting Storybook:
>
> ```
> yarn rw storybook --no-manager-cache
> ```

You can [theme Storybook's UI](https://storybook.js.org/docs/react/configure/theming) by adding two packages and making a few changes to Redwood's initial configuration.

Start by adding `@storybook/addons` and `@storybook/theming`.
From the root of your app:

```
yarn workspace web add -D @storybook/addons @storybook/theming
```

Then, create a `storybook.manager.js` file in `web/config`.
The change we'll make to the UI is enabling Storybook's dark theme:

```javascript title="web/config/storybook.manager.js"
import { addons } from '@storybook/addons'
import { themes } from '@storybook/theming'

addons.setConfig({
  theme: themes.dark,
})
```

For a guide on creating your own theme, see [Storybook's theming quickstart](https://storybook.js.org/docs/react/configure/theming#create-a-theme-quickstart).
