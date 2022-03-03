---
id: routing-params
title: "Parametri di Routing"
sidebar_label: "Parametri di Routing"
---

Ora che abbiamo una homepage in grado di elencare tutti i post, procediamo col costruire una pagina in grado di visualizzarne i dettagli. Innanzitutto, generiamo la pagina e la rotta corrispondente:

    yarn rw g page BlogPost

> Si noti che non possiamo chiamare questa pagina `Post` dato che la nostra scaffold ha già creato una pagina con tale nome in precedenza.

A questo punto, colleghiamo il titolo del post sulla homepage alla relativa pagina di dettaglio (includendo anche l'`import` necessario per i`Link` e le `routes`):

```javascript {3,12}
// web/src/components/BlogPostsCell/BlogPostsCell.js

import { Link, routes } from '@redwoodjs/router'

// QUERY, Loading, Empty and Failure definitions...

export const Success = ({ posts }) => {
  return posts.map((post) => (
    <article key={post.id}>
      <header>
        <h2>
          <Link to={routes.blogPost()}>{post.title}</Link>
        </h2>
      </header>
      <p>{post.body}</p>
      <div>Posted at: {post.createdAt}</div>
    </article>
  ))
}
```

Se clicchi sul link presente sul titolo di un post nel blog, dovresti veder apparire un testo di esempio all'interno di `BlogPostPage`. Ciò di cui abbiamo davvero bisogno, tuttavia, è specificare _quale_ dei post desideriamo mostrare su questa pagina. Sarebbe bello se fossimo in grado di specificare l'ID di un post direttamente nell'URL, per esempio attraverso qualcosa del tipo `/blog-post/1`. Indichiamo dunque alla `<Route>` di prevedere questa variabile supplementare nell'URL, ed assegnarle un nome in modo che possiamo referenziarla più tardi:

```html
// web/src/Routes.js

<Route path="/blog-post/{id}" page={BlogPostPage} name="blogPost" />
```

Osserva l'aggiunta di `{id}`. Redwood chiama queste variabili _parametri di rotta_. Quest'ultimi referenziano qualsiasi variabile che si trova in questa posizione dell'URL tramite il nome specificato all'interno delle parentesi graffe. E mentre siamo nel file delle rotte, permettiamoci di spostare tale rotta all'interno del tag `Set` caratterizzato dal `BlogLayout`.

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

Bene, bene, bene. Ora non dobbiamo fare altro che costruire un link che possieda l'ID di un post:

```html
// web/src/components/BlogPostsCell/BlogPostsCell.js

<Link to={routes.blogPost({ id: post.id })}>{post.title}</Link>
```

Per le rotte parametrizzate, sarà presente un oggetto che si aspetta un valore per ogni parametro presente. A questo punto, se clicchi sul link verrai effettivamente reindirizzato verso `/blog-post/1` (oppure `/blog-post/2`, eccetera... a seconda dell'ID del post).

### Utilizzazione dei Parametri

Ok, quindi ora l'ID si trova nell'URL. Qual è la prossima operazione da effettuare per visualizzare un post specifico? Siccome dovremo sicuramente recuperare delle informazioni dal database, necessitiamo di una cellula:

    yarn rw g cell BlogPost

In seguito, utilizzeremo tale cellula all'interno della `BlogPostPage`:

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

All'interno della cellula, abbiamo ora bisogno di accedere il parametro di rotta `{id}`, in modo tale da poter cercare tale identificativo all'interno del nostro database. Aggiorniamo la query affinché possa ricevere una variabile (e cambiamo nuovamente il nome della query da `blogPost` a `post`)

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

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>Empty</div>

export const Failure = ({ error }) => <div>Error: {error.message}</div>

export const Success = ({ post }) => {
  return JSON.stringify(post)
}
```

Ok, ci stiamo avvicinando. Detto questo, da dove proviene questo famoso `$id`? Redwood possiede un altro asso nella manica. Ogni qualvolta che è presente un parametro all'interno di una rotta, tale parametro sarà automaticamente disponibile alla pagina corrispondente. Questo significa che possiamo aggiornare la `BlogPostPage` in questo modo:

```javascript {3,5}
// web/src/pages/BlogPostPage/BlogPostPage.js

const BlogPostPage = ({ id }) => {
  return (
    <BlogPostCell id={id} />
  )
}
```

`id` è già presente ed accessible senza sforzi supplementari, dato che abbiamo chiamo il nostro parametro di rotta `{id}`. Grazie mille Redwood! Ma come fa questo `id` per diventare un parametro `$id` GraphQL? Se hai imparato qualcosa da Redwood, dovresti sapere che ci penserà lui per te! In condizioni standard, qualsiasi proprietà che assegni ad una cellula saranno automaticamente trasformate in variabili accessibili da una query GraphQL. "Seriamente?" Si, si, è la verità!

Possiamo dimostrarlo! Prova a navigare alla pagina di dettaglio di un post e... ehm...

![immagine](https://user-images.githubusercontent.com/300/75820346-096b9100-5d51-11ea-8f6e-53fda78d1ed5.png)

> A proposito, il messaggio di errore che stai vedendo è generato grazie alla sezione `Failure` della nostra cellula!

Se dai un'occhiata tramite la console del tuo browser, potrai constatare l'errore effettivo proveniente da GraphQL:

    [GraphQL error]: Message: Variable "$id" got invalid value "1";
      Expected type Int. Int cannot represent non-integer value: "1",
      Location: [object Object], Path: undefined

A quanto pare, i parametri di rotta sono stati estratti dall'URL come stringhe, mentre GraphQL si aspetta di ricevere un valore intero per quanto riguarda l'ID. Potremmo utilizzare la funzione `parseInt()` per convertire tale parametro in un numero (prima di passarlo a `BlogPostCell`), ma possiamo fare di meglio!

### Parametri di Rotta Tipizzati

Non sarebbe fantastico se potessimo effettuare questa conversione direttamente all'interno del percorso di una rotta? Indovina un po', possiamo farlo! Ora introdurremo **i parametri di rotta tipizzati**. È facile come aggiungere `:Int` al nostro parametro di rotta preesistente:

```html
// web/src/Routes.js

<Route path="/blog-post/{id:Int}" page={BlogPostPage} name="blogPost" />
```

Voilà! Attraverso questo codice, non solo potrai convertire il parametro `id` in un numero prima di passarlo alla tua Page, ma la rotta stessa non verrà considerata a meno che il parametro `id` sia composto esclusivamente da cifre. In caso vengano rilevati valori di altro tipo, il router continuerà a provare altre rotte, ed eventualmente mostrerà la `NotFoundPage` nel caso non ci sia alcuna corrispondenza.

> **E se volessi passare alla cellula qualche altra proprietà che non è necessaria per la query, ma che saranno utili negli altri componenti (Success/Loader/ecc.)?**
> 
> Tutte le proprietà che assegni alla cellula saranno automaticamente disponibili all'interno dei rispettivi componenti che renderizzerai. Soltanto quelle che coincideranno con le variabili GraphQL verrano effettivamente passate alla query. Quindi potrai ottenere il meglio dei due mondi! All'interno del nostro solito post, nel caso tu voglia visualizzare un numero casuale oltre al post stesso (per qualche motivo evidentemente legato a questo tutorial), sarà sufficiente passarlo come proprietà alla Cell:
> 
> ```javascript
> <BlogPostCell id={id} rand={Math.random()} />
> ```
> 
> E recuperarlo, insieme al risultato della query (ed anche l'`id` se ti può essere utile), all'interno del componente:
> 
> ```javascript
> export const Success = ({ post, id, rand }) => {
>   //...
> }
> ```
> 
> Grazie ancora, Redwood!

### Visualizzare un Articolo del Blog

A questo punto, visualizziamo il post effettivo invece che scaricare semplicemente il risultato della query. Questo sembra il posto perfetto per un componente buon vecchio stile, visto che stiamo visualizzando in modo identico (almeno per ora) i post sia sulla home page che su questa di dettaglio. Cominciamo quindi a Redwood-are un componente (ho appena inventato questa frase):

    yarn rw g component BlogPost

Il quale crea il file `web/src/components/BlogPost/BlogPost.js` (ed i relativi test!) come un semplicissimo componente React:

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

> Potresti notare che non necessitiamo di un `import` esplicito per `React` stesso. Infatti, qui al team di sviluppo Redwood ci siamo stancati di importarlo in continuazioni in ogni file. Perciò importiamo `React` automaticamente per te!

Trasferiamo il codice per visualizzare i post dalla `BlogPostsCell` e posizioniamolo qui, ricevendo `post` in come una proprietà in entrata:

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

In seguito, aggiorniamo la `BlogPostsCell` e `BlogPostCell` in modo che utilizzino questo nuovo componente:

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

Ed ecco fatto! Dovremmo ora essere in grado di poter navigare avanti ed indietro fra la homepage e la pagina di dettaglio degli articoli del blog.

> Se è piaciuto ciò che hai appena imparato a proposito del router, sentiti libero di esplorare la guida [Redwood Router](https://redwoodjs.com/docs/redwood-router) dedicata.

### Riepilogo

Riassumiamo:

1. Abbiamo creato una nuova pagina per visualizzare un singolo post (la pagina "dettagli").
2. Abbiamo aggiunto una rotta per gestire l'`id` del post e trasformarlo in un parametro di rotta.
3. Abbiamo creato una cellula per recuperare e visualizzare il post.
4. Rendendo l'`id` disponibile in punti chiave del nostro codice (e persino darci la possibilità di trasformarlo in un numero automaticamente), Redwood ha reso il mondo un posto migliore.
5. Abbiamo trasformato la visualizzazione effettiva di un articolo in un componente standard React, in modo tale da poterlo riutilizzare più volte (per la homepage e la pagina dei dettagli).

