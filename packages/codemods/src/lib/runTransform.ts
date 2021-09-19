import execa from 'execa'

interface RunTransformParams {
  transformFilePath: string
  targetPath: string
  variables?: Record<string, string | number>
}

const runTransform = ({
  transformFilePath,
  targetPath,
  variables = {},
}: RunTransformParams) => {
  // transforms {key: val} to --key=val string
  const options = Object.entries(variables)
    .map((key, val) => `--${key}=${val}`)
    .join(' ')

  execa.sync(
    `yarn jscodeshift -t ${transformFilePath} ${targetPath} ${options}`
  )
}

export default runTransform
