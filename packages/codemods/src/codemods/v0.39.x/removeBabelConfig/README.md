# Remove babel config

This codemod does the following
- Check root of project for babel.config.js
  - If it exists:
    - check if any plugins/presets are defined.
      - if not, delete this file
      - if it does, just remove the extends line

