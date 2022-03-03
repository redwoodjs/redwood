---
id: getting-dynamic
title: "Haciendo el blog dinámico"
sidebar_label: "Haciendo el blog dinámico"
---

La segunda parte del video tutorial continúa aquí:

> **Aviso de contenido obsoleto**
> 
> Estos videos fueron grabados con una versión anterior de Redwood y muchos comandos están desactualizados. Si quiere construir el blog necesitará acompañar el vídeo con este texto, que está actualizado a la última versión.

<div class="video-container">
  <iframe src="https://www.youtube.com/embed/SP5vbsWf5Yg?rel=0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; modestbranding; showinfo=0" allowfullscreen></iframe>
</div>

Tener una página de inicio y una "acerca de" está muy bien pero, ¿dónde están los artículos del blog? A continuación vamos a trabajar en ellos.

Para nuestro tutorial vamos a cargar las entradas (artículos o Posts) desde la base de datos. Dado que las bases de datos relacionales siguen siendo fundamentales de muchas aplicaciones web complejas (y no tan complejas), en Redwood hemos hecho que el acceso SQL sea de primera. Todo empieza con un esquema.

### Creando el esquema de base de datos

Tenemos que decidir qué datos necesita para una entrada del blog, de ahora en más nos referiremos a Post. Para empezar podemos definir:

- `id` el identificador de cada Post (toda tabla de base de datos debe tener una clave primaria)
- `title (título)`
- `body` el contenido del post
- `createdAt` una marca de tiempo de cuando se creó el post

Usamos [Prisma](https://www.prisma.io/) para conectarnos con la base de datos. Prisma tiene otra biblioteca llamada [Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate) que permite actualizar el esquema de la base de datos de forma predecible y capturar cada uno de los cambios. Cada cambio se llama una _migration_ y Migrate creará uno cuando hagamos cambios en nuestro esquema.

Primero definamos la estructura de datos para un post. Abra `api/db/schema.prisma` y añada la definición de nuestra tabla Post (borre los modelos de "muestra" que estén presentes en el archivo, como el `UserExample`). Una vez que haya terminado el archivo completo debería ser así:

```plaintext {13-18}
// api/db/schema.prisma

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider      = "prisma-client-js"
  binaryTargets = "native"
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  body      String
  createdAt DateTime @default(now())
}
```

Esto dice que queremos una tabla llamada `Post` con las siguientes columnas:

- Una columna `id` de tipo `Int` (entero), le indica a Prisma que debe usarla como identificador `@id` (para asociarse con otras tablas) y que el valor por omisión `@default` debe ser el método `autoincrement()` provisto por Prisma que indica la base de datos debe autogenerarlo al crear un nuevo registro
- Una columna "título" `title` que contendrá una "cadena de caracteres" `String`
- Una columna para el contenido `body` también tipo `String`
- Una columna `createdAt` de tipo `DateTime` y `@default` que tome el tiempo actual `now()` al crear el registro (lo que nos evita hacerlo manualmente en la aplicación)

> **Identificadores Int o String**
> 
> Para este tutorial mantendremos las cosas simples usando un entero como ID. Las aplicaciones pueden usar otros tipos soportados por Prisma como CUID o UUID. En cuyo caso sería `String` en lugar de `Int` y se usaría `cuid()` o `uuid()` en lugar de `autoincrement()`:
> 
> `id String @id @default(cuid())`
> 
> Los Ints simplifican las URLs por ejemplo https://redwoodblog.com/posts/123 en lugar de https://redwoodblog.com/posts/eebb026c-b661-42fe-93bf-f1a373421a13.
> 
> Para más información sobre IDs vea [la documentación oficial de Prisma](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-schema/data-model#defining-an-id-field).

### Migraciones

Eso fue sencillo. Ahora querremos capturar ese cambio como una migración:

    yarn rw prisma migrate dev

> **Atajo `redwood`**
> 
> A partir de ahora usamos el alias `rw` en lugar de `redwood` por brevedad.

Se le pedirá darle un nombre a esta migración. Algo que describa lo que hace, por ejemplo "cómo crear posts" (sin comillas). Esto es para su propio beneficio—a Redwood no le importa el nombre de la migración, es sólo una referencia al buscar viejas migraciones y facilita encontrar cuando creó o modificó algo específico.

Cuando termine el comando, verá un nuevo subdirectorio dentro de `api/db/migrations` que tiene una marca de tiempo y el nombre de la migración. Contendrá un único archivo `migration.sql` con el SQL necesario para actualizar la estructura de base de datos con la versión de `schema.prisma` que tenía en el momento en que se creó. Por lo que tendremos un `schema.prisma` que describe la estructura de la base de datos *actualmente* y las migraciones tienen el historial de cambios antes de llegar al estado actual. Es una forma de hacer control de versiones para la estructura de base de datos, que puede ser bastante útil.

Además de crear el archivo de migración, el comando anterior también ejecutará SQL en base de datos, para "efectuar" la migración. Al final tendremos una nueva tabla en la base de datos llamada `Post` con las columnas que definimos anteriormente.

### Editor de posts

Todavía no hemos decidido el aspecto de nuestro sitio, ¡no sería sorprendente si editáramos los posts sin escribir un montón de páginas que probablemente tiraremos una vez que el equipo de diseño las vea? ¡Por suerte, "Increíble" es el segundo nombre de Redwood! No tiene apellido.

Generemos pues lo que necesitamos para hacer operaciones de CRUD (crear, consultar, actualizar y borrar en inglés) en los Posts así podremos verificar las columnas de la base de datos, y además consultar algunos Posts de ejemplo para empezar a crear páginas y contenido real. Redwood tiene un comando para la ocasión:

    yarn rw g scaffold post

Naveguemos a `http://localhost:8910/posts` donde veremos:

<img src="https://user-images.githubusercontent.com/300/73027952-53c03080-3de9-11ea-8f5b-d62a3676bbef.png" />

Esto es poco más de lo que obtuvimos al generar una página. ¿Qué pasa si clicamos en el botón "New Post"?

<img src="https://user-images.githubusercontent.com/300/73028004-72262c00-3de9-11ea-8924-66d1cc1fceb6.png" />

Bien, por fin vamos a algún lado. Complete los campos y presione "Save".

<img src="https://user-images.githubusercontent.com/300/73028757-08a71d00-3deb-11ea-8813-046c8479b439.png" />

¿Hemos creado un post en la base de datos? Y ahora vemos el post aquí en esta página? Sí, sí lo hicimos. Intente crear otro:

<img src="https://user-images.githubusercontent.com/300/73028839-312f1700-3deb-11ea-8e83-0012a3cf689d.png" />

¿Qué pasa si clicamos "Editar" en uno de los Posts?

<img src="https://user-images.githubusercontent.com/300/73031307-9802ff00-3df0-11ea-9dc1-ea9af8f21890.png" />

¿Y qué pasa si hacemos clic en "Borrar"?

<img src="https://user-images.githubusercontent.com/300/73031339-aea95600-3df0-11ea-9d58-475d9ef43988.png" />

Así que Redwood acaba de crear páginas, componentes y servicios necesarios para realizar todas las operaciones CRUD en nuestra tabla de Posts. No precisa abrir una herramienta GUI o iniciar sesión a través de una terminal y escribir SQL desde cero. Redwood llama a estos _scaffolds_ (plantillas o andamios).

Esto es lo que pasó al ejecutar el comando `yarn rw g scaffold post`:

- Se añadió un archivo _SDL_ con consultas y mutaciones GraphQL: `api/src/graphql/posts.sdl.js`
- Se añadió un archivo _services_ en `api/src/services/posts/posts.js` con un cliente Prisma para leer y escribir datos en la base de datos
- Se crearon varias _pages_ en `web/src/pages`:
  - `EditPostPage` para modificar
  - `NewPostPage` para crear uno nuevo
  - `PostPage` para mostrar detalles
  - `PostsPage` para listar todos los posts
- Se creó una plantilla _layout_ en `web/src/layouts/PostsLayout/PostsLayout.js` que contiene las páginas con elementos comunes como el encabezado y el botón de nuevos Posts "New Posts"
- Se crearon rutas en forma de `Set` dentro la plantilla `PostsLayout` para dichas páginas dentro de `web/src/Routes.js`
- Se crearon tres _células_ en `web/src/components`:
  - `EditPostCell` trae el post para editar desde la base de datos
  - `PostCell` muestra el post
  - `PostsCell` trae todos los posts
- Se crearon _componentes_ en `web/src/components`:
  - `NewPost` muestra el formulario para crear un post
  - `Post` muestra un post
  - `PostForm` contiene el form usado por los componentes "New" y "Edit"
  - `Posts` muestra una tabla con todos los posts

> **Convenciones de nomenclatura**
> 
> Notará que algunas de las partes generadas usan plural y otras singular. Esta convención está tomada de Ruby on Rails que usa una convención "humana": si se trata de múltiples instancias de algo (como la lista de los Posts) usará plural. Si trata con algo único (como crear un post) usará singular. También vuelve natural el hablar: "muéstreme una lista de todos los Posts" o "voy a crear un nuevo Post"
> 
> En lo que respecta a los generadores:
> 
> - Los servicios van siempre en plural.
> - Los métodos del servicio son singulares o plural dependiendo de lo que devuelvan: múltiples Posts o solo uno (`posts` vs. `createPost`).
> - Los archivos SDL usan plural.
> - Las "pages" que vienen con los "scaffolds" son plurales o singulares según si se ocupan de muchos posts o de uno solo. El generador de `page` usará el nombre que le dé por argumento al comando.
> - Los "layouts" también usan el nombre del argumento del comando.
> - Componentes y células, serán plurales o singulares dependiendo del contexto usado por el generador "scaffold", o bien usarán el argumento del comando.
> 
> Tenga en cuenta que el nombre de la tabla de base de datos determina el singular o plural, no toda la palabra. Por ejemplo `PostsCell`, en lugar de `PostCells`.
> 
> No tienes que seguir esta convención cuando cree sus propias partes, pero le recomendamos que lo haga. La comunidad de Ruby on Rails ama esta nomenclatura pese a que mucha gente se quejó de cuando se usó por primera vez. [Dele cinco minutos](https://signalvnoise.com/posts/3124-give-it-five-minutes).

### Crear una página de inicio

Podemos ir reemplazando estas páginas una por una a medida que tengamos diseños, o tal vez moverlos a la sección de administración de nuestro sitio y construir nuestras propias páginas de cero. El sitio público no permitirá a los visitantes crear, editar o eliminar posts. ¿Qué _pueden_ hacer?

1. Ver una lista de posts (sin enlaces para editar/eliminar)
2. Ver un solo post

Puesto que de ahora en más querremos una forma de crear y editar posts, mantengamos las páginas generadas tal y como están y creemos nuevas páginas para esas dos acciones.

Ya tenemos `HomePage` así que no necesitaremos crear eso. Para mostrar una lista de posts al visitante tendremos que añadir lógica. Necesitamos obtener el contenido de la base de datos y como no queremos que el usuario sólo vea una pantalla en blanco mientras lo hacemos (según condiciones de red, ubicación del servidor, etc), mostraremos un mensaje de cargando o una animación. Y si hay un error al traer los datos también deberemos manejarlo. ¿Y qué pasa cuando hacemos código libre el fuente de este blog y alguien lo pone en producción con la base de datos vacía? Sería bueno que hubiera algún tipo de mensaje en blanco.

Oh muchacho, nuestra primera página con datos y ya tenemos que preocuparnos por cargar estados, errores, páginas en blanco...o ¿no?
