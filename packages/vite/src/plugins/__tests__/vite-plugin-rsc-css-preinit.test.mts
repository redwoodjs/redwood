import path from 'node:path'
import { vol } from 'memfs'
import { normalizePath } from 'vite'

import { generateCssMapping, rscCssPreinitPlugin, generateServerComponentClientComponentMapping, splitClientAndServerComponents } from '../vite-plugin-rsc-css-preinit'
import { afterAll, beforeAll, describe, it, expect, vi } from 'vitest'

import {
  clientBuildManifest,
  clientEntryFiles,
  componentImportMap,
} from './vite-plugin-rsc-css-preinit-fixture-values'
import { getPaths } from '@redwoodjs/project-config'

vi.mock('fs', async () => ({ default: (await import('memfs')).fs }))

const RWJS_CWD = process.env.RWJS_CWD

let consoleLogSpy
beforeAll(() => {
  // Add the toml so that getPaths will work
  process.env.RWJS_CWD = '/Users/mojombo/rw-app/'
  vol.fromJSON({
    'redwood.toml': '',
  }, process.env.RWJS_CWD)

  // Add the client build manifest
  const manifestPath = path.join(
    getPaths().web.distClient,
    'client-build-manifest.json',
  ).substring(process.env.RWJS_CWD.length)
  vol.fromJSON({
    'redwood.toml': '',
    [manifestPath]: JSON.stringify(clientBuildManifest),
  }, process.env.RWJS_CWD)

  consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterAll(() => {
  process.env.RWJS_CWD = RWJS_CWD
  consoleLogSpy.mockRestore()
})

describe('rscCssPreinitPlugin', () => {
  it('should insert preinits for all nested client components', async () => {
    const plugin = rscCssPreinitPlugin(clientEntryFiles, componentImportMap)

    if (typeof plugin.transform !== 'function') {
      return
    }

    // Calling `bind` to please TS
    // See https://stackoverflow.com/a/70463512/88106
    const id = path.join(process.env.RWJS_CWD!, 'web', 'src', 'pages', 'HomePage', 'HomePage.tsx')
    const output = await plugin.transform.bind({})(
      `import { jsx, jsxs } from "react/jsx-runtime";
      import { RscForm } from "@tobbe.dev/rsc-test";
      import { Assets } from "@redwoodjs/vite/assets";
      import { ProdRwRscServerGlobal } from "@redwoodjs/vite/rwRscGlobal";
      import { Counter } from "../../components/Counter/Counter";
      import { onSend } from "./actions";
      import styles from "./HomePage.module.css";
      import "./HomePage.css";
      globalThis.rwRscGlobal = new ProdRwRscServerGlobal();
      const HomePage = ({
        name = "Anonymous"
      }) => {
        return /* @__PURE__ */ jsxs("div", { className: "home-page", children: [
          /* @__PURE__ */ jsx(Assets, {}),
          /* @__PURE__ */ jsxs("div", { style: {
            border: "3px red dashed",
            margin: "1em",
            padding: "1em"
          }, children: [
            /* @__PURE__ */ jsxs("h1", { className: styles.title, children: [
              "Hello ",
              name,
              "!!"
            ] }),
            /* @__PURE__ */ jsx(RscForm, { onSend }),
            /* @__PURE__ */ jsx(Counter, {})
          ] })
        ] });
      };
      export default HomePage;`,
      normalizePath(id)
    )

    // You will see that this snapshot contains:
    //  - an import for the 'preinit' function from 'react-dom'
    //  - three 'preinit' calls within the HomePage function:
    //    - one for the Counter component which is a direct child of the HomePage
    //    - one for the SubCounter component which is a child of the Counter component
    //    - one for the DeepSubCounter component which is a child of the SubCounter component
    expect(output).toMatchInlineSnapshot(`
      "import { preinit } from "react-dom";
      import { jsx, jsxs } from "react/jsx-runtime";
      import { RscForm } from "@tobbe.dev/rsc-test";
      import { Assets } from "@redwoodjs/vite/assets";
      import { ProdRwRscServerGlobal } from "@redwoodjs/vite/rwRscGlobal";
      import { Counter } from "../../components/Counter/Counter";
      import { onSend } from "./actions";
      import styles from "./HomePage.module.css";
      import "./HomePage.css";
      globalThis.rwRscGlobal = new ProdRwRscServerGlobal();
      const HomePage = ({
        name = "Anonymous"
      }) => {
        preinit("assets/Counter-BZpJq_HD.css", {
          as: "style",
          precedence: "medium"
        });
        preinit("assets/rsc-DeepSubCounter-DqMovEyK.css", {
          as: "style",
          precedence: "medium"
        });
        preinit("assets/rsc-SubCounter-Bc4odF6o.css", {
          as: "style",
          precedence: "medium"
        });
        return /* @__PURE__ */jsxs("div", {
          className: "home-page",
          children: [/* @__PURE__ */jsx(Assets, {}), /* @__PURE__ */jsxs("div", {
            style: {
              border: "3px red dashed",
              margin: "1em",
              padding: "1em"
            },
            children: [/* @__PURE__ */jsxs("h1", {
              className: styles.title,
              children: ["Hello ", name, "!!"]
            }), /* @__PURE__ */jsx(RscForm, {
              onSend
            }), /* @__PURE__ */jsx(Counter, {})]
          })]
        });
      };
      export default HomePage;"
    `)

    // We print a log to help with debugging
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "css-preinit:",
      "pages/HomePage/HomePage.tsx",
      "x3",
      "(assets/rsc-SubCounter-Bc4odF6o.css, assets/rsc-DeepSubCounter-DqMovEyK.css, assets/Counter-BZpJq_HD.css)",
    )
  })

  it('correctly generates css mapping', () => {
    const mapping = generateCssMapping(clientBuildManifest)
    expect(mapping).toMatchInlineSnapshot(`
      Map {
        "../../node_modules/@apollo/experimental-nextjs-app-support/dist/ssr/ApolloNextAppProvider.js?commonjs-entry" => [],
        "../../node_modules/@apollo/experimental-nextjs-app-support/dist/ssr/hooks.js?commonjs-entry" => [],
        "../../node_modules/@apollo/experimental-nextjs-app-support/dist/ssr/useTransportValue.js?commonjs-entry" => [],
        "../../node_modules/@redwoodjs/router/dist/link.js?commonjs-entry" => [],
        "../../node_modules/@redwoodjs/router/dist/navLink.js?commonjs-entry" => [],
        "../../node_modules/@redwoodjs/web/dist/components/cell/CellErrorBoundary.js?commonjs-entry" => [],
        "../../node_modules/@tobbe.dev/rsc-test/dist/rsc-test.es.js" => [],
        "../../node_modules/react-hot-toast/dist/index.js?commonjs-entry" => [],
        "_ApolloNextAppProvider-5bPKKKc8.mjs" => [],
        "_CellErrorBoundary-DMFDzi5M.mjs" => [],
        "_Counter-!~{00n}~.mjs" => [],
        "_Counter-Bq0ieMbL.mjs" => [
          "assets/Counter-BZpJq_HD.css",
        ],
        "_RehydrationContext-Dl2W9Kr7.mjs" => [],
        "_formatters-CUUSZ_T1.mjs" => [],
        "_index--S8VRXEP.mjs" => [],
        "_index-Bd_2BODu.mjs" => [],
        "_index-Bweuhc7G.mjs" => [],
        "_index-CCoFRA3G.mjs" => [],
        "_index-CaDi1HgM.mjs" => [],
        "_index-CdhfsYOK.mjs" => [],
        "_index-XIvlupAM.mjs" => [],
        "_index-g0M7Bzdc.mjs" => [],
        "_index-tlgoshdH.mjs" => [],
        "_interopRequireDefault-eg4KyS4X.mjs" => [],
        "_jsx-runtime-Bx74Uukx.mjs" => [],
        "_jsx-runtime-CumG5p_V.mjs" => [],
        "_link-AMDPp6FV.mjs" => [],
        "_navLink-DO_92T9r.mjs" => [],
        "_starts-with-4Ylsn4Ru.mjs" => [],
        "_values-COtCHOJX.mjs" => [],
        "components/Counter/AboutCounter.tsx" => [
          "assets/rsc-DeepSubCounter-DqMovEyK.css",
          "assets/Counter-BZpJq_HD.css",
        ],
        "components/Counter/Counter.tsx" => [
          "assets/rsc-SubCounter-Bc4odF6o.css",
          "assets/rsc-DeepSubCounter-DqMovEyK.css",
          "assets/Counter-BZpJq_HD.css",
        ],
        "components/DeepSubCounter/DeepSubCounter.tsx" => [
          "assets/rsc-DeepSubCounter-DqMovEyK.css",
        ],
        "components/EmptyUser/EmptyUsersCell/EmptyUsersCell.tsx" => [],
        "components/EmptyUser/NewEmptyUser/NewEmptyUser.tsx" => [],
        "components/RandomNumberServerCell/UpdateRandomButton.tsx" => [],
        "components/SubCounter/SubCounter.tsx" => [
          "assets/rsc-SubCounter-Bc4odF6o.css",
          "assets/rsc-DeepSubCounter-DqMovEyK.css",
        ],
        "components/UserExample/NewUserExample/NewUserExample.tsx" => [],
        "components/UserExample/UserExample/UserExample.tsx" => [],
        "components/UserExample/UserExamples/UserExamples.tsx" => [],
        "components/UserExample/UserExamplesCell/UserExamplesCell.tsx" => [],
        "entry.client.tsx" => [
          "assets/rwjs-client-entry-79N3uomO.css",
        ],
      }
    `)
  })

  it('correctly splits client and server components', () => {
    const { serverComponentImports, clientComponentImports } =
      splitClientAndServerComponents(clientEntryFiles, componentImportMap)

    expect(serverComponentImports).toMatchInlineSnapshot(`
      Map {
        "/Users/mojombo/rw-app/web/src/entry.server.tsx" => [
          "react/jsx-runtime",
          "/Users/mojombo/rw-app/web/src/App.tsx",
          "/Users/mojombo/rw-app/web/src/Document.tsx",
        ],
        "/Users/mojombo/rw-app/web/src/entries.ts" => [
          "/Users/mojombo/rw-app/node_modules/@redwoodjs/vite/dist/entries.js",
        ],
        "/Users/mojombo/rw-app/web/src/pages/EmptyUser/EmptyUsersPage/EmptyUsersPage.tsx" => [
          "react/jsx-runtime",
          "/Users/mojombo/rw-app/web/src/components/EmptyUser/EmptyUsersCell/EmptyUsersCell.tsx",
        ],
        "/Users/mojombo/rw-app/web/src/pages/UserExample/UserExamplesPage/UserExamplesPage.tsx" => [
          "react/jsx-runtime",
          "/Users/mojombo/rw-app/web/src/components/UserExample/UserExamplesCell/UserExamplesCell.tsx",
        ],
        "/Users/mojombo/rw-app/web/src/pages/UserExample/NewUserExamplePage/NewUserExamplePage.tsx" => [
          "react/jsx-runtime",
          "/Users/mojombo/rw-app/web/src/components/UserExample/NewUserExample/NewUserExample.tsx",
        ],
        "/Users/mojombo/rw-app/web/src/pages/UserExample/UserExamplePage/UserExamplePage.tsx" => [
          "react/jsx-runtime",
          "/Users/mojombo/rw-app/web/src/components/UserExample/UserExampleServerCell/UserExampleServerCell.tsx",
        ],
        "/Users/mojombo/rw-app/web/src/pages/EmptyUser/NewEmptyUserPage/NewEmptyUserPage.tsx" => [
          "react/jsx-runtime",
          "/Users/mojombo/rw-app/web/src/components/EmptyUser/NewEmptyUser/NewEmptyUser.tsx",
        ],
        "/Users/mojombo/rw-app/web/src/pages/AboutPage/AboutPage.css" => [],
        "/Users/mojombo/rw-app/web/src/index.css" => [],
        "/Users/mojombo/rw-app/web/src/scaffold.css" => [],
        "/Users/mojombo/rw-app/web/src/pages/MultiCellPage/MultiCellPage.css" => [],
        "/Users/mojombo/rw-app/web/src/pages/FatalErrorPage/FatalErrorPage.tsx" => [
          "react/jsx-runtime",
        ],
        "/Users/mojombo/rw-app/web/src/pages/HomePage/HomePage.css" => [],
        "/Users/mojombo/rw-app/web/src/pages/HomePage/actions.ts" => [
          "/Users/mojombo/rw-app/web/src/pages/HomePage/words.ts",
        ],
        "/Users/mojombo/rw-app/web/src/components/RandomNumberServerCell/actions.ts" => [],
        "/Users/mojombo/rw-app/web/src/pages/NotFoundPage/NotFoundPage.tsx" => [
          "react/jsx-runtime",
        ],
        "/Users/mojombo/rw-app/web/src/layouts/ScaffoldLayout/ScaffoldLayout.tsx" => [
          "react/jsx-runtime",
        ],
        "/Users/mojombo/rw-app/web/src/components/Counter/Counter.css" => [],
        "/Users/mojombo/rw-app/web/src/components/RandomNumberServerCell/RandomNumberServerCell.css" => [],
        "/Users/mojombo/rw-app/web/src/pages/HomePage/HomePage.module.css" => [],
        "/Users/mojombo/rw-app/web/src/components/Counter/Counter.module.css" => [],
        "/Users/mojombo/rw-app/web/src/layouts/NavigationLayout/NavigationLayout.css" => [],
        "/Users/mojombo/rw-app/web/src/pages/HomePage/words.ts" => [
          "/Users/mojombo/rw-app/node_modules/server-only/index.js",
        ],
        "/Users/mojombo/rw-app/web/src/components/DeepSubCounter/DeepSubCounter.module.css" => [],
        "/Users/mojombo/rw-app/web/src/components/DeepSubCounter/DeepSubCounter.css" => [],
        "/Users/mojombo/rw-app/web/src/components/SubCounter/SubCounter.module.css" => [],
        "/Users/mojombo/rw-app/web/src/components/SubCounter/SubCounter.css" => [],
        "/Users/mojombo/rw-app/web/src/lib/formatters.tsx" => [
          "react/jsx-runtime",
          "/Users/mojombo/rw-app/node_modules/humanize-string/index.js",
        ],
        "/Users/mojombo/rw-app/web/src/components/RandomNumberServerCell/RandomNumberServerCell.tsx" => [
          "react/jsx-runtime",
          "/Users/mojombo/rw-app/node_modules/@redwoodjs/web/dist/components/cell/createServerCell.js",
          "/Users/mojombo/rw-app/web/src/components/RandomNumberServerCell/actions.ts",
          "/Users/mojombo/rw-app/web/src/components/RandomNumberServerCell/RandomNumberServerCell.css",
        ],
        "/Users/mojombo/rw-app/web/src/components/UserExample/UserExampleServerCell/UserExampleServerCell.tsx" => [
          "react/jsx-runtime",
          "/Users/mojombo/rw-app/node_modules/@redwoodjs/web/dist/components/cell/createServerCell.js",
          "/Users/mojombo/rw-app/api/src/lib/db.ts",
          "/Users/mojombo/rw-app/web/src/components/UserExample/UserExample/UserExample.tsx",
        ],
        "/Users/mojombo/rw-app/web/src/components/EmptyUser/EmptyUserForm/EmptyUserForm.tsx" => [
          "react/jsx-runtime",
          "/Users/mojombo/rw-app/node_modules/@redwoodjs/forms/dist/index.js",
        ],
        "/Users/mojombo/rw-app/web/src/components/UserExample/UserExampleForm/UserExampleForm.tsx" => [
          "react/jsx-runtime",
          "/Users/mojombo/rw-app/node_modules/@redwoodjs/forms/dist/index.js",
        ],
        "/Users/mojombo/rw-app/web/src/pages/AboutPage/AboutPage.tsx" => [
          "react/jsx-runtime",
          "/Users/mojombo/rw-app/node_modules/@redwoodjs/vite/dist/fully-react/assets.js",
          "/Users/mojombo/rw-app/node_modules/@redwoodjs/vite/dist/fully-react/rwRscGlobal.js",
          "/Users/mojombo/rw-app/web/src/components/Counter/AboutCounter.tsx",
          "/Users/mojombo/rw-app/web/src/pages/AboutPage/AboutPage.css",
        ],
        "/Users/mojombo/rw-app/web/src/pages/MultiCellPage/MultiCellPage.tsx" => [
          "react/jsx-runtime",
          "/Users/mojombo/rw-app/node_modules/@redwoodjs/vite/dist/fully-react/assets.js",
          "/Users/mojombo/rw-app/node_modules/@redwoodjs/vite/dist/fully-react/rwRscGlobal.js",
          "/Users/mojombo/rw-app/web/src/components/RandomNumberServerCell/actions.ts",
          "/Users/mojombo/rw-app/web/src/components/RandomNumberServerCell/RandomNumberServerCell.tsx",
          "/Users/mojombo/rw-app/web/src/components/RandomNumberServerCell/UpdateRandomButton.tsx",
          "/Users/mojombo/rw-app/web/src/pages/MultiCellPage/MultiCellPage.css",
        ],
        "/Users/mojombo/rw-app/web/src/pages/HomePage/HomePage.tsx" => [
          "react/jsx-runtime",
          "/Users/mojombo/rw-app/node_modules/@tobbe.dev/rsc-test/dist/rsc-test.es.js",
          "/Users/mojombo/rw-app/node_modules/@redwoodjs/vite/dist/fully-react/assets.js",
          "/Users/mojombo/rw-app/node_modules/@redwoodjs/vite/dist/fully-react/rwRscGlobal.js",
          "/Users/mojombo/rw-app/web/src/components/Counter/Counter.tsx",
          "/Users/mojombo/rw-app/web/src/pages/HomePage/actions.ts",
          "/Users/mojombo/rw-app/web/src/pages/HomePage/HomePage.module.css",
          "/Users/mojombo/rw-app/web/src/pages/HomePage/HomePage.css",
        ],
        "/Users/mojombo/rw-app/web/src/Document.tsx" => [
          "react/jsx-runtime",
          " /Users/mojombo/rw-app/node_modules/@redwoodjs/web/dist/index.js?commonjs-es-import",
        ],
        "/Users/mojombo/rw-app/web/src/App.tsx" => [
          "react/jsx-runtime",
          " /Users/mojombo/rw-app/node_modules/@redwoodjs/web/dist/index.js?commonjs-es-import",
          "/Users/mojombo/rw-app/node_modules/@redwoodjs/web/dist/apollo/suspense.js",
          "/Users/mojombo/rw-app/web/src/pages/FatalErrorPage/FatalErrorPage.tsx",
          "/Users/mojombo/rw-app/web/src/Routes.tsx",
          "/Users/mojombo/rw-app/web/src/index.css",
          "/Users/mojombo/rw-app/web/src/scaffold.css",
        ],
        "/Users/mojombo/rw-app/web/src/Routes.tsx" => [
          "react/jsx-runtime",
          "/Users/mojombo/rw-app/node_modules/@redwoodjs/vite/dist/client.js",
          " /Users/mojombo/rw-app/node_modules/@redwoodjs/router/dist/index.js?commonjs-es-import",
          "/Users/mojombo/rw-app/web/src/layouts/NavigationLayout/NavigationLayout.tsx",
          "/Users/mojombo/rw-app/web/src/layouts/ScaffoldLayout/ScaffoldLayout.tsx",
          "/Users/mojombo/rw-app/web/src/pages/NotFoundPage/NotFoundPage.tsx",
        ],
        "/Users/mojombo/rw-app/web/src/layouts/NavigationLayout/NavigationLayout.tsx" => [
          "react/jsx-runtime",
          " /Users/mojombo/rw-app/node_modules/@redwoodjs/router/dist/index.js?commonjs-es-import",
          "/Users/mojombo/rw-app/web/src/layouts/NavigationLayout/NavigationLayout.css",
        ],
        "/Users/mojombo/rw-app/web/src/components/EmptyUser/EmptyUsers/EmptyUsers.tsx" => [
          "react/jsx-runtime",
          "/Users/mojombo/rw-app/node_modules/graphql-tag/lib/index.js",
          " /Users/mojombo/rw-app/node_modules/@redwoodjs/router/dist/index.js?commonjs-es-import",
          " /Users/mojombo/rw-app/node_modules/@redwoodjs/web/dist/index.js?commonjs-es-import",
          "/Users/mojombo/rw-app/node_modules/@redwoodjs/web/toast/index.js",
          "/Users/mojombo/rw-app/web/src/components/EmptyUser/EmptyUsersCell/EmptyUsersCell.tsx",
          "/Users/mojombo/rw-app/web/src/lib/formatters.tsx",
        ],
      }
    `)
    expect(clientComponentImports).toMatchInlineSnapshot(`
      Map {
        "/Users/mojombo/rw-app/web/src/components/Counter/AboutCounter.tsx" => [
          "react/jsx-runtime",
          "react",
          "/Users/mojombo/rw-app/web/src/components/DeepSubCounter/DeepSubCounter.tsx",
          "/Users/mojombo/rw-app/web/src/components/Counter/Counter.module.css",
          "/Users/mojombo/rw-app/web/src/components/Counter/Counter.css",
        ],
        "/Users/mojombo/rw-app/web/src/components/RandomNumberServerCell/UpdateRandomButton.tsx" => [
          "react/jsx-runtime",
          "/Users/mojombo/rw-app/web/src/components/RandomNumberServerCell/actions.ts",
        ],
        "/Users/mojombo/rw-app/web/src/components/Counter/Counter.tsx" => [
          "react/jsx-runtime",
          "react",
          "/Users/mojombo/rw-app/node_modules/client-only/index.js",
          "/Users/mojombo/rw-app/web/src/components/SubCounter/SubCounter.tsx",
          "/Users/mojombo/rw-app/web/src/components/Counter/Counter.module.css",
          "/Users/mojombo/rw-app/web/src/components/Counter/Counter.css",
        ],
        "/Users/mojombo/rw-app/web/src/components/DeepSubCounter/DeepSubCounter.tsx" => [
          "react/jsx-runtime",
          "react",
          "/Users/mojombo/rw-app/node_modules/client-only/index.js",
          "/Users/mojombo/rw-app/web/src/components/DeepSubCounter/DeepSubCounter.module.css",
          "/Users/mojombo/rw-app/web/src/components/DeepSubCounter/DeepSubCounter.css",
        ],
        "/Users/mojombo/rw-app/web/src/components/SubCounter/SubCounter.tsx" => [
          "react/jsx-runtime",
          "react",
          "/Users/mojombo/rw-app/node_modules/client-only/index.js",
          "/Users/mojombo/rw-app/web/src/components/DeepSubCounter/DeepSubCounter.tsx",
          "/Users/mojombo/rw-app/web/src/components/SubCounter/SubCounter.module.css",
          "/Users/mojombo/rw-app/web/src/components/SubCounter/SubCounter.css",
        ],
        "/Users/mojombo/rw-app/web/src/components/EmptyUser/EmptyUsersCell/EmptyUsersCell.tsx" => [
          "react/jsx-runtime",
          " /Users/mojombo/rw-app/node_modules/@redwoodjs/web/dist/index.js?commonjs-es-import",
          "/Users/mojombo/rw-app/node_modules/graphql-tag/lib/index.js",
          " /Users/mojombo/rw-app/node_modules/@redwoodjs/router/dist/index.js?commonjs-es-import",
          "/Users/mojombo/rw-app/web/src/components/EmptyUser/EmptyUsers/EmptyUsers.tsx",
        ],
        "/Users/mojombo/rw-app/web/src/components/EmptyUser/NewEmptyUser/NewEmptyUser.tsx" => [
          "react/jsx-runtime",
          "/Users/mojombo/rw-app/node_modules/graphql-tag/lib/index.js",
          " /Users/mojombo/rw-app/node_modules/@redwoodjs/router/dist/index.js?commonjs-es-import",
          " /Users/mojombo/rw-app/node_modules/@redwoodjs/web/dist/index.js?commonjs-es-import",
          "/Users/mojombo/rw-app/node_modules/@redwoodjs/web/toast/index.js",
          "/Users/mojombo/rw-app/web/src/components/EmptyUser/EmptyUserForm/EmptyUserForm.tsx",
        ],
        "/Users/mojombo/rw-app/web/src/components/UserExample/NewUserExample/NewUserExample.tsx" => [
          "react/jsx-runtime",
          "/Users/mojombo/rw-app/node_modules/graphql-tag/lib/index.js",
          " /Users/mojombo/rw-app/node_modules/@redwoodjs/router/dist/index.js?commonjs-es-import",
          " /Users/mojombo/rw-app/node_modules/@redwoodjs/web/dist/index.js?commonjs-es-import",
          "/Users/mojombo/rw-app/node_modules/@redwoodjs/web/toast/index.js",
          "/Users/mojombo/rw-app/web/src/components/UserExample/UserExampleForm/UserExampleForm.tsx",
        ],
        "/Users/mojombo/rw-app/web/src/components/UserExample/UserExamplesCell/UserExamplesCell.tsx" => [
          "react/jsx-runtime",
          " /Users/mojombo/rw-app/node_modules/@redwoodjs/web/dist/index.js?commonjs-es-import",
          "/Users/mojombo/rw-app/node_modules/graphql-tag/lib/index.js",
          " /Users/mojombo/rw-app/node_modules/@redwoodjs/router/dist/index.js?commonjs-es-import",
          "/Users/mojombo/rw-app/web/src/components/UserExample/UserExamples/UserExamples.tsx",
        ],
        "/Users/mojombo/rw-app/web/src/components/UserExample/UserExamples/UserExamples.tsx" => [
          "react/jsx-runtime",
          "/Users/mojombo/rw-app/node_modules/graphql-tag/lib/index.js",
          " /Users/mojombo/rw-app/node_modules/@redwoodjs/router/dist/index.js?commonjs-es-import",
          " /Users/mojombo/rw-app/node_modules/@redwoodjs/web/dist/components/GraphQLHooksProvider.js?commonjs-es-import",
          "/Users/mojombo/rw-app/node_modules/@redwoodjs/web/toast/index.js",
          "/Users/mojombo/rw-app/web/src/lib/formatters.tsx",
        ],
        "/Users/mojombo/rw-app/web/src/components/UserExample/UserExample/UserExample.tsx" => [
          "react/jsx-runtime",
          "/Users/mojombo/rw-app/node_modules/graphql-tag/lib/index.js",
          " /Users/mojombo/rw-app/node_modules/@redwoodjs/router/dist/index.js?commonjs-es-import",
          " /Users/mojombo/rw-app/node_modules/@redwoodjs/web/dist/index.js?commonjs-es-import",
          "/Users/mojombo/rw-app/node_modules/@redwoodjs/web/toast/index.js",
          "/Users/mojombo/rw-app/web/src/lib/formatters.tsx",
        ],
      }
    `)
  })

  it('correctly generates server to client component mapping', () => {
    const serverComponentImports = new Map<string, string[]>()
    const clientComponentImports = new Map<string, string[]>()
    const clientComponentIds = Object.values(clientEntryFiles)
    for (const [key, value] of componentImportMap.entries()) {
      if (clientComponentIds.includes(key)) {
        clientComponentImports.set(key, value)
      } else {
        serverComponentImports.set(key, value)
      }
    }

    const serverComponentClientImportIds =
      generateServerComponentClientComponentMapping(
        serverComponentImports,
        clientComponentImports,
      )

    expect(serverComponentClientImportIds).toMatchInlineSnapshot(`
      Map {
        "/Users/mojombo/rw-app/web/src/entry.server.tsx" => [],
        "/Users/mojombo/rw-app/web/src/entries.ts" => [],
        "/Users/mojombo/rw-app/web/src/pages/EmptyUser/EmptyUsersPage/EmptyUsersPage.tsx" => [
          "/Users/mojombo/rw-app/web/src/components/EmptyUser/EmptyUsersCell/EmptyUsersCell.tsx",
          "react/jsx-runtime",
          " /Users/mojombo/rw-app/node_modules/@redwoodjs/web/dist/index.js?commonjs-es-import",
          "/Users/mojombo/rw-app/node_modules/graphql-tag/lib/index.js",
          " /Users/mojombo/rw-app/node_modules/@redwoodjs/router/dist/index.js?commonjs-es-import",
          "/Users/mojombo/rw-app/web/src/components/EmptyUser/EmptyUsers/EmptyUsers.tsx",
        ],
        "/Users/mojombo/rw-app/web/src/pages/UserExample/UserExamplesPage/UserExamplesPage.tsx" => [
          "/Users/mojombo/rw-app/web/src/components/UserExample/UserExamplesCell/UserExamplesCell.tsx",
          "react/jsx-runtime",
          " /Users/mojombo/rw-app/node_modules/@redwoodjs/web/dist/index.js?commonjs-es-import",
          "/Users/mojombo/rw-app/node_modules/graphql-tag/lib/index.js",
          " /Users/mojombo/rw-app/node_modules/@redwoodjs/router/dist/index.js?commonjs-es-import",
          "/Users/mojombo/rw-app/web/src/components/UserExample/UserExamples/UserExamples.tsx",
          " /Users/mojombo/rw-app/node_modules/@redwoodjs/web/dist/components/GraphQLHooksProvider.js?commonjs-es-import",
          "/Users/mojombo/rw-app/node_modules/@redwoodjs/web/toast/index.js",
          "/Users/mojombo/rw-app/web/src/lib/formatters.tsx",
        ],
        "/Users/mojombo/rw-app/web/src/pages/UserExample/NewUserExamplePage/NewUserExamplePage.tsx" => [
          "/Users/mojombo/rw-app/web/src/components/UserExample/NewUserExample/NewUserExample.tsx",
          "react/jsx-runtime",
          "/Users/mojombo/rw-app/node_modules/graphql-tag/lib/index.js",
          " /Users/mojombo/rw-app/node_modules/@redwoodjs/router/dist/index.js?commonjs-es-import",
          " /Users/mojombo/rw-app/node_modules/@redwoodjs/web/dist/index.js?commonjs-es-import",
          "/Users/mojombo/rw-app/node_modules/@redwoodjs/web/toast/index.js",
          "/Users/mojombo/rw-app/web/src/components/UserExample/UserExampleForm/UserExampleForm.tsx",
        ],
        "/Users/mojombo/rw-app/web/src/pages/UserExample/UserExamplePage/UserExamplePage.tsx" => [],
        "/Users/mojombo/rw-app/web/src/pages/EmptyUser/NewEmptyUserPage/NewEmptyUserPage.tsx" => [
          "/Users/mojombo/rw-app/web/src/components/EmptyUser/NewEmptyUser/NewEmptyUser.tsx",
          "react/jsx-runtime",
          "/Users/mojombo/rw-app/node_modules/graphql-tag/lib/index.js",
          " /Users/mojombo/rw-app/node_modules/@redwoodjs/router/dist/index.js?commonjs-es-import",
          " /Users/mojombo/rw-app/node_modules/@redwoodjs/web/dist/index.js?commonjs-es-import",
          "/Users/mojombo/rw-app/node_modules/@redwoodjs/web/toast/index.js",
          "/Users/mojombo/rw-app/web/src/components/EmptyUser/EmptyUserForm/EmptyUserForm.tsx",
        ],
        "/Users/mojombo/rw-app/web/src/pages/AboutPage/AboutPage.css" => [],
        "/Users/mojombo/rw-app/web/src/index.css" => [],
        "/Users/mojombo/rw-app/web/src/scaffold.css" => [],
        "/Users/mojombo/rw-app/web/src/pages/MultiCellPage/MultiCellPage.css" => [],
        "/Users/mojombo/rw-app/web/src/pages/FatalErrorPage/FatalErrorPage.tsx" => [],
        "/Users/mojombo/rw-app/web/src/pages/HomePage/HomePage.css" => [],
        "/Users/mojombo/rw-app/web/src/pages/HomePage/actions.ts" => [],
        "/Users/mojombo/rw-app/web/src/components/RandomNumberServerCell/actions.ts" => [],
        "/Users/mojombo/rw-app/web/src/pages/NotFoundPage/NotFoundPage.tsx" => [],
        "/Users/mojombo/rw-app/web/src/layouts/ScaffoldLayout/ScaffoldLayout.tsx" => [],
        "/Users/mojombo/rw-app/web/src/components/Counter/Counter.css" => [],
        "/Users/mojombo/rw-app/web/src/components/RandomNumberServerCell/RandomNumberServerCell.css" => [],
        "/Users/mojombo/rw-app/web/src/pages/HomePage/HomePage.module.css" => [],
        "/Users/mojombo/rw-app/web/src/components/Counter/Counter.module.css" => [],
        "/Users/mojombo/rw-app/web/src/layouts/NavigationLayout/NavigationLayout.css" => [],
        "/Users/mojombo/rw-app/web/src/pages/HomePage/words.ts" => [],
        "/Users/mojombo/rw-app/web/src/components/DeepSubCounter/DeepSubCounter.module.css" => [],
        "/Users/mojombo/rw-app/web/src/components/DeepSubCounter/DeepSubCounter.css" => [],
        "/Users/mojombo/rw-app/web/src/components/SubCounter/SubCounter.module.css" => [],
        "/Users/mojombo/rw-app/web/src/components/SubCounter/SubCounter.css" => [],
        "/Users/mojombo/rw-app/web/src/lib/formatters.tsx" => [],
        "/Users/mojombo/rw-app/web/src/components/RandomNumberServerCell/RandomNumberServerCell.tsx" => [],
        "/Users/mojombo/rw-app/web/src/components/UserExample/UserExampleServerCell/UserExampleServerCell.tsx" => [
          "/Users/mojombo/rw-app/web/src/components/UserExample/UserExample/UserExample.tsx",
          "react/jsx-runtime",
          "/Users/mojombo/rw-app/node_modules/graphql-tag/lib/index.js",
          " /Users/mojombo/rw-app/node_modules/@redwoodjs/router/dist/index.js?commonjs-es-import",
          " /Users/mojombo/rw-app/node_modules/@redwoodjs/web/dist/index.js?commonjs-es-import",
          "/Users/mojombo/rw-app/node_modules/@redwoodjs/web/toast/index.js",
          "/Users/mojombo/rw-app/web/src/lib/formatters.tsx",
        ],
        "/Users/mojombo/rw-app/web/src/components/EmptyUser/EmptyUserForm/EmptyUserForm.tsx" => [],
        "/Users/mojombo/rw-app/web/src/components/UserExample/UserExampleForm/UserExampleForm.tsx" => [],
        "/Users/mojombo/rw-app/web/src/pages/AboutPage/AboutPage.tsx" => [
          "/Users/mojombo/rw-app/web/src/components/Counter/AboutCounter.tsx",
          "react/jsx-runtime",
          "react",
          "/Users/mojombo/rw-app/web/src/components/DeepSubCounter/DeepSubCounter.tsx",
          "/Users/mojombo/rw-app/node_modules/client-only/index.js",
          "/Users/mojombo/rw-app/web/src/components/DeepSubCounter/DeepSubCounter.module.css",
          "/Users/mojombo/rw-app/web/src/components/DeepSubCounter/DeepSubCounter.css",
          "/Users/mojombo/rw-app/web/src/components/Counter/Counter.module.css",
          "/Users/mojombo/rw-app/web/src/components/Counter/Counter.css",
        ],
        "/Users/mojombo/rw-app/web/src/pages/MultiCellPage/MultiCellPage.tsx" => [
          "/Users/mojombo/rw-app/web/src/components/RandomNumberServerCell/UpdateRandomButton.tsx",
          "react/jsx-runtime",
          "/Users/mojombo/rw-app/web/src/components/RandomNumberServerCell/actions.ts",
        ],
        "/Users/mojombo/rw-app/web/src/pages/HomePage/HomePage.tsx" => [
          "/Users/mojombo/rw-app/web/src/components/Counter/Counter.tsx",
          "react/jsx-runtime",
          "react",
          "/Users/mojombo/rw-app/node_modules/client-only/index.js",
          "/Users/mojombo/rw-app/web/src/components/SubCounter/SubCounter.tsx",
          "/Users/mojombo/rw-app/web/src/components/DeepSubCounter/DeepSubCounter.tsx",
          "/Users/mojombo/rw-app/web/src/components/DeepSubCounter/DeepSubCounter.module.css",
          "/Users/mojombo/rw-app/web/src/components/DeepSubCounter/DeepSubCounter.css",
          "/Users/mojombo/rw-app/web/src/components/SubCounter/SubCounter.module.css",
          "/Users/mojombo/rw-app/web/src/components/SubCounter/SubCounter.css",
          "/Users/mojombo/rw-app/web/src/components/Counter/Counter.module.css",
          "/Users/mojombo/rw-app/web/src/components/Counter/Counter.css",
        ],
        "/Users/mojombo/rw-app/web/src/Document.tsx" => [],
        "/Users/mojombo/rw-app/web/src/App.tsx" => [],
        "/Users/mojombo/rw-app/web/src/Routes.tsx" => [],
        "/Users/mojombo/rw-app/web/src/layouts/NavigationLayout/NavigationLayout.tsx" => [],
        "/Users/mojombo/rw-app/web/src/components/EmptyUser/EmptyUsers/EmptyUsers.tsx" => [
          "/Users/mojombo/rw-app/web/src/components/EmptyUser/EmptyUsersCell/EmptyUsersCell.tsx",
          "react/jsx-runtime",
          " /Users/mojombo/rw-app/node_modules/@redwoodjs/web/dist/index.js?commonjs-es-import",
          "/Users/mojombo/rw-app/node_modules/graphql-tag/lib/index.js",
          " /Users/mojombo/rw-app/node_modules/@redwoodjs/router/dist/index.js?commonjs-es-import",
          "/Users/mojombo/rw-app/web/src/components/EmptyUser/EmptyUsers/EmptyUsers.tsx",
        ],
      }
    `)
  })
})

