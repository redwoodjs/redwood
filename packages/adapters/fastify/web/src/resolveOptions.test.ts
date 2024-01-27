import path from 'path'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { resolveOptions } from './resolveOptions'

let original_RWJS_CWD

beforeAll(() => {
  original_RWJS_CWD = process.env.RWJS_CWD
  process.env.RWJS_CWD = path.join(__dirname, '__fixtures__/main')
})

afterAll(() => {
  process.env.RWJS_CWD = original_RWJS_CWD
})

describe('resolveOptions', () => {
  // The possible values we will support for apiUrl and apiProxyTarget are:
  // apiUrl: (aka prefix)
  //  - undefined
  //  - empty
  //  - relative
  //  - fully-qualified
  // apiProxyTarget: (aka upstream)
  //  - undefined
  //  - empty
  //  - relative
  //  - fully-qualified

  describe('undefined apiUrl', () => {
    it.skip('undefined apiProxyTarget', () => {
      expect(() =>
        resolveOptions({
          redwood: {
            apiUrl: undefined,
            apiProxyTarget: undefined,
          },
        })
      ).toThrowErrorMatchingInlineSnapshot(
        `[Error: If you don't provide \`apiProxyTarget\`, \`apiUrl\` needs to be a fully-qualified URL. \`apiUrl\` is '/.redwood/functions']`
      )
    })

    it.skip('empty apiProxyTarget', () => {
      expect(() =>
        resolveOptions({
          redwood: {
            apiUrl: undefined,
            apiProxyTarget: '',
          },
        })
      ).toThrowErrorMatchingInlineSnapshot(
        `[Error: If you don't provide \`apiProxyTarget\`, \`apiUrl\` needs to be a fully-qualified URL. \`apiUrl\` is '/.redwood/functions']`
      )
    })

    it('relative apiProxyTarget', () => {
      expect(() =>
        resolveOptions({
          redwood: {
            apiUrl: undefined,
            apiProxyTarget: '/api',
          },
        })
      ).toThrowErrorMatchingInlineSnapshot(
        `[Error: If you provide \`apiProxyTarget\`, it has to be a fully-qualified URL. \`apiProxyTarget\` is '/api']`
      )
    })

    it('fully-qualified apiProxyTarget', () => {
      expect(
        resolveOptions({
          redwood: {
            apiUrl: undefined,
            apiProxyTarget: 'http://api.foo.com',
          },
        })
      ).toMatchInlineSnapshot(`
        {
          "redwood": {
            "apiProxyTarget": "http://api.foo.com",
            "apiUrl": "/.redwood/functions",
          },
        }
      `)
    })
  })

  describe('empty apiUrl', () => {
    it.skip('undefined apiProxyTarget', () => {
      expect(() =>
        resolveOptions({
          redwood: {
            apiUrl: '',
            apiProxyTarget: undefined,
          },
        })
      ).toThrowErrorMatchingInlineSnapshot(
        `[Error: If you don't provide \`apiProxyTarget\`, \`apiUrl\` needs to be a fully-qualified URL. \`apiUrl\` is '']`
      )
    })

    it.skip('empty apiProxyTarget', () => {
      expect(() =>
        resolveOptions({
          redwood: {
            apiUrl: '',
            apiProxyTarget: '',
          },
        })
      ).toThrowErrorMatchingInlineSnapshot(
        `[Error: If you don't provide \`apiProxyTarget\`, \`apiUrl\` needs to be a fully-qualified URL. \`apiUrl\` is '']`
      )
    })

    it('relative apiProxyTarget', () => {
      expect(() =>
        resolveOptions({
          redwood: {
            apiUrl: '',
            apiProxyTarget: '/api',
          },
        })
      ).toThrowErrorMatchingInlineSnapshot(
        `[Error: If you provide \`apiProxyTarget\`, it has to be a fully-qualified URL. \`apiProxyTarget\` is '/api']`
      )
    })

    it('fully-qualified apiProxyTarget', () => {
      expect(() =>
        resolveOptions({
          redwood: {
            apiUrl: '',
            apiProxyTarget: 'http://api.foo.com',
          },
        })
      ).toThrowErrorMatchingInlineSnapshot(
        `[Error: If you provide \`apiProxyTarget\`, \`apiUrl\` has to be a relative URL. \`apiUrl\` is '']`
      )
    })
  })

  describe('relative apiUrl', () => {
    it.skip('undefined apiProxyTarget', () => {
      expect(() =>
        resolveOptions({
          redwood: {
            apiUrl: '/api',
            apiProxyTarget: undefined,
          },
        })
      ).toThrowErrorMatchingInlineSnapshot(
        `[Error: If you don't provide \`apiProxyTarget\`, \`apiUrl\` needs to be a fully-qualified URL. \`apiUrl\` is '/api']`
      )
    })

    it.skip('empty apiProxyTarget', () => {
      expect(() =>
        resolveOptions({
          redwood: {
            apiUrl: '/api',
            apiProxyTarget: '',
          },
        })
      ).toThrowErrorMatchingInlineSnapshot(
        `[Error: If you don't provide \`apiProxyTarget\`, \`apiUrl\` needs to be a fully-qualified URL. \`apiUrl\` is '/api']`
      )
    })

    it('relative apiProxyTarget', () => {
      expect(() =>
        resolveOptions({
          redwood: {
            apiUrl: '/api',
            apiProxyTarget: '/api',
          },
        })
      ).toThrowErrorMatchingInlineSnapshot(
        `[Error: If you provide \`apiProxyTarget\`, it has to be a fully-qualified URL. \`apiProxyTarget\` is '/api']`
      )
    })

    it('fully-qualified apiProxyTarget', () => {
      expect(
        resolveOptions({
          redwood: {
            apiUrl: '/api',
            apiProxyTarget: 'http://api.foo.com',
          },
        })
      ).toMatchInlineSnapshot(`
        {
          "redwood": {
            "apiProxyTarget": "http://api.foo.com",
            "apiUrl": "/api",
          },
        }
      `)
    })
  })

  describe('fully-qualified apiUrl', () => {
    it('undefined apiProxyTarget', () => {
      expect(
        resolveOptions({
          redwood: {
            apiUrl: 'http://api.foo.com',
            apiProxyTarget: undefined,
          },
        })
      ).toMatchInlineSnapshot(`
        {
          "redwood": {
            "apiProxyTarget": undefined,
            "apiUrl": "http://api.foo.com",
          },
        }
      `)
    })

    it('empty apiProxyTarget', () => {
      expect(
        resolveOptions({
          redwood: {
            apiUrl: 'http://api.foo.com',
            apiProxyTarget: '',
          },
        })
      ).toMatchInlineSnapshot(`
        {
          "redwood": {
            "apiProxyTarget": "",
            "apiUrl": "http://api.foo.com",
          },
        }
      `)
    })

    it('relative apiProxyTarget', () => {
      expect(() =>
        resolveOptions({
          redwood: {
            apiUrl: 'http://api.foo.com',
            apiProxyTarget: '/api',
          },
        })
      ).toThrowErrorMatchingInlineSnapshot(
        `[Error: If you provide \`apiProxyTarget\`, it has to be a fully-qualified URL. \`apiProxyTarget\` is '/api']`
      )
    })

    it('fully-qualified apiProxyTarget', () => {
      expect(() =>
        resolveOptions({
          redwood: {
            apiUrl: 'http://api.foo.com',
            apiProxyTarget: 'http://api.foo.com',
          },
        })
      ).toThrowErrorMatchingInlineSnapshot(
        `[Error: If you provide \`apiProxyTarget\`, \`apiUrl\` cannot be a fully-qualified URL. \`apiUrl\` is 'http://api.foo.com']`
      )
    })
  })

  describe('apiHost', () => {
    it('apiHost is a deprecated alias of apiProxyTarget', () => {
      expect(
        resolveOptions({
          redwood: {
            apiHost: 'http://api.foo.com',
          },
        })
      ).toMatchInlineSnapshot(`
        {
          "redwood": {
            "apiProxyTarget": "http://api.foo.com",
            "apiUrl": "/.redwood/functions",
          },
        }
      `)
    })
  })
})
