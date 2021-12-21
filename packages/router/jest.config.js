/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  setupFilesAfterEnv: ['./jest.setup.js'],
  /**
   * As of Jest 27, JSDOM is no longer the default. And in 28 it'll be removed.
   * (That sounds scary, but all we'll actually have to do is install it separately.)
   *
   * @see {@link https://jestjs.io/blog/2021/05/25/jest-27#flipping-defaults}
   * @see {@link https://jestjs.io/blog/2020/05/05/jest-26}
   */
  testEnvironment: 'jest-environment-jsdom',
}
