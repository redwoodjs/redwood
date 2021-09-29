// For some reason, testutils types aren't exported.... I just dont...
// Partially copied from https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/jscodeshift/src/testUtils.d.ts
declare module 'jscodeshift/dist/testUtils' {
  import type { Transform, Options, Parser } from 'jscodeshift'
  function defineTest(
    dirName: string,
    transformName: string,
    options?: Options | null,
    testFilePrefix?: string | null,
    testOptions?: {
      parser: 'ts' | 'tsx' | 'js' | Parser
    }
  ): () => any

  function defineInlineTest(
    module: Transform,
    options: Options,
    inputSource: string,
    expectedOutputSource: string,
    testName?: string
  ): () => any

  function runInlineTest(
    module: Transform,
    options: Options,
    input: {
      path?: string
      source: string
    },
    expectedOutput: string,
    testOptions?: TestOptions
  ): string
}
