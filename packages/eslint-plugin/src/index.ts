import { processEnvComputedRule } from './process-env-computed.js'
import { serviceTypeAnnotations } from './service-type-annotations.js'

export const rules = {
  'process-env-computed': processEnvComputedRule,
  'service-type-annotations': serviceTypeAnnotations,
}
