---
id: side-quest-how-redwood-works-with-data
title: "Misión secundaria: Cómo funciona Redwood con datos"
sidebar_label: "Misión secundaria: Cómo funciona Redwood con datos"
---

A Redwood le gusta GraphQL. Creemos que es la API del futuro. Nuestra implementación GraphQL se basa en [Apollo](https://www.apollographql.com/). Así es como una típica consulta GraphQL funciona a través de la aplicación:

![Flujo de datos de Redwood](https://user-images.githubusercontent.com/300/75402679-50bdd180-58ba-11ea-92c9-bb5a5f4da659.png)

El front-end usa un [cliente de Apollo](https://www.apollographql.com/docs/react/) para crear una consulta GraphQL y enviada a un[servidor Apollo](https://www.apollographql.com/docs/apollo-server/) el cuál se ejecuta en una función serverless Lambda en la nube de AWS.

Los archivos `*.sdl.js` ubicados en `api/src/graphql` definen los tipos GraphQL de: [el objeto](https://www.apollographql.com/docs/tutorial/schema/#object-types), [la consulta](https://www.apollographql.com/docs/tutorial/schema/#the-query-type) y [la mutación](https://www.apollographql.com/docs/tutorial/schema/#the-mutation-type) y por lo tanto la interfaz de la API.

Normalmente escribiría un [mapa de resolución](https://www.apollographql.com/docs/tutorial/resolvers/#what-is-a-resolver) que contendría los resolutores e indicaría a Apollo cómo mapearlos al SDL. No obstante, poner lógica de negocios en el mapa de resolución resultaría en un archivo muy grande difícil de reutilizar, por lo que sería aconsejable extraer toda la lógica en una biblioteca de funciones, importarlas, e invocarlas en el mapa de resolución, pasando todos los argumentos. ¡Uff eso es mucho esfuerzo!, y no brinda buen reuso.

¡Redwood tiene una manera mejor! ¿Recuerdas el directorio `api/src/services`? Redwood importará y mapeará los resolutores desde el archivo **services** correspondiente a su SDL automáticamente. Al mismo tiempo, le permite escribir esos resolutores para facilitar su invocación como funciones desde otros resolutores o servicios. Veamos un ejemplo.

Considere el siguiente fragmento del SDL en JavaScript:

```javascript
// api/src/graphql/posts.sdl.js

export const schema = gql`
  type Post {
    id: Int!
    title: String!
    body: String!
    createdAt: DateTime!
  }

  type Query {
    posts: [Post!]!
    post(id: Int!): Post!
  }

  input CreatePostInput {
    title: String!
    body: String!
  }

  input UpdatePostInput {
    title: String
    body: String
  }

  type Mutation {
    createPost(input: CreatePostInput!): Post!
    updatePost(id: Int!, input: UpdatePostInput!): Post!
    deletePost(id: Int!): Post!
  }
`
```

En este ejemplo, Redwood busca en `api/src/services/posts/posts.js` los siguientes cinco resolutores:

- `posts()`
- `post({ id })`
- `createPost({ input })`
- `updatePost({ id, input })`
- `deletePost({ id })`

Para implementarlos, expórtelos desde el archivo en servicios. Esto permitirá consultar datos de la base de datos, puede hacer lo que quiera siempre y cuando devuelvan el tipo que Apollo espera según la definición de`posts.sdl.js`.

```javascript
// api/src/services/posts/posts.js
import { db } from 'src/lib/db'

export const posts = () => {
  return db.post.findMany()
}

export const post = ({ id }) => {
  return db.post.findUnique({
    where: { id },
  })
}

export const createPost = ({ input }) => {
  return db.post.create({
    data: input,
  })
}

export const updatePost = ({ id, input }) => {
  return db.post.update({
    data: input,
    where: { id },
  })
}

export const deletePost = ({ id }) => {
  return db.post.delete({
    where: { id },
  })
}
```

> Apollo asume que esas funciones devuelvan promesas por ej: `db` (instancia del `PrismaClient`). Apollo espera a que se resuelvan antes de devolver los resultados, no se preocupe por callbacks ni funciones `async`/`await`.

Se preguntará por qué llamamos a estas implementaciones "servicios". Si bien en el blog no tenemos muchas complejidad para demostrarlo, los servicios se usan como un capa de abstracción **sobre** las tablas de base de datos. Por ejemplo, una aplicación más avanzada tendría un servicio de "facturación" que utiliza las tablas `transacciones` y `suscripciones`. Puede exponer a través de GraphQL tanta funcionalidad del servicio cuanta desee.

No precisa que cada función del servicio esté expuesta a través de GraphQL—basta con dejarlo fuera los tipos `Query` y `Mutation` y GraphQL lo ignorará. No obstante, puede usarlo en otras partes pues los servicios son sólo funciones Javascript, por ejemplo:

- Desde otro servicio
- En una función lambda personalizada
- De una API completamente separada

Al dividir la aplicación en servicios bien definidos y proporcionando una API (tanto para uso interno **como** para GraphQL), mantendŕa [separación de intereses](https://es. wikipedia. org/wiki/Separaci%C3%B3n_de_intereses) y probablemente reduzca el mantenimiento de su base de código.

Volviendo al flujo de datos: Apollo ha llamado al resolutor que, en nuestro caso, ha consultado datos de la base de datos. Apollo inspecciona el objeto y devuelve sólo las clave y valores solicitados en la consulta GraphQL. Luego formatea la respuesta en un paquete GraphQL y la devuelve al navegador.

Si usa una **célula** Redwood los datos estarán disponibles para el componente `Success` listo para ser conectado y/o mostrado como cualquier otro componente React.

