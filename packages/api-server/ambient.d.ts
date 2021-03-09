declare module '@babel/register' {
  export default function (options: unknown): void
}

declare module 'youch-terminal' {
  export default function (json: Record<string, unknown>): string
}
