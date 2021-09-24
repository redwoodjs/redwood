jest.autoMockOff()
import { defineTest } from 'jscodeshift/dist/testUtils'

defineTest(__dirname, 'useRHFCoercion', null, 'javascript')
