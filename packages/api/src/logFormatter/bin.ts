#! /usr/bin/env node
import split from 'split2'

import { LogFormatter } from '.'

const input = process.stdin
const output = process.stdout

input.pipe(split(LogFormatter())).pipe(output)
