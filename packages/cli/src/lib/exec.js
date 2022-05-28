import path from 'path'

import {
  getPaths,
  getWebSideDefaultBabelConfig,
  registerApiSideBabelHook,
} from '@redwoodjs/internal'

export async function runScript(scriptPath, scriptArgs) {
  const script = await import(scriptPath)
  const returnValue = await script.default({ args: scriptArgs })

  try {
    const { db } = await import(path.join(getPaths().api.lib, 'db'))
    db.$disconnect()
  } catch (e) {
    // silence
  }

  return returnValue
}

export async function configureBabel() {
  const {
    overrides: _overrides,
    plugins: webPlugins,
    ...otherWebConfig
  } = getWebSideDefaultBabelConfig()

  // Import babel config for running script
  registerApiSideBabelHook({
    plugins: [
      [
        'babel-plugin-module-resolver',
        {
          alias: {
            $api: getPaths().api.base,
            $web: getPaths().web.base,
            api: getPaths().api.base,
            web: getPaths().web.base,
          },
          loglevel: 'silent', // to silence the unnecessary warnings
        },
        'exec-$side-module-resolver',
      ],
    ],
    overrides: [
      {
        test: ['./api/'],
        plugins: [
          [
            'babel-plugin-module-resolver',
            {
              alias: {
                src: getPaths().api.src,
              },
              loglevel: 'silent',
            },
            'exec-api-src-module-resolver',
          ],
        ],
      },
      {
        test: ['./web/'],
        plugins: [
          ...webPlugins,
          [
            'babel-plugin-module-resolver',
            {
              alias: {
                src: getPaths().web.src,
              },
              loglevel: 'silent',
            },
            'exec-web-src-module-resolver',
          ],
        ],
        ...otherWebConfig,
      },
    ],
  })
}
