import type { ListrTaskWrapper } from 'listr2'

import c from '../../../../../lib/colors'

const addBaseLayerToIndexCSS = (
  task: ListrTaskWrapper<any, any>,
  rwuiBaseLayer: string,
  projectBaseLayer: string | null,
  projectIndexCSS: string,
): string => {
  let newCSSContent = projectIndexCSS
  if (!projectBaseLayer) {
    // If the project doesn't have a base layer, check if there's an empty one or none at all.
    // Doesn't include if commented out.
    const hasEmptyBaseLayer = projectIndexCSS
      .split('\n')
      .some(
        (line) =>
          line.includes('@layer base {') &&
          !line.trim().startsWith('//') &&
          !line.trim().startsWith('*'),
      )

    // If there's an empty base layer, replace it with the RWUI base layer.
    if (hasEmptyBaseLayer) {
      newCSSContent = projectIndexCSS.replace(
        /@layer base {[^}]*}/s,
        `@layer base {\n  ${rwuiBaseLayer}\n}`,
      )
      task.output = c.success(
        "Added RedwoodUI's base layer to your project's index.css.",
      )
    } else {
      // If there's no base layer, add the RWUI base layer to the end of the file.
      newCSSContent = projectIndexCSS + `\n@layer base {\n  ${rwuiBaseLayer}}`
      task.output = c.success(
        "Added RedwoodUI's base layer to your project's index.css.",
      )
    }
  } else {
    // If the project does have a base layer, check whether its classes have the same name as those of the RWUI base layer.
    // Here, in the base layer, these are HTML tags, not classes. Therefore, they won't start with a dot.
    const classesToAdd: string[] =
      rwuiBaseLayer.match(/[a-zA-Z0-9_-]+(?=\s*\{)/g) || []

    // For each class that we want to add, check if it already exists in the project's base layer.
    // If it does, check if it's the same as the RWUI base layer class.
    // If it is, remove it from the list of classes to add.
    // If it's not, add it to a list of conflicting classes.
    const conflictingClasses: string[] = []

    classesToAdd.forEach((className) => {
      const classRegex = new RegExp(`(${className}\\s*{[^}]*})`, 's')
      const rwuiClassMatch = rwuiBaseLayer.match(classRegex)
      const projectClassMatch = projectBaseLayer.match(classRegex)

      if (projectClassMatch) {
        // If the class exists in the project's base layer, check if it's the same as the RWUI base layer class.
        // TODO: This is a naive check. It doesn't account for whitespace or ordering differences.
        if (rwuiClassMatch && rwuiClassMatch[0] === projectClassMatch[0]) {
          // If it is the same, just remove it from the list of classes to add.
          classesToAdd.splice(classesToAdd.indexOf(className), 1)
        } else {
          // If it's not the same, add it to the list of conflicting classes and remove it from the list of classes to add.
          conflictingClasses.push(className)
          classesToAdd.splice(classesToAdd.indexOf(className), 1)
        }
      }
    })

    // Now, if there's no conflicting classes or classes to add, we don't need to do anything more.
    if (conflictingClasses.length === 0 && classesToAdd.length === 0) {
      task.output = c.info(
        "Your project's base layer already has the correct classes.",
      )
      return projectIndexCSS
    } else if (classesToAdd.length > 0) {
      // If there are classes to add, add them.
      // Remember that right now we just have a list of class names, not the full class definition,
      // so we need to create the list of class definitions to add.
      const classesToAddString = classesToAdd
        .map((className) => {
          const classRegex = new RegExp(`(${className}\\s*{[^}]*})`, 's')
          const rwuiClassMatch = rwuiBaseLayer.match(classRegex)
          return rwuiClassMatch ? rwuiClassMatch[0] : ''
        })
        .join('\n  ')

      newCSSContent = addToEndOfLayer(
        'base',
        classesToAddString,
        projectIndexCSS,
      )
      task.output = c.success(
        "Added the following new classes to your project's base layer in index.css:\n" +
          `${classesToAdd.join(', ')}`,
      )
      task.output += c.warning(
        "Some classes in RedwoodUI's base layer were not added to your project's base layer because they conflict with existing classes.\nPlease review the following classes in the base layer of your index.css:\n" +
          `${conflictingClasses.join(', ')}`,
      )
    } else {
      // If there are no classes to add, but there are conflicting classes, throw an error.
      throw new Error(
        "Added no new classes to your project's base layer, because they all conflicted with your existing classes.\nPlease review the following classes in the base layer of your index.css:\n" +
          `${conflictingClasses.join(', ')}`,
      )
    }
  }

  return newCSSContent
}

export default addBaseLayerToIndexCSS

const addToEndOfLayer = (
  layerName: string,
  layerContent: string,
  cssFileContent: string,
): string => {
  return cssFileContent.replace(
    new RegExp(`(@layer ${layerName}\\s*{)([^{}]*(?:{[^{}]*}[^{}]*)*)}`, 's'),
    `$1$2  ${layerContent}\n}`,
  )
}
