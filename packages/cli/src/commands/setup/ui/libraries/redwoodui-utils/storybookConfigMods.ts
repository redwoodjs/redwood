import { addImportStatementToFile, fetchFromRWUIRepo } from './sharedUtils'

/**
 * Adds a new property and value to the default export object in a given TypeScript content string.
 *
 * @param content - The content of the TypeScript file as a string.
 * @param property - The property name to add to the default export object.
 * @param value - The value to assign to the new property.
 * @returns The modified content string with the new property and value added to the default export object.
 *
 * The function handles two cases:
 * 1. When the default export is assigned to a named object.
 * 2. When the default export is an inline object.
 *
 * If the default export is a named object, it uses a regular expression to find and modify the object definition.
 * If the default export is an inline object, it directly adds the new property and value to the object.
 * If no default export is found, the original content is returned unchanged.
 */
const addToDefaultExport = (
  content: string,
  property: string,
  value: string,
): string => {
  const defaultExportMatch = content.match(/export\s+default\s+(\w+)/)
  const defaultObjectExportMatch = content.match(/export\s+default\s+{([^}]*)}/)

  if (defaultExportMatch) {
    const defaultExportName = defaultExportMatch[1]
    const exportRegex = new RegExp(
      `(export\\s+default\\s+${defaultExportName}\\s*=\\s*{)([^}]*)}`,
      's',
    )
    // Replaces parts of the `content` string that match the `exportRegex` pattern.
    // The replacement function takes three arguments: the full match (`match`), and two capture groups (`p1` and `p2`).
    // It constructs a new string by concatenating `p1`, a trimmed version of `p2` (if `p2` is not empty, it adds a comma),
    // and then appends the new `property` and `value` pair, followed by a closing brace `}`.
    return content.replace(
      exportRegex,
      (_match, p1, p2) =>
        `${p1}${p2.trim() ? `${p2.trim()},` : ''} ${property}: ${value}}`,
    )
  } else if (defaultObjectExportMatch) {
    const defaultObjectContent = defaultObjectExportMatch[1]
    return content.replace(
      defaultObjectExportMatch[0],
      `export default {${defaultObjectContent}, ${property}: ${value}}`,
    )
  } else {
    console.error(
      `Could not find the default export in the given content. Returning the original content. Given content:\n${content}`,
    )
    return content
  }
}

/**
 * Reads and modifies the Storybook config main file to add the addons passed in.
 * If all addons are already included in the main file, it will return the original content.
 *
 * Takes in the current main file content and returns the new content.
 * Does not install any packages.
 */
export const addSBAddonsToMain = (
  sbMainContent: string,
  addOnsToAdd: string[],
): string => {
  const addonsArrayMatch = sbMainContent.match(/addons\s*:\s*\[([^\]]*)\]/)

  if (addonsArrayMatch) {
    const addonsArray = addonsArrayMatch[1]
    const addonsToAdd = addOnsToAdd.filter(
      (addon) => !addonsArray.includes(addon),
    )

    if (addonsToAdd.length > 0) {
      const updatedAddonsArray = addonsArray.trim().endsWith(',')
        ? `${addonsArray} ${addonsToAdd.map((addon) => `'${addon}'`).join(', ')},`
        : `${addonsArray}, ${addonsToAdd.map((addon) => `'${addon}'`).join(', ')},`
      return sbMainContent.replace(
        addonsArrayMatch[0],
        `addons: [${updatedAddonsArray}]`,
      )
    } else {
      return sbMainContent
    }
  } else {
    const addonsValue = `[${addOnsToAdd.map((addon) => `'${addon}'`).join(', ')}]`
    return addToDefaultExport(sbMainContent, 'addons', addonsValue)
  }
}

/**
 * Reads and modifies the Storybook preview file to add the dark/light mode themes.
 * If any dark/light mode themes are already included in the preview file, it will return the original content.
 *
 * Takes in the current preview file content and returns the new content.
 * Does not install any packages.
 */
export const addSBDarkModeThemesToPreview = async (
  sbPreviewContent: string,
): Promise<string> => {
  if (!sbPreviewContent) {
    return (await fetchFromRWUIRepo('web/.storybook/preview.ts')) as string
  }

  const hasDarkModeThemes =
    /themes:\s*{\s*light:\s*'light',\s*dark:\s*'dark',\s*}/.test(
      sbPreviewContent,
    )

  if (hasDarkModeThemes) {
    return sbPreviewContent
  }

  sbPreviewContent = addImportStatementToFile(
    sbPreviewContent,
    '@storybook/addon-styling',
    ['withThemeByDataAttribute'],
  )
  sbPreviewContent = addImportStatementToFile(
    sbPreviewContent,
    '@storybook/react',
    ['ReactRenderer'],
  )

  const decoratorsArrayMatch = sbPreviewContent.match(
    /decorators\s*:\s*\[([^\]]*)\]/,
  )

  if (decoratorsArrayMatch) {
    const decoratorsArray = decoratorsArrayMatch[1]

    if (!decoratorsArray.includes('withThemeByDataAttribute')) {
      const updatedDecoratorsArray = decoratorsArray.trim().endsWith(',')
        ? `${decoratorsArray} withThemeByDataAttribute<ReactRenderer>({
            themes: {
              light: 'light',
              dark: 'dark',
            },
            defaultTheme: 'light',
            attributeName: 'data-mode',
          }),`
        : `${decoratorsArray}, withThemeByDataAttribute<ReactRenderer>({
            themes: {
              light: 'light',
              dark: 'dark',
            },
            defaultTheme: 'light',
            attributeName: 'data-mode',
          }),`
      return sbPreviewContent.replace(
        decoratorsArrayMatch[0],
        `decorators: [${updatedDecoratorsArray}]`,
      )
    } else {
      return sbPreviewContent
    }
  } else {
    const decoratorsValue = `[
      withThemeByDataAttribute<ReactRenderer>({
        themes: {
          light: 'light',
          dark: 'dark',
        },
        defaultTheme: 'light',
        attributeName: 'data-mode',
      }),
    ]`
    return addToDefaultExport(sbPreviewContent, 'decorators', decoratorsValue)
  }
}
