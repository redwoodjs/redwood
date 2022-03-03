---
id: side-quest-how-redwood-works-with-data
title: "Quête secondaire: Fonctionnement de Redwood avec les Données"
sidebar_label: "Quête secondaire: Fonctionnement de Redwood avec les Données"
---

Redwood apprécie GraphQL. Nous pensons qu'il s'agit de l'API pour l'avenir. Notre implémentation de GraphQL is construite avec [Apollo](https://www.apollographql.com/). Voici comment une requête GraphQL classique fonctionne dans votre application:

![Redwood Data Flow](https://user-images.githubusercontent.com/300/75402679-50bdd180-58ba-11ea-92c9-bb5a5f4da659.png)

La partie frontend de l'application s'appuie sur [Apollo Client](https://www.apollographql.com/docs/react/) pour créer une requête GraphQL. Celle-ci est ensuite envoyée à [Apollo Server](https://www.apollographql.com/docs/apollo-server/) qui s'exécute dans une fonction lambda AWS serverless.

Les fichiers `*.sdl.js` qui se trouvent dans le répertoire `api/src/graphql` définissent les types GraphQL [Object](https://www.apollographql.com/docs/tutorial/schema/#object-types), [Query](https://www.apollographql.com/docs/tutorial/schema/#the-query-type) et [Mutation](https://www.apollographql.com/docs/tutorial/schema/#the-mutation-type) et donc l'interface de votre API.

En principe, vous devriez écrire une "[resolver map](https://www.apollographql.com/docs/tutorial/resolvers/#what-is-a-resolver)" qui contiendrait l'ensemble de vos "resolvers" de façon à ce qu'Apollo sache comment les brancher à vos fichiers SDL. Cependant, inscrire votre logique métier directement dans votre "resolver map" aurait pour conséquence la création d'un énorme fichier ne favorisant pas la réutilisation. Vous pourriez également extraire toute cette logique dans une librairie de fonctions que vous importeriez et appelleriez depuis votre "resolver map", en ayant toutefois à vous rappeller de passer tous les arguments nécessaires. Humm, beaucoup d'effort et de code *boilerplate*, le tout sans apporter une très bonne réutilisabilité.

Redwood s'y prend autrement! Vous rappelez-vous le répertoire `api/src/services` ? Redwood va automatiquement importer et brancher vos "resolvers" depuis les **services** vers vos fichiers SDL. Dans le même temps, Redwood vous permet d'écrire vos "resolvers" de façon à ce qu'ils soient facilement appellés comme de simples fonctions depuis d'autres "resolvers" ou d'autres services. Cela fait pas mal de choses étonnantes à intégrer, il est temps de passer à un exemple.

Observez donc le morceau de code SDL javascript suivant :

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

A partir de ce fichier SDL, Redwood va aller chercher les cinq "resolvers" suivants dans `api/src/services/posts/posts.js` :

- `posts()`
- `post({id})`
- `createPost({input})`
- `updatePost({id, input})`
- `deletePost({id})`

Pour implémenter ces cinq "resolvers", il vous suffit de les exporter depuis vos fichiers services. Vos resolvers vont habituellement récupérer les données depuis une base de données, mais en réalité ils peuvent faire ce que vous souhaitez du moment qu'ils retournent le type de données qu'Apollo s'attend à recevoir comme défini dans `posts.sdl.js`.

```javascript
// api/src/services/posts/posts.js
import { db } from 'src/lib/db'

export const posts = () => {
  return db.post.findMany()
}

export const post = ({ id }) => {
  return db.post.findOne({
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

> Apollo suppose que ces fonctions retournent des "promises", ce que `db` fait parfaitement. `db` est une instance de `PrismaClient`. Apollo attend sagement que ces promises s'achèvent avant de répondre avec le résultat de vos requêtes. De cette manière, vous n'avez pas à gérer vous-même les `async`/`await`, ou autres callbacks.

Vous êtes parfaitement fondé à vous interroger sur la raison pour laquelle nous appelons ces fichiers des "services". Bien que le blog que nous construisons ensemble ne soit pas assez complexe pour le montrer, les services sont conçus pour être une abstraction qui couvre **plus** qu'une simple table de la base de données. Une application plus avancée pourrait par exemple avoir un service nommé "facturation" qui reposerait à fois sur les tables `transactions` et `souscriptions`. Certaines des fonctionnalités de ce service pourraient être exposées via GraphQL, mais pas forcément toutes.

Vous n'avez pas besoin d'exposer chaque fonction de votre service via GraphQL. Si vous ne les déclarez pas dans dans vos types `Query` ou `Mutation`, ils n'existerons tout simplement pas pour GraphQL. Mais vous pourrez toujours les utiliser vous-même. Les services ne sont ni plus ni moins que des fonctions javascript que vous pouvez utiliser où bon vous semble :

- Depuis un autre service
- Dans une autre fonction lambda créée par vous-même
- Depuis une autre API, complètement séparée

En organisant votre application autour de services bien définis, et en proposant une API pour chacun de ces services (à la fois pour un usage interne, **et** pour GraphQL), vous contribuerez naturellement à respecter la règle dite de ["separation of concerns"](https://fr.wikipedia.org/wiki/S%C3%A9paration_des_pr%C3%A9occupations) (SoC).

Revenons-en à notre flux de données: Apollo a créé un "resolver" qui, dans notre cas, récupère les données depuis une base de données. Apollo reconstruit l'objet en ne retournant que les couples clé/valeur demandés dans la requête GraphQL. Enfin, Apollo emballe la réponse au format GraphQL et la retourne au navigateur.

Si vous utilisez une **Cell** Redwood, vos données seront dès lors disponible dans votre compsant `Success`, prêtes à être affichées comme avec n'importe quel composant React.

