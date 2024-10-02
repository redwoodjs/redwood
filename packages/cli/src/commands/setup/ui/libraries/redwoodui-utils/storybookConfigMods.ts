/**
 * Reads and modifies the Storybook config files to add the config
 * needed for dark mode
 *
 * Takes in the current main file content and returns the new content.
 * Will also install the package, if needed.
 */
export const addSBStylingAddon = (sbMainContent: string): string => {
  // TODO
  // check if main.ts has addons array.
  // if it does, add '@storybook/addon-styling' to the end.
  // if it doesn't, add: `addons: ['@storybook/addon-essentials', '@storybook/addon-themes', '@storybook/addon-styling'],`
  // to the end of the config object (which may or may not have a type annotation).
  // also, install the '@storybook/addon-styling' package.
}

export const addSBDarkModeThemes = (sbPreviewContent: string): string => {
  // TODO
  // If the user doesn't yet have a preview file, sbPreviewContent will be empty,
  // in which case we can just copy in the full content from the RWUI repo.
  // If the user does, we want to add the following to preview.decorators:
  //  withThemeByDataAttribute<ReactRenderer>({
  //   themes: {
  //     light: 'light',
  //     dark: 'dark',
  //   },
  //   defaultTheme: 'light',
  //   attributeName: 'data-mode',
  // })
  // which requires the following two imports:
  // - import { withThemeByDataAttribute } from "@storybook/addon-styling";
  // - import { ReactRenderer } from "@storybook/react";
  // It's possible there will already be some imports from either of these,
  // so explore creating a helper function for adding import(s) from a given
  // package to a given file.
}
