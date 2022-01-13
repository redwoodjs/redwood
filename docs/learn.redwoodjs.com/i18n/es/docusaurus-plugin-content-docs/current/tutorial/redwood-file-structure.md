---
id: redwood-file-structure
title: "Estructura de directorios de Redwood"
sidebar_label: "Estructura de directorios de Redwood"
---

Veamos los directorios y archivos creados (excluyendo los archivos de configuración por ahora):

```terminal
├── api
│   ├── db
│   │   ├── schema.prisma
│   │   └── seed.js
│   └── src
│       ├── functions
│       │   └── graphql.js
│       ├── graphql
│       ├── lib
│       │   └── db.js
│       └── services
└── web
    ├── public
    │   ├── README.md
    │   ├── favicon.png
    │   └── robots.txt
    └── src
        ├── Routes.js
        ├── components
        ├── index.css
        ├── index.html
        ├── App.js
        ├── layouts
        └── pages
            ├── FatalErrorPage
            │   └── FatalErrorPage.js
            └── NotFoundPage
                └── NotFoundPage.js
```

En la raíz tenemos dos directorios: `api` y `web`. Redwood separa cuestiones de backend (`api`) y de frontend (`web`) en distintos directorios. [Yarn define éstos como "workspaces", espacios de trabajo ](https://yarnpkg.com/lang/en/docs/workspaces/). En Redwood, nos referimos a ellos como "sides", lados. Cuando añada nuevos paquetes deberá indicar en que lado los quiere incluir. Por ejemplo considere la sintaxis de los siguientes comandos, pero no los ejecute:

    yarn workspace web add marked
    yarn workspace api add better-fs

### El directorio */api*

Dentro de `api` hay otros dos directorios:

- `db` contiene la lógica de conexión a la base de datos:

  - `schema.prisma` contiene el esquema de base de datos (definición de tablas y columnas).
  - `seed.js` carga en la base de datos los datos necesarios para ejecutar la aplicación, por ejemplo el usuario administrador o configuración del sitio.

  Después de agregar nuestra primera tabla a la base de datos, se creará un archivo de base de datos SQLite llamado `dev.db` y un directorio `migrations`. El cuál contiene instantáneas del esquema de la base de datos a medida de que evoluciona con el tiempo.

- `src` contiene todo el código del backend. `api/src` contiene otros cuatro directorios:
  - `functions` contiene [funciones lambda](https://docs.netlify.com/functions/overview/) para la aplicación. Además contiene el archivo `graphql.js` generado por Redwood que se usa para definir la API de GraphQL. El cuál es necesario para usa la API.
  - `graphql` contiene el esquema GraphQL usando un lenguaje de definición de esquema (archivos terminados en `.sdl.js`).
  - `lib` contiene un archivo, `db.js`, que inicia *Prisma*, el cliente de conexión a la base de datos. Si lo require, puede agregar parámetros adicionales. También puede utilizar este directorio para guardar código relacionado con el manejo de la API que no corresponda con `functions` ni `services`.
  - `services` contiene la lógica de negocio. El código para consultar o modificar datos de GraphQL deberá ubicarse aquí en un formato que es reusable en varios lugares de tu aplicación.

Eso es todo para el backend.

### El directorio /web

- `src` contiene varios subdirectorios:
  - `components` contiene los típicos componentes React, así como las _Cells_ (células) de Redwood, que en breve detallaremos.
  - `layouts` contiene HTML o componentes que envuelven el contenido y son compartidos a través de múltiples páginas _Pages_.
  - `pages` contiene componentes que pueden estar envueltas dentro de _layouts_ y son por ejemplo "landing pages"(página de destino) para una URL (por ejemplo `/articles/hello-world` se mapeará a una página de destino y `/contact-us` se mapeará a otra). En una nueva aplicación hay dos páginas incluidas por omisión:
    - `NotFoundPage.js` será servida cuando no se encuentre la ruta requerida (véase `Routes.js` a continuación).
    - `FatalErrorPage.js` será servida cuando ocurra un error irrecuperable sin capturar en la aplicación que de lo contrario causaría que nuestra aplicación realmente explotara (normalmente serviría una página en blanco).
  - `index.css` es un lugar genérico para poner CSS, pero hay alternativas.
  - `index.html` es el punto de partida estándar de la aplicación React.
  - `App.js` contiene código de arranque de la aplicación de Redwood.
  - `Routes.js` contiene las rutas de la aplicación que mapean una URL a una _page_ (página).
- `public` contiene archivos no utilizados por componentes React (se copiarán sin modificar al directorio raíz de la aplicación en producción):
  - `favicon.png` es el ícono que va en la pestaña del navegador cuando la página está abierta (por omisión es el logotipo de Redwood).
  - `robots.txt` se usa para indicar a los crawlers web que [archivos deben procesar](https://www.robotstxt.org/robotstxt.html).
  - `README.md` explica cómo y cuándo usar la carpeta `public` para servir contenido estático. También explica buenas prácticas para importar archivos dentro de componentes con Webpack. Vea [el README.md en GitHub](https://github.com/redwoodjs/create-redwood-app/tree/main/web/public) para más información.

