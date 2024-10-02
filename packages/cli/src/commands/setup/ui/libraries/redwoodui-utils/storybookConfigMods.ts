import { addImportStatementToFile, fetchFromRWUIRepo } from './sharedUtils'

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
  // Check if the addons array exists in the sbMainContent string
  const addonsArrayMatch = sbMainContent.match(/addons\s*:\s*\[([^\]]*)\]/)

  if (addonsArrayMatch) {
    // If addons array exists, add the addons from addOnsToAdd if they're not already included
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
    // If addons array doesn't exist, create it with the required addons
    const addonsSection = `
  addons: [
    ${addOnsToAdd.map((addon) => `'${addon}'`).join(', ')},
  ],`

    return sbMainContent.replace(
      /(module\.exports\s*=\s*{)/,
      `$1${addonsSection}`,
    )
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
    // If the preview file is empty, fetch the full content from the RWUI repo
    return (await fetchFromRWUIRepo('web/.storybook/preview.ts')) as string // getting a file so it's safe to cast as string
  }

  const hasDarkModeThemes =
    /themes:\s*{\s*light:\s*'light',\s*dark:\s*'dark',\s*}/.test(
      sbPreviewContent,
    )

  if (hasDarkModeThemes) {
    return sbPreviewContent
  }

  // Add the required imports
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

  // Check if preview.decorators array exists
  const decoratorsArrayMatch = sbPreviewContent.match(
    /decorators\s*:\s*\[([^\]]*)\]/,
  )

  if (decoratorsArrayMatch) {
    // If decorators array exists, add the withThemeByDataAttribute decorator if it's not already included
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
    // If decorators array doesn't exist, create it with the required decorator
    const decoratorsSection = `
  decorators: [
    withThemeByDataAttribute<ReactRenderer>({
      themes: {
        light: 'light',
        dark: 'dark',
      },
      defaultTheme: 'light',
      attributeName: 'data-mode',
    }),
  ],`

    return sbPreviewContent.replace(
      /(module\.exports\s*=\s*{)/,
      `$1${decoratorsSection}`,
    )
  }
}
