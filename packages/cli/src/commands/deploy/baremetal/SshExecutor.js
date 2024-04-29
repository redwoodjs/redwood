export class SshExecutor {
  constructor(verbose) {
    const { NodeSSH } = require('node-ssh')
    this.ssh = new NodeSSH()
    this.verbose = verbose
  }

  /**
   * Executes a single command via SSH connection. Throws an error and sets
   * the exit code with the same code returned from the SSH command.
   */
  async exec(path, command, args) {
    let sshCommand = command

    if (args) {
      sshCommand += ` ${args.join(' ')}`
    }

    if (this.verbose) {
      console.log(
        `SshExecutor::exec running command \`${command} ${args.join(' ')}\` in ${path}`,
      )
    }

    const result = await this.ssh.execCommand(sshCommand, {
      cwd: path,
    })

    if (result.code !== 0) {
      const error = new Error(
        `Error while running command \`${command} ${args.join(' ')}\``,
      )
      error.exitCode = result.code
      throw error
    }

    return result
  }

  connect(options) {
    return this.ssh.connect(options)
  }

  dispose() {
    return this.ssh.dispose()
  }
}
