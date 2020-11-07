import execa from 'execa'

export default () => async () => {
  /**
   * Sync yarn.lock file and node_modules folder.
   * Refer https://github.com/redwoodjs/redwood/issues/1301 for more details.
   */
  await execa('yarn', ['install', '--check-files'])
}
