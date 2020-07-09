import { outputFileSync } from 'fs-extra'
import proxyquire from 'proxyquire'
import { spawnCancellable } from '../x/child_process'

type FileOverrides = { [filePath: string]: string }

// cmd = 'g cell foobar'
export async function redwood_gen_dry_run(
  projectRoot: string,
  cmd: string,
  fileOverrides: FileOverrides = {}
): Promise<{ stdout: string; files: [string, string][] }> {
  // eslint-disable-next-line
  const x = [proxyquire].length // we need to make sure this module is required. it will be used in a script we will generate dynamically
  const ff = `.decoupled/tmp/rwcli.js`
  const jsfile = projectRoot + '/' + ff
  let requireStatement = 'proxyquire'
  // if (extensionPath) {
  //   requireStatement = relative(
  //     dirname(jsfile),
  //     extensionPath + "/node_modules/proxyquire"
  //   );
  // }
  outputFileSync(jsfile, buildJS(fileOverrides, requireStatement))
  const cmdargs = 'node ' + jsfile + ' ' + cmd
  const [cmd2, ...args] = cmdargs.split(' ')
  const { stdout: out, stderr } = await spawnCancellable(cmd2, args, {
    cwd: projectRoot,
  })
  if (stderr) {
    throw new Error(stderr)
  }
  //const out = execSync(cmdargs, { cwd: projectRoot })
  const [stdout, jsondata] = out.toString().split(separator)
  return { stdout, files: JSON.parse(jsondata) }
}

const separator = '---------===----===--------'

function buildJS(
  fileOverrides: FileOverrides = {},
  proxyquireRequireStatement = 'proxyquire'
) {
  let js = /*js*/ `
  // redwood_gen_dry_run___generated_template.js
  const proxyquire = require("proxyquire")
  const fs = require("fs")
  const files = []
  const fileOverrides = { FILE: "OVERRIDES" }
  proxyquire("@redwoodjs/cli/dist", {
    fs: {
      mkdir() {},
      mkdirSync(...args) {},
      writeFile(...args) {
        files.push(args)
      },
      writeFileSync(...args) {
        files.push(args)
      },
      readFileSync(...args) {
        const path = args[0]
        if (typeof path === "string")
          if (fileOverrides[path]) return fileOverrides[path]
        return fs.readFileSync.apply(fs, args)
      },
      "@global": true,
    },
  })
  process.on("exit", () => {
    console.log("__SEPARATOR__")
    console.log(JSON.stringify(files, null, 2))
  })
  `
  // replace some placeholders in the template
  js = js.replace(`{ FILE: "OVERRIDES" }`, JSON.stringify(fileOverrides))
  js = js.replace(`"__SEPARATOR__"`, JSON.stringify(separator))
  js = js.replace(
    `require("proxyquire")`,
    `require("${proxyquireRequireStatement}")`
  )
  return js
}
