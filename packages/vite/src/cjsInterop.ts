// I had to engineer something that matches all redwood packages apart from:
// - @redwoodjs/router
export const dependenciesPatterns = [
  '@redwoodjs/[a-q]*',
  '@redwoodjs/[a-q]**/*',
  '@redwoodjs/realtime',
  '@redwoodjs/record',
  '@redwoodjs/[s-z]*',
  '@redwoodjs/[s-z]**/*',
]
