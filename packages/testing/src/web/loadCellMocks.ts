import fg from 'fast-glob'

export const loadCellMocks = (webBasePath: string) => {
  return fg.sync('**/*.mock.{js,ts,jsx,tsx}', {
    cwd: webBasePath,
    absolute: true,
    ignore: [
      '**/*.test.{js,ts,tsx,jsx}',
      '**/*.fixtures.{js,ts,tsx,jsx}',
      '**/*.d.ts',
    ],
  })
}
