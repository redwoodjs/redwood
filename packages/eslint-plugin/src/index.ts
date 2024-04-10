import type { ESLintUtils } from '@typescript-eslint/utils'

import { processEnvComputedRule } from './process-env-computed.js'
import { serviceTypeAnnotations } from './service-type-annotations.js'
import { unsupportedRouteComponents } from './unsupported-route-components.js'

export const rules: Record<
  string,
  ESLintUtils.RuleModule<string, never[], ESLintUtils.RuleListener>
> = {
  'process-env-computed': processEnvComputedRule,
  'service-type-annotations': serviceTypeAnnotations,
  'unsupported-route-components': unsupportedRouteComponents,
}
