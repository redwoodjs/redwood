import { defineConfig, configDefaults } from 'vitest/config'

import { babel } from '@rollup/plugin-babel'

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, '**/fixtures', '**/__typetests__'],
    environment: 'jsdom',
    setupFiles: ['vitest.setup.mts'],
  },
  define: {
    RWJS_ENV: {},
  },
  plugins: [
    // @ts-expect-error plugin types do not seem happy with each other
    babel({
      babelHelpers: 'runtime',
      extensions: ['.ts', '.tsx', '.js'],
      include: ['src/**/*'],
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
            ],
          },
        ]
      ]
    })
  ]
})


