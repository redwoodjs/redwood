import execa from 'execa'

export default ({ ui }) => async () => {
  /**
   * Install postcss-loader, tailwindcss, and autoprefixer. Add TailwindUI if requested.
   * RedwoodJS currently uses PostCSS v7; postcss-loader and autoprefixers pinned for compatibility
   */
  let packages = ['postcss-loader@4.0.2', 'tailwindcss@npm:@tailwindcss/postcss7-compat', 'autoprefixer@9.8.6']

  if (ui) {
    packages.push('@tailwindcss/ui')
  }

  await execa('yarn', ['workspace', 'web', 'add', '-D', ...packages])
}
