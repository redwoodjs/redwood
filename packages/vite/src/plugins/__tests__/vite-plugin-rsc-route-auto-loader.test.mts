import path from 'node:path'

import { vol } from 'memfs'
import { normalizePath } from 'vite'

import { afterAll, beforeAll, describe, it, expect, vi, Mock, beforeEach, afterEach } from 'vitest'

import { processPagesDir } from '@redwoodjs/project-config'
import type * as ProjectConfig from '@redwoodjs/project-config'

import { rscRoutesAutoLoader } from '../vite-plugin-rsc-routes-auto-loader'

vi.mock('fs', async () => ({ default: (await import('memfs')).fs }))

const RWJS_CWD = process.env.RWJS_CWD

vi.mock('@redwoodjs/project-config', async (importOriginal) => {
  const originalProjectConfig = await importOriginal<typeof ProjectConfig>()
  return {
    ...originalProjectConfig,
    getPaths: () => {
      return {
        ...originalProjectConfig.getPaths(),
        web: {
          ...originalProjectConfig.getPaths().web,
          routes: '/Users/mojombo/rw-app/web/src/Routes.tsx',
        },
      }
    },
    processPagesDir: vi.fn(),
  }
})

beforeAll(() => {
  // Add a toml entry for getPaths et al.
  process.env.RWJS_CWD = '/Users/mojombo/rw-app/'
  vol.fromJSON({
    'redwood.toml': '',
  }, process.env.RWJS_CWD)
})

afterAll(() => {
  process.env.RWJS_CWD = RWJS_CWD
})

describe('rscRoutesAutoLoader', () => {
  beforeEach(() => {
    (processPagesDir as Mock).mockReturnValue(pages)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should insert the correct imports for non-ssr', async () => {
    const plugin = rscRoutesAutoLoader()
    if (typeof plugin.transform !== 'function') {
      return
    }

    // Calling `bind` to please TS
    // See https://stackoverflow.com/a/70463512/88106
    const id = path.join(process.env.RWJS_CWD!, 'web', 'src', 'Routes.tsx')
    const output = await plugin.transform.bind({})(
      `import { jsx, jsxs } from "react/jsx-runtime";
      import { Router, Route, Set } from "@redwoodjs/router";
      import NavigationLayout from "./layouts/NavigationLayout/NavigationLayout";
      import ScaffoldLayout from "./layouts/ScaffoldLayout/ScaffoldLayout";
      import NotFoundPage from "./pages/NotFoundPage/NotFoundPage";
      const Routes = () => {
        return /* @__PURE__ */ jsxs(Router, { children: [
          /* @__PURE__ */ jsxs(Set, { wrap: NavigationLayout, children: [
            /* @__PURE__ */ jsx(Route, { path: "/", page: HomePage, name: "home" }),
            /* @__PURE__ */ jsx(Route, { path: "/about", page: AboutPage, name: "about" }),
            /* @__PURE__ */ jsx(Route, { path: "/multi-cell", page: MultiCellPage, name: "multiCell" }),
            /* @__PURE__ */ jsxs(Set, { wrap: ScaffoldLayout, title: "EmptyUsers", titleTo: "emptyUsers", buttonLabel: "New EmptyUser", buttonTo: "newEmptyUser", children: [
              /* @__PURE__ */ jsx(Route, { path: "/empty-users/new", page: EmptyUserNewEmptyUserPage, name: "newEmptyUser" }),
              /* @__PURE__ */ jsx(Route, { path: "/empty-users", page: EmptyUserEmptyUsersPage, name: "emptyUsers" })
            ] }),
            /* @__PURE__ */ jsxs(Set, { wrap: ScaffoldLayout, title: "UserExamples", titleTo: "userExamples", buttonLabel: "New UserExample", buttonTo: "newUserExample", children: [
              /* @__PURE__ */ jsx(Route, { path: "/user-examples/new", page: UserExampleNewUserExamplePage, name: "newUserExample" }),
              /* @__PURE__ */ jsx(Route, { path: "/user-examples/{id:Int}", page: UserExampleUserExamplePage, name: "userExample" }),
              /* @__PURE__ */ jsx(Route, { path: "/user-examples", page: UserExampleUserExamplesPage, name: "userExamples" })
            ] })
          ] }),
          /* @__PURE__ */ jsx(Route, { notfound: true, page: NotFoundPage })
        ] });
      };
      export default Routes;`,
      normalizePath(id),
      // Passing undefined here to explicitly demonstrate that we're not passing { ssr: true }
      undefined
    )

    // What we are interested in seeing here is:
    // - The import of `renderFromRscServer` from `@redwoodjs/vite/client`
    // - The call to `renderFromRscServer` for each page that wasn't already imported
    expect(output).toMatchInlineSnapshot(`
      "const EmptyUserNewEmptyUserPage = () => null;
      const EmptyUserEmptyUsersPage = () => null;
      const EmptyUserEmptyUserPage = () => null;
      const EmptyUserEditEmptyUserPage = () => null;
      const HomePage = () => null;
      const FatalErrorPage = () => null;
      const AboutPage = () => null;
      import { jsx, jsxs } from "react/jsx-runtime";
      import { Router, Route, Set } from "@redwoodjs/router";
      import NavigationLayout from "@redwoodjs/router/dist/dummyComponent";
      import ScaffoldLayout from "@redwoodjs/router/dist/dummyComponent";
      import NotFoundPage from "./pages/NotFoundPage/NotFoundPage";
      const Routes = () => {
        return /* @__PURE__ */jsxs(Router, {
          children: [/* @__PURE__ */jsxs(Set, {
            wrap: NavigationLayout,
            children: [/* @__PURE__ */jsx(Route, {
              path: "/",
              page: HomePage,
              name: "home"
            }), /* @__PURE__ */jsx(Route, {
              path: "/about",
              page: AboutPage,
              name: "about"
            }), /* @__PURE__ */jsx(Route, {
              path: "/multi-cell",
              page: MultiCellPage,
              name: "multiCell"
            }), /* @__PURE__ */jsxs(Set, {
              wrap: ScaffoldLayout,
              title: "EmptyUsers",
              titleTo: "emptyUsers",
              buttonLabel: "New EmptyUser",
              buttonTo: "newEmptyUser",
              children: [/* @__PURE__ */jsx(Route, {
                path: "/empty-users/new",
                page: EmptyUserNewEmptyUserPage,
                name: "newEmptyUser"
              }), /* @__PURE__ */jsx(Route, {
                path: "/empty-users",
                page: EmptyUserEmptyUsersPage,
                name: "emptyUsers"
              })]
            }), /* @__PURE__ */jsxs(Set, {
              wrap: ScaffoldLayout,
              title: "UserExamples",
              titleTo: "userExamples",
              buttonLabel: "New UserExample",
              buttonTo: "newUserExample",
              children: [/* @__PURE__ */jsx(Route, {
                path: "/user-examples/new",
                page: UserExampleNewUserExamplePage,
                name: "newUserExample"
              }), /* @__PURE__ */jsx(Route, {
                path: "/user-examples/{id:Int}",
                page: UserExampleUserExamplePage,
                name: "userExample"
              }), /* @__PURE__ */jsx(Route, {
                path: "/user-examples",
                page: UserExampleUserExamplesPage,
                name: "userExamples"
              })]
            })]
          }), /* @__PURE__ */jsx(Route, {
            notfound: true,
            page: NotFoundPage
          })]
        });
      };
      export default Routes;"
    `)
  })

  it('should insert the correct imports for ssr', async () => {
    const plugin = rscRoutesAutoLoader()
    if (typeof plugin.transform !== 'function') {
      return
    }

    // Calling `bind` to please TS
    // See https://stackoverflow.com/a/70463512/88106
    const id = path.join(process.env.RWJS_CWD!, 'web', 'src', 'Routes.tsx')
    const output = await plugin.transform.bind({})(
      `import { jsx, jsxs } from "react/jsx-runtime";
      import { Router, Route, Set } from "@redwoodjs/router";
      import NavigationLayout from "./layouts/NavigationLayout/NavigationLayout";
      import ScaffoldLayout from "./layouts/ScaffoldLayout/ScaffoldLayout";
      import NotFoundPage from "./pages/NotFoundPage/NotFoundPage";
      const Routes = () => {
        return /* @__PURE__ */ jsxs(Router, { children: [
          /* @__PURE__ */ jsxs(Set, { wrap: NavigationLayout, children: [
            /* @__PURE__ */ jsx(Route, { path: "/", page: HomePage, name: "home" }),
            /* @__PURE__ */ jsx(Route, { path: "/about", page: AboutPage, name: "about" }),
            /* @__PURE__ */ jsx(Route, { path: "/multi-cell", page: MultiCellPage, name: "multiCell" }),
            /* @__PURE__ */ jsxs(Set, { wrap: ScaffoldLayout, title: "EmptyUsers", titleTo: "emptyUsers", buttonLabel: "New EmptyUser", buttonTo: "newEmptyUser", children: [
              /* @__PURE__ */ jsx(Route, { path: "/empty-users/new", page: EmptyUserNewEmptyUserPage, name: "newEmptyUser" }),
              /* @__PURE__ */ jsx(Route, { path: "/empty-users", page: EmptyUserEmptyUsersPage, name: "emptyUsers" })
            ] }),
            /* @__PURE__ */ jsxs(Set, { wrap: ScaffoldLayout, title: "UserExamples", titleTo: "userExamples", buttonLabel: "New UserExample", buttonTo: "newUserExample", children: [
              /* @__PURE__ */ jsx(Route, { path: "/user-examples/new", page: UserExampleNewUserExamplePage, name: "newUserExample" }),
              /* @__PURE__ */ jsx(Route, { path: "/user-examples/{id:Int}", page: UserExampleUserExamplePage, name: "userExample" }),
              /* @__PURE__ */ jsx(Route, { path: "/user-examples", page: UserExampleUserExamplesPage, name: "userExamples" })
            ] })
          ] }),
          /* @__PURE__ */ jsx(Route, { notfound: true, page: NotFoundPage })
        ] });
      };
      export default Routes;`,
      normalizePath(id),
      { ssr: true }
    )

    // What we are interested in seeing here is:
    // Dummy pages (`() => null`) for all the pages
    // Dummy imports (`import SomeWrapper from "@redwoodjs/router/dist/dummyComponent"`)
    // for all the wrapper components
    expect(output).toMatchInlineSnapshot(`
      "const EmptyUserNewEmptyUserPage = () => null;
      const EmptyUserEmptyUsersPage = () => null;
      const EmptyUserEmptyUserPage = () => null;
      const EmptyUserEditEmptyUserPage = () => null;
      const HomePage = () => null;
      const FatalErrorPage = () => null;
      const AboutPage = () => null;
      import { jsx, jsxs } from "react/jsx-runtime";
      import { Router, Route, Set } from "@redwoodjs/router";
      import NavigationLayout from "@redwoodjs/router/dist/dummyComponent";
      import ScaffoldLayout from "@redwoodjs/router/dist/dummyComponent";
      import NotFoundPage from "./pages/NotFoundPage/NotFoundPage";
      const Routes = () => {
        return /* @__PURE__ */jsxs(Router, {
          children: [/* @__PURE__ */jsxs(Set, {
            wrap: NavigationLayout,
            children: [/* @__PURE__ */jsx(Route, {
              path: "/",
              page: HomePage,
              name: "home"
            }), /* @__PURE__ */jsx(Route, {
              path: "/about",
              page: AboutPage,
              name: "about"
            }), /* @__PURE__ */jsx(Route, {
              path: "/multi-cell",
              page: MultiCellPage,
              name: "multiCell"
            }), /* @__PURE__ */jsxs(Set, {
              wrap: ScaffoldLayout,
              title: "EmptyUsers",
              titleTo: "emptyUsers",
              buttonLabel: "New EmptyUser",
              buttonTo: "newEmptyUser",
              children: [/* @__PURE__ */jsx(Route, {
                path: "/empty-users/new",
                page: EmptyUserNewEmptyUserPage,
                name: "newEmptyUser"
              }), /* @__PURE__ */jsx(Route, {
                path: "/empty-users",
                page: EmptyUserEmptyUsersPage,
                name: "emptyUsers"
              })]
            }), /* @__PURE__ */jsxs(Set, {
              wrap: ScaffoldLayout,
              title: "UserExamples",
              titleTo: "userExamples",
              buttonLabel: "New UserExample",
              buttonTo: "newUserExample",
              children: [/* @__PURE__ */jsx(Route, {
                path: "/user-examples/new",
                page: UserExampleNewUserExamplePage,
                name: "newUserExample"
              }), /* @__PURE__ */jsx(Route, {
                path: "/user-examples/{id:Int}",
                page: UserExampleUserExamplePage,
                name: "userExample"
              }), /* @__PURE__ */jsx(Route, {
                path: "/user-examples",
                page: UserExampleUserExamplesPage,
                name: "userExamples"
              })]
            })]
          }), /* @__PURE__ */jsx(Route, {
            notfound: true,
            page: NotFoundPage
          })]
        });
      };
      export default Routes;"
    `)
  })

  it('should throw for duplicate page import names', async () => {
    (processPagesDir as Mock).mockReturnValue(pagesWithDuplicate)

    const getOutput = async () => {
      const plugin = rscRoutesAutoLoader()
      if (typeof plugin.transform !== 'function') {
        return
      }

      // Calling `bind` to please TS
      // See https://stackoverflow.com/a/70463512/88106
      const id = path.join(process.env.RWJS_CWD!, 'web', 'src', 'Routes.tsx')
      const output = await plugin.transform.bind({})(
        `import { jsx, jsxs } from "react/jsx-runtime";
        import { Router, Route, Set } from "@redwoodjs/router";
        import NavigationLayout from "./layouts/NavigationLayout/NavigationLayout";
        import ScaffoldLayout from "./layouts/ScaffoldLayout/ScaffoldLayout";
        import NotFoundPage from "./pages/NotFoundPage/NotFoundPage";
        const Routes = () => {
          return /* @__PURE__ */ jsxs(Router, { children: [
            /* @__PURE__ */ jsxs(Set, { wrap: NavigationLayout, children: [
              /* @__PURE__ */ jsx(Route, { path: "/", page: HomePage, name: "home" }),
              /* @__PURE__ */ jsx(Route, { path: "/about", page: AboutPage, name: "about" }),
              /* @__PURE__ */ jsx(Route, { path: "/multi-cell", page: MultiCellPage, name: "multiCell" }),
              /* @__PURE__ */ jsxs(Set, { wrap: ScaffoldLayout, title: "EmptyUsers", titleTo: "emptyUsers", buttonLabel: "New EmptyUser", buttonTo: "newEmptyUser", children: [
                /* @__PURE__ */ jsx(Route, { path: "/empty-users/new", page: EmptyUserNewEmptyUserPage, name: "newEmptyUser" }),
                /* @__PURE__ */ jsx(Route, { path: "/empty-users", page: EmptyUserEmptyUsersPage, name: "emptyUsers" })
              ] }),
              /* @__PURE__ */ jsxs(Set, { wrap: ScaffoldLayout, title: "UserExamples", titleTo: "userExamples", buttonLabel: "New UserExample", buttonTo: "newUserExample", children: [
                /* @__PURE__ */ jsx(Route, { path: "/user-examples/new", page: UserExampleNewUserExamplePage, name: "newUserExample" }),
                /* @__PURE__ */ jsx(Route, { path: "/user-examples/{id:Int}", page: UserExampleUserExamplePage, name: "userExample" }),
                /* @__PURE__ */ jsx(Route, { path: "/user-examples", page: UserExampleUserExamplesPage, name: "userExamples" })
              ] })
            ] }),
            /* @__PURE__ */ jsx(Route, { notfound: true, page: NotFoundPage })
          ] });
        };
        export default Routes;`,
        normalizePath(id),
      )

      return output
    }

    expect(getOutput).rejects.toThrowErrorMatchingInlineSnapshot(
      "[Error: Unable to find only a single file ending in 'Page.{js,jsx,ts,tsx}' in the following page directories: 'AboutPage']"
    )
  })

  it('should handle existing imports in the routes file', async () => {
    const plugin = rscRoutesAutoLoader()
    if (typeof plugin.transform !== 'function') {
      return
    }

    // Calling `bind` to please TS
    // See https://stackoverflow.com/a/70463512/88106
    const id = path.join(process.env.RWJS_CWD!, 'web', 'src', 'Routes.tsx')
    const output = await plugin.transform.bind({})(
      `import { jsx, jsxs } from "react/jsx-runtime";
      import { Router, Route, Set } from "@redwoodjs/router";
      import NavigationLayout from "./layouts/NavigationLayout/NavigationLayout";
      import ScaffoldLayout from "./layouts/ScaffoldLayout/ScaffoldLayout";
      import NotFoundPage from "./pages/NotFoundPage/NotFoundPage";
      import AboutPage from "./pages/AboutPage/AboutPage";
      const Routes = () => {
        return /* @__PURE__ */ jsxs(Router, { children: [
          /* @__PURE__ */ jsxs(Set, { wrap: NavigationLayout, children: [
            /* @__PURE__ */ jsx(Route, { path: "/", page: HomePage, name: "home" }),
            /* @__PURE__ */ jsx(Route, { path: "/about", page: AboutPage, name: "about" }),
            /* @__PURE__ */ jsx(Route, { path: "/multi-cell", page: MultiCellPage, name: "multiCell" }),
            /* @__PURE__ */ jsxs(Set, { wrap: ScaffoldLayout, title: "EmptyUsers", titleTo: "emptyUsers", buttonLabel: "New EmptyUser", buttonTo: "newEmptyUser", children: [
              /* @__PURE__ */ jsx(Route, { path: "/empty-users/new", page: EmptyUserNewEmptyUserPage, name: "newEmptyUser" }),
              /* @__PURE__ */ jsx(Route, { path: "/empty-users", page: EmptyUserEmptyUsersPage, name: "emptyUsers" })
            ] }),
            /* @__PURE__ */ jsxs(Set, { wrap: ScaffoldLayout, title: "UserExamples", titleTo: "userExamples", buttonLabel: "New UserExample", buttonTo: "newUserExample", children: [
              /* @__PURE__ */ jsx(Route, { path: "/user-examples/new", page: UserExampleNewUserExamplePage, name: "newUserExample" }),
              /* @__PURE__ */ jsx(Route, { path: "/user-examples/{id:Int}", page: UserExampleUserExamplePage, name: "userExample" }),
              /* @__PURE__ */ jsx(Route, { path: "/user-examples", page: UserExampleUserExamplesPage, name: "userExamples" })
            ] })
          ] }),
          /* @__PURE__ */ jsx(Route, { notfound: true, page: NotFoundPage })
        ] });
      };
      export default Routes;`,
      normalizePath(id),
      undefined
    )

    // We don't have to add calls for the AboutPage as it was already imported
    expect(output).not.toContain('renderFromDist("AboutPage")')
    expect(output).not.toContain('renderFromRscServer("AboutPage")')
  })

})

const pages = [
  {
    importName: 'AboutPage',
    constName: 'AboutPage',
    importPath: '/Users/mojombo/rw-app/web/src/pages/AboutPage/AboutPage',
    path: '/Users/mojombo/rw-app/web/src/pages/AboutPage/AboutPage.tsx',
    importStatement: "const AboutPage = { name: 'AboutPage', loader: import('/Users/mojombo/rw-app/web/src/pages/AboutPage/AboutPage') }"
  },
  {
    importName: 'FatalErrorPage',
    constName: 'FatalErrorPage',
    importPath: '/Users/mojombo/rw-app/web/src/pages/FatalErrorPage/FatalErrorPage',
    path: '/Users/mojombo/rw-app/web/src/pages/FatalErrorPage/FatalErrorPage.tsx',
    importStatement: "const FatalErrorPage = { name: 'FatalErrorPage', loader: import('/Users/mojombo/rw-app/web/src/pages/FatalErrorPage/FatalErrorPage') }"
  },
  {
    importName: 'HomePage',
    constName: 'HomePage',
    importPath: '/Users/mojombo/rw-app/web/src/pages/HomePage/HomePage',
    path: '/Users/mojombo/rw-app/web/src/pages/HomePage/HomePage.tsx',
    importStatement: "const HomePage = { name: 'HomePage', loader: import('/Users/mojombo/rw-app/web/src/pages/HomePage/HomePage') }"
  },
  {
    importName: 'NotFoundPage',
    constName: 'NotFoundPage',
    importPath: '/Users/mojombo/rw-app/web/src/pages/NotFoundPage/NotFoundPage',
    path: '/Users/mojombo/rw-app/web/src/pages/NotFoundPage/NotFoundPage.tsx',
    importStatement: "const NotFoundPage = { name: 'NotFoundPage', loader: import('/Users/mojombo/rw-app/web/src/pages/NotFoundPage/NotFoundPage') }"
  },
  {
    importName: 'EmptyUserEditEmptyUserPage',
    constName: 'EmptyUserEditEmptyUserPage',
    importPath: '/Users/mojombo/rw-app/web/src/pages/EmptyUser/EditEmptyUserPage/EditEmptyUserPage',
    path: '/Users/mojombo/rw-app/web/src/pages/EmptyUser/EditEmptyUserPage/EditEmptyUserPage.tsx',
    importStatement: "const EmptyUserEditEmptyUserPage = { name: 'EmptyUserEditEmptyUserPage', loader: import('/Users/mojombo/rw-app/web/src/pages/EmptyUser/EditEmptyUserPage/EditEmptyUserPage') }"
  },
  {
    importName: 'EmptyUserEmptyUserPage',
    constName: 'EmptyUserEmptyUserPage',
    importPath: '/Users/mojombo/rw-app/web/src/pages/EmptyUser/EmptyUserPage/EmptyUserPage',
    path: '/Users/mojombo/rw-app/web/src/pages/EmptyUser/EmptyUserPage/EmptyUserPage.tsx',
    importStatement: "const EmptyUserEmptyUserPage = { name: 'EmptyUserEmptyUserPage', loader: import('/Users/mojombo/rw-app/web/src/pages/EmptyUser/EmptyUserPage/EmptyUserPage') }"
  },
  {
    importName: 'EmptyUserEmptyUsersPage',
    constName: 'EmptyUserEmptyUsersPage',
    importPath: '/Users/mojombo/rw-app/web/src/pages/EmptyUser/EmptyUsersPage/EmptyUsersPage',
    path: '/Users/mojombo/rw-app/web/src/pages/EmptyUser/EmptyUsersPage/EmptyUsersPage.tsx',
    importStatement: "const EmptyUserEmptyUsersPage = { name: 'EmptyUserEmptyUsersPage', loader: import('/Users/mojombo/rw-app/web/src/pages/EmptyUser/EmptyUsersPage/EmptyUsersPage') }"
  },
  {
    importName: 'EmptyUserNewEmptyUserPage',
    constName: 'EmptyUserNewEmptyUserPage',
    importPath: '/Users/mojombo/rw-app/web/src/pages/EmptyUser/NewEmptyUserPage/NewEmptyUserPage',
    path: '/Users/mojombo/rw-app/web/src/pages/EmptyUser/NewEmptyUserPage/NewEmptyUserPage.tsx',
    importStatement: "const EmptyUserNewEmptyUserPage = { name: 'EmptyUserNewEmptyUserPage', loader: import('/Users/mojombo/rw-app/web/src/pages/EmptyUser/NewEmptyUserPage/NewEmptyUserPage') }"
  },
]

const pagesWithDuplicate = [
  ...pages,
  pages[0]
]
