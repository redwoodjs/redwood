import { defineConfig, configDefaults } from 'vitest/config'

import { babel } from '@rollup/plugin-babel';

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
    babel({
      babelHelpers: 'runtime',
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs'],
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
    }) as any
  ]
})


