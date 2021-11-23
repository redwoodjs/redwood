// These declarations are based on the webpack bundler settings
// For svgs we use a babel-plugin
// see: redwood/packages/internal/src/build/babel/web.ts

// For other assets, we're using webpack asset loader 
// see: redwood/packages/core/config/webpack.common.js
// These declarations are the most common types

declare module '*.svg' {
  import React = require('react')
  const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>
  export default ReactComponent
}

declare module '*.png' {
  const content: string
  export default content
}

declare module '*.bmp' {
  const content: string
  export default content
}

declare module '*.jpg' {
  const content: string
  export default content
}

declare module '*.jpe?g' {
  const content: string
  export default content
}

declare module '*.gif' {
  const content: string
  export default content
}

declare module '*.webp' {
  const content: string
  export default content
}

declare module '*.ico' {
  const content: string
  export default content
}

declare module '*.pdf' {
  const content: string
  export default content
}