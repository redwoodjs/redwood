import { processEnvComputedRule } from './process-env-computed.js'
import { unsupportedRouteComponents } from './unsupported-route-components.js'

export const rules = {
  'process-env-computed': processEnvComputedRule,
  'unsupported-route-components': unsupportedRouteComponents,
}
