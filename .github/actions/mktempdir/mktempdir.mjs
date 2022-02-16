import * as core from '@actions/core';
import { getExecOutput } from '@actions/exec'

const { stdout } = await getExecOutput('mktemp -d -t redwood.XXXXXX')

core.setOutput('tempdir', stdout)
