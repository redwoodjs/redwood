export const getPaths = () => MOCK_PATHS

export { default as colors } from './colors'
export { zipDir } from './zip'

export const MOCK_PATHS = {
  base: 'mock_basedir',
  generated: {
    base: '.mock_redwood',
    schema: '.mock_redwood/schema.graphql',
    types: {
      includes: '.mock_redwood/types/includes',
      mirror: '.mock_redwood/types/mirror',
    },
    prebuild: '.mock_redwood/prebuild',
  },
  scripts: 'mock_scripts_dir',
  api: {
    base: 'mock_api',
    dataMigrations: 'mock_dataMigrations',
    db: 'mock_db_dir',
    dbSchema: 'mock_db_schema_dir',
    functions: 'fmock_unctions_dir',
    graphql: 'mock_graphql_dir',
    lib: 'mock_lib_dir',
    generators: 'mock_generators_dir',
    config: 'mock_config_dir',
    services: 'mock_services_dir',
    directives: 'mock_directives_dir',
    src: 'mock_src_dir',
    dist: 'mock_api/dist',
    types: 'mock_api/types',
    models: 'mock_models_dir',
  },
  web: {
    routes: ['mock_mock/routes'],
    base: 'mock_web',
    pages: 'mock_pages_dir',
    components: 'mock_components_dir',
    layouts: 'mock_layouts_dir',
    src: 'mock_src_dir',
    generators: 'mock_generators_dir',
    app: 'mock_app_dir',
    index: 'mock_index_dir',
    config: 'mock_config_dir',
    webpack: 'mock_webpack_dir',
    postcss: 'mock_postcss_dir',
    storybookConfig: 'mock_storybookConfig_dir',
    storybookPreviewConfig: 'mock_storybookPreviewConfig_dir',
    storybookManagerConfig: 'mock_storybookManagerConfig_dir',
    dist: 'mock_web/dist',
    types: 'mock_web/types',
  },
}
