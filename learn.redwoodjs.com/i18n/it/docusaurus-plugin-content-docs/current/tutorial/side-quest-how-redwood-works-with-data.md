---
id: side-quest-how-redwood-works-with-data
title: "Missione secondaria: Funzionamento di Redwood con i dati"
sidebar_label: "Missione secondaria: Funzionamento di Redwood con i dati"
---

Redwood adora GraphQL. Pensiamo che sia l'API del futuro. La nostra implementazione GraphQL è basata su [Apollo](https://www.apollographql.com/). Ecco come funziona una classica richiesta GraphQL all'interno della tua app:

![Redwood Data Flow](https://user-images.githubusercontent.com/300/75402679-50bdd180-58ba-11ea-92c9-bb5a5f4da659.png)

Il front-end utilizza [Apollo Client](https://www.apollographql.com/docs/react/) per creare una richiesta GraphQL. Quest'ultima verrà poi inviata ad [Apollo Server](https://www.apollographql.com/docs/apollo-server/), ed eventualmente eseguita all'interno di una funzione Lambda dell'ambiente cloud serverless AWS.

I files `*.sdl.js` collocati in `api/src/graphql` definiscono i tipi disponibili di GraphQL [Object](https://www.apollographql.com/docs/tutorial/schema/#object-types), [Query](https://www.apollographql.com/docs/tutorial/schema/#the-query-type) e [Mutation](https://www.apollographql.com/docs/tutorial/schema/#the-mutation-type), che permettono d'interfacciare l'API.

Tradizionalmente, dovresti scrivere un [resolver map](https://www.apollographql.com/docs/tutorial/resolvers/#what-is-a-resolver) contenente tutti i resolver che la tua app necessita. Quest'ultimi verrebbero poi trasmessi ad Apollo, in modo che sia in grado di mapparli ai file SDL. Collocare tutta questa logica all'interno dei "resolver map", tuttavia, risulterebbe in un file enorme e difficile da riutilizzare. Perciò, potremmo posizionare tale logica all'interno di una libreria di funzioni, importarle, e chiamarle a partire dalla "resolver map" (includendo eventuali argomenti). Uffa, ancora troppa fatica e codice *boilerplate* che non risultano in un buon livello di riusabilità.

Redwood ha un modo migliore! Ti ricordi della cartella `api/src/services`? Redwood importerà e mapperà automaticamente i resolver a partire dai loro file **services** corrispondenti verso l'SDL. Contemporaneamente, ti permette di scrivere tali resolver in modo che siano facili da invocare (come fossero delle semplici funzioni) a partire da altri resolvers o servizi. Tutta questa grandiosità potrebbe essere difficile da contemplare tutta in un colpo, quindi è il momento di passare ad un esempio.

Considera il seguente snippet di javascript SDL:

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

In questo esempio, Redwood cercherà i cinque resolvers che seguono all'interno di questo file `api/src/services/posts/posts.js`:

- `posts()`
- `post({ id })`
- `createPost({ input })`
- `updatePost({ id, input })`
- `deletePost({ id })`

Per implementarli, sarà sufficiente esportarli dal file dei servizi. Di solito, recuperano i tuoi dati da un database, ma in realtà possono fare tutto ciò che vuoi fintanto che restituiscano i tipi di dati che Apollo si aspetta in base a ciò che hai definito in `posts. dl.js`.

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

> Apollo suppone che queste funzioni restituiscano delle "promesse", a loro volta prodotte da `db` (un'istanza di `PrismaClient`). Apollo aspetta che queste promesse vengano esaudite prima di rispondere con i risultati della tua query, in modo che tu non debba preoccuparti di eventuali callback come `async`/`await`.

Potresti benissimo chiederti perché chiamiamo questi file di implementazione "servizi". Anche se questo blog di esempio non diventerà abbastanza complesso per poterlo dimostrare, i servizi sono stati ideati come un'astrazione che si trova ad un livello **superiore** rispetto ad una semplice tabella del database. Per esempio, un'applicazione più complessa potrebbe essere dotata di un servizio dedicato alle "fatturazioni", il quale avrebbe utilizzerebbe sia la tabella delle `transazioni` che quella degli `abbonamenti`. Alcune delle funzionalità di questo servizio (soltanto quelle che desideri) possono essere esposte tramite GraphQL.

Infatti, non è necessario esporre a GraphQL tutte le funzioni del tuo servizio. Nel caso non le dichiari all'interno dei tipi delle tue `Query` o `Mutation`, queste funzioni non esisteranno affatto per quanto riguarda GraphQL. Tuttavia, potresti comunque utilizzarle manualmente siccome i servizi non sono altro che funzioni Javascript, che di conseguenza possono essere invocate ovunque desideri:

- Da un altro servizio
- In una funzione lambda personalizzata
- Da un'API completamente separata e personalizzata

Dividendo la tua app in servizi ben definiti e relative API (sia per utilizzo interno **che** per GraphQL), contribuirai di conseguenza a rispettare la regola della [separation of concerns](https://en.wikipedia.org/wiki/Separation_of_concerns) e, con alta probabilità ad aumentare la facilità di manutenzione del tuo codice.

Per concludere, riassumiamo il nostro flusso di dati: Apollo possiede un "resolver" che, nel nostro caso, recupera dati dal database. Apollo ispeziona un oggetto e ritorna soltanto paia di chiavi/valori richieste dalla query GraphQL. Infine, assembla la risposta in una payload GraphQL pronta ad essere trasmessa e visualizzata dal tuo browser.

Perciò, nel caso si utilizzi una **cellula** Redwood, i tuoi dati saranno disponibili all'interno del componente `Success`, pronti ad essere visualizzati come qualsiasi altro componente React.

