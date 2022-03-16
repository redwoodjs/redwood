module.exports = {
  customFields: {
    defaultDocsLandingPage: 'tutorial/welcome-to-redwood', // redirects here when hitting /docs/
    defaultSectionLandingPages: {
      // map of what is considered the first article in each section
      // section: id
      tutorial: 'welcome-to-redwood',
      tutorial2: 'welcome-to-redwood-part-ii-redwoods-revenge',
    },
  },
  // ?
  title: 'RedwoodJS Docs',
  // ?
  tagline:
    'Built on React, GraphQL, and Prisma, Redwood works with the components and development workflow you love, but with simple conventions and helpers to make your experience even better.',
  // ?
  url: 'https://learn-redwood.netlify.app',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'redwoodjs', // Usually your GitHub org/user name.
  // ?
  projectName: 'redwood', // Usually your repo name.,
  themeConfig: {
    algolia: {
      appId: 'FK1BZ27LVA',
      apiKey: 'cfc36f6fc808745d1d2c7725fd0720a5',
      indexName: 'docs',
      contextualSearch: true,
      searchParameters: {},
    },
    navbar: {
      title: 'RedwoodJS',
      logo: {
        alt: 'RedwoodJS pinecone logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          href: 'https://github.com/redwoodjs/learn.redwoodjs.com',
          position: 'right',
          className: 'github-logo',
          'aria-label': 'GitHub repository',
        },
      ],
    },
    // ?
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Tutorial',
              to: 'docs/tutorial/welcome-to-redwood',
            },
            {
              label: 'Tutorial II',
              to: 'docs/tutorial2/welcome-to-redwood-part-ii-redwoods-revenge',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Discord',
              href: 'https://discord.com/invite/redwoodjs',
            },
            {
              label: 'Discourse',
              href: 'https://community.redwoodjs.com/',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/redwoodjs',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'redwoodjs.com',
              to: 'https://redwoodjs.com/',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/redwoodjs/redwood',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} RedwoodJS. Built with Docusaurus.`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // ? — blob? tree?
          editUrl: 'https://github.com/redwoodjs/redwood/blob/main/docs', // base path for repo edit pages
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
  // ?
  scripts: [
    {
      src: 'https://plausible.io/js/plausible.js',
      defer: true,
      'data-domain': 'learn.redwoodjs.com',
    },
  ],
  stylesheets: [
    'https://fonts.googleapis.com/css?family=Open+Sans:400,600,700&display=swap',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;900&display=swap',
  ],
}
