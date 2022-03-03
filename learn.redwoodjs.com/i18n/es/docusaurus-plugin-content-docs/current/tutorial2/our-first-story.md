---
id: our-first-story
title: "Nuestra primera Story"
sidebar_label: "Nuestra primera Story"
---

Digamos que en la página de inicio sólo querríamos ver las primeras frases del post como un resumen y luego tendríamos que cliquear para ver el post completo.

Primero agreguemos esa funcionalidad al componente **BlogPost**:

```javascript {5-7,9,18}
// web/src/components/BlogPost/BlogPost.js

import { Link, routes } from '@redwoodjs/router'

const truncate = (text, length) => {
  return text.substring(0, length) + '...'
}

const BlogPost = ({ post, summary = false }) => {
  return (
    <article className="mt-10">
      <header>
        <h2 className="text-xl text-blue-700 font-semibold">
          <Link to={routes.blogPost({ id: post.id })}>{post.title}</Link>
        </h2>
      </header>
      <div className="mt-2 text-gray-900 font-light">
        {summary ? truncate(post.body, 100) : post.body}
      </div>
    </article>
  )
}

export default BlogPost
```

Pasaremos una prop adicional `summary` (resumen) al componente para indicar que muestre el resumen o toda el post. Por omisión, usamos `false` para preservar el comportamiento existente, mostrando el contenido completo.

En Storybook crearemos una historia para `summary` que usará **BlogPost** del mismo modo que la historia `generated`, añadiendo la nueva prop. Tomaremos el contenido del post de muestra y lo pondremos en una constante que ambas historias usarán. También renombraremos `generated` a `full`, completo, para marcar la diferencia entre ellas:

```javascript {5-14,16-18,20-22}
// web/components/BlogPost/BlogPost.stories.js

import BlogPost from './BlogPost'

const POST = {
  id: 1,
  title: 'First Post',
  body: `Neutra tacos hot chicken prism raw denim, put a bird on it
         enamel pin post-ironic vape cred DIY. Street art next level
         umami squid. Hammock hexagon glossier 8-bit banjo. Neutra
         la croix mixtape echo park four loko semiotics kitsch forage
         chambray. Semiotics salvia selfies jianbing hella shaman.
         Letterpress helvetica vaporware cronut, shaman butcher YOLO
         poke fixie hoodie gentrify woke heirloom.`,
}

export const full = () => {
  return <BlogPost post={POST} />
}

export const summary = () => {
  return <BlogPost post={POST} summary={true} />
}

export default { title: 'Components/BlogPost' }
```

Al guardar el cambio Storybook actualiza y muestra las actualizaciones de las historias:

![imagen](https://user-images.githubusercontent.com/300/95523957-ed823a80-0984-11eb-9572-31f1c249cb6b.png)

### Mostrar el Resumen

¡Genial! Ahora para completar la foto utilizaremos el resumen la página de inicio del blog. Recordemos que la página de inicio no hace referencia al componente **BlogPost**, pues está en el **BlogPostsCell**. Añadiremos la prop summary y luego comprobaremos el resultado en Storybook:

```javascript {27}
// web/src/components/BlogPostsCell/BlogPostsCell.js

import BlogPost from 'src/components/BlogPost'

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

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>Empty</div>

export const Failure = ({ error }) => <div>Error: {error.message}</div>

export const Success = ({ posts }) => {
  return (
    <div className="space-y-10">
      {posts.map((post) => (
        <BlogPost post={post} summary={true} />
      ))}
    </div>
  )
}
```

![imagen](https://user-images.githubusercontent.com/300/95525432-f4ab4780-0988-11eb-9e9b-8df6641452ec.png)

Y si usted va al sitio también verá el resumen allí:

![imagen](https://user-images.githubusercontent.com/300/101545160-b2d45880-395b-11eb-9a32-f8cb8106de7f.png)

Storybook facilita crear y modificar los componentes de forma aislada y ayuda a aplicar buenas prácticas al construir aplicaciones React: los componentes deben ser autocontenidos y reutilizables simplemente cambiando los props de los mismos.

