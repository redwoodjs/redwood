---
id: layouts
title: "Layout"
sidebar_label: "Layout"
---

Un modo per risolvere il dilemma dell'`<header>` sarebbe creare un component `<Header>` ed includerlo sia nella `HomePage` che nell'`AboutPage`. Questo funziona, ma esiste una soluzione migliore? Idealmente ci dovrebbe essere un solo riferimento al `<header>` ovunque nel nostro codice.

Quando osservi queste due pagine, di cosa dovrebbero occuparsi davvero? Possiedono alcuni contenuti che desiderano mostrare. Non si dovrebbero davvero preoccuparsi di ciò che viene prima (come un `<header>`) o dopo (come un `<footer>`). Ecco dove entrano in gioco i layout: eseguono un wrap della pagina attraverso un tipo di component capace di renderizzare il resto della pagina come suo child. Il layout può contenere qualsiasi contenuto esterno alla pagina stessa. Concettualmente, il rendering finale del documento sarà strutturato come segue:

<img src="https://user-images.githubusercontent.com/300/70486228-dc874500-1aa5-11ea-81d2-eab69eb96ec0.png" alt="Layouts structure diagram" width="300" />

Creiamo un layout che mantenga quel `<header>`:

    yarn redwood g layout blog

> **`generate` shorthand**
> 
> D'ora in poi useremo l'alias abbreviativo `g` invece di `generate`

Questa operazione ha creato `web/src/layouts/BlogLayout/BlogLayout.js` ed un file di test associato. Stiamo chiamando questo layout "blog" perché potremmo avere altri layout in futuro (un layout "admin", magari?).

Taglia l'`<header>` sia dalla `HomePage` che dall'`AboutPage` ed incollalo all'interno del layout. Prendiamo anche il tag duplicato `<main>`:

```javascript {3,7-19}
// web/src/pages/HomePage/HomePage.js

import { Link, routes } from '@redwoodjs/router'

const HomePage = () => {
  return (
    <>
      <header>
        <h1>Redwood Blog</h1>
        <nav>
          <ul>
            <li>
              <Link to={routes.about()}>About</Link>
            </li>
          </ul>
        </nav>
      </header>
      <main>Home</main>
    </>
  )
}

export default HomePage
```

`children` è dove si avverrà la magia. Qualsiasi contenuto di pagina assegnato al layout verrà renderizzato qui. Ed ora che le pagine sono tornate ad occuparsi solamente dei contenuti che le riguardano direttamente, possiamo tranquillamente rimuovere l'import `Link` e `routes` dalla `HomePage` dato che sono nel Layout. Per procedere col render del nostro layout, è necessario fare una modifica ai file routes. Infatti, è necessario wrappare la `HomePage` l'`AboutPage` con il `BlogLayout`, tramite un `<Set>`:

```javascript {3,4,9-12}
// web/src/Routes. s

import { Router, Route, Set } from '@redwoodjs/router'
import BlogLayout from 'src/layouts/BlogLayout'

const Routes = () => {
  return (
    <Router>
      <Set wrap={BlogLayout}>
        <Route path="/about" page={AboutPage} name="about" />
        <Route path="/" page={HomePage} name="home" />
      </Set>
      <Route notfound page={NotFoundPage} />
    </Router>
  )
}

export default Routes
```

> **L'alias `src`**
> 
> Si noti che la dichiarazione import utilizza `src/layouts/BlogLayout` e non `../src/layouts/BlogLayout` o `./src/layouts/BlogLayout`. Essere in grado di usare soltanto `src` è una funzionalità fornita da Redwood con lo scopo di comodità: `src` è un alias del percorso `src` nello spazio di lavoro corrente. Quindi, se stai lavorando in `web` allora `src` punta a `web/src` e in `api` punta a `api/src`.

Tornando sul browser dovresti vedere... nulla di diverso. Ma questo è un bene, significa che il nostro layout sta funzionando.

> **Perché le cose vengono chiamate in questo modo?**
> 
> Potresti aver notato qualche ripetizione nei nomi dei file di Redwood. Le pagine risiedono in una directory chiamata `/pages` e contengono anche `Page` nel loro nome. Lo stesso vale per i Layout. Che problema c'è?
> 
> Quando si hanno dozzine di file aperti nell'editor è facile perdersi, soprattutto quando si dispone di file con nomi simili o anche uguali (può capitare quando risiedono in directory diverse). Immagina una dozzina di file nominati `index.js` e poi prova a trovare quello che stai cercando in quelli che hai aperto! Pensiamo che la doppia nomenclatura valga la pena, soprattutto riguardo al vantaggio che porta in termini produttività durante la ricerca di uno specifico file aperto.
> 
> Nel caso utilizzassi il plugin [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=en), anch'esso può aiutarti ad evitare ambiguità durante la navigazione grazie alla schemata degli stack dei component:
> 
> <img src="https://user-images.githubusercontent.com/300/73025189-f970a100-3de3-11ea-9285-15c1116eb59a.png" width="400" />

### Nuovamente indietro alla Home

Creiamo un altro `<Link>`, in modo da avere un collegamento dal titolo/logo alla homepage come al solito:

```javascript {9-11}
// web/src/pages/HomePage/HomePage.js

import { Link, routes } from '@redwoodjs/router'

const HomePage = () => {
  return (
    <>
      <header>
        <h1>Redwood Blog</h1>
        <nav>
          <ul>
            <li>
              <Link to={routes.about()}>About</Link>
            </li>
          </ul>
        </nav>
      </header>
      <main>Home</main>
    </>
  )
}

export default HomePage
```

A questo punto, possiamo rimuovere il link ora ridondante "Return to Home" (e l'import Link/routes) che avevamo sulla pagina About:

```javascript
// web/src/pages/AboutPage/AboutPage.js

const AboutPage = () => {
  return (
    <p>
      This site was created to demonstrate my mastery of Redwood: Look on my
      works, ye mighty, and despair!
    </p>
  )
}

export default AboutPage
```
