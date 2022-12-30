#!/bin/bash

echo "POSTBUILD DB MIGRATIONS [postbuild.sh]"

node_modules/.bin/rw prisma migrate deploy
node_modules/.bin/rw prisma generate
node_modules/.bin/rw dataMigrate up
