---
id: routing-params
title: "Parámetros de Rutas"
sidebar_label: "Parámetros de Rutas"
---

Ahora que la página de inicio lista todos los posts, construiremos la página de "detalles"—una URL canónica que muestra un solo post. Generemos pues página y ruta:

    yarn rw g page BlogPost

> Tenga en cuenta que no llamamos a esta página `Post` porque nuestro "scaffold" ya creó una página con ese nombre.

Enlacemos el título del post, en la página de inicio, a la página de detalles ( agreguemos `import` de `Link` y `routes`):

```javascript {3,12}
// web/src/components/BlogPostsCell/BlogPostsCell.js

import { Link, routes } from '@redwoodjs/router'

// QUERY, Loading, Empty and Failure etc...

export const Success = ({ posts }) => {
  return posts.map((post) => (
    <article key={post.id}>
      <header>
        <h2>
          <Link to={routes.blogPost()}>{post.title}</Link>
        </h2>
      </header>
      <p>{post.body}</p>
      <div>Creado a las: {post.createdAt}</div>
    </article>
  ))
}
```

Si cliquea en el enlace en el título del post, debería ver el texto de la plantilla de `BlogPostPage`. Necesitamos especificar _qué_ post queremos ver en esa página. Sería bueno poder especificar el ID del post en la URL ej: `/blog-post/1`. Podemos indicar a `<Route>` que use otra parte de la URL, de forma tal que podamos referenciar más adelante ese nombre:

```html
// web/src/Routes.js

<Route path="/blog-post/{id}" page={BlogPostPage} name="blogPost" />
```

Observe el `{id}`. Redwood les llama _parámetros de ruta_. Es decir, "cualquier valor que se encuentre en esta posición en el camino, podemos referenciarlo con el nombre entre corchetes". Y ya que estamos en el archivo de rutas, movamos la ruta dentro del `Set` de `BlogPostLayout`.

```javascript {5}
// web/src/Routes.js

<Router>
  <Set wrap={BlogLayout}>
    <Route path="/blog-post/{id}" page={BlogPostPage} name="blogPost" />
    <Route path="/about" page={AboutPage} name="about" />
    <Route path="/" page={HomePage} name="home" />
  </Set>
  <Route notfound page={NotFoundPage} />
</Router>
```

Perfecto. Ahora construiremos un enlace que tenga el ID del post:

```html
// web/src/components/BlogPostsCell/BlogPostsCell.js

<Link to={routes.blogPost({ id: post.id })}>{post.title}</Link>
```

Para rutas con parámetros, la función con nombre recibe un objeto con un valor para cada parámetro. Si clica en el enlace lo llevará a `/blog-post/1` (o `/blog-post/2`, sucesivamente).

### Usando los parámetros

Recordemos que el ID está en la URL. ¿Qué necesitamos hacer para mostrar un post específico? Como haremos una consulta de la base de datos querremos generar una célula:

    yarn rw g cell BlogPost

Que usaremos en `BlogPostPage`:

```javascript
// web/src/pages/BlogPostPage/BlogPostPage.js

import BlogPostCell from 'src/components/BlogPostCell'

const BlogPostPage = () => {
  return (
    <BlogPostCell />
  )
}

export default BlogPostPage
```

Volviendo a la célula, usaremos el parámetro de ruta `{id}` para buscar el ID del post en la base de datos. Actualicemos la consulta para recibir una variable (y cambiemos el nombre de la consulta de `blogPost` a `post`)

```javascript {4,5,7-9,20,21}
// web/src/components/BlogPostCell/BlogPostCell.js

export const QUERY = gql`
  query BlogPostQuery($id: Int!) {
    post(id: $id) {
      id
      title
      body
      createdAt
    }
  }
`

export const Loading = () => <div>Cargando...</div>

export const Empty = () => <div>Vacío</div>

export const Failure = ({ error }) => <div>Error: {error.message}</div>

export const Success = ({ post }) => {
  return JSON.stringify(post)
}
```

Bien, nos acercamos. Aún así, ¿de dónde obtendremos el `$id`? Redwood tiene otro truco en su manga. Cada vez que haya un parámetro en una ruta, ese parámetro se pasa automáticamente a la página destino. Lo que significa que podemos actualizar `BlogPostPage` para que se vea así:

```javascript {3,5}
// web/src/pages/BlogPostPage/BlogPostPage.js

const BlogPostPage = ({ id }) => {
  return (
    <BlogPostCell id={id} />
  )
}
```

Como hemos nombrado nuestro parámetro de ruta `id` tendremos una variable `{id}`. ¡Gracias Redwood! Pero, ¿y cómo termina ese `id` como parámetro `$id` de GraphQL? Conociendo a Redwood, ¡sabemos que se va a encargar! Por omisión, cualquier propiedad de la célula se convierte en variable de la consulta. "¿En serio?" Si, si, es verdad.

¡Podemos demostrarlo! Navegue a los detalles de un post y verá. ¿Mmm?

![imagen](https://user-images.githubusercontent.com/300/75820346-096b9100-5d51-11ea-8f6e-53fda78d1ed5.png)

> Por cierto, este mensaje de error que está viendo es debido al componente `Failure` de la célula!

Si mira la consola del inspector web podrá ver el error de GraphQL:

    [GraphQL error]: Message: Variable "$id" got invalid value "1";
      Expected type Int. Int cannot represent non-integer value: "1",
      Location: [object Object], Path: undefined

Resulta que los parámetros de rutas se extraen como cadenas de caracteres de la URL, pero GraphQL requiere un número entero para el ID. Podríamos usar `parseInt()` para convertirlo antes de pasarlo a `BlogPostCell`, ¡pero podemos hacer cosas mejores!

### Parámetros de ruta tipados

¿Qué pasaría si convertiéramos el parámetro en la misma definición de ruta? Bueno, adivine qué: ¡podemos! Introduciendo **route type parameters**. Es sencillo, agreguemos `:Int` a nuestro parámetro:

```html
// web/src/Routes.js

<Route path="/blog-post/{id:Int}" page={BlogPostPage} name="blogPost" />
```

Voilà! Esto convertirá el parámetro `id` a un número al pasarlo a la página y evitará que la ruta coincida cuando `id` no conste únicamente de números. Si se encuentran otro tipo, el enrutador seguirá probando otras rutas, mostrando al final `NotFoundPage` si no hay rutas que coincidan.

> **¿Qué pasa si quiero pasar otra propiedad a la célula no necesaria para la consulta, pero sí para algún componente Success/Loading/etc?**
> 
> Todos las propiedades asignadas a la célula estarán disponibles como propiedades en los componentes de renderizado. Sólo las que coincidan con las variables GraphQL se pasarán a la consulta. ¡Obtiene lo mejor de ambos mundos! Asimismo, si quisiera mostrar un post al azar (rebuscado pero para ejemplificar) podría pasarlo como propiedad:
> 
> ```javascript
> <BlogPostCell id={id} rand={Math.random()} />
> ```
> 
> Dicho número se puede obtener junto al resultado de la consulta (e incluso el `id` original) en el componente:
> 
> ```javascript
> export const Success = ({ post, id, rand }) => {
>   //...
> }
> ```
> 
> ¡Gracias de nuevo, Redwood!

### Mostrar un post

Mostremos el post en lugar de volcar el resultado de la consulta. Podríamos usar un componente típico para mostrar el post tal como hicimos en la página de inicio, produciendo el mismo resultado. Vamos a Redwoodear el componente (es un término inventado):

    yarn rw g component BlogPost

Lo cual genera `web/src/components/BlogPost/BlogPost.js` (y el test, claro) como un sencillo componente de React:

```javascript
// web/src/components/BlogPost/BlogPost.js

const BlogPost = () => {
  return (
    <div>
      <h2>{'BlogPost'}</h2>
      <p>{'Find me in ./web/src/components/BlogPost/BlogPost.js'}</p>
    </div>
  )
}

export default BlogPost
```

> Nótese que no hay declaraciones de `imports` para `React` de por sí. En el equipo de desarrollo de Redwood nos cansamos de importarlo una y otra vez ¡por lo que Redwood lo importa automáticamente!

Vamos a extraer el código de visualización de `BlogPostsCell` y ponerlo aquí, en su lugar, recibiendo el `post` como propiedad:

```javascript {3,5,7-14}
// web/src/components/BlogPost/BlogPost.js

import { Link, routes } from '@redwoodjs/router'

const BlogPost = ({ post }) => {
  return (
    <article>
      <header>
        <h2>
          <Link to={routes.blogPost({ id: post.id })}>{post.title}</Link>
        </h2>
      </header>
      <div>{post.body}</div>
    </article>
  )
}

export default BlogPost
```

Ahora actualizamos `BlogPostsCell` y `BlogPostCell` para usar este nuevo componente:

```javascript {3,8}
// web/src/components/BlogPostsCell/BlogPostsCell.js

import BlogPost from 'src/components/BlogPost'

// Loading, Empty, Failure...

export const Success = ({ posts }) => {
  return posts.map((post) => <BlogPost key={post.id} post={post} />)
}
```

```javascript {3,8}
// web/src/components/BlogPostCell/BlogPostCell.js

import BlogPost from 'src/components/BlogPost'

// Loading, Empty, Failure...

export const Success = ({ post }) => {
  return <BlogPost post={post} />
}
```

¡Y listo! Deberíamos poder navegar hacia adelante y hacia atrás desde la ṕagina de inicio y de detalles.

> Si le gusta lo que ve sobre el enrutador, puedes profundizar en la guía [Redwood Router](https://redwoodjs.com/docs/redwood-router).

### Resumen

Resumiendo:

1. Hemos creado una página de "detalle" para mostrar un post.
2. Hemos añadido una ruta asociada al `id` del post como parámetro.
3. Hemos creado una célula para traer y mostrar el post.
4. Redwood hizo del mundo un lugar mejor al poner el `id` en lugares clave del código e incluso convertirlo en un número automáticamente.
5. Refactorizamos la visualización del post en un componente estándar React que reusamos en las páginas de inicio y detalle.

