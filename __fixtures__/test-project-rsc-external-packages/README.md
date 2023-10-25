RW smoke-test fixture project for an app that uses RSC and imports external npm
packages

Mainly these things are tested:
  * Importing a package with company scope (@ and / in its name)
  * Importing a package that uses the 'use client' directive
  * Using the 'client-only' package
  * Using the 'server-only' package

Used by `.github/actions/set-up-rsc-from-fixture`
