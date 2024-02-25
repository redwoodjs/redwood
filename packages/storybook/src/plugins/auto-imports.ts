import AutoImport from 'unplugin-auto-import/vite'

export const autoImports = AutoImport({
  // targets to transform
  include: [
    /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
  ],

  // global imports to register
  imports: [
    {
      '@redwoodjs/testing/web': [
        'mockGraphQLQuery',
        'mockGraphQLMutation',
        'mockCurrentUser',
      ],
    },
  ],
})
