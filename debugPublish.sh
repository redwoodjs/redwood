args+=(
  --include-merged-tags
  --canary
  --exact
  --preid "$TAG"
  --dist-tag "$TAG"
  --force-publish
  --loglevel verbose
  --no-git-reset
)

yarn lerna publish "${args[@]}"
