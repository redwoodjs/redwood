// Inspired by code in
// https://github.com/facebook/docusaurus/blob/main/packages/docusaurus-remark-plugin-npm2yarn/src/index.ts

const needImports = (tree) =>
  tree.children.some(
    (child) => child.type === 'jsx' && /^<Tabs\b/.test(child.value)
  )

const plugin = () => (tree, _file) => {
  if (needImports(tree)) {
    // Add `import` nodes to the top of the parsed file
    tree.children.unshift({
      type: 'import',
      value: "import Tabs from '@theme/Tabs'",
    })
    tree.children.unshift({
      type: 'import',
      value: "import TabItem from '@theme/TabItem'",
    })
  }
}

module.exports = plugin
