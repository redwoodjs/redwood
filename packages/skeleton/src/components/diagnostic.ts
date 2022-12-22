export interface RedwoodDiagnostics {
  warnings: RedwoodWarning[]
  errors: RedwoodError[]
  hasErrors(): boolean
  hasWarnings(): boolean
  printWarnings(): void
  printErrors(): void
}

export interface RedwoodError {
  code: RedwoodErrorCode
  message: string
}

export enum RedwoodErrorCode {
  // 00.xxx - Generic
  GENERIC_PARSER_ERROR_JSTS = '00.001',
  GENERIC_PARSER_ERROR_JSXTSX = '00.002',
  GENERIC_PARSER_ERROR_GQL = '00.003',

  // 01.xxx - Cell
  CELL_NO_QUERY_EXPORT = '01.001',
  CELL_NO_SUCCESS_EXPORT = '01.002',

  // 02.xxx - Route
  ROUTE_NOTFOUND_IS_PRIVATE = '02.001',
  ROUTE_NOTFOUND_HAS_PATH = '02.002',
  ROUTE_NO_CORRESPONDING_PAGE = '02.003',

  // 03.xxx - Router
  ROUTER_NO_NOTFOUND_ROUTE = '03.001',
  ROUTER_MULTIPLE_NOTFOUND_ROUTES = '03.002',
  ROUTER_DUPLICATE_NAMED_ROUTES = '03.003',
  ROUTER_NO_ROUTER_FOUND = '03.004',

  // 04.xxx - SDL
  SDL_DIRECTIVE_NOT_FOUND = '04.001',
  SDL_MISSING_SCHEMA_EXPORT = '04.002',

  // 05.xxx - Service
  SERVICE_ = '05.001',

  // 06.xxx - Environment variable
  ENV_ = '06.001',

  // 07.xxx - TOML
  TOML_ = '07.001',

  // 08.xxx - Side
  SIDE_NOT_FOUND = '08.001',

  // 09.xxx - Directive
  DIRECTIVE_MISSING_DEFAULT_EXPORT = '09.001',
  DIRECTIVE_MISSING_SCHEMA_EXPORT = '09.002',
  DIRECTIVE_DEFINE_ONE_DIRECTIVE = '09.003',

  // 0a.xxx - Function
  FUNCTION_NO_HANDLER = '0a.001',

  // 0b.xxx - ServiceFunction
  SERVICE_FUNCTION_PARAMETERS_DO_NOT_MATCH_SDL_OPERATION = '0b.001',
}

export interface RedwoodWarning {
  code: RedwoodWarningCode
  message: string
}

export enum RedwoodWarningCode {
  // 00.xxx - Generic
  GENERIC_PARSER_WARNING_JSTS = '00.001',
  GENERIC_PARSER_WARNING_JSXTSX = '00.002',
  GENERIC_PARSER_WARNING_GQL = '00.003',

  // 01.xxx - Cell
  CELL_NO_QUERY_OPERATION_NAME = '01.001',

  // 02.xxx - Route
  ROUTE_ = '02.001',

  // 03.xxx - Router
  ROUTER_NO_ROUTES = '03.001',

  // 04.xxx - SDL
  SDL_ = '04.001',

  // 05.xxx - Service
  SERVICE_ = '05.001',

  // 06.xxx - Environment variable
  ENV_ = '06.001',

  // 07.xxx - TOML
  TOML_ = '07.001',

  // 08.xxx - Side
  SIDE_ = '08.001',

  // 09.xxx - Directive
  DIRECTIVE_ = '09.001',

  // 0a.xxx - Function
  FUNCTION_ = '0a.001',

  // 0b.xxx - ServiceFunction
  SERVICE_FUNCTION_ = '0b.001',
}
