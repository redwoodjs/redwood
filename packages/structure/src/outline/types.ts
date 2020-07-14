export enum Icon {
  redwood = 'redwood',
  page = 'page',
  pages = 'pages',
  layouts = 'layouts',
  netlify = 'netlify',
  prisma = 'prisma',
  storybook = 'storybook',
  services = 'services',
  graphql = 'graphql',
  play = 'play',
  components = 'components',
  rw_cli = 'rw_cli',
  functions = 'functions',
  cells = 'cells',
  model = 'model',
}

export interface OutlineItem {
  /**
   * Label for the outline item.
   * This is the main text.
   */
  label: string
  /**
   * If label is not unique amongst siblings, key is used to disambiguate.
   * This is similar to ReactNode.key
   */
  key?: string
  /**
   * Secondary text.
   */
  description?: string

  /**
   * - If present, this item will be rendered as a folder (with an expand button).
   * - If undefined, this item will be rendered as a leaf
   */
  children?(): Promise<OutlineItem[]>

  /**
   * Whether this outline item should be expanded by default.
   * This is only relevant if children() is defined
   */
  expanded?: boolean

  /**
   * An action to execute when this outline item is clicked.
   * It can be
   * - a file (with optional position)
   * ex: "file:///Users/foo/bar/project/myfile.js:3:10"
   * ex: "file:///somefile.ts"
   * - a URL
   * ex: "http://localhost:9999/foo"
   * - a redwood CLI action
   * ex: "rw g page"
   */
  link?: string

  icon?: Icon
}

export type OutlineItemJSON = Omit<OutlineItem, 'children'> & {
  children?: OutlineItemJSON[]
}

/**
 * this will recursively await all children and return a serializable representation
 * of the complete outline
 * @param item
 */
export async function outlineToJSON(
  item: OutlineItem
): Promise<OutlineItemJSON> {
  if (!item.children) return { ...item, children: undefined }
  const cs = item.children ? await item.children() : []
  const css = await Promise.all(cs.map(outlineToJSON))
  return { ...item, children: css }
}
