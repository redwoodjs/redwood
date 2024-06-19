// These declarations are based on the webpack bundler settings
// For svgs we use a babel-plugin
// see: redwood/packages/internal/src/build/babel/web.ts

// For other assets, we're using webpack asset loader
// see: redwood/packages/core/config/webpack.common.js
// These declarations are the most common types

/// <reference types="vite/client" />

/**
 * @NOTE
 * Declare module syntax does not work in ESM projects.
 *
 * I'm just trying to import Vite's types here and 🤞 it works.
 *
 * REMEMBER TO VALIDATE THIS!
 */
