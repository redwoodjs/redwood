---
id: a-second-page-and-a-link
title: "Una seconda pagina e un link"
sidebar_label: "Una seconda pagina e un link"
---

Creiamo una pagina "About" per il nostro blog in modo che tutti sappiano chi siano i geni dietro questo successo. Creeremo un'altra pagina utilizzando `redwood`:

    yarn redwood generate page about

Notare che non abbiamo specificato un percorso questa volta. Infatti, se lo escludi dal comando `redwood generate page`, Redwood creerà una `Route` e gli assegnerà un percorso omonimo alla pagina che hai specificato preceduto da uno slash. In questo caso sarà `/about`.

> **Code-splitting per ogni pagina**
> 
> Man mano che aggiungi pagine alla tua applicazione, potresti iniziare a temere che sempre più codice debba essere scaricato dal client ad ogni caricamento delle pagine. Non temere! Redwood dividerà automaticamente il codice di ogni Page, risultando in caricamenti incredibilmente veloci, e potrai creare tutte le pagine che vuoi senza doverti preoccupare del loro impatto sulla dimensione complessiva del bundle webpack. Se, tuttavia, si desidera che specifiche Page siano incluse nel bundle principale, è possibile sovrascrivere il comportamento predefinito.

http://localhost:8910/about dovrebbe mostrare la nostra nuova pagina. Tuttavia nessuno la troverà cambiando manualmente l'URL, quindi aggiungiamo un link dalla nostra homepage alla pagina About e viceversa. Inizieremo a creare un semplice header e nav bar allo stesso tempo sulla HomePage:

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

Mettiamo in evidenza alcuni aspetti:

- Redwood ama i [Function Component](https://www.robinwieruch.de/react-function-component). Faremo ampio uso di [React Hook](https://reactjs.org/docs/hooks-intro.html) strada facendo e questi sono abilitati solo nei component delle function. Sei libero di utilizzare class component, ma si consiglia di evitarli a meno che non abbia bisogno delle loro capacità speciali.
- Il tag Redwood `<Link>`, nel suo utilizzo più semplice, richiede un singolo attributo `to`. Quell'attributo `to` chiama una _named route function_ al fine di generare l'URL corretto. La funzione ha lo stesso nome dell'attributo `name` sul `<Route>`:

  `<Route path="/about" page={AboutPage} name="about" />`

  Se non ti piace il nome che `redwood generate` utilizza per la tua route, sentiti libero di cambiarlo all'interno di `Routes.js`! Le named route sono fantastiche perché se mai dovessi cambiare il path associato ad una route, dovrai cambiarlo soltanto in `Routes.js` ed ogni link riferito ad una named route function punterà ancora all'indirizzo corretto. Puoi anche passare una stringa all'attributo `to`, ma perderai tutti i vantaggi che le named route di Redwood possono offrire.

### Torna alla home

Una volta arrivati alla pagina About non abbiamo alcun modo per tornare indietro quindi aggiungiamo un link anche lì:

```javascript {3,7-25}
// web/src/pages/AboutPage/AboutPage.js

import { Link, routes } from '@redwoodjs/router'

const AboutPage = () => {
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
      <main>
        <p>
          This site was created to demonstrate my mastery of Redwood: Look on my
          works, ye mighty, and despair!
        </p>
        <Link to={routes.home()}>Return home</Link>
      </main>
    </>
  )
}

export default AboutPage
```

Ottimo! Ora apri questa pagina nel browser e verifica che la navigazione funzioni correttamente sia in avanti che indietro.

Come sviluppatore di fama mondiale, hai probabilmente notato quel `<header>` copiato ed incollato e ne sei probabilmente rimasto disgustato. Ti capiamo. Ecco perché Redwood ha una cosuccia chiamata _Layout_.

