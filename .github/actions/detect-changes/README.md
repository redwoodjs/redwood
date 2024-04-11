You can run this script locally to debug/verify

Make sure you have a GITHUB_TOKEN or REDWOOD_GITHUB_TOKEN env var set, and then run this command:
```
GITHUB_REF=refs/pull/6919/merge GITHUB_BASE_REF=main node .github/actions/detect-changes/detectChanges.mjs
```

PR 6919 has 137 changed files, so is good for testing pagination
