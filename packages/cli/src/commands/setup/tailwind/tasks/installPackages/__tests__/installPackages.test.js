import execa from 'execa'

import 'src/lib/test'
import installPackages from '..'

jest.mock('execa', () => jest.fn())

describe('rw setup tailwind - installPackages task', () => {
  const yarnArgs = ['workspace', 'web', 'add', '-D']
  const basePackages = [
    'postcss-loader@4.0.2',
    'tailwindcss',
    'autoprefixer@9.8.6',
  ]

  describe('without the --ui flag', () => {
    test('it installs postcss, tailwindcss & autoprefixer', () => {
      const task = installPackages({ ui: false })
      task()

      expect(execa).toHaveBeenCalledWith('yarn', [...yarnArgs, ...basePackages])
    })
  })

  describe('with the --ui flag', () => {
    test('it installs @tailwindcss/ui along with base packages', () => {
      const task = installPackages({ ui: true })
      task()

      expect(execa).toHaveBeenCalledWith('yarn', [
        ...yarnArgs,
        ...basePackages,
        '@tailwindcss/ui',
      ])
    })
  })
})
