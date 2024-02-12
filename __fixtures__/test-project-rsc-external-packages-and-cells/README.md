RW smoke-test fixture project for an app that tests two RSC related features
  1. imports external npm packages
  2. Uses client cells to do client-side gql data fetching

Mainly these things are tested:
  * Importing a package with company scope (@ and / in its name)
  * Importing a package that uses the 'use client' directive
  * Using the 'client-only' package
  * Using the 'server-only' package
  * Imports a traditional RW Cell into a page (that's, like all pages, a server
    component) to verify that we can still do client side GQL data fetching
    like we've always been able to do

Used by `.github/actions/set-up-rsc-from-fixture`
