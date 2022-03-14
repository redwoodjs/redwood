# learn.redwoodjs.com

Deployment URL: https://learn.redwoodjs.com/

[![Crowdin](https://badges.crowdin.net/learn-redwoodjs/localized.svg)](https://crowdin.com/project/learn-redwoodjs)

## Translation

We currently support English, French, Spanish, Portuguese and Italian, but wish to include more languages!

Hey polyglots, **want to help translate or proofread?** Check out the [Translation Guide](./README_TRANSLATION_GUIDE.md) to find out how to get started

### Docusaurus 2 + Crowdin

We are using a late stage Alpha release of [Docusuraus 2](https://v2.docusaurus.io/docs/next/) that includes experimental integration with l10n management service Crowdin. i18n is a bleeding edge feature of Docusaurus and official documentation has not been released yet. However, there is [unofficial documentation here](https://deploy-preview-4014--docusaurus-2.netlify.app/classic/docs/next/i18n/introduction/), and we also have [this PR](https://github.com/facebook/docusaurus/pull/3325) and [this explanatory comment](https://github.com/facebook/docusaurus/issues/3317#issuecomment-742589241) to reference.

We are also learning from the source code for [Jest website migration on `docusaurus-2` branch](https://github.com/jest-website-migration/jest/tree/docusaurus-2/website-v2), which is using this same undocumented setup for their localized docs. See their test site here: https://jest-v2.netlify.app/

## Getting started

```
yarn install

yarn start  # defaults to serving English locale
```

- **NOTE** Only one locale can be served in development at a time, so start yarn with the locale with it's language code if you want to test

```
yarn start --locale fr
```

P.S., the language switcher doesn't really work in development. No worries, things work better once the site is built and served. Try this and the locale switcher suddenly works:

```
yarn build

yarn serve
```

## Localized content

Source content markdown files are found in `docs/`, which map to locales in `i18n/%lang_code%/<plugin>/current/`.

```
├── docs
│   └── tutorial
├── i18n
│   └── fr
│       └── docusaurus-plugin-content-docs
│           └── current
│               └── tutorial
```

Target language codes follow [ISO 639-1 codes](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)

Localized content without a "counterpart" for the source content fallbacks to the source locale (English).

### Do not directly edit translations in this repo!

All translation is done via our [Crowdin repo](https://crowdin.com/project/learn-redwoodjs) to make sure our translations do not go stale.

Fully approved translations made from the above repo are auto-PR'ed into this Github repo (every 10 minutes).

Here's the lifecycle
![image](https://user-images.githubusercontent.com/9841162/105461058-8b062f00-5c41-11eb-94e4-4fa7e8dc397b.png)

### Keep in mind in source markdown

#### Static assets

If a static asset is referenced in the source markdown with a relative path (ex: `[]!(../img/logo.svg)`), the path will break in the target locale document which is in a differently nested directory.

**Use absolute paths** for local static assets that do not change across locales.

If it is an image that you feel absolutely inclined to localize, you can use relative paths and include files with the exact same name (with different image content) at the same relative path in all target dirs.
^ This is cumbersome - let's try to be as lazy as possible and not localize image assets unless totally necessary.

#### Internal linking

For links to other docs inside the `tutorials` directory, USE RELATIVE LINKS!

```
In [previous section](./our-first-page) we....
```

This ensures accurate linking no matter what locale a user is viewing.

```
# acessing ./our-first-page from within tutorial/* works in any locale

/docs/tutorial/our-first-page/
/fr/docs/tutorial/our-first-page/
```

## Crowdin

Crowdin is our localization (l10n) manager. We use a Github integration to sync our [Crowdin repo](https://crowdin.com/project/learn-redwoodjs) with this repo.

## Contact

Questions or ideas? Hit up @clairefro or drop a post in the Redwood forums under ["Docs & Content Translations"](https://community.redwoodjs.com/c/translations/10)
