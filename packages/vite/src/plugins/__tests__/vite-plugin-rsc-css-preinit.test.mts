import path from 'node:path'
import { vol } from 'memfs'

import { rscCssPreinitPlugin } from '../vite-plugin-rsc-css-preinit'
import { afterAll, beforeAll, describe, it, expect, vi } from 'vitest'

import {
  clientBuildManifest,
  clientEntryFiles,
  componentImportMap,
} from './vite-plugin-rsc-css-preinit-fixture-values'

vi.mock('fs', async () => ({ default: (await import('memfs')).fs }))

const RWJS_CWD = process.env.RWJS_CWD

let consoleLogSpy
beforeAll(() => {
  process.env.RWJS_CWD = '/Users/mojombo/rw-app/'
  vol.fromJSON({
    'redwood.toml': '',
    [path.join('web', 'dist', 'client', 'client-build-manifest.json')]: JSON.stringify(clientBuildManifest),
  }, process.env.RWJS_CWD)
  consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterAll(() => {
  process.env.RWJS_CWD = RWJS_CWD
  consoleLogSpy.mockRestore()
})

describe.skip('rscCssPreinitPlugin', () => {
  it('should insert preinits for all nested client components', async () => {
    const plugin = rscCssPreinitPlugin(clientEntryFiles, componentImportMap)

    if (typeof plugin.transform !== 'function') {
      return
    }

    // Calling `bind` to please TS
    // See https://stackoverflow.com/a/70463512/88106
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
      path.join(process.env.RWJS_CWD!, 'web', 'src', 'pages', 'HomePage', 'HomePage.tsx')
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
          as: "style"
        });
        preinit("assets/rsc-DeepSubCounter-DqMovEyK.css", {
          as: "style"
        });
        preinit("assets/rsc-SubCounter-Bc4odF6o.css", {
          as: "style"
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
})

