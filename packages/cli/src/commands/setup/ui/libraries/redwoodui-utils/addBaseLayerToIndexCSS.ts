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
        `@layer base {\n  ${rwuiBaseLayer}\n}\n`,
      )
      task.output = c.success(
        "Added RedwoodUI's base layer to your project's index.css.",
      )
    } else {
      // If there's no base layer, add the RWUI base layer to the end of the file.
      newCSSContent = projectIndexCSS + `\n@layer base {\n  ${rwuiBaseLayer}\n}`
      task.output = c.success(
        "Added RedwoodUI's base layer to your project's index.css.",
      )
    }
  } else {
    // If the project does have a base layer, check whether its classes have the same name as those of the RWUI base layer.
    const projectBaseLayerClasses: string[] =
      projectBaseLayer.match(/[a-zA-Z0-9_-]+(?=\s*\{)/g) || []
    const rwuiBaseLayerClasses: string[] =
      rwuiBaseLayer.match(/[a-zA-Z0-9_-]+(?=\s*\{)/g) || []

    console.log('projectBaseLayerClasses', projectBaseLayerClasses)
    console.log('rwuiBaseLayerClasses', rwuiBaseLayerClasses)

    const conflictingClasses = projectBaseLayerClasses.filter((cls) =>
      rwuiBaseLayerClasses.includes(cls),
    )

    const hasConflictingClasses = conflictingClasses.length > 0

    if (hasConflictingClasses) {
      task.output = c.warning(
        "Conflicting classes found between your project's base layer and RedwoodUI's base layer.\nPlease review the following classes in the base layer of your index.css:\n" +
          `${conflictingClasses.join(', ')}\n\n`,
      )
    } else {
      // If they don't match, just add the RWUI base layer to the end of the existing base layer.
      // TODO: instead of at the end of the layer, is erroneously adding the new classes after the first of the existing classes
      newCSSContent = projectIndexCSS.replace(
        /(@layer base {[^}]*})/s,
        `$1\n  ${rwuiBaseLayer}`,
      )
      task.output = c.success(
        "Added RedwoodUI's base layer classes to your project's existing base layer in index.css.",
      )
    }
  }

  return newCSSContent
}

export default addBaseLayerToIndexCSS
