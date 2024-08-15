## VS Code Settings

This directory includes global workspace settings for local development of the RedwoodJS Framework.

See:

- [VS Code Doc: User and Workspace Settings](https://code.visualstudio.com/docs/getstarted/settings)
- [What is a VS Code Workspace?](https://stackoverflow.com/questions/44629890/what-is-a-workspace-in-visual-studio-code)

### Overriding Global Settings

It is possible to create your own "local" settings, overriding the global, via a `.code-workspace` file. See:

- [Workspace Settings](https://code.visualstudio.com/docs/editor/multi-root-workspaces#_settings)
- [Local settings overrides](https://github.com/microsoft/vscode/issues/37519)

> `*.code-workspace` files are included in `.gitignore`

For example, if you want a bright pink status background (and who doesn't?), create this file in the root of your project `mySettings.code-workspace`:

```
// mySettings.code-workspace

"workbench.colorCustomizations": {
     "statusBar.background": "#ff007f",
   },

```

> **WARNING:** If you create a custom file that is ignored by git, then _anytime_ you run `git clean -fxd` the file will be permanently deleted.
>
> You can avoid this by using the option `-e`, e.g. `git clean -fxd -e mySettings.code-workspace`.
