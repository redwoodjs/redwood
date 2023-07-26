import fs from 'fs/promises'
import path from 'path'

import { transform as svgrTransform } from '@svgr/core'
import type { API, FileInfo, StringLiteral } from 'jscodeshift'
import pascalcase from 'pascalcase'

import { getPaths } from '@redwoodjs/project-config'

/**
 * @param svgFilePath Full path to the existing svg file
 * @param outputPath Full path to the output file
 * @param componentName Name of the React component to generate inside the output file
 * @param typescript Whether to generate TypeScript code
 */
async function convertSvgToReactComponent(
  svgFilePath: string,
  outputPath: string,
  componentName: string,
  typescript: boolean
) {
  const svgContents = await fs.readFile(svgFilePath, 'utf-8')

  const jsCode = await svgrTransform(
    svgContents,
    {
      jsxRuntime: 'automatic',
      plugins: ['@svgr/plugin-jsx'],
      typescript,
    },
    {
      componentName: componentName,
    }
  )

  await fs.writeFile(outputPath, jsCode)

  console.log()
  console.log(`SVG converted to React component: ${outputPath}`)
}

export default async function transform(file: FileInfo, api: API) {
  const j = api.jscodeshift
  const root = j(file.source)

  // If the input file is TypeScript, we'll generate TypeScript SVG components
  const isTS = file.path.endsWith('.tsx')

  // Find all import declarations with "*.svg" import
  const svgImports = root.find(j.ImportDeclaration).filter((path) => {
    const importPath = path.node.source.value as string
    return importPath.includes('.svg')
  })

  const svgsToConvert: Array<{
    filePath: string
    importSourcePath: StringLiteral
  }> = []

  // Process each import declaration
  svgImports.forEach((importDeclaration) => {
    const importSpecifiers = importDeclaration.node.specifiers

    // Process each import specifier
    importSpecifiers?.forEach((importSpecifier) => {
      if (importSpecifier.type === 'ImportDefaultSpecifier') {
        if (!importSpecifier.local) {
          // Un-freaking-likely, skip if it happens
          return
        }

        const importName = importSpecifier.local.name

        const importPath = importDeclaration.node.source.value as string
        const currentFolder = path.dirname(file.path)

        let pathToSvgFile = path.resolve(currentFolder, importPath)

        if (importPath.startsWith('src/')) {
          pathToSvgFile = importPath.replace('src/', getPaths().web.src + '/')
        }

        // Find the JSX elements that use the default import specifier
        const svgsUsedAsComponent = root.findJSXElements(importName)

        svgsUsedAsComponent.forEach(() => {
          svgsToConvert.push({
            filePath: pathToSvgFile,
            importSourcePath: importDeclaration.node.source as StringLiteral, // imports are all strings in this case
          })
        })

        const svgsUsedAsRenderProp = root.find(j.JSXExpressionContainer, {
          expression: {
            type: 'Identifier',
            name: importName,
          },
        })

        svgsUsedAsRenderProp.forEach(() => {
          svgsToConvert.push({
            filePath: pathToSvgFile,
            importSourcePath: importDeclaration.node.source as StringLiteral, // imports are all strings in this case
          })
        })
      }
    })
  })

  if (svgsToConvert.length > 0) {
    // if there are any svgs used as components, or render props, convert the svg to a react component
    await Promise.all(
      svgsToConvert.map(async (svg) => {
        const svgFileNameWithoutExtension = path.basename(
          svg.filePath,
          path.extname(svg.filePath)
        )

        const componentName = pascalcase(svgFileNameWithoutExtension)

        const newFileName = `${componentName}SVG`

        // The absolute path to the new file
        const outputPath = path.join(
          path.dirname(svg.filePath),
          `${newFileName}.${isTS ? 'tsx' : 'jsx'}`
        )

        try {
          await convertSvgToReactComponent(
            svg.filePath,
            outputPath,
            componentName,
            isTS
          )
        } catch (error: any) {
          console.error(
            `Error converting ${svg.filePath} to React component: ${error.message}`
          )

          // Don't proceed if SVGr fails
          return
        }

        // If SVGr is successful, change the import path
        // '../../bazinga.svg' -> '../../BazingaSVG'
        // Use extname, incase ext casing does not match
        svg.importSourcePath.value = svg.importSourcePath.value.replace(
          `${svgFileNameWithoutExtension}${path.extname(svg.filePath)}`,
          newFileName
        )
      })
    )
  }

  return root.toSource()
}
