---
id: cells
title: "Células"
sidebar_label: "Células"
---

Estas funcionalidades se hallan en la mayoría de las aplicaciones Web. Queremos ver cómo facilitar la vida del desarrollador a la hora de agregar un componente común. Creemos tener una solución útil, a la cuál llamamos _Cells_, o bien células en español, las cuales proveen una forma declarativa y simple para trabajar con datos. ([lea la documentación para más inf.](https://redwoodjs.com/docs/cells))

Al crear una célula se exportan varias constantes con nombres específicos que Redwood toma en consideración. Una célula típica puede verse así:

```javascript
export const QUERY = gql`
  query {
    posts {
      id
      title
      body
      createdAt
    }
  }
`

export const Loading = () => <div>Cargando...</div>

export const Empty = () => <div>No hay posts aún!</div>

export const Failure = ({ error }) => (
  <div>Error al cargar los posts: {error.message}</div>
)

export const Success = ({ posts }) => {
  return posts.map((post) => (
    <article>
      <h2>{post.title}</h2>
      <div>{post.body}</div>
    </article>
  ))
}
```

Cuando React renderiza el componente Redwood ejecuta la consulta `QUERY` y muestra al componente `Cargando` hasta recibir respuesta.

Una vez recibida, se mostrará uno de los tres estados siguientes:
  - Si hubo un error, el componente `Failure`
  - Si no hay datos (`null` o bien un vector vacío), el componente `Empty`
  - De lo contrario, el componente `Success`

Hay también ciertos métodos auxiliares como `beforeQuery`(para procesar propiedades antes de ejecutar la consulta `QUERY`) y `afterQuery` (análogo pero antes de devolverlos al componente `Success`).

Lo mínimo que necesita para una Cell es exportar la consulta `QUERY` y el componente `Success`. Si no exporta un componente `Empty`, se enviará el resultado vacío al componente `Success`. Así mismo, si no exporta un componente `Failure`, verá un error en la consola.

Para saber cuándo usar una Cell considere si su componente necesita datos de la base de datos o de un servicio que haga esperar al usuario. Redwood se encargará de definir cuándo mostrar el componente mientras usted se concentra en el camino feliz del componente renderizado los datos.

### Nuestra primera célula

La página de inicio es un candidato perfecto para una Célula pues muestra una lista de Posts. Naturalmente, Redwood tiene un generador para ello:

    yarn rw g cell BlogPosts

Este comando crea un archivo `/web/src/components/BlogPostsCell/BlogPostsCell.js` (y un archivo de prueba) con algo de código para empezar:

```javascript
// web/src/components/BlogPostsCell/BlogPostsCell.js

export const QUERY = gql`
  query BlogPostsQuery {
    blogPosts {
      id
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>Empty</div>

export const Failure = ({ error }) => <div>Error: {error.message}</div>

export const Success = ({ blogPosts }) => {
  return JSON.stringify(blogPosts)
}
```

> **Cómo indicar instancias múltiples al generador**
> 
> Al generar una célula ud. puede elegir cual convención de sintaxis y Redwood ajustará los nombres automáticamente. Las siguientes invocaciones generarán el mismo archivo (`web/src/components/BlogPostsCell/BlogPostsCell.js`):
> 
>     yarn rw g cell blog_posts
>     yarn rw g cell blog-posts
>     yarn rw g cell blogPosts
>     yarn rw g cell BlogPosts
>     
> 
> Necesita _algún tipo de indicación_ de que estás usando más de una palabra: guión (`blog-posts`), subguión (`blog_posts`), camelCase (`blogPosts`) o PascalCase (`BlogPosts`).
> 
> Invocar `yarn redwood g cell blogposts`, sin indicar que estamos usando dos palabras, generará un archivo `web/src/components/BlogpostsCell/BlogpostsCell.js`.

Para permitirle empezar prontamente, el generador asume que la consulta GraphQL será homónima al componente y crea una consulta básica para traer datos de la base de datos. En este caso la consulta se llama `blogPosts`:

```javascript
// web/src/components/BlogPostsCell/BlogPostsCell.js

export const QUERY = gql`
  query BlogPostsQuery {
    blogPosts {
      id
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>Empty</div>

export const Failure = ({ error }) => <div>Error: {error.message}</div>

export const Success = ({ posts }) => {
  return JSON.stringify(posts)
}
```

Sin embargo, no es un nombre válido para el SDL de Posts que definimos previamente (`src/graphql/posts.sdl.js`) ni para el Servicio (`src/services/posts/posts.js`). (revea el detalle de esos archivos en la sección [Creando un editor de mensajes](./getting-dynamic#creating-a-post-editor) en la parte *Haciendo el blog dinámico*.)

Tan solo renombraremos el resultado de la consulta a `posts` y en el nombre de la propiedad de `Success`:

```javascript {5,17,18}
// web/src/components/BlogPostsCell/BlogPostsCell.js

export const QUERY = gql`
  query BlogPostsQuery {
    posts {
      id
    }
  }
`

export const Loading = () => <div>Cargando...</div>

export const Empty = () => <div>No hay posts aún!</div>

export const Failure = ({ error }) => <div>Error: {error.message}</div>

export const Success = ({ posts }) => {
  return JSON.stringify(posts)
}
```

Veamos que pasa al colocar la célula en la página de inicio `HomePage`:

```javascript {3,7}
// web/src/pages/HomePage/HomePage.js

import BlogPostsCell from 'src/components/BlogPostsCell'

const HomePage = () => {
  return (
    <BlogPostsCell />
  )
}

export default HomePage
```

El navegador mostrará un vector con una serie de posts (asumiendo que ha creado un post en el blog con el [scaffolding](./getting-dynamic#creating-a-post-editor) de antes). Fantástico!

<img src="https://user-images.githubusercontent.com/300/73210519-5380a780-40ff-11ea-8639-968507a79b1f.png" />

> **Veamos de dónde vienen los `posts` del componente `Success`**
> 
> Vemos que `QUERY` es la consulta que trae los `posts`. El nombre de la consulta se pasa como propiedad al componente `Success` con los datos. Puede usar de alias el nombre de la variable que contiene el resultado de la consulta GraphQL, y ese será el nombre de la propiedad:
> 
> ```javascript
> export const QUERY = gql`
>   query BlogPostsQuery {
>     postIds: posts {
>       id
>     }
>   }
> `
> ```
> 
> Ahora `postIds` estará disponible en `Success` en lugar de `posts`

Además de que `id` que el generador creó en la consulta `query` podemos agrear title, body y createdAt:

```javascript {7-9}
// web/src/components/BlogPostsCell/BlogPostsCell.js

export const QUERY = gql`
  query BlogPostsQuery {
    posts {
      id
      title
      body
      createdAt
    }
  }
`
```

La página mostrará todos los datos para cada post del blog:

<img src="https://user-images.githubusercontent.com/300/73210715-abb7a980-40ff-11ea-82d6-61e6bdcd5739.png" />

Ahora podemos pensar en componentes React típicos, basta construir el componente `Success` para mostrar los posts en un mejor formato:

```javascript {4-12}
// web/src/components/BlogPostsCell/BlogPostsCell.js

export const Success = ({ posts }) => {
  return posts.map((post) => (
    <article key={post.id}>
      <header>
        <h2>{post.title}</h2>
      </header>
      <p>{post.body}</p>
      <div>Publicado a las: {post.createdAt}</div>
    </article>
  ))
}
```

Y así es como tenemos un blog! Puede que sea muy básico y feo, ¡pero algo es algo! (No se preocupe, tenemos más funcionalidades para añadir.)

<img src="https://user-images.githubusercontent.com/300/73210997-3dbfb200-4100-11ea-847a-602cbf59cb2a.png" />

### Resumen

¿Qué hicimos para llegar hasta aquí?

1. Creamos la página de inicio
2. Generamos un layout para el blog
3. Creamos el esquema de la base de datos
4. Ejecutamos migraciones para actualizar la base de datos y crear una tabla
5. Generamos una interfaz CRUD a la tabla de base de datos
6. Creamos una célula para cargar los datos y visualizar de los estados de cargando/vacío/error/éxito
7. Añadir la célula a la página

Este se volverá parte del típico ciclo de vida a medida que agregue funcionalidades a la aplicación Redwood.

Hasta ahora, aparte de un poco de HTML, no hemos mucho a mano. Y especialmente no tuvimos que escribir un montón de código para mover datos de un lugar a otro. ¿no cree que hace el desarrollo de la web algo más agradable?

