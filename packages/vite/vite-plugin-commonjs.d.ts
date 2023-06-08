// Override the typedef for vite-plugin-commonjs because it has issues with how its packaged
import type { Options } from 'vite-plugin-commonjs'

declare module 'vite-plugin-commonjs' {
  export default function commonJSPlugin(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options?: Options
  ): import('vite').Plugin | import('vite').PluginOption[] {}
}
