module.exports = {
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/*.test.[jt]s?(x)'],
  testPathIgnorePatterns: ['fixtures', 'dist'],
}

process.env = Object.assign(process.env, {
  WEBHOOK_SECRET: 'MY_VOICE_IS_MY_PASSPORT_VERIFY_ME',
})
