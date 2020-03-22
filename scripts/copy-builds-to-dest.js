const fs = require('fs')
const path = require('path')

const chokidar = require('chokidar')
const yargs = require('yargs')

const copyBuildToDest = (file, source, destination) => {
  destination = path.join(destination, file.replace(source, '.'))
  source = path.resolve(process.cwd(), file)

  console.log(file)

  fs.mkdirSync(destination.replace(path.basename(destination), ''), {
    recursive: true,
  })
  fs.copyFileSync(source, destination)
}

const removeFileFromDest = (file, source, destination) => {}

// Watch the source directory for changes to files
// and copy those to the destination's `node_modules/@redwoodjs/*`
const start = ({ destination }) => {
  const source = path.resolve('./packages/api')
  destination = path.resolve(
    process.cwd(),
    destination,
    'node_modules/@redwoodjs/'
  )

  // check that the destination folders exist.
  if (!fs.existsSync(destination)) {
    console.log(`${destination} doesn't exist`)
    process.exit(1)
  }

  console.log(`Copying files from '${source}'\nto '${destination}'`)

  const watcher = chokidar.watch(source, {
    cwd: process.cwd(),
    persistent: true,
    followSymlinks: false,
    awaitWriteFinish: true,
  })
  watcher
    .on('add', (file) => copyBuildToDest(file, source, destination))
    .on('change', (file) => copyBuildToDest(file, source, destination))
    .on('unlink', (file) => removeFileFromDest(file, source, destination))
}

const { destination } = yargs
  .usage('Usage: $0 [destination]')
  .demandOption(['destination']).argv

start({ destination })
