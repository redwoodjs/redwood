import { setTomlSetting } from '@redwoodjs/cli-helpers'

import { isModuleInstalled, installModule } from '../lib/packages'

export const handler = async (options) => {
  try {
    // Check the module is installed
    if (!isModuleInstalled('@redwoodjs/studio')) {
      console.log(
        'The studio package is not installed, installing it for you, this may take a moment...'
      )
      await installModule('@redwoodjs/studio', '11.0.1')
      console.log('Studio package installed successfully.')

      console.log('Adding config to redwood.toml...')
      setTomlSetting('studio', 'enabled', true)
    }

    // Import studio and start it
    const { serve } = await import('@redwoodjs/studio')
    await serve({ open: options.open, enableWeb: true })
  } catch (e) {
    console.log('Cannot start the development studio')
    console.log(e)
    process.exit(1)
  }
}
