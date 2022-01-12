# redwoodjs.com

This is the repo for https://redwoodjs.com

The content for the tutorials are managed along with localization over at [learn.redwoodjs.com](https://github.com/redwoodjs/learn.redwoodjs.com).

Other documentation is pulled from various READMEs in the main [redwoodjs/redwood](https://github.com/redwoodjs/redwood) repo (see `lib/build.js`, the `SECTIONS` constant).

## Local Development

This codebase is built with https://cameronjs.com and relies on plain HTML pages and Javascript with a couple helpers built in to abstract things like partials and layouts. We use https://stimulusjs.org for the few sprinkles of interactivity throughout the site.

First, make sure that you are running Node 14+. If you're not sure of how to manage your node versions, see [nvm](https://github.com/nvm-sh/nvm) or [nvm-windows](https://github.com/coreybutler/nvm-windows).

Then build the tutorial and doc pages (after you've installed all dependencies with `yarn install`):

    yarn build

And to develop locally (you'll need to run `yarn build` once first in order to generate some of the navigation menus):

    yarn dev

If you are already running a `yarn dev` process, when you `yarn build`, you may need to stop and start `yarn dev` to pick up the new pages properly.

## Contributing

Open a PR against the repo on GitHub. That will build and launch a copy of the site that you can get from the `netlify/redwoodjs/deploy-preview` check (click "Details" to open it):

![image](https://user-images.githubusercontent.com/300/76569613-c4421000-6470-11ea-8223-eb98504e6994.png)

Double check that your changes look good!

## Contributors

Redwood is amazing thanks to a wonderful [community of contributors](https://github.com/redwoodjs/redwood/blob/main/README.md#contributors).
