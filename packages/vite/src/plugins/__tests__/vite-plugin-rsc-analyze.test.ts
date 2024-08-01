import { describe, expect, it } from 'vitest'

import { rscAnalyzePlugin } from '../vite-plugin-rsc-analyze.js'

describe('vite-plugin-rsc-analyze', () => {
  it('finds "use server" action inlined as an arrow function', async () => {
    const foundFiles: Array<string> = []

    function callback(id: string) {
      foundFiles.push(id)
    }

    const plugin = rscAnalyzePlugin(callback, callback)

    const code = `
      import { jsx, jsxs } from "react/jsx-runtime";
      import fs from "node:fs";
      import "./ServerDelayForm.css";
      const ServerDelayForm = () => {
        let delay = 0;
        if (fs.existsSync("settings.json")) {
          delay = JSON.parse(fs.readFileSync("settings.json", "utf8")).delay || 0;
        }
        return /* @__PURE__ */ jsx("div", { className: "server-delay-form", children: /* @__PURE__ */ jsxs("form", { action: async (formData) => {
          "use server";
          await fs.promises.writeFile("settings.json", \`{ "delay": \${formData.get("delay")} }
      \`);
        }, children: [
          /* @__PURE__ */ jsxs("label", { htmlFor: "delay", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              "Delay (",
              delay,
              "ms)"
            ] }),
            /* @__PURE__ */ jsx("input", { type: "number", id: "delay", name: "delay" })
          ] }),
          /* @__PURE__ */ jsx("button", { type: "submit", children: "Set" })
        ] }) });
      };
      export default ServerDelayForm;
      `

    if (typeof plugin.transform !== 'function') {
      return
    }

    plugin.transform.bind({})(code, 'test.tsx')

    expect(foundFiles).toHaveLength(1)
    expect(foundFiles[0]).toEqual('test.tsx')
  })

  it('finds "use server" action inlined as a named function', async () => {
    const foundFiles: Array<string> = []

    function callback(id: string) {
      foundFiles.push(id)
    }

    const plugin = rscAnalyzePlugin(callback, callback)

    const code = `
      import { jsx, jsxs } from "react/jsx-runtime";
      import fs from "node:fs";
      import "./ServerDelayForm.css";
      const ServerDelayForm = () => {
        let delay = 0;
        if (fs.existsSync("settings.json")) {
          delay = JSON.parse(fs.readFileSync("settings.json", "utf8")).delay || 0;
        }
        return /* @__PURE__ */ jsx("div", { className: "server-delay-form", children: /* @__PURE__ */ jsxs("form", { action: async function formAction(formData) {
          "use server";
          await fs.promises.writeFile("settings.json", \`{ "delay": \${formData.get("delay")} }
      \`);
        }, children: [
          /* @__PURE__ */ jsxs("label", { htmlFor: "delay", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              "Delay (",
              delay,
              "ms)"
            ] }),
            /* @__PURE__ */ jsx("input", { type: "number", id: "delay", name: "delay" })
          ] }),
          /* @__PURE__ */ jsx("button", { type: "submit", children: "Set" })
        ] }) });
      };
      export default ServerDelayForm;
      `

    if (typeof plugin.transform !== 'function') {
      return
    }

    plugin.transform.bind({})(code, 'test.tsx')

    expect(foundFiles).toHaveLength(1)
    expect(foundFiles[0]).toEqual('test.tsx')
  })

  it('finds "use server" action as a named function', async () => {
    const foundFiles: Array<string> = []

    function callback(id: string) {
      foundFiles.push(id)
    }

    const plugin = rscAnalyzePlugin(callback, callback)

    const code = `
      import { jsx, jsxs } from "react/jsx-runtime";
      import fs from "node:fs";
      import "./ServerDelayForm.css";
      async function formAction(formData) {
        "use server";
        await fs.promises.writeFile("settings.json", \`{ "delay": \${formData.get("delay")} }
      \`);
      }
      const ServerDelayForm = () => {
        let delay = 0;
        if (fs.existsSync("settings.json")) {
          delay = JSON.parse(fs.readFileSync("settings.json", "utf8")).delay || 0;
        }
        return /* @__PURE__ */ jsx("div", { className: "server-delay-form", children: /* @__PURE__ */ jsxs("form", { action: formAction, children: [
          /* @__PURE__ */ jsxs("label", { htmlFor: "delay", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              "Delay (",
              delay,
              "ms)"
            ] }),
            /* @__PURE__ */ jsx("input", { type: "number", id: "delay", name: "delay" })
          ] }),
          /* @__PURE__ */ jsx("button", { type: "submit", children: "Set" })
        ] }) });
      };
      export default ServerDelayForm;
      `

    if (typeof plugin.transform !== 'function') {
      return
    }

    plugin.transform.bind({})(code, 'test.tsx')

    expect(foundFiles).toHaveLength(1)
    expect(foundFiles[0]).toEqual('test.tsx')
  })
})
