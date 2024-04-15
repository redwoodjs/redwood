# Installing ShadCN

[ShadCN](https://ui.shadcn.com/) is an open source component library. 

To install ShadCN, there are a few things you need to keep in mind regarding the structure of a Redwood application:

- Redwood is a true full-stack frontend framework. Meaning, there's a proper frontend (`web/`) and backend (`api/`) separation.
- Redwood uses yarn workspaces to manage the mono repo and its dependencies.

If you want to install a package to use in the frontend, you'll need to run:

```sh
yarn workspace web add <PACKAGE_NAME>
```

You can refer to the [Manual Installation documentation on ShadCN](https://ui.shadcn.com/docs/installation/manual), but you'll need to adapt the instructions to the Redwood structure.

1. Add [Tailwind CSS](https://tailwindcss.com/)

```sh
yarn rw setup ui tailwindcss
```

This command will install Tailwind CSS and set up the necessary configuration files.

2. Add the dependencies

```sh
yarn workspace web add tailwindcss-animate class-variance-authority clsx tailwind-merge
```

3. Add the icon library

If you're using the `default` style, install `lucide-react`:

```sh
yarn workspace web add lucide-react
```

If you're using the `new-york` style, install `@radix-ui/react-icons`:

```sh
yarn workspace web add @radix-ui/react-icons
```

4. Configure path aliases

Vite doesn't understand TypeScript's path mappings out of the box. You'll need to install a plugin to help Vite understand the path mappings.

```sh
yarn workspace web add vite-tsconfig-paths
```

and then within your `vite.config.js` file:

```js
import tsconfigPaths from 'vite-tsconfig-paths';

export default {
  plugins: [tsconfigPaths()],
}
```

Within your `web/tsconfig.json` file, you'll need to add the path aliases:

```json
// web/tsconfig.json
{
  "paths": {
    "@/*": ["./src/*"],
  }
}
```

[Additional documentation for setting up path aliases within Redwood.](https://redwoodjs.com/docs/typescript/introduction#using-alias-paths)

After doing this, you may need to restart your server: `yarn rw dev` and/or restart TypeScript within your VS Code project `Cmd + Shift + P` and look for "Restart TS Server"


5. Configure tailwind.config.js

Replace your config/tailwind.config.js with this:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

:::note
If you're comparing this file against the tailwind.config.js file in [ShadCN's documentation](https://ui.shadcn.com/docs/installation/manual), there are a few key differences:
- I removed the references to `fontFamily`.
- the `content` path is different. I've updated it specifically for Redwood.
:::

6. Configure styles

Redwood already set up a CSS file for Tailwind: `web/src/index.css`.

If you open the file, you should see Tailwind's base styles already listed:

```css
/**
 * START --- SETUP TAILWINDCSS EDIT
 *
 * `yarn rw setup ui tailwindcss` placed these directives here
 * to inject Tailwind's styles into your CSS.
 * For more information, see: https://tailwindcss.com/docs/installation
 */
@tailwind base;
@tailwind components;
@tailwind utilities;
/**
 * END --- SETUP TAILWINDCSS EDIT
 */
 ```

Add the following below the Tailwind setup:

```
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 47.4% 11.2%;
 
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
 
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 47.4% 11.2%;
 
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
 
    --card: 0 0% 100%;
    --card-foreground: 222.2 47.4% 11.2%;
 
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
 
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
 
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
 
    --destructive: 0 100% 50%;
    --destructive-foreground: 210 40% 98%;
 
    --ring: 215 20.2% 65.1%;
 
    --radius: 0.5rem;
  }
 
  .dark {
    --background: 224 71% 4%;
    --foreground: 213 31% 91%;
 
    --muted: 223 47% 11%;
    --muted-foreground: 215.4 16.3% 56.9%;
 
    --accent: 216 34% 17%;
    --accent-foreground: 210 40% 98%;
 
    --popover: 224 71% 4%;
    --popover-foreground: 215 20.2% 65.1%;
 
    --border: 216 34% 17%;
    --input: 216 34% 17%;
 
    --card: 224 71% 4%;
    --card-foreground: 213 31% 91%;
 
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 1.2%;
 
    --secondary: 222.2 47.4% 11.2%;
    --secondary-foreground: 210 40% 98%;
 
    --destructive: 0 63% 31%;
    --destructive-foreground: 210 40% 98%;
 
    --ring: 216 34% 17%;
 
    --radius: 0.5rem;
  }
}
 
@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
```

7. Add a cn helper

Shad uses a `cn` helper to make it easier to conditionally add Tailwind CSS classes.

Within the `web/src` directory, create a folder called `lib`, with a file inside called `utils.ts`

Add the following code:
```ts
// web/src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

8. That's it! ... Kind of. If you want to use ShadCN's command line interface (CLI) keep reading.

If you look at [ShadCN's documentation for their CLI tool](https://ui.shadcn.com/docs/cli), you're supposed to run 

```sh
npx shadcn-ui@latest init
```

The problem is that this command installs the dependencies for ShadCN, adds the `cn` util, configures `tailwind.config.js`, and CSS variables for the project, and we already did all those steps! In fact, if you try running that command anyway, it will tell you that Tailwind does not exist and you need to install that first.

One thing that the `init` command does, that we do need to add is a `components.json` file. This file tells ShadCN CLI where everything is located within our project.

Within our `web` directory, create a `components.json` file. The contents for this file is [documented here](https://ui.shadcn.com/docs/components-json). Inside add:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "aliases": {
    "components": "src/components",
    "ui": "src/components/ui",
    "utils": "src/lib/utils"
  },
  "style": "default",
  "tailwind": {
    "baseColor": "neutral",
    "config": "./config/tailwind.config.js",
    "css": "./src/index.css",
    "cssVariables": true,
    "prefix": "tw-",
    "rsc": false,
    "tsx": true
  }
}
```

:::note
A few things worth noting:
- You might have a different `style` value, but I used the `default` styles when I went through the manual process.
- The `aliases` section defines all the path names you'll use. I added a `ui` folder to the `web/src/components` directory. To keep the ShadCN components separate from my custom components.
- ShadCN won't create a Storybook and test file, like the Redwood generators will.
- Set `tsx` to `true` if you're using TypeScript, `false` if you're using JavaScript.
:::

9. Add a script to your `package.json`

Within the `package.json` file, in the root of your project, add a `scripts` section:

```json
"scripts": {
  "shad": "cd web && npx shadcn-ui@latest add"
}
```

Now, when you want to add a new ShadCN component from the CLI, you can run:

```sh
yarn shad <NAME-OF-COMPONENT>
```

:::note
[Here's an example repo with ShadCN installed.](https://github.com/ahaywood/redwood-shadcn-example)
:::
