#!/usr/bin/env node

import { serve } from './server'

if (require.main === module) {
  serve()
}
