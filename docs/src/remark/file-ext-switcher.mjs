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
        type: 'mdxjsEsm',
        value:
          "import FileExtSwitcher from '@site/src/components/FileExtSwitcher'",
        data: {
          estree: {
            type: 'Program',
            body: [
              {
                type: 'ImportDeclaration',
                specifiers: [
                  {
                    type: 'ImportDefaultSpecifier',
                    local: {
                      type: 'Identifier',
                      name: 'FileExtSwitcher',
                    },
                  },
                ],
                source: {
                  type: 'Literal',
                  value: '@site/src/components/FileExtSwitcher',
                  raw: "'@site/src/components/FileExtSwitcher'",
                },
              },
            ],
            sourceType: 'module',
            comments: [],
          },
        },
      })
    }
  }
}

export default plugin
