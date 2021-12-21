/**
 * Tests don't actually fail without mocking `scrollTo`,
 * but if we don't, we get a wall of text about how `window.scrollTo` hasn't been implemented.
 *
 * @see {@link https://jestjs.io/docs/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom}
 * @see {@link https://github.com/jsdom/jsdom/issues/1422}
 * @see {@link https://github.com/jsdom/jsdom/pull/2626}
 */
global.scrollTo = jest.fn()
