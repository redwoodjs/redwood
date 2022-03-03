---
id: cells
title: "Cellule"
sidebar_label: "Cellule"
---

Queste funzionalità sono comuni nella maggior parte delle applicazioni web. Volevamo vedere se c'era qualcosa che potessimo fare per semplificare la vita agli sviluppatori, soprattutto per quanto riguarda implementare queste funzionalità in un componente standard. Pensiamo di aver escogitato una soluzione che possa aiutarti. Si tratta delle _Cells_ (o _cellule_ in italiano). Quest'ultime forniscono un approccio semplificato e di forma dichiarativa per interagire con i dati. ([Leggi la documentazione completa sulle Cells](https://redwoodjs.com/docs/cells).)

Quando crei una cellula, verranno esportate diverse costanti identificate da un nome specifico, e Redwood se ne occuperà automaticamente. Una cellula tipica può assomigliare a qualcosa del genere:

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

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>No posts yet!</div>

export const Failure = ({ error }) => (
  <div>Error loading posts: {error.message}</div>
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

Quando React renderizza questo component, Redwood si eseguirà la `QUERY` and mostrerà il componente di `Caricamento` finché viene ricevuta una risposta.

Una volta ricevuta la query, verrà visualizzato uno dei tre stati seguenti:
  - Nel caso si verifichi un errore, il componente `Failure`
  - Nel caso query non abbia prodotto dati (array `null` o vuoto), il componente `Empty`
  - Altrimenti, il componente `Success`

Inoltre, esistono anche dei metodi ausiliari che possono risultare utili nel definire il ciclo di vita di un componente, come `beforeQuery` (per manipolare le eventuali proprietà prima che vengano passate alla `QUERY`) e `afterQuery` (per manipolare i dati ritornati da GraphQL prima che siano trasmessi al componente `Success`).

Il minimo necessario per una cellula sono gli export relativi alla `QUERY` e al `Success`. Se non viene esportato un componente `Empty`, le richieste con risposte vuote verranno gestite dal componente `Success`. Invece, nel caso non venga esportato un componente `Failure`, gli eventuali errori verranno inviati alla console.

Per determinare quando utilizzare una Cellula, ricordati che sono utili quando i tuoi componenti hanno bisogno di recuperare dati dal database o da qualsiasi altro servizio che potrebbe incorrere in ritardi nei suoi tempi di risposta. Lascia che sia Redwood a preoccuparsi di individuare quale stato visualizzare, in modo che tu possa concentrarti soltanto sulla buona riuscita del componente compilato con i dati recuperati.

### La nostra prima Cellula

La homepage, visto che ha l'obiettivo di mostrare una lista di posts, è un candidato perfetto per la nostra prima cellula. Naturalmente, Redwood possiede un generatore apposito:

    yarn rw g cell BlogPosts

L'esecuzione di questo comando provocherà la creazione di un nuovo file `/web/src/components/BlogPostsCell/BlogPostsCell.js` (ed un relativo file di test) con un pò di codice standard per facilitarti il lavoro:

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

> **Come specificare la molteplicità delle cellule al generatore**
> 
> Quando stai generando una cellula, puoi utilizzare la sintassi che preferisci e Redwood si occuperà di correggerne il nome automaticamente. Tutti questi comandi risulteranno nella creazione dello stesso file (`web/src/components/BlogPostsCell/BlogPostsCell.js`):
> 
>     yarn rw g cell blog_posts
>     yarn rw g cell blog-posts
>     yarn rw g cell blogPosts
>     yarn rw g cell BlogPosts
>     
> 
> Tuttavia, avrai comunque bisogno di _qualche_ maniera per indicare che stai utilizzando più di una parola: cioè attraverso lo snake_case (`blog_posts`), il kebab-case (`blog-posts`), il camelCase (`blogPosts`) nonché il PascalCase (`BlogPosts`).
> 
> Eseguire `yarn redwood g cell blogposts`, senza alcuna indicazione che stiamo utilizzando due parole distinte, risulterà nella generazione del file `web/src/components/BlogpostsCell/BlogpostsCell.js`.

Per aiutarti ad essere più rapido ed efficace, il generatore presuppone che per la query GraphQL utilizzerai una richiesta omonima alla tua cellula e si occuperà automaticamente di scrivere la relativa query per recuperare i dati dal database. In questo caso, la query si chiama `blogPosts`:

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

Tuttavia, questo non è un nome valido per quanto riguarda i Posts SDL che abbiamo definito in precedenza (`src/graphql/posts.sdl.js`) e nemmeno per i Service (`src/services/posts/posts.js`). (Se ti interessa vedere da dove provengono questi file, ritorna al paragrafo [Creazione di un Post Editor](./getting-dynamic#creating-a-post-editor) nella sezione *Dinamismo* part.)

Perciò, dovremo utilizzare lo stesso termine `posts` sia per il nome della query che per il nome della proprietà relativa al `Success`:

```javascript {5,17,18}
// web/src/components/BlogPostsCell/BlogPostsCell.js

export const QUERY = gql`
  query BlogPostsQuery {
    posts {
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

Immettiamo questa cellula nella nostra `HomePage` e vediamo cosa accade:

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

Il browser dovrebbe visualizzare un array contenente un pò di posts (supponendo che tu ne abbia creato qualcheduno durante il passaggio precedente relativo allo [scaffolding](./getting-dynamic#creating-a-post-editor)). Fantastico!

<img src="https://user-images.githubusercontent.com/300/73210519-5380a780-40ff-11ea-8639-968507a79b1f.png" />

> **Da dove provengono i `posts` relativi al componente `Success`?**
> 
> Se ci fai caso, la query che costruiamo tramite `QUERY` si chiama proprio `posts`. Qualunque sia il nome della query, il medesimo nome verrà utilizzato per la proprietà del `Success` contenente i tuoi dati. Inoltre, potrai assegnare uno pseudonimo alla variabile contenente il risultato della query GraphQL, che verrà utilizzato come nome della proprietà:
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
> Ora `postIds` sarà disponibile in `Success` invece che in `posts`

Oltre all'`id` che è stato aggiunto alla `query` dal generatore, recuperiamo anche il titolo, corpo, e la variable createdAt:

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

A questo punto, la pagina dovrebbe mostrare un dump di tutti i dati che sono stati inserito tramite qualsiasi blog post:

<img src="https://user-images.githubusercontent.com/300/73210715-abb7a980-40ff-11ea-82d6-61e6bdcd5739.png" />

Adesso ci troviamo nel regno dei componenti del buon vecchio React, e sarà semplicemente necessario effettuare una build del componente `Success` per mostrare il blog post in un formato più accattivante:

```javascript {4-12}
// web/src/components/BlogPostsCell/BlogPostsCell.js

export const Success = ({ posts }) => {
  return posts.map((post) => (
    <article key={post.id}>
      <header>
        <h2>{post.title}</h2>
      </header>
      <p>{post.body}</p>
      <div>Posted at: {post.createdAt}</div>
    </article>
  ))
}
```

E come se niente fosse, abbiamo un blog! Ok, a questo punto potrebbe essere il blog più semplice ed antiestetico che si sia mai visto su internet, ma è meglio di niente! (Non preoccuparti, abbiamo molte altre funzionalità da implementare ancora)

<img src="https://user-images.githubusercontent.com/300/73210997-3dbfb200-4100-11ea-847a-602cbf59cb2a.png" />

### Sommario

Riassumendo, cosa abbiamo effettivamente fatto per giungere a questo punto?

1. Generato la homepage
2. Generato un layout per il blog
3. Definito uno schema per il database
4. Eseguito delle migrazioni per aggiornare il database e creare una tabella
5. Creato una scaffold CRUD per interfacciare la tabella del database
6. Creato una cellula per caricare i dati e gestire i casi di caricamento/vuoto/fallimento/successo
7. Aggiunto la cellula alla pagina

Inoltre, questo processo rappresenta il ciclo di vita che seguirai man mano che aggiungerai nuove funzionalità alla tua app Redwood.

Finora, tralasciando quel poco di codice HTML, non abbiamo dovuto fare molti sforzi o step manuali. Soprattutto, non è stato necessario scrivere un sacco di codice soltanto per trasferire dei dati da una parte ad un'altra. Tutto ciò rende lo sviluppo web un po' più entusiasmante, non credi?

