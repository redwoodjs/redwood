<!--@@joggrdoc@@-->
<!-- @joggr:version(v1):end -->
<!-- @joggr:warning:start -->
<!-- 
  _   _   _    __        __     _      ____    _   _   ___   _   _    ____     _   _   _ 
 | | | | | |   \ \      / /    / \    |  _ \  | \ | | |_ _| | \ | |  / ___|   | | | | | |
 | | | | | |    \ \ /\ / /    / _ \   | |_) | |  \| |  | |  |  \| | | |  _    | | | | | |
 |_| |_| |_|     \ V  V /    / ___ \  |  _ <  | |\  |  | |  | |\  | | |_| |   |_| |_| |_|
 (_) (_) (_)      \_/\_/    /_/   \_\ |_| \_\ |_| \_| |___| |_| \_|  \____|   (_) (_) (_)
                                                              
This document is managed by Joggr. Editing this document could break Joggr's core features, i.e. our 
ability to auto-maintain this document. Please use the Joggr editor to edit this document 
(link at bottom of the page).
-->
<!-- @joggr:warning:end -->
# RedwoodJS Docs

Deployment URL: https://redwoodjs.com/docs

## Getting started

Checkout this repo [(redwoodjs/redwood)](https://github.com/redwoodjs/redwood), `cd` into this directory (`docs`)

```
yarn install

yarn start
```

#### Making Changes

Changes should be made in the `./docs` directory and not in the generated `./versioned_docs` or `./versioned_sidebars` directories directly.

After running `yarn start`, you should be able to see your changes in the local [Canary Version](http://localhost:3000/docs/canary/index).

#### Internal linking

For links to other docs inside the `tutorials` directory you need to use *relative* links.

```
In [previous section](./first-page) we....
```

## Contributing

Fork the repo, make your changes and open a PR on GitHub. That will build and launch a copy of the site that you can get from the `netlify/redwoodjs/deploy-preview` check (click "Details" to open it):

![image](https://user-images.githubusercontent.com/300/76569613-c4421000-6470-11ea-8223-eb98504e6994.png)

Double check that your changes look good!

### Updating Doc Images
To update any images in the doc, first upload your screenshot into a comment textbox in your PR. Once it's uploaded, you can open the image in a new tab and use the github url as a image link in your docs.

## Contributors

Redwood is amazing thanks to a wonderful [community of contributors](https://github.com/redwoodjs/redwood/blob/main/README.md#contributors).

<!-- @joggr:editLink(67f37754-6768-44ad-80aa-d33e8995cdfc):start -->
---
<a href="https://app.joggr.io/app/documents/67f37754-6768-44ad-80aa-d33e8995cdfc/edit" alt="Edit doc on Joggr">
  <img src="https://storage.googleapis.com/joggr-public-assets/github/badges/edit-document-badge.svg" />
</a>
<!-- @joggr:editLink(67f37754-6768-44ad-80aa-d33e8995cdfc):end -->