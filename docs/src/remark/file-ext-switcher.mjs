import { visit } from 'unist-util-visit'

const plugin = () => {
  let needImport = false

  return (tree, _file) => {
    visit(tree, (node) => {
      if (node.type === 'inlineCode' && /\w\.\{js,tsx?}$/.test(node.value)) {
        needImport = true
        node.type = 'jsx'
        node.value = `<FileExtSwitcher path="${node.value}" />`
      }
    })

    if (needImport) {
      tree.children.unshift({
        type: 'import',
        value:
          "import FileExtSwitcher from '@site/src/components/FileExtSwitcher'",
      })
    }
  }
}

export default plugin
