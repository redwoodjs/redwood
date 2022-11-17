import { spawnSync } from 'child_process'
import path from 'path'

export const BASE_DIR = path.resolve(__dirname, '..', '..', '..', '..')
const CLI = path.join(BASE_DIR, 'packages', 'cli', 'dist', 'index.js')

export function rw(args, options) {
  const { status, stdout, stderr } = spawnSync('node', [CLI, ...args], {
    cwd: BASE_DIR,
    ...options,
  })

  return {
    status,
    stdout: stdout.toString().trim(),
    stderr: stderr.toString().trim(),
  }
}
