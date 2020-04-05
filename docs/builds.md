# Builds

## API

The api side of Redwood is transpiled by Babel into the `./api/dist` folder.

### steps on Netlify

To emulate Netlify's build steps locally:

```bash
yarn rw build api
cd api
yarn zip-it-and-ship-it dist/functions/ zipballs/
```

Each lambda function in `./api/dist/functions` is parsed by zip-it-and-ship-it resulting in a zip file per lambda function that contains all the dependencies required by for that lambda function.

## Web

The web side of Redwood is packaged by Webpack into the `./web/dist` folder.
