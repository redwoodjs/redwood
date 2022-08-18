/**
 * # RedwoodJS's Babel Config
 *
 * This Babel config is for the framework--all the `@redwoodjs/*` packages. NOT for apps.
 * You can find that babel config in ./packages/internal/src/build/babel/common.ts.
 *
 * We use the recommended strategy for monorepos (see https://babeljs.io/docs/en/config-files#monorepos):
 *
 * - a babel.config.js file (this one) in the root directory
 * - per-project .babelrc.js files
 *
 * ## Historical Note
 *
 * Many options that `@babel/preset-env` took--targets, assumptions (formerly, `loose`)--are now at the top level[^1].
 * This is mainly the result of babel rethinking their polyfilling story[^2].
 *
 * `targets` in particular is super important. It used to be an option to `@babel/preset-env`,
 * but that meant other presets/plugins didn't know about it. `targets` didn't matter for most of them,
 * but `plugin-transform-runtime`, which was responsible for polyfilling, really should've known about it.
 *
 * Since the plugin we used for polyfilling didn't know what we were targeting, it polyfilled as much as it could.
 * That's why we saw things like `Array.prototype.forEach` (which has been in Node.js since 0.10.0) being polyfilled.
 *
 * But now that `targets` is top-level, all presets and plugins know the target, and only do as much as they need to.
 *
 * (Also, by specifying core-js options in `@babel/preset-env` and `plugin-transform-runtime`, we were effectively polyfilling twice.
 * But since `@babel/preset-env` knew the target, it didn't include much.)
 *
 * [^1]:
 * - https://babeljs.io/blog/2021/02/22/7.13.0#top-level-targets-option-12189httpsgithubcombabelbabelpull12189-rfchttpsgithubcombabelrfcspull2
 * - https://github.com/babel/rfcs/blob/main/rfcs/0002-top-level-targets.md.
 * - https://github.com/babel/rfcs/blob/main/rfcs/0003-top-level-assumptions.md.
 * [^2]: https://github.com/babel/rfcs/blob/main/rfcs/0001-rethink-polyfilling-story.md.
 *
 * ## targets
 *
 * Answers the question "Where's the code going to run?"
 *
 * It dictates syntax transforms and polyfills. So it's very important!
 * All RedwoodJS packages target Node.js 14.x.x, but we override it for web packages.
 *
 * We need to bump this at a regular cadence. It's mainly deployment providers (Netlify, Vercel) that dictate this.
 *
 * ## assumptions
 *
 * We can tell Babel to cut some corners we don't care about to produce smaller or more-performant code.
 * See https://babeljs.io/docs/en/assumptions#enumerablemodulemeta.
 *
 * ## plugins -> @babel/plugin-transform-runtime
 *
 * This one is an optimization; it dedupes babel-specific helpers. See https://babeljs.io/docs/en/babel-plugin-transform-runtime.
 *
 * ## plugins -> babel-plugin-polyfill-corejs3
 *
 * This one does all the polyfilling. We use the "usage-pure" method because we want polyfills
 * to be imported in a way that doesn't pollute the global environment:
 *
 * ```
 * // in
 * let obj = Object.fromEntries(entries);
 *
 * // out
 * import _ObjectFromEntries from "object-polyfills/from-entries";
 * let obj = _ObjectFromEntries(entries);
 * ```
 *
 * The "usage" part means Babel only polyfills what we use, not everything it possibly can.
 * See https://github.com/babel/babel-polyfills/blob/main/docs/usage.md#method.
 */

// This's used in the `babel-plugin-polyfill-corejs3` plugin below.
// It's recommended to specify the version of core-js used up to the minor version, like "3.6".
// Just specifying the major version won't inject modules added in minor releases.
// See https://github.com/zloirock/core-js/blob/master/README.md#babelpreset-env.
const path = require('path')
const packageJSON = require(path.join(__dirname, 'package.json'))
const CORE_JS_VERSION = packageJSON.devDependencies['core-js-pure']
  .split('.')
  .slice(0, 2)
  .join('.')

// FIXME: this interface seems a little outdated.
/** @type {import('@babel/core').TransformOptions} */
module.exports = {
  targets: {
    node: '14.20',
  },

  assumptions: {
    enumerableModuleMeta: true,
  },

  presets: [
    '@babel/preset-env',
    '@babel/preset-react',
    '@babel/typescript',
  ],

  plugins: [
    [
      '@babel/plugin-transform-runtime',
      {
        // This plugin assumes that @babel/runtime@7.0.0 is installed. Specifying the version can result in a smaller bundle size.
        // See https://babeljs.io/docs/en/babel-plugin-transform-runtime/#version.
        version: packageJSON.devDependencies['@babel/runtime'],
      },
    ],
    [
      'babel-plugin-polyfill-corejs3',
      {
        method: 'usage-pure',
        version: CORE_JS_VERSION,
        // See https://github.com/babel/babel-polyfills/issues/105.
        include: [
          'es.promise',
        ],
      },
    ],
  ],

  overrides: [
    // ** WEB PACKAGES **
    //
    // Override `targets` and auto import React.
    {
      test: [
        './packages/auth/',
        './packages/forms/',
        './packages/router',
        './packages/web/',
      ],
      // Run `npx browserslist "defaults, not IE 11, not IE_Mob 11"` to see a list of target browsers.
      targets: {
        browsers: ['defaults', 'not IE 11', 'not IE_Mob 11'],
      },
      plugins: [
        [
          'babel-plugin-auto-import',
          {
            declarations: [
              {
                // import { React } from 'react'
                default: 'React',
                path: 'react',
              },
              {
                // import { PropTypes } from 'prop-types'
                default: 'PropTypes',
                path: 'prop-types',
              },
            ],
          },
        ],
      ],
    },

    // ** STRUCTURE PACKAGE **
    //
    // The structure package needs a legacy version of the decorators proposal. See https://github.com/tc39/proposal-decorators.
    {
      test: ['./packages/structure'],
      plugins: [
        [
          '@babel/plugin-proposal-decorators',
          {
            legacy: true,
          },
        ],
      ],
    },
  ],

  // Ignore test directories when we're not testing.
  ignore:
    process.env.NODE_ENV === 'test'
      ? []
      : [/\.test\.(js|ts)/, '**/__tests__', '**/__mocks__', '**/__snapshots__'],
}
